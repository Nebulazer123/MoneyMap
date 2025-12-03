# Dashboard decomposition plan

Goal: keep `src/app/dashboard/page.tsx` as a thin orchestrator and push logic into reusable hooks + presentational components, while preserving current behavior, demo realism, and localStorage interactions.

## Target structure

### Hooks – `src/app/dashboard/hooks/`

- `useDateRange.ts`  
  Default three-month range, storage hydration (legacy keys), normalized range, year options, `hasTouchedRange` flag.  
  **Status: Done**

- `useStatementFlow.ts`  
  Generates / regenerates / analyzes / restarts the sample statement. Owns `flowStep`, `fullStatementTransactions`, `showStatement`, `isEditing`, add-transaction handler, and syncs state to `localStorage`.  
  **Status: Done**

- `useOwnershipAccounts.ts`  
  Central state machine for transfer/ownership logic. Responsibilities now include:
  - Derive transfer “counterparty accounts” from transfer transactions using a normalized key based on the cleaned description (e.g. `"Venmo 8596"`, `"Cash App transfer to Chase Freedom 9204"`), stripping the `"Transfer to/from"` prefix but keeping last-4 digits.
  - Maintain `transferAccounts` with metadata, ownership mode (personal vs bills), and `matchedTransactionIds` for each account.
  - Track a canonical `assignedTransactionIds` set across all accounts.
  - Compute `unassignedTransferTransactions` as “all transfer transactions minus assigned IDs” for the manual-add pool.
  - Provide APIs to:
    - start / cancel editing an account,
    - add/save/delete accounts,
    - unassign transactions from an account on save (unchecked rows go back to the unassigned pool),
    - `attachTransactionsToAccount(accountId, txIds)` to move unassigned transfers into an existing account.
  - Persist account definitions + matches to `localStorage`.
  **Status: Done**

- `useDuplicates.ts`  
  Builds duplicate clusters for recurring charges, tracks `duplicateDecisions`, and exposes overlay open/close and expand/collapse state.  
  **Status: Done**

- `useDerivedMetrics.ts`  
  Pure derived layer over `statementTransactions` + ownership:
  - sorted statement list + month buckets,
  - cashflow rows and month buckets,
  - grouped spending data and overview tiles inputs,
  - totals for income, spending, fees, subscriptions, internal transfers,
  - budget guidance + top spending categories,
  - rows for fees / recurring charges / subscriptions.  
  **Status: Done**

- `useGestureTabs.ts`  
  Swipe-gesture handlers for moving between dashboard tabs on touch devices.  
  **Status: Done**

- `useExpansionState.ts`  
  Manages expanded/collapsed sets:
  - statement months,
  - cashflow months,
  - cashflow day details.  
  **Status: Done**

### Components – `src/app/dashboard/components/`

- Layout primitives
  - `GlassPanel.tsx`, `SectionHeader.tsx`, `InfoTip.tsx` etc. – shared visual primitives for the dashboard.  
    **Status: Done**
  - `DashboardShell` – potential future shell for the dashboard layout if we want to extract chrome out of `page.tsx`.  
    **Status: Optional / TBD**

- Statement flow
  - `StatementPanel.tsx`  
    Handles the “Demo statement” edit/analyze view:
    - date-range pickers + edit / regenerate / analyze / restart buttons,
    - statement table with month grouping and inline category editing,
    - add-transaction row,
    - **header line that uses base-account metadata to show something like**  
      `Demo statement covering Checking ****7846 and Savings ****4837`  
      via `formatBaseAccountLabel(..., true)`,
    - table uses the **exact** `tx.description` string (including “Transfer to X 8596”, “Transfer from Savings 4837”, and Visa/ACH hints).  
    **Status: Done**

- Result chrome
  - `SummaryCards.tsx`  
    Renders the summary tiles grid above the tabs using derived totals.  
    **Status: Done**

  - `TabsBar.tsx`  
    Tab strip (Overview / Subscriptions / Fees / Cash flow / Review) plus “Edit transactions” toggle when relevant.  
    **Status: Done**

- Tabs
  - `OverviewTab.tsx`  
    Donut chart + legend + category chips. Shows transactions for active spending categories. Uses grouped spending data from `useDerivedMetrics`.  
    **Status: Done**

  - `RecurringTab.tsx`  
    Subscriptions/recurring charges table, duplicate chip/actions, wired to `useDuplicates`.  
    **Status: Done**

  - `FeesTab.tsx`  
    Simple fees table + total.  
    **Status: Done**

  - `CashflowTab.tsx`  
    Monthly accordions with daily inflow/outflow rows, using cashflow rows + expansion state from hooks.  
    **Status: Done**

  - `ReviewTab.tsx`  
    “Deep dive” summary and account/cleanup tools. Responsibilities now:
    - Summary cards (net, left after bills, category guidance, etc.).
    - Duplicate-review tile hooking into `useDuplicates`.
    - Budget guidance + needs-vs-wants visualization.
    - **Transfer accounts section** driven by `useOwnershipAccounts`:
      - “Detected accounts from transfers” cards for each `transferAccount`, with:
        - editable name and type,
        - ownership mode chips (personal / bills / not mine),
        - matched transfer list with checkboxes. Unchecking moves that tx back to the unassigned pool on save.
      - “Manually add account” area that:
        - is populated exclusively from `unassignedTransferTransactions`,
        - hides or shows an empty-state message when there are no uncategorized transfers,
        - sorts representative transactions by normalized counterparty name then by date,
        - offers a dropdown to either:
          - create a new account (using provided name/type), or
          - attach the selected transfers to an **existing** account via `attachTransactionsToAccount`.
        - prevents accidental duplicate accounts by preferring “attach to existing” behavior when a matching account already exists.
      - Uses normalized counterparty labels so names read like “Venmo ending 8596” or “Cash App transfer to Chase Freedom 9204” (single account number, no full “Transfer from … to …” sentences).  
    - Anywhere base checking/savings accounts appear here, they are shown as `"Checking -7846"` / `"Savings -4837"` via the base-account helpers.  
    **Status: Done**

  - `SubscriptionsOverlay.tsx` / `DuplicateOverlay.tsx`  
    Overlays for deeper inspection. `DuplicateOverlay` is wired into `useDuplicates` and displays clusters, metadata, and confirm/dismiss actions.  
    **Status: Done**

