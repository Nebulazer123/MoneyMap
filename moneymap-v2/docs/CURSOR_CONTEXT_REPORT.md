# MoneyMap v2 - Cursor Context Report

**Generated:** 2025-01-27  
**Purpose:** Comprehensive project snapshot for ChatGPT context transfer

---

## Environment & Tools

### Cursor Version
**Status:** Unable to read automatically  
**How to find:** Click `Help` → `About Cursor` in the menu bar, copy the version number

### System Information
- **OS:** Windows 10.0.26200 (win32)
- **Shell:** PowerShell (C:\WINDOWS\System32\WindowsPowerShell\v1.0\powershell.exe)
- **Node.js:** v24.11.1
- **npm:** 11.6.2

### Next.js Configuration
- **Version:** 16.0.7
- **Router:** **App Router** (confirmed by `src/app/` directory structure)
- **Why App Router:** 
  - Uses `src/app/` directory with `layout.tsx`, `page.tsx` files
  - Route handlers in `src/app/api/*/route.ts` pattern
  - Client components marked with `"use client"` directive
  - Server components by default (no directive needed)

### Git Status
- **Branch:** `main`
- **Status:** **DIRTY** (10 modified files, 4 untracked files)
- **Last Commit:** `3b76971bc740a0e8e08e4b3e30498e2172268a9c`
- **Last Commit Message:** `refactor: Enhance Cashflow component with improved date handling and aggregation logic`

**Modified Files:**
- `src/app/dashboard/page.tsx`
- `src/components/dashboard/Cashflow.tsx`
- `src/components/dashboard/CurrencyConverter.tsx`
- `src/components/dashboard/Dashboard.tsx`
- `src/components/dashboard/EconomicWidget.tsx`
- `src/components/dashboard/Overview.tsx`
- `src/components/dashboard/Review.tsx`
- `src/components/layout/Sidebar.tsx`
- `src/components/ui/GlassCard.tsx`
- `src/lib/store/useUIStore.ts`

**Untracked Files:**
- `BUG_REPORT.md`
- `COMPREHENSIVE_TEST_REPORT.md`
- `FINAL_TEST_SUMMARY.md`
- `TESTING_REPORT.md`

---

## Repository Metrics

### File Counts
- **Tracked Files (git ls-files):** 138 files
- **Source Files (src/):**
  - `.ts`: 41 files
  - `.tsx`: 34 files
  - `.css`: 1 file
  - **Total source:** 76 files

### Folder Size
- **Total (excluding node_modules):** 724.79 MB
- **Note:** Includes build artifacts, `.next/`, and other generated files

### File Counts by Extension (entire repo, excluding node_modules)
- `.md`: 713 files (mostly in docs)
- `.js`: 15,449 files (likely includes build outputs)
- `.json`: 1,194 files
- `.css`: 15 files
- `.ts`: 5,016 files
- `.tsx`: 66 files

---

## Directory Structure (Curated)

### `moneymap-v2/src/app/`
```
app/
├── api/                    # Next.js API routes (App Router)
│   ├── charts/route.ts
│   ├── countries/route.ts
│   ├── crypto/route.ts
│   ├── economy/route.ts
│   ├── exchange/route.ts
│   ├── faker/route.ts      # Demo data generation
│   ├── location/route.ts
│   ├── logos/route.ts
│   ├── news/route.ts
│   ├── stocks/route.ts
│   ├── time/route.ts
│   ├── users/route.ts
│   ├── uuid/route.ts
│   ├── verification/route.ts
│   └── weather/route.ts
├── dashboard/
│   ├── crypto/page.tsx
│   ├── layout.tsx          # Wraps with AppLayout
│   ├── page.tsx             # Main dashboard router
│   └── stocks/page.tsx
├── favicon.ico
├── globals.css
├── layout.tsx               # Root layout (includes DebugPanel)
└── page.tsx                 # Landing page (Try Demo / Upload)
```

