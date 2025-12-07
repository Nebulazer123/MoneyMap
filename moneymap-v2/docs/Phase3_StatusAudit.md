# Phase 3 Status Audit

**Audit Date:** December 7, 2025  
**Purpose:** Truthful snapshot of feature implementation status for planning future slices.

---

## Feature Status Overview

| Feature | Status | Notes |
|---------|--------|-------|
| Math folder centralization | **PARTIAL** ⚠️ | `transactionMath.ts` + `transactionSelectors.ts` exist and centralize core logic; some components still import math directly |
| API debouncing | **MISSING** ❌ | No debounce found in search inputs (news, stocks, crypto search uses inline `setTimeout`) |
| Rate limiting guards | **MISSING** ❌ | No explicit rate-limit guards on external APIs (news, FRED, CoinGecko) |
| Suspicious charge system | **PARTIAL** ⚠️ | All 3 types exist; "More Info" lacks surrounding transaction context |
| Merchant logo handling | **PARTIAL** ⚠️ | Clearbit domain mapping exists but mostly shows colored initials |
| Date handling separation | **DONE** ✅ | Clear view range vs dataset range in selectors; "New Statements" only in debug panel |
| ATM fees logic | **MISSING** ❌ | No ATM-specific logic found; fee merchants not differentiated |
| Crypto converter position | **WRONG** ❌ | Converter renders at TOP of page, spec wants BOTTOM |
| Per-page accent colors | **PARTIAL** ⚠️ | Only Crypto (orange) and Stocks (lime) have custom colors |

---

## Detailed Findings

### 1. Math Folder Centralization

**Location:** `src/lib/math/transactionMath.ts` + `src/lib/selectors/transactionSelectors.ts`

- **Centralized functions:**
  - `computeSummaryMetrics()` – used by Dashboard and Overview for 5 summary boxes
  - `getNetIncome()`, `getTotalSpending()`, `getFeeTotals()`, `getCategoryTotals()`
  - `getTransactionsInDateRange()` – month-based date filtering
  - `isInternalTransfer()` – transfer classification
  - `getDailyCashflowBuckets()` – cashflow tab data

- **Still scattered:**
  - Some components do local `.filter()/.reduce()` instead of using selectors
  - Subscription totals calculated inline in some places

### 2. API Debouncing / Rate Limiting

| Input | Debounced? | Rate Limited? |
|-------|------------|---------------|
| News search | ❌ No | ❌ No |
| Crypto search | ⚠️ 300ms setTimeout | ❌ No |
| Stock search | ⚠️ 300ms setTimeout | ❌ No |
| Statement search | ❌ No | N/A (local) |

**External API guards:** None implemented. APIs hit on every keystroke or request.

### 3. Suspicious Charge System

| Type | In Code? | Notes |
|------|----------|-------|
| `duplicate` | ✅ Yes | Detects same merchant charged twice within days |
| `overcharge` | ✅ Yes | Detects amount significantly higher than usual |
| `unexpected` | ✅ Yes | Detects charge on unusual day/pattern |

**"More Info" view:** Shows single-line reason only (e.g., "Duplicate charge detected - 3 days after original"). Does **NOT** show surrounding transactions for context.

**Mark Suspicious / All Good buttons:** Present but count update on Review tab is broken (D8, D11 in QA checklist).

### 4. Merchant Logo Handling (Statement)

- **Strategy:** `MERCHANT_DOMAINS` mapping (~50 merchants) → Clearbit logo URL
- **Fallback:** Colored circle with first letter initial
- **Current state:** Most merchants show initials since mapping is incomplete
- **No external logo API** used besides Clearbit domain-based lookup

### 5. Date Handling

| Concept | Implementation | Notes |
|---------|----------------|-------|
| View range | `useDateStore` (viewStart/viewEnd) | Controls what user sees |
| Dataset range | Full transaction array | All generated data |
| Profile regen | "New Statements" button | Only in DebugPanel, regenerates with random profile |

**Separation is clean.** `getTransactionsInDateRange()` filters by month boundaries using dateKey math.

### 6. Fees Logic

- **Fee detection:** `kind === 'fee'` filter
- **ATM-specific:** ❌ Not implemented
- **Bank names visible:** ❌ Not implemented
- **Fee-merchant pool:** Generic fee merchants only, no ATM-specific pool

### 7. Crypto Page

**Currency converter position:** Line 624-627 in `Crypto.tsx` renders `<CryptoCurrencyConverter />` near TOP of the component, right after Market Status box. Spec wants it at BOTTOM.

```tsx
{/* Crypto Converter */}
<div className="mb-8">
    <CryptoCurrencyConverter />
</div>
```

### 8. Per-Page Accent Colors

| Tab | Custom Color | Implementation |
|-----|--------------|----------------|
| Dashboard | ❌ Neutral/white | Generic glass cards |
| Overview | ❌ Neutral | Standard styling |
| Statement | ❌ Neutral | White/zinc palette |
| Subscriptions | ⚠️ Orange banner | Yellow warning, hard to read |
| Recurring | ⚠️ Orange banner | Same as Subscriptions |
| Review | ❌ Orange/teal | Not deep purple as spec'd |
| Accounts | ❌ Neutral | Standard glass cards |
| Budget | ❌ Neutral | White/zinc |
| Fees | ❌ Neutral | Standard styling |
| Stocks | ✅ **Lime green** | `tint="lime"` on GlassCard |
| Crypto | ✅ **Orange** | `tint="orange"` on GlassCard |

---

## Summary

- ✅ **3 items DONE:** Date handling, math core exists, suspicious types defined
- ⚠️ **4 items PARTIAL:** Math not fully centralized, logos incomplete, colors not complete, suspicious flow incomplete
- ❌ **3 items MISSING/WRONG:** Debouncing, rate limiting, ATM fees, converter position

---

*This audit is read-only and makes no code changes.*
