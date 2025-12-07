# Phase 2 Remaining Gaps and Model Plan

**Analysis Date:** 2025-12-05  
**Spec Source:** `docs/Phase2Plan_Unrevised.md` (ground truth)  
**Status Docs:** `docs/FINAL-Phase2Plan.md`, `docs/Phase2_QA_Checklist.md`

**Implementation Pass:** 2025-12-05 ✅ COMPLETED

---

## 1. Overview

Phase 2 is **now fully implemented**. All major gaps identified in the initial analysis have been addressed.

**Completed in This Session:**

1. ✅ **Statement tab** now has date-range dropdowns and respects view range
2. ✅ **View-range scoping** confirmed correct across all tabs (Overview, Subscriptions, Recurring, Cashflow, Fees)
3. ✅ **Crypto detail API** already implemented - added graceful error fallback UI
4. ✅ **DebugPanel functionality** merged from old panel (+3Mo, Log State, Clear Data)
5. ✅ **Statement search** preserved alongside new date controls

---

## 2. Bucket A – ~~Definitely NOT Implemented~~ → COMPLETED

### A.1 – Statement Month-by-Month Date Dropdown ✅ DONE

- **Fix applied:** Added month/year dropdown controls to `StatementTab.tsx`
- **Implementation:**
  - From/To select inputs per §3.2.2
  - Uses `useDateStore.setViewRange()` to update view range
  - "View Range" / "Full Dataset" toggle button
  - Defaults to view range mode

---

### A.2 – Statement View Range Scoping ✅ DONE

- **Fix applied:** `StatementTab.tsx` now uses `getTransactionsInDateRange(transactions, viewStart, viewEnd)`
- **Implementation:**
  - Date filtering applied via `useMemo`
  - View Range / Full Dataset toggle for user control
  - Search works on already-filtered transactions

---

### A.3 – Crypto Detail API Missing/Broken ✅ FIXED

- **Finding:** API was already implemented at `/api/crypto?detail=`
- **Fix applied:** Added graceful error handling UI in `Crypto.tsx`
  - Shows AlertCircle icon + "Unable to load crypto details" message
  - Retry button to attempt fetch again

---

## 3. Bucket B – ~~Implemented but Wrong/Incomplete~~ → VERIFIED/FIXED

### B.1 – View Range "Close But Off" in Tabs ✅ VERIFIED CORRECT

- **Audit result:** All tabs correctly use `getTransactionsInDateRange(transactions, viewStart, viewEnd)`
  - Overview.tsx: ✅ Lines 67, 83-85
  - Subscriptions.tsx: ✅ Lines 16, 30-32
  - Recurring.tsx: ✅ Lines 14, 28-30
  - Cashflow.tsx: ✅ Lines 29, 45-47
  - Fees.tsx: ✅ Lines 11, 24-26
- **Note:** Suspicious charges intentionally use full dataset for alerts (spans view ranges)

---

### B.2 – DebugPanel Old Functionality Preservation ✅ MERGED

- **Fix applied:** Merged features from `src/components/debug/DebugPanel.tsx` into `src/components/dashboard/DebugPanel.tsx`
- **Added features:**
  - +3 Months extend button
  - Log State button (console.group output)
  - Clear Data button (with confirmation)
  - Terminal and Trash2 icons

---

### B.3 – Subscriptions/Recurring Suspicious Detection Counts ✅ VERIFIED CONSISTENT

- **Audit result:** All tabs use same pattern `transactions.filter(t => t.isSuspicious)`
  - Review.tsx: Line 84
  - Subscriptions.tsx: Line 47
  - Recurring.tsx: Line 42
- **Counts match** because they all read from same `transactions` state

---

## 4. Bucket C – ~~Manual QA Required~~ → QA HELPER ADDED (2025-12-07)

> **New:** Run `npm run qa:bucketC` to verify these items automatically.

### C.1 – Subscription Amount Stability ✅ LOGIC VERIFIED

- **Status:** ✅ Logic verified via QA helper
- **How the check works:**
  - QA helper groups subscriptions by merchant and checks for distinct amounts
  - Multi-plan merchants (e.g., Apple iCloud + AppleCare) may show as "unstable" - this is expected
- **Logic location:** `transactionEngine.ts` uses `subscriptionAmounts` Map

---

### C.2 – Fee Type Variety (3-6 Types) ✅ LOGIC VERIFIED

- **Status:** ✅ Logic verified via QA helper
- **How the check works:**
  - QA helper counts distinct fee descriptions
  - Expected: 3-6 unique types per profile
- **Logic location:** `transactionEngine.ts` pre-selects `profileFeeTypes` from `FEE_TYPES` pool

---

### C.3 – VISA*/ACH Prefix Consistency ✅ LOGIC VERIFIED

- **Status:** ✅ Logic verified via QA helper
- **How the check works:**
  - QA helper counts `VISA*` prefixed and `ACH` suffixed transactions
  - Shows sample descriptions for visual inspection
- **Logic location:** `formatDescription()` in `transactionEngine.ts`

---

### Running the QA Helper

```bash
npm run qa:bucketC
```

**What to look for:**
- Subscription stability: Multi-plan merchants flagged as "unstable" is expected
- Fee variety: Should be 3-6 unique types
- Prefixes: Both VISA* and ACH patterns should be present

---

## 5. Files Changed in This Session

| File | Change |
|------|--------|
| `src/components/dashboard/StatementTab.tsx` | ✅ Added date dropdowns, view range filtering, View/Full toggle |
| `src/components/dashboard/DebugPanel.tsx` | ✅ Merged old features (+3Mo, Log State, Clear Data) |
| `src/components/dashboard/Crypto.tsx` | ✅ Added graceful error fallback with Retry button |

---

## 6. Execution Summary

| Task | Status |
|------|--------|
| 1. Fix Statement date-range filtering | ✅ Done |
| 2. Normalize view-range across all tabs | ✅ Verified already correct |
| 3. Add Statement date dropdown | ✅ Done |
| 4. Fix Crypto detail API | ✅ Done (was working, added error UI) |
| 5. Merge DebugPanel functionality | ✅ Done |
| 6. Verify suspicious detection counts | ✅ Verified consistent |
| 7. QA: Subscription stability, Fee variety, VISA/ACH | ✅ QA helper added (2025-12-07) |
| 8. Internal transfer netting (selectors/exclusion) | ✅ Verified & Finalized (2025-12-07) |

---

## 7. Build Status

```
npm run build: ✅ Exit code 0
npm run lint: ⚠️ Pass with minor warnings (non-blocking)
```

**Phase 2 implementation is COMPLETE. QA helper available for Bucket C verification.**

---

## 8. Internal Transfer Logic (Finalized 2025-12-07)

### Status: ✅ VERIFIED COMPLETE

All internal transfer logic was audited and confirmed correct:

- **`isInternalTransfer(tx)`** helper centralizes all classification logic
- **`getTotalSpending()`** excludes internal transfers
- **`getNetIncome()`** excludes internal transfers (only counts `kind='income'`)
- **`getDailyCashflowBuckets()`** excludes internal transfers
- **`getCategoryTotals()`** excludes internal transfers
- **`getInternalTransferTotals()`** provides dedicated metric for UI

### New Additions (2025-12-07)

- Added `getInternalTransferTransactions()` convenience selector
- Re-exported `isInternalTransfer()` from selectors for component use
- Created verification file: `src/lib/__tests__/internalTransferLogic.verify.ts`

### Reference

See `docs/DOCUMENTEDchanges.md` section "2025-12-07 – Internal Transfer Netting" for full details.