### `moneymap-v2/src/components/`
```
components/
├── dashboard/              # Main dashboard components
│   ├── Accounts.tsx
│   ├── Budget.tsx
│   ├── Cashflow.tsx
│   ├── Crypto.tsx
│   ├── CurrencyConverter.tsx
│   ├── Dashboard.tsx
│   ├── DebugPanel.tsx      # ⚠️ DUPLICATE #1 (see below)
│   ├── EconomicWidget.tsx
│   ├── Fees.tsx
│   ├── LocationWidget.tsx
│   ├── MinigameModal.tsx
│   ├── NewsFeed.tsx
│   ├── Overview.tsx
│   ├── Recurring.tsx
│   ├── Review.tsx
│   ├── StatementTab.tsx
│   ├── Stocks.tsx
│   └── Subscriptions.tsx
├── debug/
│   └── DebugPanel.tsx      # ⚠️ DUPLICATE #2 (see below)
├── layout/
│   ├── AppLayout.tsx
│   └── Sidebar.tsx
├── onboarding/
│   └── UploadModal.tsx
└── ui/                     # Reusable UI components
    ├── Badge.tsx
    ├── Button.tsx
    ├── GlassCard.tsx
    ├── InfoTooltip.tsx
    ├── Input.tsx
    └── Ticker.tsx
```

### `moneymap-v2/src/lib/`
```
lib/
├── __tests__/
│   └── internalTransferLogic.verify.ts
├── cache/                  # API caching hooks
│   ├── CacheManager.ts
│   ├── index.ts
│   ├── useCache.ts
│   ├── useCrypto.ts
│   ├── useStocks.ts
│   └── useUtilities.ts
├── categoryRules.ts        # Transaction categorization rules
├── config.ts
├── constants/
│   └── categories.ts
├── cryptoHelpers.ts
├── data/
│   └── merchantPools.ts   # Merchant definitions for fake data
├── derived/
│   └── suspiciousSummary.ts
├── generators/            # Fake data generation
│   ├── idGenerator.ts
│   ├── lifestyleProfile.ts # Deterministic user profiles
│   ├── suspiciousDetection.ts
│   └── transactionEngine.ts # Main transaction generator
├── logic/
│   ├── accounts.ts
│   └── metrics.ts
├── math/
│   └── transactionMath.ts
├── selectors/
│   └── transactionSelectors.ts
├── services/               # Empty directory
├── store/                  # Zustand state management
│   ├── useDataStore.ts     # Transactions, accounts, categories
│   ├── useDateStore.ts     # Date ranges, profile IDs
│   └── useUIStore.ts       # UI state (tabs, sidebar, date filters)
├── types/
│   └── index.ts            # TypeScript type definitions
└── utils.ts
```

### `moneymap-v2/docs/`
```
docs/
├── APIS_INTEGRATED.md
├── Budget_Car_Insurance_Box_Spec.md
├── DOCUMENTEDchanges.md
├── DOCUMENTEDnames.md
├── FINAL-Phase2Plan.md
├── FREE_APIS_SUGGESTIONS.md
├── How to Upgrade Next.js.md
├── lifestyle_merchant_pools_v1.md
├── merchant_name_coverage_status.md
├── news_api_artifacts.md
├── Personal Instructions for Phases .txt
├── Phase2_1_Date_Range_Bug_Fix.md
├── Phase2_1_Final_Fix_Summary.md
├── Phase2_2_and_2_3_Implementation_Summary.md
├── Phase2_Manual_QA_Findings_2025-12-05_v2.md
├── Phase2_Manual_QA_Findings_2025-12-05.md
├── phase2_pre_implementation_research.md
├── Phase2_QA_Checklist.md
├── Phase2_Remaining_Gaps_and_ModelPlan.md
├── Phase2Plan_Unrevised.md
├── Phase3_CryptoSpec.md
├── Phase3_EconIndicators_Styling.md
├── Phase3_FeesSpec.md
├── Phase3_OverviewPieAndCategories.md
├── Phase3_OverviewPiePolish.md
├── Phase3_Plan.md
├── Phase3_StatusAudit.md
├── Phase3_StocksSpec.md
├── Phase3_SuspiciousUX_Spec.md
└── Transaction_Pool_Audit_Report.md
```

---

## Architecture Snapshot

### Routing (App Router)
- **Root:** `/` → `src/app/page.tsx` (landing page with "Try Demo" button)
- **Dashboard:** `/dashboard` → `src/app/dashboard/page.tsx` (tab router)
- **Sub-routes:**
  - `/dashboard/stocks` → dedicated stocks page
  - `/dashboard/crypto` → dedicated crypto page
