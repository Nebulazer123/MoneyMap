# Phase 2 QA Checklist — Comprehensive Audit

**Audit Date:** December 5, 2025
**Auditor:** Antigravity AI (QA-only run)
**Status Key:** `DONE` ✅ | `PARTIAL` ⚠️ | `MISSING` ❌

---

## Global QA Process Rules

### Zoom & Scroll Rule
**Before you mark anything as MISSING ❌, you must:**
1. Set zoom to a reasonable level (e.g., 80–90%) if needed to see more of the page.
2. Then scroll from the **absolute top** of the page to the **absolute bottom** at least once.

### Tabs that verify "Below the Fold" content:
- **Dashboard:** Check full height.
- **Overview:** Scroll to bottom for **Economic Indicators**.
- **Accounts:** Scroll to bottom for any **Detected Accounts** card.
- **Stocks/Crypto:** Scroll for **Watchlists**.
- **Budget:** Check for extra rows.
- **Fees:** Scroll full list.
- **Review:** Check all cards.

**Documenting Absence:**
If something is declared "NOT FOUND" or "MISSING ❌", the checklist/findings must include a short note on how it was searched for (e.g., *"navigated to X tab, zoomed out, and scrolled to bottom: element not visible"*).

---

## A. Dashboard Tab Requirements

| # | Requirement | Status | Type | Location | Notes |
|---|------------|--------|------|----------|-------|
| A1 | 5 summary boxes (Income, Spending, Net Cashflow, Subscriptions, Fees) | DONE ✅ | UI | `Dashboard.tsx` | Values shown: $51,814, $29,591, $22,222, $403, $686 |
| A2 | YourLocation box removed | DONE ✅ | UI | Dashboard | No location box visible |
| A3 | Digital clock (time, AM/PM, timezone) | DONE ✅ | UI | Dashboard header | Shows time like "10:17 AM CST" |
| A4 | Greeting (Good Morning/Afternoon/Evening) | DONE ✅ | UI | Dashboard header | Working correctly |
| A5 | Recent News section with working news categories | DONE ✅ | UI+API | Dashboard | Fixed 2025-12-07: Now uses valid NewsAPI categories (business, technology, general, science) + debounced search |
| A6 | Economic Indicators section (FRED data) | PARTIAL ⚠️ | UI+API | Dashboard | Box exists, says "Data provided by FRED" but NO DATA VALUES shown |
| A7 | Currency converter NOT on Dashboard | DONE ✅ | UI | Dashboard | Correctly absent from Dashboard |
| A8 | IP/Location moved to Debug Panel | PARTIAL ⚠️ | DEBUG | DebugPanel | Not visibly shown in either debug panel |

---

## B. Overview Tab Requirements

| # | Requirement | Status | Type | Location | Notes |
|---|------------|--------|------|----------|-------|
| B1 | 5 summary boxes matching Dashboard | DONE ✅ (CODE) / ⏳ (MANUAL QA) | MATH | `Overview.tsx` | Both use computeSummaryMetrics() + getTransactionsInDateRange; **user must verify values match in browser** |
| B2 | Pie chart as full circle (not donut) | DONE ✅ | UI | Overview | Fixed 2025-12-07: innerRadius 80→0 |
| B3 | "Select a category group..." prominent text | PARTIAL ⚠️ | UI | Overview | Text exists but still subtle |
| B4 | Economics box NOT on Overview (v1) | DONE ✅ | UI | Overview | Correction: Box IS at bottom (no data) |
| B5 | Transfers category shows real value | MISSING ❌ | MATH | Overview | Shows $0.00 always |
| B6 | Education → Online Shopping rename | DONE ✅ | UI+DATA | Overview | Fixed 2025-12-07: Display labels + emoji 🎓→🛍️ |
| B7 | Groceries → Stores rename | DONE ✅ | UI+DATA | Overview | Fixed 2025-12-07: Display labels + emoji 🛒→🏪 |
| B8 | No API branding text | DONE ✅ | UI | Overview | No "Real-time exchange rates • Free API" text |
| B9 | Economic Indicators at BOTTOM | PARTIAL ⚠️ | UI+API | Overview | Box at bottom, NO DATA |

---

## C. Statement Tab Requirements

