# Phase 2 Step 4: Transaction ID, Sorting, and Stability Architecture

## 1. ID Generation Model

### Design Principles
- **Deterministic:** Same inputs → same ID, always
- **Collision-safe:** Unique across 500+ transactions/month
- **Stable:** IDs never change after creation
- **Extend-safe:** New IDs don't collide with existing
- **Human-readable:** Debuggable prefix structure

### ID Format
```
{profilePrefix}-{epochMonth}-{generationPhase}-{sequence}

Example: "p7x2-612-R-024"
         │     │   │  └── Sequence within phase (base36, 3 chars)
         │     │   └───── Generation phase (R=recurring, S=subscription, 
         │     │          V=variable, T=transfer, F=fee, X=suspicious)
         │     └───────── Epoch month (months since Jan 2020, base10)
         └─────────────── Profile prefix (first 4 chars of profileId hash)
```

### Hash Inputs (for sequence stability)
```
sequenceKey = hash(
  profileId +
  merchantName +
  category +
  amount (rounded to 2 decimals) +
  anchorDay (for recurring) +
  monthIndex
)
```

### Hash Algorithm
```
1. Concatenate inputs as UTF-8 string
2. Apply FNV-1a 32-bit hash
3. Convert to base36 (alphanumeric)
4. Truncate to required length
```

### Phase Prefixes
| Phase | Code | Description |
|-------|------|-------------|
| Recurring | R | Bills, rent, insurance, loans |
| Subscription | S | Streaming, cloud, gym, software |
| Income | I | Payroll, interest, refunds |
| Variable | V | Groceries, dining, gas, shopping |
| Transfer | T | Internal transfers |
| Fee | F | ATM, overdraft, late fees |
| Suspicious | X | Injected anomalies |

### Epoch Month Calculation
```
epochMonth = (year - 2020) * 12 + month
// January 2020 = 0
// December 2025 = 71
// December 2027 = 95
```

---

## 2. Canonical Sorting Rules

### Universal Sort Order
All components (Dashboard, Statements, Cashflow, Review) use identical sorting:

```
PRIMARY:   date (ascending, earliest first)
SECONDARY: time-of-day bucket (synthetic, from generation phase)
TERTIARY:  category priority (income → bills → spending → transfers)
QUATERNARY: merchant name (alphabetical)
FINAL:     ID (lexicographic, stable tie-breaker)
```

### Time-of-Day Buckets
| Phase | Synthetic Time | Priority |
|-------|----------------|----------|
| Income | 00:00 | 0 |
| Recurring (bills) | 08:00 | 1 |
| Subscription | 09:00 | 2 |
| Variable (groceries) | 14:00 | 3 |
| Variable (dining) | 18:00 | 4 |
| Variable (entertainment) | 20:00 | 5 |
| Transfer | 22:00 | 6 |
| Fee | 23:00 | 7 |

### Category Priority Map
```
PRIORITY_MAP = {
  'Income': 0,
  'Rent': 1,
  'Utilities': 2,
  'Insurance': 3,
  'Loans': 4,
  'Subscriptions': 5,
  'Groceries': 6,
  'Transport': 7,
  'Dining': 8,
  'Shopping': 9,
  'Other': 10,
  'Transfer': 11,
  'Fees': 12
}
```

### Sort Comparator
```
sortTransactions(a, b):
  // Primary: date
  dateCmp = compareDates(a.date, b.date)
  if (dateCmp !== 0) return dateCmp
  
  // Secondary: time bucket (derived from phase)
  timeCmp = getTimeBucket(a.id) - getTimeBucket(b.id)
  if (timeCmp !== 0) return timeCmp
  
  // Tertiary: category priority
  catCmp = PRIORITY_MAP[a.category] - PRIORITY_MAP[b.category]
  if (catCmp !== 0) return catCmp
  
  // Quaternary: merchant name
  merchCmp = a.merchant.localeCompare(b.merchant)
  if (merchCmp !== 0) return merchCmp
  
  // Final: ID (guaranteed unique)
  return a.id.localeCompare(b.id)
```

### Suspicious Charge Clustering
Suspicious charges sort **immediately after** their parent charge:
```
Parent ID:     p7x2-612-S-015 (Netflix $15.99)
Suspicious ID: p7x2-612-X-015 (Netflix $15.99 duplicate)

Sorting: X-phase IDs reference parent sequence, sort adjacently
```

---

## 3. Stability Model

### Immutability Guarantees

| Event | ID Behavior | Sort Behavior |
|-------|-------------|---------------|
| View range change | No change | No change |
| Extend dataset | Existing unchanged, new IDs added | New entries inserted chronologically |
| Full regeneration | All IDs reset (new profileId) | Complete re-sort |
| Suspicious injection | Parent IDs unchanged | Suspicious cluster after parent |
| Category edit | ID unchanged | May re-sort within day |

### ID Lifecycle States
```
┌──────────────┐
│   PENDING    │  Before ID assignment (mid-generation)
└──────┬───────┘
       │ assignID()
       ▼
┌──────────────┐
│   ASSIGNED   │  ID is final, immutable
└──────┬───────┘
       │ persist()
       ▼
┌──────────────┐
│   PERSISTED  │  Stored in useDataStore
└──────────────┘
```

### Overlap Detection (Extend Mode)
```
detectOverlap(existingRange, newRange):
  if (newRange.end <= existingRange.start):
    return { type: 'prepend', delta: newRange }
  if (newRange.start >= existingRange.end):
    return { type: 'append', delta: newRange }
  if (rangesOverlap(existingRange, newRange)):
    return { type: 'skip', message: 'Range overlaps existing data' }
```

