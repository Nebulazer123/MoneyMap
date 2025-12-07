# Phase 2 Step 3: Transaction Generation Engine Architecture

## 1. High-Level Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                  TRANSACTION GENERATION PIPELINE                 │
├─────────────────────────────────────────────────────────────────┤
│  Stage 1: Initialize PRNG with profileId (deterministic seed)   │
│  Stage 2: Build monthly calendar grid (datasetStart → End)      │
│  Stage 3: Generate FIXED recurring (rent, utils, insurance)     │
│  Stage 4: Generate SUBSCRIPTION charges (streaming, cloud, gym) │
│  Stage 5: Generate INCOME (payroll on 1st/15th or biweekly)     │
│  Stage 6: Generate VARIABLE spending per category quota         │
│  Stage 7: Generate INTERNAL TRANSFERS                           │
│  Stage 8: Inject FEES (3-6 per generation, sparse)              │
│  Stage 9: [HOOK] Suspicious charge injection points             │
│  Stage 10: Resolve same-day collisions (spread within day)      │
│  Stage 11: Normalize amounts (round, apply tax where needed)    │
│  Stage 12: Assign stable IDs + final sort by date               │
└─────────────────────────────────────────────────────────────────┘
```

### Function Signature
```
generateTransactions(
  profile: LifestyleProfile,
  dateRange: { start: Date, end: Date },
  mode: 'full' | 'extend',
  existingTransactions?: Transaction[]
): Transaction[]
```

---

## 2. Day-of-Month Distribution Strategy

### Weighted Bucket System
Replace random `(1-28)` with category-specific distributions:

| Category | Day Distribution | Pattern |
|----------|-----------------|---------|
| Rent/Mortgage | 1st only | Fixed anchor |
| Utilities | 1-5 | Early month bias |
| Subscriptions | Per `billingDay` | Fixed per plan |
| Income | 1st + 15th OR biweekly | Anchor pattern |
| Groceries | 3, 8, 15, 22, 27 ± 2 | Weekly-ish |
| Gas | Every 5-7 days | Even spread |
| Fast Food | Weighted: Fri/Sat +40% | Weekend spike |
| Coffee | Weighted: Mon-Fri +60% | Workday bias |
| Casual Dining | Fri +30%, Sat +50% | Weekend heavy |
| Rideshare | Fri/Sat +50% | Nightlife pattern |
| Retail/Online | 1-20 of month | Pre-paycheck spending |

### Day Selection Algorithm
```
selectDay(category, month, year):
  1. Get category bucket weights (array of 28 values)
  2. Apply weekend adjustment if category.weekendBias
  3. Apply payday adjustment if category.paydayCorrelated
  4. Weighted random sample from bucket
  5. Clamp to actual month length
  6. Return day
