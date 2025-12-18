# MoneyMap v2 – UI Regression Sweep Plan

A fast, repeatable checklist to catch high-impact UI regressions in MoneyMap v2 after code changes.

---

## 1. Key Routes & Screens

### 1.1 Landing – `/`
- **Primary file**: `src/app/page.tsx`
- **Key behaviors**:
  - "Try Demo" loads demo data via `useDataStore.loadDemoData()` and navigates to `/dashboard` using `useRouter().push("/dashboard")`.
  - "Upload Statement" opens `UploadModal`.
- **What to glance at visually**:
  - MoneyMap logo (animated glassmorphism tile) and hero copy.
  - Two primary buttons: "Try Demo" and "Upload Statement" with hover states.
  - Fullscreen background, gradients, and text legibility.

### 1.2 Dashboard Shell – `/dashboard`
- **Primary files**:
  - `src/app/dashboard/page.tsx` – chooses which dashboard tab component to render based on `useUIStore().activeTab` and ensures demo data is loaded when transactions are empty.
  - `src/components/layout/AppLayout.tsx` – global dashboard shell with background, layered gradients, and main content layout.
  - `src/components/layout/Sidebar.tsx` – navigation sidebar, tab switching, demo controls, and minigame trigger.
- **Key behaviors**:
  - On first load with no data, `loadDemoData()` hydrates demo transactions.
  - `activeTab` from `useUIStore` selects which tab component renders.
  - `DebugPanel` is always present at the bottom of the page.
- **What to glance at visually**:
  - Sidebar open/close behavior and mobile toggle.
  - Main content padding, scroll behavior, and glassmorphism theme.
  - No visible layout jumps when tabs switch.

### 1.3 Dashboard Tabs (via `useUIStore.activeTab`)
All tab components live under `src/components/dashboard/` and are switched in `src/app/dashboard/page.tsx`.

- **`dashboard` → `Dashboard`**
  - Files: `src/components/dashboard/Dashboard.tsx`
  - Summary cards for income, spending, net cashflow, subscriptions, and fees.
  - Clock + greeting section using current time and timezone.

- **`overview` → `Overview`**
  - File: `src/components/dashboard/Overview.tsx`
  - High-level breakdown and charts of spending vs income and categories.

- **`statement` → `StatementTab`**
  - File: `src/components/dashboard/StatementTab.tsx`
  - Transaction list for the selected date range, filters, and scrolling.

- **`subscriptions` → `Subscriptions`**
  - File: `src/components/dashboard/Subscriptions.tsx`
  - Subscription detection, grouping, and totals.

- **`recurring` → `Recurring`**
  - File: `src/components/dashboard/Recurring.tsx`
  - Recurring inflow/outflow summaries.

- **`fees` → `Fees`**
  - File: `src/components/dashboard/Fees.tsx`
  - Fee detection, totals, and fee-type grouping.

- **`cashflow` → `Cashflow`**
  - File: `src/components/dashboard/Cashflow.tsx`
  - Cashflow over time, often chart-based; sensitive to date range.

- **`budget` → `Budget`**
  - File: `src/components/dashboard/Budget.tsx`
  - Budget categories and progress vs targets.

- **`accounts` → `Accounts`**
  - File: `src/components/dashboard/Accounts.tsx`
  - Account list, balances, and types (checking, savings, credit, etc.).

- **`stocks` → `Stocks`**
  - Files: `src/components/dashboard/Stocks.tsx`, `src/app/dashboard/stocks/page.tsx`
  - Stock market overview, indices, watchlist, and market status bar.

- **`crypto` → `Crypto`**
  - Files: `src/components/dashboard/Crypto.tsx`, `src/app/dashboard/crypto/page.tsx`
  - Crypto overview, global stats, trending strip, and personal watchlist.

- **`review` → `Review`**
  - File: `src/components/dashboard/Review.tsx`
  - Summary / review experience for user’s financial health and next steps.

---

## 2. Likely Regression Hotspots

### 2.1 Data Loading & Stores
- **Stores**: `src/lib/store/useDataStore.ts`, `src/lib/store/useDateStore.ts`, `src/lib/store/useUIStore.ts`.
  - `useDataStore`: demo data loading, transaction set, derived account data.
  - `useDateStore`: current `viewStart` / `viewEnd` date range driving many widgets.
  - `useUIStore`: `activeTab`, `dateRange`, `isSidebarOpen`, `apisEnabled` (persisted via Zustand).
- **Initial demo load**:
  - `src/app/page.tsx` – `handleDemo` calls `loadDemoData()` then `router.push("/dashboard")`.
  - `src/app/dashboard/page.tsx` – `useEffect` checks `transactions.length === 0` and calls `loadDemoData()`.
  - **Risk**: double-loading demo data or missing data when navigation paths change.

### 2.2 Time / Date & Ranges
- **Core helpers**:
  - `src/lib/selectors/transactionSelectors.ts` – `getTransactionsInDateRange`.
  - `src/lib/math/transactionMath.ts` – `computeSummaryMetrics` used in `Dashboard` summary.
- **Risk areas**:
  - Off-by-one day issues from `DateRange` boundaries.
  - Empty states when `viewStart`/`viewEnd` move outside demo data range.
  - Summary cards showing `0` or `NaN` when transactions are unexpectedly filtered out.

