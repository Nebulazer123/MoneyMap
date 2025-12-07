# Phase 2 Step 1: Date Logic Audit

## Summary
The date system is **fragmented across two independent layers** that do not communicate:
1. **UI Store dateRange** — controls what is *displayed* (filtering)
2. **fakeData.ts generation** — controls what transactions *exist* (generation)

---

## Current Problems

### Problem 1: Dual Date Systems Out of Sync
- `useUIStore.ts` has a `dateRange` (6 months back → today)
- `fakeData.ts` generates transactions for **18 months** independently
- **Result:** UI filter range ≠ data generation range
- Changing UI dateRange does NOT regenerate data; it only filters

### Problem 2: Generation Uses Hardcoded 18-Month Range
- `generateSampleStatement()` defaults to 18 months (line 1222)
- No mechanism to pass the UI store's dateRange to the generator
- **Result:** Date range changes in Debug panel don't affect transaction generation

### Problem 3: Random Day Assignment Creates Gaps
- Line 1263: `Math.floor(Math.random() * maxDay) + 1`
- Transactions get random days within each month
- **Result:** Big date jumps (Dec 2 → Dec 22) because days are random, not continuous

### Problem 4: Debug Panel Changes Only Filter, Not Regenerate
- `DebugPanel.tsx` calls `setDateRange()` (lines 83, 89)
- This updates UI store, but data remains unchanged
- **Result:** Extending range shows empty days (no new transactions generated)

### Problem 5: Merchant Pool Shuffles on Every Regeneration
- `buildHouseholdProfile()` is called fresh each time (line 1210)
- No persistence of profile between date range extensions
- **Result:** Extending dates creates new merchants instead of reusing existing ones

### Problem 6: Persisted DateRange Gets Stale
- `useUIStore` persists `dateRange` to localStorage (line 47)
- If user returns weeks later, "today" from old session is wrong
- **Result:** UI may show dates that don't match current reality

---

## Files Using Date State

| File | Usage | Role |
|------|-------|------|
| `src/lib/types/index.ts:53-56` | `DateRange` type definition | Type only |
| `src/lib/store/useUIStore.ts:9-47` | Stores/provides `dateRange` | **UI Filter State** |
| `src/lib/store/useDataStore.ts:63` | Calls `generateSampleStatement()` | Data trigger |
| `src/lib/fakeData.ts:1203-1344` | Generates transactions | **Data Generation** |
| `src/lib/utils.ts:8-26` | `isDateInRange()` filter helper | Filtering logic |
| `src/components/debug/DebugPanel.tsx:28-89` | Reads/writes `dateRange` | User control |
| `src/components/dashboard/Overview.tsx:64` | Reads `dateRange` for filtering | Display |
| `src/components/dashboard/Cashflow.tsx:29` | Reads `dateRange` for filtering | Display |
| `src/components/dashboard/Review.tsx:17` | Reads `dateRange` for filtering | Display |
| `src/components/dashboard/Budget.tsx:13` | Reads `dateRange` for filtering | Display |
| `src/components/dashboard/Subscriptions.tsx:15` | Reads `dateRange` for filtering | Display |
| `src/components/dashboard/Recurring.tsx:15` | Reads `dateRange` for filtering | Display |
| `src/components/dashboard/Fees.tsx:11` | Reads `dateRange` for filtering | Display |

---

## Required Replacements

### 1. Unify Date State
- [ ] Create single source of truth for "active dataset date range"
- [ ] Store in `useDataStore` (not UI store) since it affects data
- [ ] UI store dateRange becomes a "view filter" that cannot exceed dataset bounds

### 2. Connect Generation to Date State
- [ ] `generateSampleStatement()` must receive date range from store
- [ ] Pass `datasetDateRange` to generator, not hardcoded 18 months
- [ ] Current month default = today; extend backwards as needed

### 3. Persist Lifestyle Profile Separately
- [ ] Create `LifestyleProfile` store or cache
- [ ] When extending date range, reuse same merchant pool
- [ ] Only regenerate profile on "New Statements" action

### 4. Fix Random Day Logic
- [ ] Implement realistic transaction day distribution
- [ ] Bills: fixed days (1st, 15th, etc.)
- [ ] Recurring: consistent day-of-month
- [ ] Variable transactions: distributed across days (not purely random)

### 5. Add Explicit Regeneration Trigger
- [ ] Debug panel "Apply Range" → extend/shrink transactions as needed
- [ ] "New Statements" button → full regeneration (new profile)
- [ ] Distinguish these two actions clearly in UI and logic

### 6. Fix Stale Persistence
- [ ] On app load, recalculate "today" and validate persisted range
- [ ] If persisted "to" date is in the past, auto-update to current date

---

## Dependencies on Other Systems

| Dependency | Impact |
|------------|--------|
| **Statement Tab dropdown** | Must respect unified dateRange; filter-only role |
| **Sidebar "Restart Demo"** | Calls `loadDemoData()` which regenerates; must reset dateRange |
| **Suspicious charge detection** | Relies on continuous date coverage for interval calculations |
| **Recurring charge detection** | Needs consistent merchant/amount across months |
| **Transfer netting** | Uses date-filtered transaction list |
| **All dashboard tabs** | All use `isDateInRange()` for filtering |

---

## Recommended Implementation Order

1. **Create `datasetDateRange` in useDataStore** — single source of truth
2. **Modify `generateSampleStatement()`** — accept range, remove hardcoded defaults
3. **Create `useLifestyleProfile` or add to useDataStore** — persist merchant pool
4. **Update `useUIStore.dateRange`** — becomes view-only filter, bounded by dataset
5. **Update DebugPanel** — distinguish "filter" from "regenerate" actions
6. **Fix day-of-month logic** — bills on fixed days, variable spread
7. **Add date validation on load** — fix stale persistence issue

---

## Notes
- This is a **deep refactor** touching core data flow
- Must be done carefully to avoid breaking existing filtering
- All dashboard tabs depend on `isDateInRange()` — that logic is fine, just constrained
