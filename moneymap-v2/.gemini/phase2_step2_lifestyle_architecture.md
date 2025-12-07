# Phase 2 Step 2: LifestyleProfile + Merchant Pool Architecture

> **Canonical Merchant Pool Source:** `docs/lifestyle_merchant_pools_v1.md`  
> `merchantPools.ts` MUST stay in sync with that doc. Do NOT add new merchants to code without updating the doc first.

## 1. LifestyleProfile Structure

Location: `src/lib/types/lifestyleProfile.ts`

```
LifestyleProfile {
  id: string                    // UUID, links to useDateStore.profileId
  createdAt: number             // timestamp
  
  // Financial Accounts
  primaryBank: BankMerchant
  secondaryBanks: BankMerchant[]           // 2-4 additional
  p2pWallets: P2PMerchant[]                // 1-3 (Cash App, Venmo, PayPal)
  creditCards: CreditCardMerchant[]        // 1-4 distinct issuers
  investmentBrokerages: string[]           // 1-2 (Vanguard, Fidelity, etc.)
  cryptoExchanges: string[]                // 1-3
  
  // Housing (mutually exclusive)
  housingType: 'rent' | 'mortgage'
  housingProvider: string                  // 1 provider only
  
  // Utilities + Bills
  utilities: UtilityMerchant[]             // 2-5 (electric, gas, water)
  phoneCarrier: string                     // 1 (prioritized)
  internetProvider: string                 // 1
  
  // Insurance
  autoInsurance: string                    // 1
  healthInsurance: string                  // 1
  homeOrRentersInsurance: string           // 1
  lifeInsurance: string | null             // 0-1
  
  // Loans
  carLender: string | null                 // 0-1
  studentLoanServicer: string | null       // 0-1
  otherLoans: string[]                     // 0-2
  
  // Subscriptions
  streamingServices: SubscriptionPlan[]    // 2-5
  musicService: SubscriptionPlan           // 1
  cloudStorage: SubscriptionPlan[]         // 1-3
  gym: SubscriptionPlan | null             // 0-1 (prefer 1)
  softwareSubscriptions: SubscriptionPlan[] // 2-6
  
  // Daily Spending Merchants
  groceryStores: string[]                  // 2-6
  fastFoodSpots: string[]                  // 5-10
  coffeeShops: string[]                    // 2-4
  casualDining: string[]                   // 4-5 (less frequent)
  gasStations: string[]                    // 2-5
  rideshareApps: string[]                  // 1-3
  foodDeliveryApps: string[]               // 1-3
  
  // Shopping
  retailStores: string[]                   // 3-6
  onlineShops: string[]                    // 3-5 (includes Amazon)
  unknownMerchants: string[]               // 4-5 (random/misc)
}
```

### Sub-Types

```
BankMerchant { name: string, last4: string, type: 'checking'|'savings'|'mmsa' }
P2PMerchant { name: string, last4: string }
CreditCardMerchant { issuer: string, cardName: string, last4: string }
UtilityMerchant { name: string, type: 'electric'|'gas'|'water'|'combined' }
SubscriptionPlan { 
  merchant: string
  displayName: string       // e.g., "APPLE.COM/BILL"
  amount: number            // stable per plan
  billingDay: number        // 1-28, consistent
  frequency: 'monthly'|'biweekly'|'annual'
  planLabel?: string        // e.g., "iCloud Storage", "AppleCare"
}
```

---

## 2. Selection Rules (per PLAN.md Tables)

### Count Constraints

| Category | Min | Max | Priority |
|----------|-----|-----|----------|
| Streaming | 2 | 5 | — |
| Music | 1 | 1 | Single service |
| Cloud | 1 | 3 | — |
| Gym | 0 | 1 | Prefer 1 |
| Software | 2 | 6 | — |
| Banks (total) | 3 | 5 | 1 primary |
| Credit Cards | 1 | 4 | — |
| P2P Wallets | 1 | 3 | Exclude Zelle |
| Grocery | 2 | 6 | — |
| Fast Food | 5 | 10 | High frequency |
| Casual Dining | 4 | 5 | Low frequency |

### Exclusive Rules
- `housingType === 'rent'` XOR `housingType === 'mortgage'` — never both
- Each subscription merchant can have **1-3 plans** (e.g., Apple: iCloud, AppleCare, App)
- P2P wallets exclude Zelle (handled as instant transfer, not merchant)

### Frequency Weighting
- Fast food: 3-8 transactions/month per merchant
- Coffee: 4-12 transactions/month per merchant
- Grocery: 1-4 transactions/month per merchant
- Casual dining: 0-2 transactions/month per merchant
- Gas stations: 2-6 transactions/month
- Retail: 0-2 transactions/month per merchant

---

## 3. Deduplication + Conflict Resolution