### Skip Rules
- If extending and requested range already covered → skip generation
- If partial overlap → truncate new range to non-overlapping portion
- Log skipped ranges for debugging

---

## 4. Incremental Merge Logic

### Extend Mode Merge Pipeline
```
mergeExtendedTransactions(existing, newBatch):
  
  Step 1: Validate no ID collisions
    → existingIds = new Set(existing.map(t => t.id))
    → newBatch.forEach(t => assert(!existingIds.has(t.id)))
  
  Step 2: Assign IDs to new batch
    → Use epoch month from new range
    → Sequence counters start fresh per month/phase
  
  Step 3: Sort new batch internally
    → Apply canonical sort
  
  Step 4: Merge lists
    → combined = [...existing, ...newBatch]
  
  Step 5: Global re-sort
    → combined.sort(sortTransactions)
  
  Step 6: Rebuild indexes
    → Update byMonth, byCategory, byMerchant indexes
  
  Step 7: Return merged list
```

### ID Space Partitioning
Each month gets its own sequence namespace:
```
Month 612 (Dec 2025): p7x2-612-V-001, p7x2-612-V-002, ...
Month 613 (Jan 2026): p7x2-613-V-001, p7x2-613-V-002, ...
```

**Benefit:** Extending never risks collision with prior months.

### Recurring Alignment Across Boundaries
```
Example: Netflix bills on 15th

Existing: Oct 15, Nov 15 (IDs: p7x2-610-S-003, p7x2-611-S-003)
Extended to Dec: Dec 15 generated → p7x2-612-S-003

Sequence 003 is stable because:
  - Same merchant (Netflix)
  - Same profile
  - Same anchor day
  - Hash produces same sequence suffix
```

---

## 5. Index Structures

### Primary Indexes
```
TransactionIndex {
  byId: Map<string, Transaction>           // O(1) lookup
  byDate: Map<string, Transaction[]>       // YYYY-MM-DD → transactions
  byMonth: Map<number, Transaction[]>      // epochMonth → transactions
  byCategory: Map<string, Transaction[]>   // category → transactions
  byMerchant: Map<string, Transaction[]>   // merchant → transactions
}
```

### Index Rebuild Triggers
| Event | Rebuild Required |
|-------|-----------------|
| Initial load | Full rebuild |
| Extend dataset | Incremental add |
| Full regeneration | Full rebuild |
| View range change | No rebuild (filter only) |
| Category edit | Partial (byCategory only) |

### Lazy Index Strategy
```
getTransactionsByMonth(epochMonth):
  if (!byMonth.has(epochMonth)):
    // Lazy build for this month
    byMonth.set(epochMonth, all.filter(t => getEpochMonth(t) === epochMonth))
  return byMonth.get(epochMonth)
```

---

## 6. Suspicious Charge ID Handling

### Parent-Child Relationship
```
Suspicious transactions reference their "trigger" transaction:

SuspiciousTransaction extends Transaction {
  parentId: string          // ID of normal charge that triggered detection
  suspiciousType: 'duplicate' | 'overcharge' | 'unexpected'
  detectedAt: number        // timestamp of detection
}
```

### ID Generation for Suspicious
```
generateSuspiciousId(parentTransaction, type):
  baseSequence = extractSequence(parentTransaction.id)
  return `${profilePrefix}-${epochMonth}-X-${baseSequence}`
```

### Sort Clustering
Suspicious charges sort immediately after parent:
```
Before injection:
  p7x2-612-S-003 (Netflix $15.99) - Nov 15

After injection:
  p7x2-612-S-003 (Netflix $15.99) - Nov 15
  p7x2-612-X-003 (Netflix $15.99 DUPLICATE) - Nov 17
```

The X-phase sorts after S-phase for same sequence, keeping them visually adjacent.

---

## 7. Integration Points

### With Step 1B (Date Store)
```
useDateStore.profileId → Used as ID prefix source
useDateStore.datasetStart/End → Defines epoch month range
```

### With Step 2 (Lifestyle Profile)
```
LifestyleProfile.id → Matches useDateStore.profileId
Merchant names → Feed into hash for sequence stability
```

### With Step 3 (Transaction Engine)
```
Generation phases → Map to ID phase codes (R, S, V, T, F)
Anchor days → Contribute to sequence determinism
```

### With Step 7 (Suspicious Logic)
```
X-phase IDs → Reserved for suspicious injections
parentId field → Links to normal transaction
```

---

## 8. Error Recovery

### Collision Detection
```
detectCollision(newId, existingIds):
  if (existingIds.has(newId)):
    log.warn(`ID collision detected: ${newId}`)
    return generateFallbackId(newId, attempt++)
```

### Fallback ID Generation
```
generateFallbackId(originalId, attempt):
  // Append attempt counter
  return `${originalId}-${attempt}`
```

### Corrupt State Detection
```
validateTransactionList(transactions):
  ids = transactions.map(t => t.id)
  uniqueIds = new Set(ids)
  
  if (ids.length !== uniqueIds.size):
    throw new CorruptStateError('Duplicate transaction IDs detected')
  
  if (!isSorted(transactions)):
    log.warn('Transaction list not sorted, re-sorting...')
    transactions.sort(sortTransactions)
```

---

## Notes
- ID format optimized for debugging (human-readable month/phase)
- Base36 encoding balances compactness with readability
- Epoch month approach prevents cross-year collisions
- Suspicious X-phase reserved even if not used initially
- Index structures support O(1) lookup for common operations