```

### Payday Anchor Logic
- If profile uses biweekly pay: anchor on Fridays
- Spending spikes: days 1-5 and 15-20 of month
- Low activity: days 10-14 and 25-28

---

## 3. Category Frequency Engine

### Monthly Quotas (from LifestyleProfile)

| Category | Monthly Range | Scaling Rule |
|----------|---------------|--------------|
| Subscriptions | Exactly N plans | N = sum of all SubscriptionPlan[] |
| Grocery | 3-7 total | scales with groceryStores.length |
| Fast Food | 8-20 total | 1-3 per fastFoodSpots merchant |
| Coffee | 8-15 total | 2-5 per coffeeShops merchant |
| Casual Dining | 2-5 total | 0-1 per restaurant |
| Gas | 4-8 total | ~1-2 per station |
| Rideshare | 0-6 total | if rideshareApps.length > 0 |
| Delivery | 0-4 total | if foodDeliveryApps.length > 0 |
| Retail | 2-5 total | 0-1 per store |
| Online | 3-8 total | Amazon gets 40% weight |
| Transfers | 2-6 total | internal only |
| Fees | 0-2 per month | sparse, random |

### Quota Board
```
MonthlyQuotaBoard {
  month: number
  year: number
  quotas: Map<Category, { target: number, generated: number }>
  
  // Methods
  needsMore(category): boolean
  recordGenerated(category): void
  getRemainingSlots(category): number
}
```

### Incremental Generation Scaling
When extending from month M to M+3:
1. Build quota board for months M+1, M+2, M+3 only
2. Use same profile merchants
3. Recurring charges auto-continue with same anchor days
4. Variable spending respects per-month quotas independently

---

## 4. Recurring Charge Engine

### Fixed Recurring Schema
```
RecurringCharge {
  merchant: string
  category: string
  frequency: 'monthly' | 'biweekly' | 'annual'
  anchorDay: number          // 1-28
  jitterDays: number         // 0-2 allowed
  amount: number             // fixed
  chargeType: 'ach' | 'visa'
  descriptionTemplate: string
}
```

### Monthly Recurring (Generated First)
| Type | Anchor Day | Jitter | Amount Stability |
|------|-----------|--------|------------------|
| Rent/Mortgage | 1 | 0 | Fixed |
| Electric | 5 | ±1 | ±5% |
| Gas (utility) | 8 | ±1 | ±10% |
| Water | 10 | ±2 | ±5% |
| Internet | 3 | 0 | Fixed |
| Phone | 7 | ±1 | Fixed |
| Auto Insurance | 15 | 0 | Fixed |
| Health Insurance | 1 | 0 | Fixed |
| Gym | Per plan.billingDay | 0 | Fixed |
| Streaming | Per plan.billingDay | 0 | Fixed |
| Car Payment | 10 | ±2 | Fixed |
| Student Loan | 20 | ±3 | Fixed |

### Jitter Application
```
applyJitter(anchorDay, jitterDays, monthLength):
  offset = seededRandom(-jitterDays, jitterDays)
  return clamp(anchorDay + offset, 1, monthLength)
```

---

## 5. Merchant Description Formatting

### Template System
```
DescriptionTemplate {
  style: 'visa_pos' | 'visa_online' | 'ach' | 'subscription' | 'p2p' | 'atm'
  merchantName: string
  locationSuffix?: string    // e.g., "LOS ANGELES CA"
  referenceSuffix?: string   // e.g., "*2K4L9"
}
```

### Style Expansion Rules

| Style | Pattern | Example Output |
|-------|---------|----------------|
| `visa_pos` | `VISA*{NAME} {LOCATION}` | `VISA*MCDONALDS LOS ANGELES CA` |
| `visa_online` | `{DOMAIN}` or `VISA*{NAME}` | `AMAZON.COM` |
| `ach` | `{NAME} ACH PYMT` | `CITY WATER ACH PYMT` |
| `subscription` | `{DISPLAY_NAME}` | `APPLE.COM/BILL` |
| `p2p` | `{APP} {TYPE}` | `VENMO PAYMENT` |
| `atm` | `{BANK} ATM {LOCATION}` | `CHASE ATM DALLAS TX` |
| `loan` | `{LENDER} LOAN PYMT` | `NAVIENT LOAN PYMT` |

### Merchant Metadata Pool
```
MerchantMeta {
  name: string
  displayName: string
  preferredStyle: DescriptionStyle
  typicalAmountRange: [min, max]
  category: string
  chargeType: 'visa' | 'ach' | 'both'
  addLocationSuffix: boolean
  addReferenceSuffix: boolean
}
```

---

## 6. Amount Generation Engine

### Distribution Models by Category

| Category | Model | Range | Notes |
|----------|-------|-------|-------|
| Subscriptions | Fixed | Exact plan amount | No variance |
| Bills/Utilities | Normal | ±5-10% of base | Seasonal variation |
| Groceries | Triangular | $25-$250 | Peak at $80 |
| Fast Food | LogNormal | $5-$35 | Heavy left skew |
| Coffee | Uniform | $4-$12 | Simple range |
| Gas | Normal | $30-$80 | Mean $55 |
| Restaurants | Triangular | $20-$120 | Peak at $45 |
| Retail | LogNormal | $15-$500 | Occasional big purchase |
| Online | LogNormal | $10-$200 | Amazon dominates |

### Amount Calculation
```
generateAmount(category, merchantMeta):
  1. Get base range from merchantMeta.typicalAmountRange
  2. Apply category distribution model
  3. Round to nearest cent
  4. Apply min/max safeguards
  5. Return amount (negative for expenses)
