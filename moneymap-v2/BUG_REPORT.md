# MoneyMap Bug Report
**Generated:** December 16, 2025  
**Status:** Active Issues Found

---

## 🔴 Critical Bugs

### 1. Tab Navigation Not Updating Content
**Location:** `src/app/dashboard/page.tsx`  
**Issue:** Clicking sidebar tabs (Dashboard, Overview, etc.) updates the activeTab state but the page content doesn't always re-render immediately.  
**Observed:** After clicking "Dashboard" button, the page still shows Review tab content (news feed).  
**Potential Cause:** React state update timing or Zustand persistence issue.  
**Priority:** HIGH

### 2. Dashboard vs Overview Value Mismatch
**Location:** `src/components/dashboard/Dashboard.tsx` vs `src/components/dashboard/Overview.tsx`  
**Issue:** Dashboard and Overview tabs show different values for the same metrics.  
**Example:** 
- Dashboard: Income $51,814 | Spending $29,591 | Net $22,222
- Overview: Income $10,390 | Spending $6,484 | Net $3,906
**Root Cause:** Both should use `computeSummaryMetrics()` with same date range, but may be using different transaction filters.  
**Priority:** HIGH

---

## ⚠️ High Priority Bugs

### 3. useEffect Missing Dependencies
**Location:** `src/components/dashboard/CurrencyConverter.tsx:74`  
**Issue:** React Hook useEffect has missing dependency: 'fetchRates'.  
**Impact:** Could cause stale closures or infinite loops.  
**Fix:** Add `fetchRates` to dependency array or wrap in useCallback.

### 4. Synchronous setState in Effect
**Location:** `src/components/dashboard/CurrencyConverter.tsx:202`  
**Issue:** Calling setState synchronously within an effect can trigger cascading renders.  
**Impact:** Performance issues, potential infinite render loops.  
**Priority:** HIGH

### 5. Economic Indicators Not Displaying Data
**Location:** `src/components/dashboard/EconomicWidget.tsx`  
**Issue:** Widget shows "Data provided by Federal Reserve Economic Data (FRED)" but no actual values.  
**Observed:** Box present but empty.  
**Potential Cause:** API call failing silently or data parsing issue.  
**Priority:** MEDIUM

### 6. Merchant Images Not Loading
**Location:** Statement tab  
**Issue:** Only colored circles with initial letters shown, no actual merchant logos.  
**Expected:** Clearbit Logo API should provide images.  
**Status:** API listed in APIS_INTEGRATED.md but not working.  
**Priority:** MEDIUM

---

## 🟡 Medium Priority Bugs

### 7. News Feed Showing "No Articles Found"
**Location:** `src/components/dashboard/NewsFeed.tsx`  
**Issue:** Custom categories break Yahoo News API.  
**Observed:** Shows "No articles found" with custom category tabs.  
**Fix Required:** Remove custom categories, use native Yahoo/API defaults.

### 8. Fees Tab Showing No Transactions
**Location:** `src/components/dashboard/Fees.tsx`  
**Issue:** Page loads but shows no fee transactions for current date range.  
**Expected:** Should show 3-6 fee merchants, ATM fees with bank names.  
**Potential Cause:** Fee generation broken or date range excludes them.

### 9. Suspicious Count Sync Issue
**Location:** Subscriptions/Recurring vs Review tab  
**Issue:** Counts not synced between tabs.  
**Example:** Subscriptions (1) + Recurring (2) = 3 suspicious, but Review shows 14.  
**Root Cause:** No single source of truth for suspicious transaction count.

### 10. Review Tab Subscription Box Not Functional
**Location:** `src/components/dashboard/Review.tsx`  
**Issue:** "Tap to manage subscriptions" button does nothing when clicked.  
**Expected:** Should open popup with all subscription merchants.

### 11. Crypto Holdings Display Broken
**Location:** `src/components/dashboard/Crypto.tsx`  
**Issue:** Placeholder holdings "1", "2", "3" — no real names.  
**Issue:** Entering "BTC" doesn't add to holdings.  
**Priority:** MEDIUM

### 12. Stocks Auto-Refresh Interval Wrong
**Location:** `src/components/dashboard/Stocks.tsx`  
**Issue:** Currently 60 seconds, should be 5 minutes.  
**Line:** Check auto-refresh interval implementation.

---

## 🟢 Low Priority / UI Issues

### 13. Currency Converter Position
**Location:** Stocks and Crypto tabs  
**Issue:** Converter at TOP of page, should be at BOTTOM.  
**Priority:** LOW

### 14. Orange Banner Readability
**Location:** Subscriptions/Recurring tabs  
**Issue:** White text on bright yellow/orange is hard to read.  
**Fix:** Improve contrast in Phase 3 style pass.

### 15. Pie Chart Still Donut Style
**Location:** Overview tab  
**Issue:** Should be full circle, currently ring/donut with hole.  
**Priority:** LOW

### 16. Empty State Message Too Subtle
**Location:** Overview tab  
**Issue:** "Transactions for selected category" with empty table is not obvious enough.  
**Fix:** Larger font, higher contrast, dedicated empty-state styling.

---

## 📝 Code Quality Issues

### 17. Console.log Statements in Production Code
**Location:** Multiple files  
**Files:** 
- `src/components/dashboard/DebugPanel.tsx` (lines 137-139)
- Multiple API route files
**Issue:** Console.log statements should be removed or wrapped in dev-only checks.

### 18. Missing Error Boundaries
**Issue:** No error boundaries to catch component errors gracefully.  
**Impact:** Entire app could crash on single component error.

### 19. Incomplete Type Safety
**Location:** Various components  
**Issue:** Some `any` types or loose type definitions found.  
**Recommendation:** Stricter TypeScript configuration.

---

## 🔧 Recommended Fixes

1. **Fix Tab Navigation:**
   - Verify Zustand store updates are triggering re-renders
   - Add React.memo or useMemo to prevent unnecessary re-renders
   - Check if persistence middleware is interfering

2. **Unify Summary Metrics:**
   - Ensure both Dashboard and Overview use `computeSummaryMetrics()` 
   - Verify both use same `getTransactionsInDateRange()` with same date range
   - Add unit tests to verify consistency

3. **Fix useEffect Issues:**
   - Wrap `fetchRates` in useCallback
   - Move synchronous setState out of effect or use proper pattern
   - Review all useEffect dependencies

4. **API Error Handling:**
   - Add proper error handling for FRED API
   - Add fallback UI when APIs fail
   - Log errors to monitoring service

5. **Add Error Boundaries:**
   - Wrap main dashboard components in ErrorBoundary
   - Provide user-friendly error messages

---

## 📊 Summary

| Severity | Count |
|----------|-------|
| 🔴 Critical | 2 |
| ⚠️ High | 4 |
| 🟡 Medium | 6 |
| 🟢 Low | 4 |
| **Total** | **16** |

---

*This report is based on code analysis, browser testing, and existing QA documentation.*

