# Phase 2 Manual QA Findings (v2) — Deep Interaction

**QA Session Date:** December 5, 2025
**Method:** Deep Interaction Walkthrough (Scrolling, Clicks, Debug Forcing)
**Previous Version:** `Phase2_Manual_QA_Findings_2025-12-05.md`

**Important Note on QA Methodology:**
The QA run zoomed out the browser so the whole page (or most of it) fit visually without scrolling. Some tabs were still scrolled as needed, but the primary technique was zoom-out.

**Future QA Rule:**
Future QA must always ensure full-page coverage before marking anything MISSING, by:
1. First optionally zooming out (e.g., 80–90%) to see more content.
2. And still scrolling from very top to very bottom once to catch anything still below the fold.

This is explicitly required for verifying:
- **Economic Indicators** (Overview)
- **Detected Accounts** (Accounts/Review)
- **Stocks/Crypto Watchlists**
- **Long lists of Fees**
- **Extra boxes** on Budget/Review/etc.

---

## 1. Dashboard Findings

### 1.1 Summary Boxes
- **Status:** ✅ Present
- **Values:** Implementation uses centralized `computeSummaryMetrics()` with view range filtering (see 1.6). **Manual verification needed** to confirm Dashboard and Overview values match for the same view range.

### 1.2 Interactive Elements
- **News:** Clicking category tabs (Financial/Business) results in "No articles found".
- **Debug:** Two panels confirm. The purple "v2.0-alpha" panel is the functional one for data generation.

---

## 1.5 Statement Tab Findings (Post Phase 2.1 Fix)

### Date Range Filtering
- **Status:** ✅ FIXED
- **Issue (Pre-fix):** When selecting same-month range (e.g., Dec 2025 – Dec 2025), transactions from the previous month (Nov 30) were incorrectly included.
- **Root Cause:** The date filtering logic used `toISOString()` and string comparisons which could have timezone-related edge case issues.
- **Fix Applied:** Rewrote `getTransactionsInDateRange()` in `transactionSelectors.ts` to use:
  - Normalized local midnight timestamps for all date comparisons
  - Numeric comparisons with **inclusive start / exclusive end** pattern
  - Proper parsing of both `"YYYY-MM-DD"` strings and full ISO date strings

### Verification Results
- **Same-month (Dec–Dec):** Now shows only December transactions (Dec 1+). No November dates leak through.
- **Cross-month (Nov–Dec, Oct–Dec):** Works correctly, transactions span full range.
- **Range changes:** Update reliably, no stale data or console errors.

#### How to verify:
1. Go to **Statement** tab.
2. Set **From = Dec 2025**, **To = Dec 2025**.
3. Scroll to the bottom of the transaction list.
4. Confirm all dates are ≥ Dec 1, 2025. No Nov 30 should appear.
- **Status:** ✅ FOUND (Correction from v1)
- **Location:** At the **very bottom** of the page (below the fold).
- **Content:** Header "Data provided by Federal Reserve Economic Data (FRED)", "Last updated" timestamp.
- **Issue:** **NO DATA VALUES** displayed. The box exists but is empty of actual indicators.

#### How to verify:
- Go to `/dashboard` and click the **Overview** tab in the sidebar.
- If you don’t see “Economic Indicators”, zoom the browser out (e.g., 80–90%) and scroll to the **very bottom**.
- The Economic Indicators section should be below the “Transactions for selected category” table.
- **Expect:** Header “Data provided by Federal Reserve…” and a “Last updated” line, but no actual metrics yet.

### 2.2 Transfers Value
- **Status:** ❌ $0.00
- **Verification:** Even with generated data showing transfer interactions, this category remains flat $0.00.

---

## 3. Accounts Findings ("My Money")

### 3.1 Naming & Labels
- **Sidebar Label:** "Accounts" (❌ mismatches "My Money" spec).
- **Page H1 Title:** "Account Balances" (❌ mismatches "My Money" spec).

### 3.2 "Detected Accounts"
- **Status:** ❌ NOT FOUND
- **Investigation:** Scrolled to bottom of Accounts page. No "Detected accounts" card/section exists.
- **Spec:** Was removed from Review (✅) but not added here (❌).

#### How to verify:
- Click the **Accounts** tab in the sidebar (spec’d as “My Money”, currently labeled “Accounts”).
- Confirm the H1/title shows “Account Balances”.
- Zoom out if needed, then scroll **all the way to the bottom**.
- Confirm that **no card or section labeled “Detected accounts”** appears anywhere on this page.

---

## 4. Subscriptions & Recurring Logic

### 4.1 "Review Issues" / "More Info" Behavior
- **Status:** ⚠️ LIMITED
- **Interaction:**
  1. Found suspicious merchant ("Peacock" / "Amazon Photos").
  2. Expanded row.
  3. Clicked "Review Issues" (formerly "More info").