- **API Routes:** All under `/api/*` (e.g., `/api/crypto`, `/api/stocks`)

**Tab System:**
Dashboard uses `useUIStore.activeTab` to switch between:
- `dashboard`, `overview`, `recurring`, `fees`, `cashflow`, `review`, `statement`, `subscriptions`, `budget`, `accounts`, `stocks`, `crypto`

### Fake Data Generation

**Three-Layer System:**

1. **Lifestyle Profile** (`lib/generators/lifestyleProfile.ts`)
   - Deterministic profile based on `profileId` (UUID seed)
   - Defines: banks, merchants, subscriptions, utilities, P2P services
   - Profile persists across data regeneration (same `profileId` = same merchants)

2. **Transaction Engine** (`lib/generators/transactionEngine.ts`)
   - 12-stage pipeline generating realistic transactions
   - Uses seeded RNG for determinism
   - Supports two modes:
     - `'full'`: Generate new profile + transactions
     - `'extend'`: Add transactions to existing dataset (preserves profile)

3. **Suspicious Detection** (`lib/generators/suspiciousDetection.ts`)
   - Post-generation pass that flags:
     - Duplicate charges (same merchant/amount, too soon)
     - Overcharges (expected merchant, higher amount)
     - Unexpected charges (unknown merchant patterns)

**Data Flow:**
```
useDateStore.profileId → generateLifestyleProfile() 
  → generateTransactions(profile, dateRange, mode)
    → injectSuspiciousCharges()
      → runDetectionPass()
        → useDataStore.setTransactions()
```

**API Endpoint:** `/api/faker` - Generates demo transactions using FakerAPI.it

### State Management (Zustand)

**Three Stores:**

1. **`useDataStore`** (`lib/store/useDataStore.ts`)
   - **State:** `transactions[]`, `accounts[]`, `categories[]`, `currentProfile`, `isLoading`
   - **Actions:** `generateData(mode)`, `loadDemoData()`, `clearData()`, CRUD operations
   - **Persistence:** localStorage (`moneymap-data-storage`)
   - **Key:** Stores all transactions in memory (may be inefficient for large datasets)

2. **`useDateStore`** (`lib/store/useDateStore.ts`)
   - **State:** `datasetStart`, `datasetEnd`, `viewStart`, `viewEnd`, `today`, `profileId`, `lastGeneratedAt`
   - **Actions:** `setDatasetRange()`, `setViewRange()`, `extendDatasetRange()`, `regenerateStatements()`, `syncToday()`
   - **Persistence:** localStorage (`moneymap-date-store`)
   - **Key:** Separates "what data exists" (dataset) from "what user sees" (view)

3. **`useUIStore`** (`lib/store/useUIStore.ts`)
   - **State:** `activeTab`, `dateRange` (legacy), `isSidebarOpen`, `apisEnabled`
   - **Actions:** `setActiveTab()`, `setDateRange()`, `toggleSidebar()`, `setApisEnabled()`
   - **Persistence:** localStorage (`moneymap-ui-storage`)
   - **Note:** `dateRange` in UIStore appears to be legacy; `useDateStore` is the source of truth

### API Calls

**External APIs (via Next.js API routes):**

1. **Crypto:** CoinGecko (free tier, rate limited)
2. **Stocks:** Yahoo Finance (`yahoo-finance2` npm package)
3. **Exchange Rates:** Frankfurter API (primary), ExchangeRate-API (fallback)
4. **News:** NewsAPI.org (requires API key, rate limited)
5. **Location:** ipapi.co (1,000 req/day, free)
6. **Time:** WorldTimeAPI (unlimited, polite use)
7. **Faker:** FakerAPI.it (unlimited, demo data)
8. **Countries:** REST Countries API
9. **Users:** RandomUser.me API
10. **Weather:** OpenWeatherMap (requires API key)

**Caching Strategy:**
- `lib/cache/` provides hooks: `useCache()`, `useCrypto()`, `useStocks()`, `useUtilities()`
- TTL-based caching with session/localStorage fallback
- API kill switch: `useUIStore.apisEnabled` can disable all external calls

**API Route Pattern:**
All routes in `src/app/api/*/route.ts` export `GET(request: NextRequest)` handlers.