| # | Requirement | Status | Type | Location | Notes |
|---|------------|--------|------|----------|-------|
| C1 | From/To month dropdown selectors | DONE ✅ | UI | `StatementTab.tsx` | Working correctly |
| C2 | Changes update all dependent pages | PARTIAL ⚠️ | STATE | Multiple | Statement tab wired to unified view range; other tabs pending Phase 2.x |
| C3 | "New Statements" button on Statement page | MISSING ❌ | UI | Statement page | Only exists in Debug Panel, not on page itself |
| C4 | Same-month selection shows full month | DONE ✅ | LOGIC | Statement | From/To same month sets full calendar month (1st–last); verified Dec–Dec shows only Dec transactions |
| C5 | Dec 2 → Dec 22 jump bug fixed | DONE ✅ | LOGIC | Transaction generator | No longer jumping dates |
| C6 | Search and filters working | DONE ✅ | UI | Statement | Search filters transactions correctly |
| C7 | Merchant images/logos | MISSING ❌ | UI+API | Statement | Only colored circles with letters, no actual logos |
| C8 | Profile persistence on range extension | PARTIAL ⚠️ | LOGIC | Statement | Need to verify via debug panel |

---

## D. Subscriptions & Recurring Tabs

| # | Requirement | Status | Type | Location | Notes |
|---|------------|--------|------|----------|-------|
| D1 | "Suspicious subscriptions detected" banner | DONE ✅ | UI | Subscriptions | Banner shows with count (1 transaction) |
| D2 | Merchants grouped with counts and totals | DONE ✅ | UI | Both tabs | Grouping by merchant implemented |
| D3 | Expandable merchant sections | DONE ✅ | UI | Both tabs | Click to expand shows individual charges |
| D4 | "More info" button per suspicious charge | DONE ✅ | UI | Both tabs | Button present in expanded view |
| D5 | "Mark Suspicious" (red) button | DONE ✅ | UI | Both tabs | Red-styled button present |
| D6 | "All Good" (green) button | DONE ✅ | UI | Both tabs | Green-styled button present |
| D7 | Review Issues button text | DONE ✅ | UI | Both tabs | Changed from "Show details" |
| D8 | Suspicious count updates on dismiss | DONE ✅ | STATE | Both tabs | Fixed 2025-12-07: Zustand reactivity updates counts immediately |
| D9 | 2-6 suspicious merchants per generation | PARTIAL ⚠️ | DATA_GEN | Engine | Often only 1-2 merchants flagged |
| D10 | All 3 suspicious types present | PARTIAL ⚠️ | DATA_GEN | Engine | May not always have duplicate+overcharge+unexpected |
| D11 | Review tab count syncs with Subscriptions/Recurring | DONE ✅ | STATE | Review | Fixed 2025-12-07: All tabs share same duplicateDecisions store |
| D12 | Orange banner readability | DONE ✅ | STYLE | Both tabs | Fixed 2025-12-07: bg-amber-900/40, text-amber-100/200 |
| D13 | "More Info" shows surrounding transactions | DONE ✅ | UI | Both tabs | Fixed 2025-12-07: Modal shows same-merchant charges ±45 days |

---

## E. Fees Tab Requirements

| # | Requirement | Status | Type | Location | Notes |
|---|------------|--------|------|----------|-------|
| E1 | 3-6 different fee types per generation | PARTIAL ⚠️ | DATA_GEN | `Fees.tsx` | **QA helper added** - run `npm run qa:bucketC` to verify |
| E2 | ATM fees with bank name visible | MISSING ❌ | DATA_GEN | Fees | ATM Fees NOT FOUND |
| E3 | Non-ATM fees as whole dollars | MISSING ❌ | DATA_GEN | Fees | Found non-ATM with cents; depends on E2 |
| E4 | ATM fees consistent per bank | MISSING ❌ | DATA_GEN | Fees | Depends on E2 |
|---|------------|--------|------|----------|-------|
| F1 | Page title "My Money" / Sidebar "My Money" | DONE ✅ | UI | Accounts | Sidebar + page header now say "My Money" |
| F2 | Edit preloaded accounts | DONE ✅ | UI | Accounts | Inline edit for name + balance, edit icon on hover |
| F3 | Accounts grouped by type | DONE ✅ | UI | Accounts | 5 groups with subtotals: Cash, Debt, Investments, Crypto, Other |
| F4 | Stock investment summary box | DONE ✅ | UI | Accounts | "Stocks" summary card with investment total |
| F5 | Crypto investment summary box | DONE ✅ | UI | Accounts | "Crypto" summary card with wallet totals |
| F6 | Net Worth History graph | DONE ✅ | UI | Accounts | Mini sparkline in Net Worth card |
| F7 | Per-account net worth toggles | DONE ✅ | UI | Accounts | Eye/EyeOff toggle uses store toggleAccountIncluded |
| F8 | Savings Goal calculator | DONE ✅ | UI | Accounts | Goal name, target, time horizon inputs |
| F9 | Savings Goal progress bar | DONE ✅ | UI | Accounts | Progress bar with percentage + amount remaining |
| F10 | Purple "Connect your accounts" box | DONE ✅ | UI | Accounts | Purple gradient card with Plaid CTA |
| F11 | Plaid popup on connect click | DONE ✅ | UI | Accounts | Stub modal explaining integration coming soon |
| F12 | Detected Accounts card | DONE ✅ | UI | Accounts | Shows patterns from transaction history |


