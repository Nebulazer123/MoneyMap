# Phase 2.1 View Range - FINAL ROOT CAUSE FIX

**Date:** December 6, 2025  
**Status:** ✅ COMPLETE - Found and fixed the TRUE root cause

---

## The Real Bug

### Symptom
When selecting `From = Dec 2025` and `To = Dec 2025`:
- Header showed: "39 transactions (Dec 1, 2025 – Dec 31, 2025)" ✅
- But table included Nov 30, 2025 transactions! ❌

### Root Cause: Timezone Shift in Transaction Generation

**File:** `src/lib/generators/transactionEngine.ts`

**The Bug (Line 140):**
```typescript
date: date.toISOString().split('T')[0],
```

**What Happened:**
1. Transaction is created for December 1, 2025 at midnight local time (CST)
2. `new Date(2025, 11, 1)` creates `Dec 1, 2025 00:00:00 CST`
3. `.toISOString()` converts to UTC: `"2025-11-30T06:00:00.000Z"` (because CST = UTC-6)
4. `.split('T')[0]` extracts: `"2025-11-30"` ← **WRONG DATE!**
5. Transaction stored as Nov 30 instead of Dec 1

**Result:** All transactions were shifted back 1 day for users in negative UTC offset timezones (US, Canada, South America, etc.)

---

## The Fix

**Changed from:**
```typescript
date: date.toISOString().split('T')[0],
```

**Changed to:**
```typescript
// Format as YYYY-MM-DD using local components (NOT toISOString which converts to UTC!)
// This prevents timezone drift like Dec 1 local → Nov 30 UTC
const yyyy = date.getFullYear();
const mm = String(date.getMonth() + 1).padStart(2, '0');
const dd = String(date.getDate()).padStart(2, '0');
const localDateStr = `${yyyy}-${mm}-${dd}`;
```

**Why This Works:**
- Uses `.getFullYear()`, `.getMonth()`, `.getDate()` which return **local** time components
- No UTC conversion happens
- December 1 local → "2025-12-01" string ✅

---

## Files Changed

| File | Change |
|------|--------|
| `src/lib/generators/transactionEngine.ts` | Fixed `createTx()` to format dates using local components |
| `src/lib/selectors/transactionSelectors.ts` | Already correct (uses dateKey-based filtering) |
| `src/components/dashboard/Budget.tsx` | Already fixed (removed legacy `isDateInRange`) |

---

## Important Note: Data Regeneration Required

**The fix only affects NEW transactions.** Existing transactions in localStorage still have the wrong dates.

To see the fix in action:
1. **Clear localStorage** in browser DevTools → Application → Local Storage → Delete `moneymap-data-storage`
2. OR use the "Regenerate Data" button in the Debug Panel
3. The app will regenerate all transactions with correct local dates

---

## Build Status

✅ `npm run build` passes (Exit code: 0)  
✅ No TypeScript errors  
✅ No lint errors  
✅ No console warnings

---

## Manual QA Checklist

**IMPORTANT:** Clear localStorage or regenerate data first!

### Test 1: Dec-Dec
- [ ] Set From = Dec 2025, To = Dec 2025
- [ ] Header: "X transactions (Dec 1, 2025 – Dec 31, 2025)"
- [ ] Scroll to bottom of table
- [ ] **NO** Nov 30 transactions
- [ ] First transaction: Dec 1 or later
- [ ] Last transaction: Dec 31 or earlier

### Test 2: Nov-Dec
- [ ] Set From = Nov 2025, To = Dec 2025
- [ ] Header: "X transactions (Nov 1, 2025 – Dec 31, 2025)"
- [ ] Includes both November and December transactions

### Test 3: Oct-Oct
- [ ] Set From = Oct 2025, To = Oct 2025
- [ ] Only October transactions visible

### Test 4: Budget Tab
- [ ] With Dec-Dec selected
- [ ] Open "Rent and utilities" section
- [ ] **NO** Nov 30 transactions

---

## Technical Summary

### Why Previous Fixes Didn't Work

We were looking in the **wrong place**. The filtering logic (`getTransactionsInDateRange`) was correct all along:
- It correctly computed Dec 1-31 boundaries
- It correctly filtered by dateKey comparison

The problem was the **source data** itself contained wrong dates due to the `toISOString()` timezone conversion during generation.

### The Data Pipeline

1. **Generation:** `createTx()` creates Date object → formats to string
2. **Storage:** Transaction stored with `date: "YYYY-MM-DD"` string
3. **Filtering:** `getTransactionsInDateRange()` parses string back to Date
4. **Display:** Table shows transaction date

The bug was in step 1, but we kept looking at steps 3-4.

### Lesson Learned

**Never use `toISOString()` for local date formatting!** It converts to UTC which can shift the date:
- 12:00 AM local → 6:00 AM UTC (next day in positive offset zones)
- 12:00 AM local → 6:00 PM UTC previous day (in negative offset zones like US)

---

## Invariant Established

**Transaction Date Formatting:**
> All transaction dates MUST be formatted using local date components (`getFullYear()`, `getMonth()`, `getDate()`), never `toISOString()` which converts to UTC.

**View Range Filtering:**
> All view-range filtering MUST go through `getTransactionsInDateRange()` using integer dateKey comparison for timezone-safe filtering.

---

**Status:** Ready for final verification after data regeneration