- Debug
  - `DebugTransactionPanel.tsx`  
    Optional debug view to inspect raw transactions, categories, and ownership mappings.  
    **Status: Done**

### Utilities – `src/app/dashboard/utils/`

- `format.ts`  
  Exposes shared `currency` and `dateFormatter` helpers for consistent formatting across components.  
  **Status: Done**

- `types.ts`  
  Small shared types hub for things like summary tiles, grouped spending entries, tab IDs, etc., used across tabs/components where it helps avoid duplication.  
  **Status: In use / Done**

### Shared lib – `src/lib/dashboard/`

- `fakeData.ts`  
  Core of the demo data model. Responsibilities now:
  - Base account system:
    - `BaseAccountId` union (`"checking" | "savings"`),
    - base account metadata with random 12-digit `fullAccountNumber` and derived `last4`,
    - helpers like `getBaseAccounts()` / `getBaseAccount()` and `formatBaseAccountLabel(accountId, includeFullNumber)` used by the UI.
  - Realistic transaction generation:
    - all transactions tagged with `sourceAccountId` (checking vs savings),
    - savings only has interest + internal transfers (no merchant charges),
    - checking carries income, merchant spending, fees, subscriptions, etc.
  - Transfer description generation:
    - external transfers like `"Transfer to Venmo 8596"`,
    - internal transfers like `"Transfer from Savings 4837"` / `"Transfer to Checking 7846"`,
    - always keep last-4 digits in descriptions.
  - Visa/ACH labeling:
    - ACH prefixes for things like utilities, insurance, rent, phone, subscriptions,
    - Visa/debit prefixes for day-to-day purchases (groceries, dining, transport, etc.).
  - Month-by-month distribution of transactions to keep each month populated with checking activity and some savings transfers.

- `config.ts`, `categories.ts`, `duplicates.ts`, `categoryRules.ts`  
  Central configuration for category metadata & overview groups, duplicate/recurring detection helpers, demo flow constants (storage keys, tab IDs), and category rules that feed `useDerivedMetrics` and the tabs.  

- `fakeData.ts` and these config files together define the “demo profile” that downstream hooks/components consume.

## Work phases (status)

1. **Extract shared utilities/types**  
   - `format.ts` and `types.ts` created and wired through the dashboard.  
   **Status: Done**

2. **Create hooks in `hooks/` with logic moved out of `page.tsx`**  
   - All major state machines (`useDateRange`, `useStatementFlow`, `useOwnershipAccounts`, `useDuplicates`, `useDerivedMetrics`, `useGestureTabs`, `useExpansionState`) are implemented and in use.  
   **Status: Done**

3. **Move presentational pieces into `components/`**  
   - `StatementPanel`, summary tiles, all tab components, overlays, and debug panel live under `components/` and receive data/handlers via props.  
   **Status: Done**

4. **Slim `page.tsx` to an orchestrator**  
   - `page.tsx` now:
     - wires hooks together,
     - passes props into `StatementPanel`, summary tiles grid, each tab component, and `DuplicateOverlay`,
     - manages active tab, swipe handling, ARIA live region for tab changes.  
   **Status: Done**

5. **Demo realism + transfer/account UX**  
   - Demo data updated to realistic checking/savings behavior and transfer descriptions (Visa/ACH, last-4 account digits, internal transfers).
   - Ownership/accounts hook and ReviewTab updated to use normalized counterparties, assigned vs unassigned transfer pools, and “attach to existing” behavior.  
   **Status: Done**

6. **Verification**  
   - `npm run lint` and `npm run build` pass with the current structure.  
   **Status: Done**

## Notes for future changes

- If we introduce new demo modes (multiple real-world profiles, different banks, credit-card-only statements), prefer:
  - new generators or profiles in `fakeData.ts` / config,
  - minimal hook changes, preserving `page.tsx` as a wiring layer.
- Any future features around transfers or accounts should go through `useOwnershipAccounts` so the assigned/unassigned model stays consistent and the manual-add section never regresses to duplicate accounts.
- Any time we show checking/savings in the UI, use the base-account helpers (`formatBaseAccountLabel`) instead of hardcoded strings, so masking and numbering stay consistent.
