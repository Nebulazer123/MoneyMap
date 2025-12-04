# Dashboard Architecture Documentation

## Overview

The MoneyMap dashboard (`src/app/dashboard/page.tsx`) is structured as a **thin orchestrator** that coordinates specialized hooks and presentational components. The architecture follows clear separation of concerns:

- **page.tsx** - Top-level coordinator that calls hooks, manages tab state, and renders components
- **hooks/** - State machines for date range, statement flow, ownership tracking, metrics, duplicates, gestures, expansion
- **components/** - Presentational components for tabs, panels, overlays, and visual primitives
- **utils/** - Shared formatters and type definitions
- **lib/dashboard/** - Configuration, categories, duplicate detection logic

---

## Architecture Principles

### 1. Thin Orchestrator Pattern
`page.tsx` (~717 lines) serves as the main orchestrator:
- Calls 7 hooks to manage state
- Passes derived data to 15+ components
- Manages active tab and local UI state
- Provides ARIA live regions for accessibility

### 2. Data Flow
```
fakeData.ts (demo data)
    ↓
useStatementFlow (generate/analyze statement)
    ↓
useOwnershipAccounts (detect transfer accounts)
    ↓
useDerivedMetrics (compute totals, categories, budgets)
    ↓
page.tsx (orchestrate)
    ↓
Components (render)
```

### 3. Separation of Concerns
- **Hooks** handle state management and business logic
- **Components** receive props and render UI
- **Utils** provide pure formatting functions
- **Config** centralizes constants and metadata

---

## Core Hooks (src/app/dashboard/hooks/)

### useDateRange.ts
**Purpose:** Manage the date range picker for statement analysis

**Responsibilities:**
- Default to a 3-month range (ending last month)
- Persist selections to localStorage
- Handle legacy single-month keys and migrate to from/to range keys
- Normalize range to ensure start ≤ end
- Generate year options based on demo data
- Compute range start/end date strings for filtering

**Key Exports:**
- `selectedMonthFrom`, `selectedYearFrom`, `selectedMonthTo`, `selectedYearTo` - User selections
- `setSelectedMonthFrom`, `setSelectedYearFrom`, `setSelectedMonthTo`, `setSelectedYearTo` - Setters
- `normalizedRange` - Guaranteed valid { start, end } with { month, year }
- `rangeStartDateString`, `rangeEndDateString` - ISO date strings for filtering
- `yearOptions` - Available years for pickers
- `hasTouchedRangeRef` - Track if user manually changed range (prevents auto-resets)

**Hydration:** Reads from localStorage on mount, migrates legacy keys

---

### useStatementFlow.ts
**Purpose:** Manage the statement generation/analysis workflow

**Responsibilities:**
- Track flow steps: `"idle"` → `"statement"` → `"analyzing"` → `"results"`
- Generate demo statement via `generateSampleStatement()` from fakeData.ts
- Persist full statement to localStorage
- Filter statement to selected date range when in "results" mode
- Handle regenerate (new transactions) and analyze (advance to results)
- Provide restart flow to reset to idle state
- Manage edit mode and statement visibility toggles
- Support manual transaction addition with duplicate/date-range validation

**Key Exports:**
- `flowStep` - Current workflow step
- `fullStatementTransactions` - All generated transactions (before date filter)
- `statementTransactions` - Filtered to date range (when in results mode)
- `showStatement`, `isEditing` - UI toggles
- `handleStart`, `handleRegenerate`, `handleAnalyze`, `handleRestartAll` - Flow actions
- `handleToggleEditing` - Toggle edit mode
- `handleAddTransaction` - Manually add transaction with validation

**Hydration:** Restores flow step, transactions, and range from localStorage if present

---

### useOwnershipAccounts.ts
**Purpose:** Detect and manage transfer accounts (external accounts involved in transfers)

**Responsibilities:**
- Detect transfer accounts from transaction descriptions using `parseInstitutionAndLast4()`
- Track which transactions are assigned to which accounts via `matchedTransactionIds`
- Prevent duplicate accounts by normalizing institution + last 4 digits to unique keys
- Allow manual account creation, editing (name/type), and deletion
- Support ownership modes: `"spending"` (mine), `"payment"` (mine, payment method), `"notMine"` (external)
- Enable attaching unassigned transactions to existing accounts
- Provide candidate accounts (auto-detected from transfers) with draft editing state
- Persist custom accounts, overrides, hidden accounts, and ownership modes to localStorage

**Key Exports:**
- `transferAccounts` - Array of detected/manual accounts with metadata
- `ownership` - Map of accountId → boolean (is mine?)
- `ownershipModes` - Map of accountId → OwnershipMode
- `handleOwnershipModeChange` - Update ownership mode
- `editingAccountId`, `editingAccountName`, `editingAccountType` - Edit state for existing accounts
- `startEditingAccount`, `handleSaveEditedAccount`, `handleDeleteAccount`, `resetEditingAccount` - Account CRUD
- `isAddingAccount`, `addAccountName`, `addAccountType`, `addBaseTransactionId` - Manual add state
- `setIsAddingAccount`, `setAddAccountName`, `setAddAccountType`, `setAddBaseTransactionId` - Manual add setters
- `handleSelectBaseTransaction`, `handleToggleAccountTransaction`, `handleSaveNewAccount` - Manual add actions
- `transferTransactions` - All transfer transactions
- `unassignedTransferTransactions` - Transfers not yet assigned to any account
- `assignedTransactionIds` - Set of transaction IDs already assigned
- `attachTransactionsToAccount` - Attach unassigned transactions to existing account
- `suggestedAccountTransactions` - Transactions matching selected base transaction
- `selectedAccountTxIds` - Set of transaction IDs selected for new account
- `setSelectedAccountTxIds` - Update selected transactions
- `detectedAccountCandidates` - Auto-detected accounts from transfers
- `candidateDrafts` - Draft state for editing candidate accounts before saving
- `handleUpdateCandidateDraft`, `handleSaveDetectedAccount`, `handleCancelCandidate` - Candidate actions

**Storage Keys:**
- `STORAGE_CUSTOM_ACCOUNTS_KEY` - Manual/edited accounts
- `STORAGE_OWNERSHIP_MODES_KEY` - Ownership mode per account
- `STORAGE_ACCOUNT_OVERRIDES_KEY` - Label/type overrides
- `STORAGE_HIDDEN_ACCOUNTS_KEY` - Hidden account IDs

**Account Identity:**
Accounts are uniquely identified by normalized keys:
- Format: `{institution}_{last4}` (e.g., "chase_1234")
- Extracted via `parseInstitutionAndLast4()` from transaction descriptions
- Prevents duplicate accounts for the same counterparty

---

### useDerivedMetrics.ts
**Purpose:** Pure computation layer for financial metrics

**Responsibilities:**
- Sort statement transactions by date
- Group transactions by month with labels
- Calculate totals: income, spending, fees, subscriptions, net, internal transfers
- Group spending by overview categories (rent/utils, auto, subscriptions, etc.)
- Generate cashflow rows (daily net in/out) and group by month
- Compute budget guidance (recommended vs actual spending per category)
- Calculate percentages for transport, internet, essentials, other categories
- Find top spending categories
- Extract recurring transactions (subscriptions, bills)
- Generate summary stats for review tab

**Key Exports:**
- `statementTransactionsSorted` - Transactions sorted by date
- `statementMonths` - Array of { key, label, transactions } grouped by month
- `totalIncome`, `totalSpending`, `totalFees`, `totalSubscriptions`, `netThisMonth`, `internalTransfersTotal` - Totals
- `groupedSpendingData` - Array of spending groups with categories, amounts, percents
- `cashFlowRows` - Array of { date, totalInflowForThatDate, totalOutflowForThatDate, netForThatDate }
- `cashflowMonths` - Array of { key, label, rows, totalIn, totalOut, totalNet } for accordions
- `budgetGuidance` - Array of { category, actualAmount, recommendedAmount, differenceAmount, differenceDirection }
- `transportPercent`, `transportGuideline`, `internetPercent`, `internetGuideline`, `essentialsPercent`, `otherPercent` - Category percentages
- `leftAfterBills` - Income minus bill-like transactions
- `topSpendingCategories` - Array of { category, amount } sorted descending
- `recurringRows`, `feeRows` - Filtered transaction lists

**Pure Computation:** No side effects, just data transformations based on transactions + ownership

---

### useDuplicates.ts
**Purpose:** Detect and manage suspected duplicate charges

**Responsibilities:**
- Build duplicate clusters via `buildDuplicateClusters()` from lib/dashboard/duplicates.ts
- Clusters group similar transactions with off-pattern dates or amounts
- Track user decisions per transaction: `"confirmed"` (is duplicate) or `"dismissed"` (not duplicate)
- Persist decisions to localStorage
- Manage duplicate overlay open/closed state and focus trap
- Track expanded/collapsed clusters in overlay
- Provide metadata map for quick lookups by transaction ID

**Key Exports:**
- `duplicateDecisions` - Map of txId → "confirmed" | "dismissed"
- `duplicateClusters` - Array of DuplicateClusterView with suspicious transactions
- `activeDuplicateIds` - Set of transaction IDs flagged as potential duplicates
- `duplicateMetaById` - Map of txId → { clusterKey, label, category, lastNormalDate, reason }
- `showDuplicateOverlay`, `setShowDuplicateOverlay` - Overlay state
- `duplicateOverlayTriggerRef`, `duplicateOverlayRef` - Focus trap refs
- `handleOpenDuplicateOverlay`, `handleCloseDuplicateOverlay` - Overlay controls
- `handleConfirmDuplicate`, `handleDismissDuplicate` - Decision actions
- `toggleDuplicateCluster` - Expand/collapse cluster in overlay
- `expandedDuplicateClusters` - Set of expanded cluster keys

**Storage Key:** `STORAGE_DUPLICATE_DECISIONS_KEY`

---

### useGestureTabs.ts
**Purpose:** Enable touch swipe gestures for tab navigation on mobile

**Responsibilities:**
- Track touch start position (startX, startY)
- Detect horizontal swipes (dx > 40px, dx > dy)
- Navigate to next/prev tab on swipe left/right
- Prevent duplicate triggers per swipe gesture
- Clean up state on touch end

**Key Exports:**
- `handleSwipeStart` - onTouchStart handler
- `handleSwipeMove` - onTouchMove handler
- `handleSwipeEnd` - onTouchEnd handler

**Usage:** Attach handlers to top-level container in page.tsx

---

### useExpansionState.ts
**Purpose:** Manage collapsed/expanded state for statement months and cashflow accordions

**Responsibilities:**
- Track expanded month keys for statement table grouping
- Track expanded cashflow month keys for cashflow tab accordions
- Track expanded cashflow dates within accordions (nested expand)
- Reset expansion state when month signature changes

**Key Exports:**
- `expandedMonths`, `setExpandedMonths` - Statement table month expansion
- `expandedCashflowMonths`, `setExpandedCashflowMonths` - Cashflow tab month expansion
- `expandedCashflowDates`, `setExpandedCashflowDates` - Cashflow tab date expansion (within month)

**Reset Logic:** When statement months change, collapse all expanded sections to avoid stale state

---

## Components (src/app/dashboard/components/)

### StatementPanel.tsx
**Purpose:** Demo statement edit/analyze view

**Renders:**
- Date range pickers (from month/year, to month/year)
- Control buttons: Start, Regenerate, Analyze, Restart, Edit toggle
- Account context header (base accounts with full numbers)
- Transaction table with columns: Date, Description, Category, Amount
- Month grouping with expand/collapse (when showGroupedTable=true)
- Category dropdown editing (when isEditing=true)
- Manual transaction add row (when isEditing=true)
- Summary totals: Total inflow, Total outflow, Net

**Props:** Receives flow step, date state, transactions, edit state, handlers from page.tsx

**Key Features:**
- Exact transaction descriptions with all formatting intact
- Base account context at top (Checking *1234, Savings *5678)
- Month-grouped view with expand/collapse
- Inline category editing with dropdown
- Add transaction form with date/description/category/amount
- Validation for date range and duplicate descriptions

---

### TabsBar.tsx
**Purpose:** Tab navigation strip with 5 tabs + edit toggle

**Renders:**
- 5 tab buttons: Overview, Recurring, Fees, Cashflow, Review
- Active tab indicator with animated underline
- Color-coded tab accents (purple, rose, amber, emerald, pink)
- Dot indicator on active tab
- Edit mode toggle button

**Props:** activeTab, onSelectTab, isEditing, onToggleEditing

**Styling:** Glass-morphism cards with animated underline, color gradients per tab

---

### OverviewTab.tsx
**Purpose:** Spending overview with donut chart and category breakdown

**Renders:**
- Donut chart showing spending groups with percentages
- Category chips for filtering (clickable to select/deselect)
- Filtered transaction list based on selected categories
- Summary cards for major spending categories (Rent, Utilities, Auto, etc.)

**Props:** currency, dateFormatter, groupedSpendingData, activeCategoryIds, onSelectGroup, overviewTransactions, flowStep

**Key Features:**
- Interactive donut chart with hoverable segments
- Color-coded category chips matching overview groups
- Click category chip to filter transactions
- Emoji icons for each category
- Expandable detail cards with category-specific transactions

---

### RecurringTab.tsx
**Purpose:** Subscriptions, bills, and auto payments view

**Renders:**
- Section header with caption
- Duplicate warning message (if active duplicates found)
- "Show possible duplicates" button to open overlay
- Table of recurring transactions: Name, Category, Amount, Date
- Badge indicators for confirmed/suspected duplicates

**Props:** currency, dateFormatter, recurringRows, duplicateDecisions, activeDuplicateIds, duplicateMetaById, handleOpenDuplicateOverlay, handleConfirmDuplicate, handleDismissDuplicate, flowStep

**Filtering:** Shows only transactions matching bill-like categories (subscriptions, bills, utilities, etc.)

---

### FeesTab.tsx
**Purpose:** Simple fees overview

**Renders:**
- Section header
- Total fees card (prominent display)
- Table of fee transactions: Name, Amount, Date

**Props:** currency, dateFormatter, feeRows, totalFees

**Filtering:** Shows only transactions with category "Fees"

---

### CashflowTab.tsx
**Purpose:** Monthly cashflow breakdown with daily granularity

**Renders:**
- Section header with info tooltip explaining cashflow
- Toggle for grouped/flat view (future enhancement)
- Month accordions with expand/collapse
- Daily rows within each month: Date, Inflow, Outflow, Net
- Month totals: Total In, Total Out, Net
- Nested transaction lists per date (expandable)

**Props:** currency, dateFormatter, statementTransactions, cashFlowRows, cashflowMonths, showGroupedCashflow, expandedCashflowMonths, setExpandedCashflowMonths, expandedCashflowDates, setExpandedCashflowDates, flowStep

**Key Features:**
- Accordion UI for month-level view
- Expandable daily rows showing individual transactions
- Color-coded net values (green positive, red negative)
- Smooth expand/collapse animations

---

### ReviewTab.tsx (~867 lines)
**Purpose:** Deep dive with budget guidance, transfer account management, duplicate review

**Renders 4 Main Sections:**

1. **Summary Stats Panel**
   - Total income, spending, net for period
   - Subscription count and total
   - Total fees
   - Internal transfers total (excluded from spending)

2. **Budget Guidance Section**
   - Recommended vs actual spending per category
   - Over/under indicators with color coding
   - Transport, internet, essentials, other percentages vs guidelines
   - Left after bills calculation

3. **Transfer Account Management Section** (the meat of ReviewTab)
   - **Detected Accounts Panel:** Auto-detected transfer accounts with:
     - Account label, ending digits, type
     - Draft editing state (name/type) before saving
     - "Save" and "Cancel" buttons per candidate
   - **Stored Accounts Panel:** Saved transfer accounts with:
     - Account label, ending digits, type, transaction count
     - Ownership mode toggle: "Mine (spending)" | "Mine (payment method)" | "Not mine"
     - Edit button (opens inline edit form with name/type)
     - Delete button with confirmation
   - **Manual Add Section:** Create new account or attach to existing
     - Base transaction dropdown (unassigned transfers only)
     - Suggested transactions list (matching base transaction pattern)
     - Checkboxes to select additional transactions
     - Account name/type inputs for new account
     - "Attach to existing account" button (shows when unassigned transfers exist)
     - Account picker dropdown for attaching

4. **Duplicate Review Section**
   - List of duplicate clusters with suspicious transactions
   - "Show possible duplicates" button to open overlay
   - Confirm/dismiss actions per duplicate

**Props:** 40+ props including summaryStats, budgetGuidance, transferAccounts, ownership, ownershipModes, editing state, manual add state, candidate state, handlers

**Key Features:**
- Comprehensive transfer account management (detect, edit, delete, create, attach)
- Prevents duplicate accounts via normalized keys
- Unassigned transaction pool (only truly unassigned transfers)
- Attach-to-existing functionality for bulk assignment
- Draft editing for detected candidates before saving
- Budget guidance with over/under indicators
- Duplicate cluster summary with overlay trigger

---

### DuplicateOverlay.tsx
**Purpose:** Modal for reviewing/confirming/dismissing duplicate charges

**Renders:**
- Overlay backdrop with click-outside-to-close
- Modal panel with focus trap
- List of duplicate clusters (expandable accordions)
- Per-cluster details: Name, category, last normal charge date
- List of suspicious transactions with dates, amounts, reasons
- Confirm/Dismiss buttons per transaction
- Visual indicators for confirmed/dismissed status
- Close button (X)

**Props:** duplicateClusters, duplicateDecisions, expandedDuplicateClusters, toggleDuplicateCluster, handleCloseDuplicateOverlay, handleConfirmDuplicate, handleDismissDuplicate, duplicateOverlayRef, currency, dateFormatter

**Accessibility:** Focus trap, ESC to close, ARIA labels

---

### SubscriptionsOverlay.tsx
**Purpose:** Modal for detailed subscription view

**Renders:**
- Overlay backdrop
- Modal panel with focus trap
- List of subscription transactions with details
- Close button

**Props:** subscriptionRows, currency, dateFormatter, handleCloseSubscriptionsOverlay, subscriptionsOverlayRef

**Usage:** Triggered from ReviewTab when clicking "View all subscriptions" link

---

### GlassPanel.tsx
**Purpose:** Reusable glass-morphism container component

**Variants:**
- `"hero"` - Large panel for main content areas (backdrop-blur-3xl)
- `"card"` - Medium panel for cards and sections (backdrop-blur-2xl)
- `"dialog"` - Modal/overlay panel (backdrop-blur-3xl, centered, elevated)

**Tones:**
- `"vivid"` - High contrast, vibrant borders
- `"subtle"` - Low contrast, muted borders

**Props:** variant, tone, className, children, ...rest (spreads to div)

**Styling:** Uses Tailwind classes for glass-morphism effect (backdrop-blur, border, shadow, gradient)

---

### SectionHeader.tsx
**Purpose:** Reusable section title component

**Renders:**
- Optional label (small, uppercase, tracking-wide)
- Title (large, semibold)
- Optional caption (small, muted)
- Accent color variant (purple, rose, amber, emerald, pink)

**Props:** label?, title, caption?, accentColor?

**Usage:** Consistent section headers across all tabs and panels

---

### InfoTip.tsx
**Purpose:** Tooltip component for contextual help

**Renders:**
- Info icon (circle with "i")
- Tooltip on hover with help text

**Props:** children (tooltip content)

**Usage:** Inline help for budget guidance, cashflow explanations, etc.

---

### AddTransactionRow.tsx
**Purpose:** Form row for adding transactions in edit mode

**Renders:**
- Date input (date picker)
- Description input (text)
- Category dropdown (select)
- Amount input (number)
- Add button

**Props:** onAddTransaction, categoryOptions, normalizedRange, currency, dateFormatter

**Validation:** Date within range, non-empty description, valid amount

---

### DebugTransactionPanel.tsx
**Purpose:** Debug view for inspecting raw transaction data

**Renders:**
- Table of all transactions with all fields
- Ownership mode and account assignment details
- Raw JSON view option

**Props:** transactions, ownership, accountModes

**Usage:** Toggle via "Show Debug" button in header (only in dev/demo mode)

---

### SummaryCards.tsx
**Purpose:** Summary tiles grid component

**Renders:**
- Grid of summary cards (Income, Spending, Net, Subscriptions, Fees)
- Click to navigate to relevant tab
- Color-coded borders and icons
- Placeholder values before analysis

**Props:** summaryTiles (array of tile configs with label, value, subtext, icon, color, targetTab)

**Usage:** Displayed in page.tsx after statement analysis completes

---

## Utils (src/app/dashboard/utils/)

### format.ts
**Purpose:** Shared formatting utilities

**Exports:**
- `currency` - Intl.NumberFormat for USD currency (e.g., "$1,234.56")
- `dateFormatter` - Intl.DateTimeFormat for short dates (e.g., "1/15/24")

**Usage:** Passed as props to all components for consistent formatting

---

### types.ts
**Purpose:** Shared TypeScript type definitions

**Current State:** Empty placeholder

**Future:** Could contain shared types like TabId, FlowStep, OwnershipMode if moved from config/fakeData

---

## Configuration (src/lib/dashboard/)

### config.ts
**Purpose:** Dashboard constants and metadata

**Exports:**
- `tabs` - Array of { id, label } for tab navigation
- `TabId` - Union type: "overview" | "recurring" | "fees" | "cashflow" | "review"
- `months` - Array of month names
- `overviewGroupMeta` - Metadata for spending groups (colors, labels)
- `overviewGroupOrder` - Order of groups in donut chart
- `categoryEmojis` - Emoji map for categories
- `accountTypeLabels` - Display labels for account types
- `STORAGE_*_KEY` - localStorage key constants

---

### categories.ts
**Purpose:** Category grouping and display logic

**Exports:**
- `getOverviewGroupForCategory` - Map category to overview group
- `getCategoriesForGroup` - Get categories in a group
- `getTransactionDisplayCategory` - Get display category for transaction
- `titleCase` - Utility for title-casing strings

---

### duplicates.ts
**Purpose:** Duplicate detection algorithm

**Exports:**
- `buildDuplicateClusters` - Main algorithm to detect duplicate charges
- `DuplicateClusterView` - Type for cluster view with suspicious transactions

**Logic:** Groups recurring charges, detects off-pattern dates/amounts, flags suspicious transactions

---

### categoryRules.ts
**Purpose:** Category classification helpers

**Exports:**
- `isSubscriptionCategory` - Check if category is subscription-like
- `isEssentialCategory` - Check if category is essential (rent, utilities, groceries, etc.)
- `isBillLikeCategory` - Check if category is bill-like (utilities, insurance, etc.)
- `isBillishDescription` - Check if description suggests a bill

**Usage:** Used by useDerivedMetrics and ReviewTab for filtering and budget calculations

---

## Demo Data (src/lib/fakeData.ts)

### Purpose
Generate realistic demo statement data with checking/savings accounts and transfers

### Key Features
- **Base Account System:** Checking (*1234) and Savings (*5678) with random account numbers
- **Realistic Transfers:** Between base accounts with ACH/Visa hints in descriptions
- **Category Assignment:** Realistic categories per transaction type
- **Duplicate Generation:** Some transactions marked as suspected duplicates
- **Ownership Modes:** Support for "spending", "payment", "notMine" modes
- **Transaction Types:** Income (paychecks), spending (groceries, dining, bills, subscriptions), transfers

### Exports
- `generateSampleStatement` - Main function to generate transactions for date range
- `BaseAccount` type and `getBaseAccounts()` - Base account info
- `Transaction` type - Transaction shape
- `OwnershipMode`, `OwnershipMap` - Ownership types
- `parseInstitutionAndLast4` - Extract normalized account key from description
- `isInternalTransfer`, `isRealSpending` - Transaction classification helpers
- Various calculation helpers: `getTotalIncome`, `getTotalSpending`, `getNetThisMonth`, etc.

---

## Data Flow Examples

### 1. Generating and Analyzing a Statement

```
User clicks "Generate sample statement"
    ↓
page.tsx calls handleStart()
    ↓
useStatementFlow.handleStart() generates transactions via generateSampleStatement()
    ↓
Transactions stored in fullStatementTransactions + localStorage
    ↓
Flow advances to "statement" step
    ↓
StatementPanel renders with transactions
    ↓
User clicks "Analyze"
    ↓
useStatementFlow.handleAnalyze() advances flow to "results"
    ↓
useDerivedMetrics computes all totals, categories, budgets
    ↓
useOwnershipAccounts detects transfer accounts from transactions
    ↓
useDuplicates builds duplicate clusters
    ↓
page.tsx renders TabsBar + active tab content with derived data
```

### 2. Managing Transfer Accounts

```
User clicks ReviewTab
    ↓
ReviewTab renders "Transfer Account Management" section
    ↓
useOwnershipAccounts detects accounts via parseInstitutionAndLast4()
    ↓
Detected accounts appear in "Detected Accounts" panel (with draft state)
    ↓
User edits account name/type → handleUpdateCandidateDraft()
    ↓
User clicks "Save" → handleSaveDetectedAccount() adds to customAccounts
    ↓
Account moves to "Stored Accounts" panel
    ↓
User changes ownership mode → handleOwnershipModeChange()
    ↓
Ownership mode persisted to localStorage
    ↓
useDerivedMetrics recalculates totals based on ownership
```

### 3. Attaching Unassigned Transactions to Existing Account

```
User scrolls to "Manual Add" section in ReviewTab
    ↓
unassignedTransferTransactions populated with transfers not assigned to any account
    ↓
User clicks "Attach to existing account" button
    ↓
Account picker dropdown appears
    ↓
User selects transactions via checkboxes
    ↓
User picks account from dropdown
    ↓
User confirms → attachTransactionsToAccount(accountId, txIds)
    ↓
useOwnershipAccounts updates matchedTransactionIds for account
    ↓
Transactions removed from unassigned pool
    ↓
Manual add section updates to show only remaining unassigned
```

### 4. Reviewing Duplicates

```
User sees "N possible duplicates" warning in RecurringTab
    ↓
User clicks "Show possible duplicates" button
    ↓
useDuplicates.handleOpenDuplicateOverlay() opens overlay
    ↓
DuplicateOverlay renders with clusters and suspicious transactions
    ↓
User expands cluster → toggleDuplicateCluster()
    ↓
User clicks "Confirm" on suspicious transaction → handleConfirmDuplicate()
    ↓
duplicateDecisions updated with "confirmed"
    ↓
localStorage persisted
    ↓
Cluster recalculates to exclude confirmed duplicates from suspicious list
```

---

## Key Design Decisions

### 1. Why Thin Orchestrator?
**Rationale:** Keep page.tsx focused on coordination, not business logic
- Easier to test hooks in isolation
- Clear separation: hooks = state, components = presentation
- Simpler mental model for debugging

### 2. Why Normalized Account Keys?
**Rationale:** Prevent duplicate accounts for the same counterparty
- Format: `{institution}_{last4}`
- Consistent identity across sessions
- Allows safe editing of labels without breaking identity

### 3. Why Assignment Tracking (matchedTransactionIds)?
**Rationale:** Enable moving transactions between accounts
- Prevents duplicate account creation when attaching transactions
- Allows "unassigned pool" view in ReviewTab
- Supports bulk attachment to existing accounts

### 4. Why localStorage Everywhere?
**Rationale:** Demo app with no backend, need persistence across refreshes
- Each hook manages its own storage keys
- Hydration on mount, persistence on change
- Clear separation: each concern owns its storage

### 5. Why Pure Computation Hook (useDerivedMetrics)?
**Rationale:** Separate stateful logic from pure calculations
- Easier to test calculations in isolation
- Clear dependency: statementTransactions + ownership → all metrics
- No side effects, just transformations

---

## Common Patterns

### 1. Hook Calling Order in page.tsx
```tsx
// Date range first (no dependencies)
const { ... } = useDateRange();

// Statement flow (depends on date range)
const { ... } = useStatementFlow({ ...dateRange, ... });

// Ownership accounts (depends on statement transactions)
const { ... } = useOwnershipAccounts(statementTransactions);

// Derived metrics (depends on transactions + ownership)
const { ... } = useDerivedMetrics({ statementTransactions, ownership, ownershipModes });

// Duplicates (depends on transactions)
const { ... } = useDuplicates(statementTransactions);

// Gestures (depends on activeTab state)
const { ... } = useGestureTabs(activeTab, setActiveTab);

// Expansion state (depends on grouped view toggles)
const { ... } = useExpansionState({ showGroupedTable, monthsSignature, cashflowMonths });
```

### 2. Prop Drilling Pattern
Components receive all needed data via props from page.tsx:
```tsx
<ReviewTab
  currency={currency}
  dateFormatter={dateFormatter}
  summaryStats={summaryStatsForReview}
  transferAccounts={transferAccounts}
  ownership={ownership}
  ownershipModes={ownershipModes}
  // ... 40+ props
/>
```

**Rationale:** Explicit data flow, easy to trace, no hidden dependencies

### 3. LocalStorage Hydration Pattern
```tsx
const [state, setState] = useState(() => {
  if (typeof window === "undefined") return defaultValue;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    // ignore bad data
  }
  return defaultValue;
});

useEffect(() => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}, [state]);
```

**Rationale:** SSR-safe hydration, graceful fallback on parse errors

---

## Testing Strategy (Future)

### Unit Tests
- **Hooks:** Test state transitions, localStorage persistence, derived calculations
- **Utils:** Test formatters, pure functions
- **Config:** Test category mappings, duplicate detection logic

### Integration Tests
- **Flow:** Test full statement generation → analysis → tab navigation flow
- **Ownership:** Test account detection, editing, deletion, attachment
- **Duplicates:** Test cluster building, confirm/dismiss actions

### E2E Tests
- **Happy Path:** Generate → analyze → navigate tabs → review duplicates
- **Edge Cases:** Empty statements, date range changes, localStorage corruption

---

## Performance Considerations

### Memoization
- All derived metrics use `useMemo` to avoid recalculation on unrelated re-renders
- `statementTransactionsSorted`, `statementMonths`, `groupedSpendingData`, etc. all memoized

### Conditional Rendering
- Only render active tab content (others not in DOM)
- Statement table months collapse by default (fewer DOM nodes)
- Cashflow accordions collapse by default

### LocalStorage Batching
- Avoid saving on every keystroke (debounce inputs if needed)
- Save only when state stabilizes (e.g., after "Save" button click)

---

## Future Enhancements

### Potential Improvements
1. **Context API:** Replace prop drilling for deeply nested components (currency, dateFormatter)
2. **React Query:** Add server-side data fetching for real bank connections
3. **Zod Schemas:** Validate localStorage data on hydration
4. **Storybook:** Document and test components in isolation
5. **Virtualization:** Use react-window for large transaction lists (1000+ transactions)
6. **Optimistic Updates:** Show UI changes before localStorage saves
7. **Undo/Redo:** Add history stack for account edits, category changes
8. **Export:** Allow CSV/PDF export of statements and reports

---

## Troubleshooting Guide

### Issue: Statement not persisting across refreshes
**Solution:** Check localStorage quota (5-10MB limit). Clear old keys if needed.

### Issue: Duplicate accounts created for same institution
**Solution:** Verify `parseInstitutionAndLast4()` is extracting consistent keys from descriptions.

### Issue: Transactions disappearing from date range filter
**Solution:** Ensure `normalizedRange` is computed correctly. Check date string parsing in `useStatementFlow`.

### Issue: Metrics not updating after category change
**Solution:** Verify `handleUpdateTransactionCategory` updates `fullStatementTransactions` and persists to localStorage.

### Issue: Expansion state stuck after month change
**Solution:** Check `useExpansionState` reset logic. Ensure `monthsSignature` changes when months update.

---

## Summary

The MoneyMap dashboard is a **stateful demo application** with:
- **7 hooks** managing state (date range, statement flow, ownership, metrics, duplicates, gestures, expansion)
- **15+ components** rendering UI (tabs, panels, overlays, primitives)
- **Thin orchestrator** (page.tsx) coordinating hooks and components
- **localStorage persistence** for demo data across refreshes
- **Pure computation layer** (useDerivedMetrics) for financial calculations
- **Transfer account system** with duplicate prevention, assignment tracking, and bulk attachment
- **Duplicate detection** with confirm/dismiss workflow
- **Accessible UI** with ARIA labels, focus traps, keyboard navigation

**Where to look for:**
- **Statement generation:** useStatementFlow.ts → fakeData.ts
- **Transfer account management:** useOwnershipAccounts.ts → ReviewTab.tsx
- **Budget calculations:** useDerivedMetrics.ts
- **Duplicate detection:** useDuplicates.ts → lib/dashboard/duplicates.ts
- **Tab rendering:** page.tsx (lines 600-717)
- **Date range logic:** useDateRange.ts
