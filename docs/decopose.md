# Dashboard decomposition plan

Goal: break `src/app/dashboard/page.tsx` into reusable hooks and presentational components while preserving current behavior and localStorage interactions.

## Target structure
- `src/app/dashboard/hooks/`
  - `useDateRange.ts` – default three-month range, storage hydration (legacy keys), normalized range, year options, hasTouchedRange flag. **Done**
  - `useStatementFlow.ts` – generate/regenerate/analyze/restart sample statement, `flowStep`, `fullStatementTransactions`, `showStatement`, `isEditing`, localStorage sync, add-transaction handler. **Done**
  - `useOwnershipAccounts.ts` – derive transfer accounts (inferred + custom), overrides/hide, ownership modes + derived ownership map, edit/delete, add-account wizard state & save handler, storage persistence. **Done**
  - `useDuplicates.ts` – build duplicate clusters, `duplicateDecisions`, confirm/dismiss handlers, overlay open/close, expanded clusters, metadata lookup. **Done**
  - `useDerivedMetrics.ts` – memoized totals and breakdowns: filtered statement by range, sorted list + month buckets, cashflow rows/month buckets, category breakdown/grouped spending, summary stats, budget guidance, subscription/fee/recurring rows, internal transfer totals, etc. **Done**
  - `useGestureTabs.ts` – swipe navigation state/handlers for tab changes. **Done**
  - `useExpansionState.ts` – expanded sets for statement months, cashflow months, cashflow day details. **Done**
- `src/app/dashboard/components/`
  - Layout primitives: `DashboardShell`. **TBD**
  - Statement flow: `StatementPanel` (range picker + actions, grouped/flat statement table, inline category editing, add row). **Done**
  - Results: `SummaryCards`, `TabsBar`. **Done**
  - Tabs:
    - `OverviewTab` (donut, legend, category cards, transactions list). **Done**
    - `RecurringTab` (recurring table, duplicate chip/actions). **Done**
    - `FeesTab`. **Done**
    - `CashflowTab` (monthly accordions + daily rows). **Done**
    - `ReviewTab` (snapshot cards, duplicate tile, budget guidance, needs-vs-wants bar, accounts section). **Done (inline accounts kept inside component)**
    - `AccountsSection` (if further split of ReviewTab accounts is desired). **TBD**
  - Overlay: `DuplicateOverlay` (currently still inline in `page.tsx`). **TBD**
- `src/app/dashboard/utils/`
  - `format.ts` – shared currency and date formatters. **Done**
  - `types.ts` – small shared shapes (e.g., SummaryCard, SpendingGroup) if needed across components. **Placeholder**

## Work phases
1) Extract shared utilities/types (formatters, small type aliases). **Done**
2) Create hooks in `hooks/` with existing logic copied from `page.tsx` (no behavior changes). **Done**
3) Move presentational pieces into `components/`, wired with hook props. **In progress (Overview/Recurring/Fees/Cashflow/Review/Summary/Tabs/Statement done; duplicate overlay and optional account subcomponent remain)**
4) Slim `page.tsx` to orchestrate hooks, pass data/handlers to components. **Mostly done; duplicate overlay still inline**
5) Verify build/types (`npm run lint` or `npm run build` per repo), fix regressions. **Lint passing**
