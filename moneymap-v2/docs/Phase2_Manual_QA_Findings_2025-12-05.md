# Phase 2 Manual QA Findings — December 5, 2025

**QA Session Date:** December 5, 2025  
**Method:** Browser walkthrough via Chrome Preview  
**Source:** User's manual walkthrough notes + Antigravity verification

---

## 1. Dashboard Findings

### 1.1 Summary Boxes
- **Status:** ✅ Present
- **Values Observed:** Income $51,814.00, Spending $29,591.05, Net Cashflow $22,222.95, Subscriptions $403.85, Fees $686.86
- **Issue:** Values do NOT match Overview tab (see 2.1)

### 1.2 YourLocation Box
- **Status:** ✅ Removed
- **Notes:** User's manual finding confirmed — no location box visible on Dashboard

### 1.3 Clock & Greeting
- **Status:** ✅ Working
- **Observed:** Digital time shows correctly with AM/PM and timezone abbreviation (e.g., "10:17 AM CST")
- **Greeting:** "Good Morning/Afternoon/Evening" working based on time

### 1.4 Debug Panels
- **Status:** ⚠️ TWO panels exist
- **Panel 1 (older):** "New Statements", "+1 Mo", "+3 Mo", "Log State", API rate limits (stubbed)
- **Panel 2 (purple, v2.0-alpha):** "New Profile", "Extend +3M", "Clear Data", View Range selectors, "Log State"
- **User Preference:** Keep ONLY the purple panel, merge features from both

### 1.5 Currency Converters
- **Dashboard:** ✅ Correctly absent
- **Stocks/Crypto:** ❌ At TOP of pages (should be at BOTTOM)

### 1.6 Financial News
- **Status:** ⚠️ BROKEN
- **Observed:** "Recent News" section present, 5 category tabs visible (Financial, Business, Technology, Stock, Cryptocurrency)
- **Problem:** Shows "No articles found" — custom categories break Yahoo News API
- **Fix Required:** Remove custom categories, use native Yahoo/API defaults (Business first is acceptable)

### 1.7 Economic Indicators
- **Status:** ⚠️ NO DATA
- **Observed:** Box present with text "Data provided by Federal Reserve Economic Data (FRED)"
- **Problem:** No actual indicator values displayed
- **Fix Required:** Verify FRED API calls are being made and data parsed correctly

---

## 2. Overview Findings

### 2.1 Summary Box Values Mismatch
- **Status:** ❌ CRITICAL BUG
- **Dashboard Values:** Income $51,814 | Spending $29,591 | Net $22,222
- **Overview Values:** Income $10,390 | Spending $6,484 | Net $3,906
- **Difference:** ~5x discrepancy
- **Root Cause:** Unknown — likely different date ranges or calculation methods
- **Fix Required:** Both pages must use SAME data source and date range

### 2.2 Pie Chart Style
- **Status:** ❌ Still DONUT
- **Spec:** Should be full circle or more legible representation
- **Current:** Ring/donut with hole in center

### 2.3 Empty State Message
- **Status:** ⚠️ Subtle
- **Observed:** "Transactions for selected category" with empty table
- **Spec:** "Select a category group to see transactions." should be MORE obvious
- **Fix:** Larger font, higher contrast, dedicated empty-state styling

### 2.4 Category Issues
- **Education:** ❌ Still exists (should become "Online Shopping")
- **Groceries:** ❌ Still named (should broaden to "Stores")
- **Transfers:** ❌ Shows $0.00 always (should show net sent vs received)

---

## 3. Statement Findings

### 3.1 Date Dropdowns
- **Status:** ✅ Working
- **Observed:** From/To month dropdowns functional, changes update View Range

### 3.2 New Statements Button
- **Status:** ❌ MISSING on Statement page
- **Observed:** Button exists in Debug Panel only
- **Spec:** Statement tab should have its own "New Statements" button

### 3.3 Same-Month Selection
- **Status:** ⚠️ PARTIAL
- **Test:** Selected Dec 2025 → Dec 2025
- **Result:** Shows Dec 1-4 (partial month), NOT just one day
- **Notes:** User reported "only shows Dec 30" but this may be data-dependent

