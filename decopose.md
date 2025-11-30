# Dashboard decomposition plan

Goal: break `src/app/dashboard/page.tsx` into reusable hooks and presentational components while preserving current behavior and localStorage interactions.

## Target structure
- `src/app/dashboard/hooks/`
  - `useDateRange.ts` – default three-month range, storage hydration (legacy keys), normalized range, year options, hasTouchedRange flag.
  - `useStatementFlow.ts` – generate/regenerate/analyze/restart sample statement, `flowStep`, `fullStatementTransactions`, `showStatement`, `isEditing`, localStorage sync, add-transaction handler.
  - `useOwnershipAccounts.ts` – derive transfer accounts (inferred + custom), overrides/hide, ownership modes + derived ownership map, edit/delete, add-account wizard state & save handler, storage persistence.
  - `useDuplicates.ts` – build duplicate clusters, `duplicateDecisions`, confirm/dismiss handlers, overlay open/close, expanded clusters, metadata lookup.
  - `useDerivedMetrics.ts` – memoized totals and breakdowns: filtered statement by range, sorted list + month buckets, cashflow rows/month buckets, category breakdown/grouped spending, summary stats, budget guidance, subscription/fee/recurring rows, internal transfer totals, etc.
  - `useGestureTabs.ts` – swipe navigation state/handlers for tab changes.
  - `useExpansionState.ts` – expanded sets for statement months, cashflow months, cashflow day details.
- `src/app/dashboard/components/`
  - Layout primitives: `DashboardShell`.
  - Statement flow: `StatementPanel` (range picker + actions), `DateRangePicker`, `StatementActions`, `StatementTable` (grouped/flat, inline category editing, AddTransactionRow slot).
  - Results: `SummaryCards`, `TabsBar`.
  - Tabs:
    - `OverviewTab` (uses `SpendingDonut`, `SpendingLegend`, `CategoryGrid`, `CategoryTransactions`).
    - `RecurringTab` (table, duplicate chip/actions).
    - `FeesTab`.
    - `CashflowTab` (monthly accordions + daily rows).
    - `ReviewTab` (snapshot cards, duplicate tile, budget guidance, needs-vs-wants bar).
    - `AccountsSection` (account cards with ownership buttons, edit/delete, add-account form).
  - Overlay: `DuplicateOverlay`.
- `src/app/dashboard/utils/`
  - `format.ts` – shared currency and date formatters.
  - `types.ts` – small shared shapes (e.g., SummaryCard, SpendingGroup) if needed across components.

## Work phases
1) Extract shared utilities/types (formatters, small type aliases).
2) Create hooks in `hooks/` with existing logic copied from `page.tsx` (no behavior changes).
3) Move presentational pieces into `components/`, wired with hook props.
4) Slim `page.tsx` to orchestrate hooks, pass data/handlers to components.
5) Verify build/types (`npm run lint` or `npm run build` per repo), fix regressions.