- **Result:** Shows a single line text reason (e.g., "Unexpected charge amount vs history").
- **Gap:** Does **NOT** show a dropdown or list of surrounding transactions for context as requested in spec.

### 4.2 Suspicious Count Sync
- **Status:** ❌ BROKEN
- **Test:**
  1. Review Tab count: **13**.
  2. Subscriptions Tab: Marked 1 item "All Good".
  3. Returned to Review Tab.
- **Result:** Count remained **13**. State is not syncing.

---

## 5. Review Tab Interactions

### 5.1 "Tap to manage subscriptions"
- **Status:** ❌ DEAD CHECK
- **Interaction:** Clicked the text/button in the Subscriptions summary card.
- **Result:** **Nothing happens.** No modal, no popup, no navigation.

### 5.2 Suspicious Charges Box
- **Status:** ⚠️ Static
- **Count:** Stuck at **13** (or **4** depending on generation), does not reflect real-time resolutions from other tabs.

---

## 6. Fees Tab & Data Generation

### 6.1 Fee Types & Amounts
- **Status:** ❌ DATA ISSUES
- **Generated:** "Overdraft Fee", "Returned Item Fee" seen.
- **Amounts:** Show **cents** (e.g., "$35.00" or "$29.50"). Spec requested whole dollars for non-ATM (pending ATM fee presence).
- **ATM Fees:** **NOT FOUND** in multiple generation attempts. Could not verify "Bank Name" requirement. Non-ATM whole-dollar rule enforcement depends on ATM fees being present and labeled first.

#### How to verify:
- Click **Fees** tab.
- Use the **purple Debug panel**.
- Click “New Profile” and/or “Extend +3M” up to a few times.
- Zoom/scroll down the fees list to confirm:
  - Which fee types are shown.
  - Whether any “ATM Fee” lines exist and whether they include a bank name (e.g., “Chase ATM Fee”).
- If after those steps no ATM fees appear, document “ATM Fees NOT FOUND” and treat E2/E3/E4 as MISSING ❌.

---

## 7. Budget Tab Findings

### 7.1 Current State
- **Status:** ✅ 5 Boxes Present
- **Boxes Found:**
  1.  **Rent**: Over Budget
  2.  **Groceries**: Over Budget
  3.  **Dining**: On Track
  4.  **Transport**: On Track
  5.  **Utilities**: On Track
- **Car Insurance Box:** ❌ MISSING

#### How to verify:
- Navigate to **Budget** tab in sidebar.
- At normal zoom, you should see the 5 boxes in the “Category Breakdown” region.
- **Zoom out and scroll to bottom** just in case there’s an extra row.
- Confirm that there is **no 6th box titled “Car insurance”**.

### 7.2 Desired State (Spec Gap)
- A 6th box, "Car insurance", is required.
- It should show user's monthly spend (from car insurance merchants) vs. a benchmark "Typical in your area" value, with a comparison.
- This is a new requirement to be added.

---

## 8. Stocks & Crypto Interactions

### 8.1 Search
- **Status:** ⚠️ No "type-ahead"
- **Interaction:** Clicking search input does not show suggestions. Must type to get results.

### 8.2 Crypto
- **Holdings:** Still placeholders ("1", "2").
- **Converter:** At TOP.
- **Watchlist:** ❌ NOT FOUND (even after scroll) -> *Zoom, scroll to bottom, confirm no watchlist section.*

### 8.3 Stocks
- **Watchlist:** ❌ NOT FOUND (even after scroll) -> *Navigate to Stocks tab, zoom out, scroll to bottom, confirm no dedicated Watchlist section.*

---

## UNRESOLVED ITEMS

The following items could not be verified despite deep interaction attempts:

### 1. ATM Fees with Bank Names
- **Tab:** Fees
- **Attempt:** Used "New Profile" (x3) and "Extend +3M" to force fee generation.
- **Result:** Only "Overdraft" and "Returned Item" fees appeared.
- **Missing:** Any instance of an ATM fee to verify if it includes a bank name (e.g., "Chase ATM Fee" vs "ATM Fee").

### 2. "Detected Accounts" Location
- **Tab:** Accounts ("My Money")
- **Attempt:** Scrolled entire page DOM.
- **Result:** The feature is definitely gone from Review, but simply **missing** from Accounts.
- **Missing:** The actual UI card for "Detected Accounts".

### 3. "Contextual" Suspicious View
- **Tab:** Subscriptions / Recurring
- **Attempt:** Clicked "Review Issues" on a suspicious item.
- **Result:** Found the text reason, but **undefined** if the "surrounding transactions" feature is just hidden, broken, or never implemented.

---

*This document supersedes the v1 findings based on deeper scroll/click verification.*