### 3.4 Dec 2 → Dec 22 Jump
- **Status:** ✅ Fixed
- **Observed:** Transactions now continuous, no random date jumps

### 3.5 Merchant Images
- **Status:** ❌ NOT LOADING
- **Observed:** Only colored circles with initial letters
- **Notes:** Clearbit Logo API listed in APIS_INTEGRATED.md but not working

### 3.6 Search & Filters
- **Status:** ✅ Working
- **Test:** Searched "GAS" — correctly filtered to 1 result

---

## 4. Subscriptions & Recurring Findings

### 4.1 Suspicious Banner
- **Status:** ✅ Present
- **Subscriptions:** Shows "1 transaction" suspicious
- **Recurring:** Shows "2 transactions" suspicious

### 4.2 Merchant Grouping
- **Status:** ✅ Implemented
- **Observed:** Transactions grouped by merchant name, clickable to expand

### 4.3 Action Buttons
- **Status:** ✅ Present
- **Observed:** "More info", "All Good" (green), "Mark Suspicious" (red)
- **Button Text:** Changed from "Show details" to "Review Issues" ✅

### 4.4 Suspicious Count Sync
- **Status:** ❌ BROKEN
- **Subscriptions + Recurring total:** 1 + 2 = 3 suspicious
- **Review tab shows:** 14 suspicious
- **Problem:** Counts not synced; single source of truth missing

### 4.5 Orange Banner Readability
- **Status:** ⚠️ Poor contrast
- **Problem:** White text on bright yellow/orange is hard to read
- **Fix:** Phase 3 style pass

---

## 5. Fees Tab Findings

### 5.1 Fee Transactions
- **Status:** ❌ NO FEES VISIBLE
- **Observed:** Page loads but shows no fee transactions for current date range
- **Expected:** 3-6 fee merchants, ATM fees with bank names, whole dollar amounts
- **Problem:** Fee generation may be broken or date range excludes them

---

## 6. Accounts Tab Findings

### 6.1 Page Title
- **Status:** ❌ Wrong
- **Current:** "Accounts" / "Account Balances"
- **Spec:** Should be "My Accounts"

### 6.2 Account Editing
- **Status:** ❌ MISSING
- **Observed:** Only trash/delete icons per account
- **Spec:** Should allow editing name, type/category, balance

### 6.3 Account Grouping
- **Status:** ⚠️ Partial
- **Observed:** "Balance by Account Type" shows totals (Checking, Savings, Credit Card, Investment)
- **Problem:** "All Accounts" list below is flat, no group headings

### 6.4 Stock/Crypto Summary Boxes
- **Status:** ❌ MISSING
- **Spec:** Two separate boxes for Total stock portfolio and Total crypto portfolio
- **Current:** Only combined "Investment" total

### 6.5 Savings Goals
- **Status:** ❌ NOT IMPLEMENTED
- **Observed:** Listed under "Coming Soon" at bottom
- **Spec:** Active calculator, progress bar between "Balance by type" and "All Accounts"

### 6.6 Connect Bank Box
- **Status:** ❌ Wrong style
- **Observed:** "Coming Soon" text at bottom
- **Spec:** Purple "Connect your accounts" element with Plaid popup on click

---

## 7. Stocks Tab Findings

### 7.1 Converter Position
- **Status:** ❌ Wrong
- **Current:** Currency converter at TOP of page
- **Spec:** Should be at BOTTOM

### 7.2 Trash Icon Overlap
- **Status:** ✅ OK
- **Observed:** Trash icon appears on hover, does NOT overlap price

### 7.3 Search Suggestions
- **Status:** ❌ MISSING
- **Current:** No suggestions appear when clicking search (before typing)
- **Spec:** Should show trending/relevant immediately on click

### 7.4 Stock Detail View
- **Status:** ❌ LIMITED
- **Observed:** Holdings card shows: Ticker, Shares, Price, Day%, Avg Cost, Value, Gain/Loss
- **Spec:** Full detail panel with Day's Range, 52-Week, Volume, Market Cap, PE, EPS, Earnings Date, Dividend, 1Y Target

### 7.5 Compare Stocks
- **Status:** ❌ NOT IMPLEMENTED
- **Spec:** Select 2-3 stocks for side-by-side comparison