### 2.3 Network/API-Dependent Widgets
- **Crypto dashboard**:
  - `src/app/dashboard/crypto/page.tsx` – global stats, trending, search, and watchlist.
  - Uses external APIs (via `lib/cache` / `useCrypto` / `/api/crypto`) and must handle loading, error, and offline states.
- **Stocks dashboard**:
  - `src/app/dashboard/stocks/page.tsx` – market status bar, indices tiles, search, and watchlists.
  - Uses external APIs (via `useStocks` / `/api/stocks`) with similar state handling requirements.
- **Economy & news widgets**:
  - `src/components/dashboard/EconomicWidget.tsx` + `src/app/api/economy/route.ts`.
  - `src/components/dashboard/NewsFeed.tsx` + `src/app/api/news/route.ts`.
- **Risk areas**:
  - Misaligned loading skeletons and final content (e.g., layout jumps).
  - Errors not surfaced clearly to the user or overlapping content.
  - Throttling/ratelimit handling and stale data visuals.

### 2.4 Navigation & Layout
- **Sidebar behavior** (`Sidebar` + `useUIStore`):
  - `setActiveTab` changes `activeTab` and closes the sidebar on mobile.
  - `isSidebarOpen` controls transform/slide-in animations.
- **Layout shell** (`AppLayout`):
  - Background image `dashboard-bg.png`, black overlay, and radial gradient layers.
  - `main` content padding and responsiveness via `md:pl-64` when sidebar is open.
- **Risk areas**:
  - Sidebar overlapping main content or failing to close on small screens.
  - Tabs appearing selected in the sidebar but content not changing (store wiring bugs).
  - Scrollable content sections clipping under fixed headers.

### 2.5 Modals, Debug, and Misc Overlays
- **UploadModal**:
  - `src/components/onboarding/UploadModal.tsx` opened from `/`.
  - Risk: portal/overlay z-index issues with landing page background.
- **MinigameModal**:
  - `src/components/dashboard/MinigameModal.tsx` opened from `Sidebar` footer.
- **DebugPanel**:
  - `src/components/dashboard/DebugPanel.tsx`, always rendered by `src/app/dashboard/page.tsx`.
  - Risk: overlapping bottom content, especially on smaller viewports.

---

## 3. Fast Smoke Test Checklist (3–5 Minutes)

Run this whole list after impactful UI changes or dependency upgrades.

### 3.1 Landing & Demo Entry
1. **Open `/`** in a fresh session (clear local storage if needed).
   - Confirm logo, hero text, and background gradients render and text is readable.
   - Hover both buttons and ensure styles change (no clipped focus rings or odd colors).
2. **Click "Upload Statement"**.
   - `UploadModal` opens centered with backdrop; closing returns cleanly to landing.
3. **Click "Try Demo"**.
   - You are navigated to `/dashboard`.
   - No errors in console during navigation.

### 3.2 Dashboard Shell & Sidebar
4. **Initial dashboard view**.
   - Sidebar is visible on desktop; main content shows the `Dashboard` tab.
   - Background image and gradients are present, with no harsh banding or missing assets.
5. **Sidebar interactions**.
   - Click the sidebar toggle to collapse/expand; main content width adjusts smoothly.
   - On a narrow viewport (or dev tools mobile mode), open and close the mobile sidebar toggle; ensure it does not cover content after closing.

### 3.3 Tab Navigation Sweep
6. **Click through all tabs in order** (Dashboard → Overview → Statement → Subscriptions → Recurring → Fees → Cashflow → Budget → My Money → Stocks → Crypto → Review).
   - For each tab:
     - No runtime errors or blank screens.
     - A clear heading/label and non-empty primary content (cards, tables, or charts).
     - Layout fits within viewport; no obvious overflow or cut-off content.

### 3.4 Time/Date & Summary Sanity
7. **On `Dashboard` tab**.
   - Greeting ("Good Morning/Afternoon/Evening") and time box show a plausible local time and timezone.
   - All five summary cards show **formatted USD currency** and non-`NaN` values.
   - Changing the date range (if controls are visible) does not produce empty or obviously wrong summary values.

### 3.5 Live Data Tabs – Stocks & Crypto
8. **Stocks tab**.
   - Market status bar renders with a status (e.g., "Market Open" / "Market Closed") and next change text.
   - Indices/tiles render (SPY/QQQ/etc.) with prices and percent changes; if APIs are disabled/unavailable, a clear error or empty state is shown instead of broken UI.
   - Try a simple action: search or add a stock and ensure the watchlist updates.
9. **Crypto tab**.
   - Global stats row renders (total market cap, volume, dominance) or a clear loading/error state.
   - Trending strip shows coins or a skeleton when loading.
   - Try a simple action: search for a popular coin (e.g., bitcoin) and add/remove it from the watchlist.

### 3.6 Debug & Misc
10. **Scroll to the bottom of `/dashboard`**.
    - `DebugPanel` is visible, readable, and does not cover essential content.
11. **Optional quick reset**.
    - Use "Restart Demo" in the Sidebar footer.
    - Confirm you are redirected appropriately and demo data resets without obvious glitches.