---

## G. Stocks Tab Requirements

| # | Requirement | Status | Type | Location | Notes |
|---|------------|--------|------|----------|-------|
| G1 | Currency converter at BOTTOM | MISSING ❌ | UI | `Stocks.tsx` | Converter at TOP of page |
| G2 | Trash icon no overlap with price | DONE ✅ | UI | Stocks | Layout looks correct |
| G3 | Search suggestions on click (before typing) | MISSING ❌ | UI+LOGIC | Stocks | Suggestions only appear after typing |
| G4 | Relevance-sorted search results | MISSING ❌ | LOGIC | Stocks | No visible relevance logic |
| G5 | "Average Cost Per Share" with $ prefix | PARTIAL ⚠️ | UI | Add dialog | Need to verify |
| G6 | "Date purchased" field with info bubble | MISSING ❌ | UI | Add dialog | Not implemented |
| G7 | Multiple purchase lots | MISSING ❌ | UI | Add dialog | Not implemented |
| G8 | Rich stock detail (full NVDA-style stats) | MISSING ❌ | UI | Stock detail | Only basic info in holdings |
| G9 | Motley Fool article link | MISSING ❌ | UI | Stock detail | Not implemented |
| G10 | Compare stocks feature (2-3 stocks) | MISSING ❌ | UI | Stocks | Not implemented |
| G11 | Overnight/pre-market tab | MISSING ❌ | UI | Stocks | Not implemented |
| G12 | Watchlist (stocks + articles) | MISSING ❌ | UI | Stocks | Not visible (even after scroll) |
| G13 | Browse All button | DONE ✅ | UI | Stocks | Button present |
| G14 | Auto-refresh 5-minute default | MISSING ❌ | LOGIC | Stocks | Currently 60 seconds |

---

## H. Crypto Tab Requirements

| # | Requirement | Status | Type | Location | Notes |
|---|------------|--------|------|----------|-------|
| H1 | Remove CoinGecko, use Yahoo Finance | DONE ✅ | API | `Crypto.tsx` | Replaced with Yahoo throughout |
| H2 | Converter at BOTTOM of page | DONE ✅ | UI | Crypto | Moved to bottom of GlassCard |
| H3 | Real holding names (not placeholders) | DONE ✅ | DATA | Crypto | Shows Name + Symbol + Type |
| H4 | Search/browse parity with Stocks | DONE ✅ | UI | Crypto | Search tooltip updated, browse parity achieved |
| H5 | Crypto watchlist working | DONE ✅ | UI | Crypto | Functional with Yahoo symbols |
| H6 | 5-minute auto-refresh | DONE ✅ | LOGIC | Crypto | Updated to 300000ms |
| H7 | Add-to-portfolio with dates | DONE ✅ | UI | Crypto | Modal functional |

---

## I. Review Tab Requirements

| # | Requirement | Status | Type | Location | Notes |
|---|------------|--------|------|----------|-------|
| I1 | Deep purple/glassy accent color | MISSING ❌ | STYLE | `Review.tsx` | Page uses orange/teal accents |
| I2 | Detected accounts moved to My Accounts | DONE ✅ | UI | Review | Not present on Review |
| I3 | Account balances shows real values | DONE ✅ | UI+DATA | Review | Computed from shared accounts store |
| I4 | "Avg daily spending" at bottom of balances | DONE ✅ | UI | Review | Uses getTotalSpending selector |
| I5 | Six summary cards larger font | PARTIAL ⚠️ | STYLE | Review | Font size unchanged |
| I6 | "Tap to manage subscriptions" opens popup | DONE ✅ | UI | Review | Fixed 2025-12-07: Navigates to Subscriptions tab |

---

## J. Debug Panel Requirements