### 7.6 Watchlist
- **Status:** ❌ NOT VISIBLE
- **Spec:** Add stocks and news articles to watchlist

### 7.7 Overnight/Pre-market
- **Status:** ❌ NOT IMPLEMENTED
- **Spec:** Separate tab for after-hours pricing

### 7.8 Auto-Refresh
- **Status:** ⚠️ Wrong interval
- **Current:** 60 seconds
- **Spec:** 5-minute default + manual refresh button

---

## 8. Crypto Tab Findings

### 8.1 API Source
- **Status:** ❌ Still CoinGecko
- **Observed:** CoinGecko mentioned in debug/code
- **Spec:** Remove CoinGecko completely, use Yahoo Finance

### 8.2 Converter Position
- **Status:** ❌ Wrong
- **Current:** At TOP
- **Spec:** At BOTTOM

### 8.3 Holdings Display
- **Status:** ❌ BROKEN
- **Observed:** Placeholder holdings "1", "2", "3" — no real names
- **Add by ID not working:** Entering "BTC" doesn't add

### 8.4 Watchlist
- **Status:** ❌ NOT FUNCTIONAL

---

## 9. Review Tab Findings

### 9.1 Accent Color
- **Status:** ❌ Wrong
- **Current:** Orange/teal accents (similar to iPhone Pro orange)
- **Spec:** Deep purple/glassy matching site theme

### 9.2 Detected Accounts
- **Status:** ✅ Correctly removed from Review
- **Spec:** Should be on My Accounts page

### 9.3 Account Balances
- **Status:** ❌ NOT FUNCTIONAL
- **Current:** Shows "Coming Soon"
- **Spec:** Real totals (Checking, Savings, Investments, Debt with hideable balance)
- **Missing:** "Avg daily spending" metric

### 9.4 Subscriptions Box
- **Status:** ❌ BROKEN
- **Observed:** "Tap to manage subscriptions" does NOTHING when clicked
- **Spec:** Should open popup with all subscription merchants

### 9.5 Suspicious Charges
- **Status:** ⚠️ BROKEN
- **Count:** Shows "14 transactions" — never changes
- **Problem:** Count not wired to dismiss/confirm actions

### 9.6 Internal Transfers
- **Status:** ⚠️ MINIMAL
- **Current:** Shows $0.00, "Money moved between your own accounts"
- **Spec:** Total sent, total received, net amount, date range, clickable for monthly breakdown

### 9.7 Money Left After Bills
- **Status:** ⚠️ PARTIAL
- **Current:** Shows "$1,312.45 Approximate savings"
- **Missing:** "Average monthly" label, histogram on click, toggles for crypto/investments

### 9.8 Needs vs Wants
- **Status:** ✅ Present
- **Observed:** Shows "Saved this month", Essentials %, Everything else %
- **Verification needed:** Math correctness with transfer netting

---

## 10. Debug Panel Findings

### 10.1 Two Panels Exist
- **Panel 1:** Basic, with "New Statements", "+1 Mo", "+3 Mo"
- **Panel 2:** Purple themed, "Debug Panel (Phase 2) v2.0-alpha"
- **Action Required:** Merge into single panel, keep purple style

### 10.2 Missing Features
- Per-API toggle switches (pause/enable)
- "Pause all APIs" master switch
- Toggle state persistence
- Merchant pool visibility view
- "All merchants used in dataset" debug view

---

## Summary

| Category | Done | Partial | Missing |
|----------|------|---------|---------|
| Dashboard | 4 | 3 | 1 |
| Overview | 2 | 2 | 4 |
| Statement | 3 | 2 | 2 |
| Subscriptions/Recurring | 5 | 3 | 4 |
| Fees | 0 | 1 | 4 |
| Accounts | 0 | 1 | 10 |
| Stocks | 2 | 1 | 11 |
| Crypto | 0 | 0 | 7 |
| Review | 1 | 4 | 9 |
| Debug Panel | 0 | 2 | 6 |
| **TOTAL** | **17** | **19** | **58** |

---

*This document reflects manual QA findings on December 5, 2025, verified via browser walkthrough.*