---

## Duplicates & Confusing Patterns

### ⚠️ Two DebugPanel Components

**Issue:** Two different `DebugPanel` components exist:

1. **`src/components/debug/DebugPanel.tsx`** (282 lines)
   - Used in: `src/app/layout.tsx` (root layout)
   - Features: Month/year dropdowns, preset buttons, simpler UI
   - Version: "v2.0-alpha"

2. **`src/components/dashboard/DebugPanel.tsx`** (386 lines)
   - Used in: `src/app/dashboard/page.tsx`
   - Features: More detailed, API status display, kill switch, extended date options
   - Uses: `GlassCard` component, more polished UI

**Impact:** Both are rendered simultaneously:
- Root layout renders `components/debug/DebugPanel.tsx`
- Dashboard page renders `components/dashboard/DebugPanel.tsx`
- Result: Two debug panels visible at once

**Recommendation:** Consolidate into one component, or remove one.

### Date Range Confusion

**Issue:** Multiple date range concepts:

1. **`useDateStore`** (source of truth):
   - `datasetStart/End`: What transactions exist
   - `viewStart/End`: What user sees (filtered)

2. **`useUIStore.dateRange`** (legacy):
   - Appears to be old implementation
   - Still used in some components for filtering

**Impact:** Components may filter using different date sources, causing inconsistencies.

### State Persistence Overlap

**Issue:** Both `useDateStore` and `useUIStore` persist date-related state:
- `useDateStore`: `datasetStart`, `datasetEnd`, `viewStart`, `viewEnd`
- `useUIStore`: `dateRange` (legacy)

**Impact:** Potential for stale or conflicting date state after hydration.

### Empty Services Directory

**Issue:** `src/lib/services/` exists but is empty.

**Impact:** Unclear if this is intentional (future use) or leftover structure.

---

## Key Dependencies

```json
{
  "next": "^16.0.7",
  "react": "^19.2.1",
  "react-dom": "^19.2.1",
  "zustand": "^5.0.9",
  "recharts": "^3.5.1",
  "yahoo-finance2": "^3.10.2",
  "@tanstack/react-virtual": "^3.13.12",
  "lucide-react": "^0.555.0",
  "tailwindcss": "^4",
  "typescript": "^5"
}
```

---

## Questions for Corbin

1. **DebugPanel Duplication:** Which `DebugPanel` should be the canonical one? Should we merge them or remove one entirely?

2. **Date Range Legacy:** Is `useUIStore.dateRange` still needed, or can we migrate all components to use `useDateStore.viewStart/viewEnd`?

3. **Services Directory:** Is `src/lib/services/` intentionally empty for future use, or should it be removed?

4. **Transaction Storage:** The `useDataStore` persists all transactions in localStorage. For large datasets, should we implement pagination or lazy loading?

5. **API Key Management:** Several APIs (NewsAPI, OpenWeatherMap) require keys. Are these configured via environment variables, or is the app running in demo mode only?

6. **Profile Regeneration:** When should `profileId` change? Currently it changes on "New Statements" but persists on "Extend". Is this the desired behavior?

7. **Suspicious Detection:** The suspicious detection runs post-generation. Should users be able to manually mark transactions as suspicious, or is it detection-only?

8. **Build Artifacts:** The repo is 724MB excluding node_modules. Should `.next/`, `tsconfig.tsbuildinfo`, and other build artifacts be in `.gitignore`?

9. **Component Organization:** Some dashboard components are quite large (e.g., `Review.tsx`). Should we consider splitting into smaller sub-components?

10. **Type Safety:** The codebase uses TypeScript, but some API responses use `any`. Should we add stricter typing for external API responses?

11. **Testing Strategy:** There's one test file (`internalTransferLogic.verify.ts`). What's the testing strategy going forward—unit tests, integration tests, or manual QA only?

12. **Documentation:** The `docs/` folder has 27 markdown files. Should we consolidate or create a master index for easier navigation?

---

## Notes

- **moneymap-legacy:** Treated as ignored per instructions (separate legacy codebase)
- **No commits:** Per instructions, no git commits made
- **Cursor version:** Please manually copy from Help → About Cursor and add to this report

---

**End of Report**