### Bank-Credit Card Overlap
- If `primaryBank.name === "Chase"`, credit card pool may include "Chase Freedom"
- This is **allowed** — realistic to have checking + credit at same bank
- Mark as `issuedByPrimaryBank: true` for visual grouping

### Grocery Store Similarity
- Avoid selecting: Walmart + Sam's Club + Walmart Neighborhood Market together
- Rule: Pick at most 1 from each "brand family"
- Brand families: Walmart, Kroger, Publix, Target, Costco

### P2P vs Bank Conflict
- Cash App, Venmo, PayPal are P2P — not main banks
- Never select "PayPal Bank" as `primaryBank` (it doesn't exist as checking)
- ACH transfers TO P2P are labeled differently than bank-to-bank

### Crypto Exchange Consistency
- Exchanges chosen here must match portfolio generation later
- Store `cryptoExchanges` at profile level, referenced by Crypto page

---

## 4. Profile ↔ Date System Relationship

### Profile Stability Rules

| Action | Profile Behavior |
|--------|------------------|
| **Extend Range** | Keep same `profileId`, same merchants, same amounts |
| **New Statements** | Generate new `profileId`, new LifestyleProfile |
| **Change View Range** | No effect on profile |

### Linkage
```
useDateStore.profileId  ←→  LifestyleProfile.id
useDataStore.lifestyleProfile  (cached instance)
```

### On Extend
1. Retrieve existing `LifestyleProfile` by `profileId`
2. Generate transactions for new months only
3. Use same `SubscriptionPlan.amount` and `billingDay` values
4. Append to existing transaction list

### On Regenerate
1. Create new `LifestyleProfile` with new `id`
2. Update `useDateStore.profileId`
3. Clear all transactions
4. Generate fresh for full date range

---

## 5. Integration with fakeData.ts

### Function Signature
```
generateTransactions(
  profile: LifestyleProfile,
  dateRange: { start: Date, end: Date },
  existingTransactions?: Transaction[]  // for extend mode
): Transaction[]
```

### Processing Order
1. **Recurring/Bills first** — fixed amounts, fixed days
2. **Subscriptions second** — stable amounts, consistent billing days
3. **Variable spending third** — randomized within category frequency bands
4. **Transfers last** — internal transfers between owned accounts

### Display Name Derivation

| Merchant Type | Pattern | Example |
|---------------|---------|---------|
| In-person card | `VISA*{NAME}` | `VISA*MCDONALDS` |
| Online card | `{DOMAIN}` or `VISA*{NAME}` | `AMAZON.COM` |
| ACH utility | `{NAME} ACH` | `CITY WATER ACH` |
| Subscription | `{DISPLAYNAME}` | `APPLE.COM/BILL` |
| P2P transfer | `{APP} {DIRECTION}` | `VENMO PAYMENT` |
| ACH loan | `{LENDER} PAYMENT` | `NAVIENT PAYMENT` |

### Monthly Distribution Strategy
- Subscriptions: Exact `billingDay` each month
- Bills (utilities, rent): 1st-5th of month typically
- Income: 1st and 15th (or biweekly pattern)
- Variable: Distributed across days, weighted toward first 3 weeks
- Transfer: Mid-month and end-of-month clusters

---

## 6. Storage Location

```
useDataStore {
  lifestyleProfile: LifestyleProfile | null
  // Persisted via localStorage
  // Regenerated only on "New Statements" action
}

useDateStore {
  profileId: string
  // Links to lifestyleProfile.id
}
```

### Persistence
- `LifestyleProfile` is fully persisted (allows session continuity)
- On app load: validate `profileId` matches stored profile
- If mismatch: regenerate profile (data corruption recovery)

---

## 7. Multi-Plan Subscription Handling

### Apple Example
```
SubscriptionPlan[] = [
  { merchant: "Apple", displayName: "APPLE.COM/BILL", amount: 2.99, 
    billingDay: 12, frequency: "monthly", planLabel: "iCloud 50GB" },
  { merchant: "Apple", displayName: "APPLE.COM/BILL", amount: 9.99, 
    billingDay: 1, frequency: "monthly", planLabel: "AppleCare" },
  { merchant: "Apple", displayName: "APPLE.COM/BILL", amount: 3.99, 
    billingDay: 4, frequency: "biweekly", planLabel: "Lose It! Premium" }
]
```

### Detection Logic
- Same merchant, different amounts → check if known multi-plan
- If `planLabel` exists and matches expected set → **not suspicious**
- If amount/date combination is unexpected → flag for suspicious review

---

## Notes
- Actual merchant pool arrays live in `src/lib/data/merchantPools.ts`
- Pool sizes per PLAN.md Section 5.4.3 (15-50 per category)
- This architecture is code-free specification for implementation