```

### Special Cases
- Refunds: 1-3% chance per month, matches prior charge amount
- Partial payments: Rare, subscription cancellation mid-cycle
- Fees: Separate pool (ATM $2.50-$5, Overdraft $35, Late $25-$40)

---

## 7. Suspicious Charge Injection Hooks

### Injection Points (Specification Only)

```
HOOK_POINT_1: After recurring generation
  → Can inject duplicate subscription charge
  → Can inject overcharge on utility

HOOK_POINT_2: After variable spending
  → Can inject unexpected merchant
  → Can inject amount spike

HOOK_POINT_3: Before final sort
  → Can inject extra charge same-day (duplicate pattern)
  → Suspicious flag metadata attached
```

### Data Requirements for Suspicious Module
- Access to all generated charges by merchant
- Frequency history per merchant
- Amount history per merchant
- Date pattern per merchant
- Flag: `isSuspicious: boolean`, `suspiciousType: 'duplicate'|'overcharge'|'unexpected'`

### Integration Contract
```
suspiciousModule.inject(
  transactions: Transaction[],
  profile: LifestyleProfile,
  config: { duplicateRate: 0.02, overchargeRate: 0.01, unexpectedRate: 0.01 }
): Transaction[]  // mutated with suspicious entries
```

---

## 8. Incremental Generation Rules

### Extend Mode Behavior
```
generateTransactions(profile, newRange, 'extend', existingTx):
  1. Validate: newRange.start >= existingRange.end OR newRange.end <= existingRange.start
  2. Keep all existingTx unchanged
  3. Build quota board for NEW months only
  4. Use SAME profile (merchants, amounts, anchor days)
  5. Generate recurring with same anchors (just new months)
  6. Generate variable spending for delta months
  7. Append new transactions to existing
  8. Re-sort entire list by date
  9. Preserve existing IDs, assign new IDs only to new transactions
```

### Boundary Alignment
- If extending from Nov 15 to Feb 28:
  - November: Only generate Nov 16-30
  - December: Full month
  - January: Full month
  - February: Full month through 28th
- Recurring charges that would have occurred before extension start are skipped

### Merchant Frequency Continuity
```
Example: profile.fastFoodSpots = ["McDonald's", "Chick-fil-A"]
Original range: Oct-Nov → 8 McDonald's, 6 Chick-fil-A generated
Extended to Dec → Continue same ratio, 4 McDonald's, 3 Chick-fil-A for December
```

---

## 9. ID Generation Strategy

### Stable ID Format
```
{profileId}-{year}-{month}-{category}-{merchantHash}-{sequence}

Example: "a1b2c3-2025-11-grocery-f8e9-001"
```

### Determinism Requirements
- Same profile + same date range = same IDs
- Extend mode: new IDs must not collide with existing
- Sequence resets per month/category/merchant

---

## 10. Collision Resolution

### Same-Day Collision Handling
```
If multiple transactions on same day:
  1. Sort by time-of-day preference:
     - Income: 00:00 (first)
     - Bills: 08:00
     - Subscriptions: 09:00
     - Groceries: 14:00-18:00
     - Dining: 12:00 or 19:00
     - Entertainment: 20:00+
  2. Spread within assigned window
  3. Store as "date" only (no time exposed to UI)
```

### Maximum Transactions Per Day
- Hard cap: 12 transactions per day
- Soft target: 3-5 average
- If quota exceeds cap: redistribute to adjacent days

---

## Notes
- Implementation lives in `src/lib/generators/transactionEngine.ts`
- Merchant metadata catalog: `src/lib/data/merchantCatalog.ts`
- Amount models: `src/lib/generators/amountModels.ts`
- This architecture supports future real-data import (Plaid) by swapping generator