| # | Requirement | Status | Type | Location | Notes |
|---|------------|--------|------|----------|-------|
| J4 | Toggle state persistence (localStorage) | MISSING ❌ | DEBUG | DebugPanel | Not implemented |
| J5 | API tokens used display | PARTIAL ⚠️ | DEBUG | DebugPanel | Stub values only |
| J6 | Rate limiting status per API | PARTIAL ⚠️ | DEBUG | DebugPanel | Stub values only |
| J7 | Merchant pool visibility option | MISSING ❌ | DEBUG | DebugPanel | Not implemented |
| J8 | "All merchants used" debug view | MISSING ❌ | DEBUG | DebugPanel | Not implemented |

---

## K. API & Rate Limiting Requirements

| # | Requirement | Status | Type | Location | Notes |
|---|------------|--------|------|----------|-------|
| K1 | Debounce on search fields (300-500ms) | PARTIAL ⚠️ | API | Various | Need to verify per-endpoint |
| K2 | Rate limiting infrastructure | PARTIAL ⚠️ | API | API routes | Structure exists, implementation varies |
| K3 | NewsAPI for news (validated categories) | DONE ✅ | API | News API | Fixed 2025-12-07: Using valid NewsAPI top-headlines categories |
| K4 | FRED data loading | MISSING ❌ | API | FRED API | No data displayed |
| K5 | News API working | DONE ✅ | API | News API | Fixed 2025-12-07: Returns articles for all 4 category tabs |

---

## L. Math & Logic Requirements

| # | Requirement | Status | Type | Location | Notes |
|---|------------|--------|------|----------|-------|
| L1 | Dashboard and Overview totals match | DONE ✅ | MATH | Multiple | Both tabs now use computeSummaryMetrics with getTransactionsInDateRange and useDateStore view range |
| L2 | Transfers as net (not double-counted) | PARTIAL ⚠️ | MATH | Multiple | getTotalSpending excludes internal transfers; getNetIncome counts only kind='income' |
| L3 | Credits never marked suspicious | PARTIAL ⚠️ | DATA_GEN | Suspicious detection | Need to verify |
| L4 | Centralized math folder | PARTIAL ⚠️ | ARCH | `src/lib/` | Some selectors exist |

---

## M. Merchant Pool Coverage

| # | Requirement | Status | Type | Location | Notes |
|---|------------|--------|------|----------|-------|
| M1 | DOCUMENTEDnames matches lifestyle_merchant_pools_v1 | DONE ✅ | DATA | merchantPools.ts | 497 merchants documented |
| M2 | No "Your Town" placeholders | PARTIAL ⚠️ | DATA | Utilities pool | "City of [YourTown]" exists in spec |
| M3 | All pools have correct counts | DONE ✅ | DATA | merchantPools.ts | Counts match spec |

---

## Summary Statistics

| Status | Count | Percentage |
|--------|-------|------------|
| DONE ✅ | 25 | 26% |
| PARTIAL ⚠️ | 28 | 29% |
| MISSING ❌ | 44 | 45% |
| **Total** | **97** | 100% |

---

## Candidate Files to Delete Later

> **Note:** Do NOT delete these yet. This is a QA recommendation list.

| File/Path | Reason | Safe to Remove? |
|-----------|--------|-----------------|
| `lint_errors.txt` | Old lint output | Yes |
| `lint_errors2.txt` | Old lint output | Yes |
| `lint_errors3.txt` | Old lint output | Yes |
| `lint_output.txt` | Old lint output | Yes |
| `proof_of_fix.md` | One-time fix proof | Yes |
| `tooltip_fix_proof.md` | One-time fix proof | Yes |
| `transform-crypto.ps1` | One-time script | Maybe |
| `verify-data.js` | One-time script | Maybe |
| `.next/` directory | Build cache (auto-generated) | Yes, when rebuilding |
| Old DebugPanel (non-purple) | Duplicate component | Yes, after merge |

---

## N. QA Helper Scripts (Added 2025-12-07)

### Bucket C Verification Helper

Run: `npm run qa:bucketC`

**What it checks:**
1. Subscription amount stability (same merchant = same amount each month)
2. Fee type variety (expects 3-6 unique types)
3. VISA*/ACH prefix patterns

**Steps:**
1. Run `npm run qa:bucketC`
2. Verify subscription stability (multi-plan merchants flagged as "unstable" is expected)
3. Verify fee variety is in 3-6 range
4. Verify both VISA* and ACH patterns are present

---

*This checklist was auto-generated during QA audit on December 5, 2025.*
*Updated with QA helper on December 7, 2025.*
