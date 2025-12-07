# GitHub Copilot – MoneyMap v2 Repository Instructions

## Overview

- This repo is the **main MoneyMap v2 app**.  
- It is a **Next.js 16 App Router** project using **TypeScript**, **Tailwind**, and **Recharts**.
- Treat this repo as the **only source of truth**.  
  - Ignore any sibling directories like `moneymap-legacy` – those are **old and not used**.

## Project structure (what matters)

- `src/app/`
  - `layout.tsx`, `page.tsx`: top-level app shell and dashboard entry.
  - `dashboard/`: main demo/dashboard pages.
- `src/components/dashboard/`
  - `StatementTab.tsx`: statement table, date range dropdowns.
  - `Overview.tsx`, `Budget.tsx`, `Cashflow.tsx`, `Subscriptions.tsx`, `Fees.tsx`, `Review.tsx`, etc.
  - `DebugPanel.tsx`: internal debug output and view-range diagnostics.
- `src/lib/`
  - `store/useDataStore.ts`: transaction state, synthetic data.
  - `store/useDateStore.ts`: **canonical view range state** (viewStart / viewEnd).
  - `store/useUIStore.ts`: UI-only state. **Do not use this for filtering transactions by date.**
  - `math/transactionMath.ts`: core math – summary metrics, car insurance spend, etc.
  - `selectors/transactionSelectors.ts`: **canonical filtering helpers**  
    - `getTransactionsInDateRange`  
    - Any date / view-range filtering must go through these helpers.
  - `constants/`, `data/merchantPools.ts`, etc.: category and merchant definitions.

- `docs/`
  - `lifestyle_merchant_pools_v1.md` – **canonical merchant pools & lifestyle mapping** (must be treated as source of truth).
  - `moneymap_planned_changes.md` – backlog / UX behavior spec. Implement features to match this.
  - `Phase2_1_Final_Fix_Summary.md` – final spec for **view-range behavior**.
  - `Phase2_2_and_2_3_Implementation_Summary.md` – centralized summary metrics + car insurance box spec.
  - `Phase2_Remaining_Gaps_and_ModelPlan.md` – open issues + model plan.
  - Any `Phase*_QA*` or `*_Plan.md` – docs first, then code.

If you need context for a feature, **read the docs in `/docs` before editing code.**

## Date / view-range rules (very important)

When touching anything related to date ranges, bank statements, or view filters:

1. **Single source of truth for view range**
   - Use `useDateStore` (`viewStart`, `viewEnd`) for the active range.
   - Do **not** introduce new date state in components.
   - Do **not** use `useUIStore.dateRange` for transaction filtering.

2. **Filtering transactions**
   - Always use `getTransactionsInDateRange(transactions, viewStart, viewEnd)` from `transactionSelectors.ts`.
   - This helper uses **dateKey** (YYYYMMDD integer) comparisons and is the only place where inclusive/exclusive boundaries are defined.
   - If you need additional filters (category, amount, etc.), call them **after** `getTransactionsInDateRange`.

3. **Month-based behavior**
   - For month pickers (From / To dropdowns in `StatementTab.tsx`), treat the range as:
     - Start = first day of “From” month (inclusive)
     - End = first day of month after “To” (exclusive)
   - When formatting subtitles, show:
     - `Dec 1, 2025 – Dec 31, 2025` for `Dec 2025` to `Dec 2025`
   - Do **not** re-introduce ad-hoc date arithmetic like `23:59:59.999` hacks in components.

4. **Budget / Overview / other tabs**
   - Any component that needs “transactions in view range” must:
     - Get `viewStart` / `viewEnd` from `useDateStore`.
     - Derive `filteredTransactions` using `getTransactionsInDateRange`.
     - Run all math (totals, percentages, category stats, car insurance comparisons, etc.) on `filteredTransactions` only.
   - Remove or avoid any use of legacy helpers like `isDateInRange(t.date, dateRange)` for new code.

## Merchant / category rules

- **Never hard-code random merchant/category logic.**
- Use the canonical sources:
  - `docs/lifestyle_merchant_pools_v1.md` for lifestyle / merchant pools.
  - `src/lib/constants/categories.ts` (or similar) for category IDs / labels.
  - `src/lib/data/merchantPools.ts` for pool membership.
- When adding new merchants, categories, or lifestyle rules:
  - Update the relevant doc and data file together.
  - Keep naming consistent with existing patterns.

## Coding style & patterns

- Use **TypeScript** types consistently:
  - Re-use existing shared types in `src/lib/types/` instead of redefining shapes.
  - Prefer explicit type aliases / interfaces for transactions, stats, and stores.
- **Next.js 16 App Router** conventions:
  - Keep server vs client components correct (`"use client"` only where needed).
  - Avoid blocking async work inside React rendering; use data-fetching routes or helpers.
- UI:
  - Use existing Tailwind design language (dark gradient dashboard).
  - Favor small, composable components under `src/components/ui` and `src/components/dashboard`.
- Testing / safety:
  - When changing math or date logic, add or update a small suite of unit tests where feasible, or at least inline examples in comments.
  - Don’t silently change public behavior without updating the relevant docs under `/docs`.

## What to ignore or avoid

- Ignore `moneymap-legacy` completely – it’s old and not used.
- Don’t touch `.next`, `node_modules`, or generated artifacts.
- Don’t introduce new state stores if an existing store can be extended.
- Don’t bypass centralized math or selectors:
  - No copy-pasted totals logic in components.
  - Route all summary metrics through `transactionMath.ts`.
- Avoid adding libraries unless absolutely necessary; prefer built-in Next/React/Tailwind/Recharts.

## How to help the maintainer

- If a spec or behavior is unclear:
  - Check `/docs/*Plan*.md` and `/docs/*Summary*.md` first.
  - Then look at existing implementations in other tabs before inventing new patterns.
- When proposing bigger changes:
  - Update the relevant plan / summary doc, or create a new doc in `/docs` explaining the behavior and assumptions.
