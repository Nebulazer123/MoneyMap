---
name: QA Readiness Audit
overview: A comprehensive audit identifying issues to fix before deploying MoneyMap to Vercel, covering static analysis, smoke tests, and terminal verification.
todos:
  - id: run-lint
    content: Run npm run lint and verify current error/warning count
    status: pending
  - id: run-typecheck
    content: Run npx tsc --noEmit to verify no type errors
    status: pending
  - id: run-build
    content: Run npm run build to verify production build succeeds
    status: pending
  - id: fix-duplicate-debug
    content: Remove duplicate DebugPanel from root layout.tsx
    status: pending
    dependencies:
      - run-lint
  - id: fix-fees-any
    content: Fix any type errors in Fees.tsx lines 90 and 103
    status: pending
    dependencies:
      - run-lint
  - id: cleanup-unused-imports
    content: Remove unused imports flagged by lint warnings
    status: pending
    dependencies:
      - run-lint
  - id: smoke-test-browser
    content: Run browser smoke tests per checklist
    status: pending
    dependencies:
      - run-build
  - id: decision-about-page
    content: "User decision: Create /about page or remove from requirements"
    status: pending
  - id: decision-placeholders
    content: "User decision: Handle Coming Soon and placeholder crypto rate"
    status: pending
---

# QA Readiness Audit for MoneyMap

## Summary

The active app is `moneymap-v2` (Next.js 16 with App Router), using npm. The last documented build (Dec 18, 2025) passed lint and build, but the lint log shows 3 errors and 51 warnings that need review. Several incomplete features, a duplicate component issue, and missing routes require attention.---

## 1. Project Identification

| Property | Value ||----------|-------|| Active Root | `moneymap-v2` || Package Manager | npm || Framework | Next.js 16.0.7 (App Router) || Key Scripts | `dev`, `build`, `start`, `lint` || Typecheck | No explicit script (runs during `next build`) |---

## 2. Route Inventory

### Static Routes (App Router)

| Route | File | Status ||-------|------|--------|| `/` | `src/app/page.tsx` | Landing page || `/dashboard` | `src/app/dashboard/page.tsx` | Tab-based dashboard shell || `/dashboard/crypto` | `src/app/dashboard/crypto/page.tsx` | Dedicated crypto page || `/dashboard/stocks` | `src/app/dashboard/stocks/page.tsx` | Dedicated stocks page |

### Tab-Based Navigation (State-Driven, Not Routes)

The main dashboard uses `useUIStore` to switch between: `dashboard`, `overview`, `statement`, `subscriptions`, `recurring`, `fees`, `cashflow`, `budget`, `accounts`, `stocks`, `crypto`, `review`

### Missing Routes

- **`/about`** - Listed in your smoke-test checklist but does NOT exist in `moneymap-v2`. Only exists in `moneymap-legacy`. Decision needed.

### Dynamic API Routes (17 total)

All under `src/app/api/`: `charts`, `countries`, `crypto`, `economy`, `exchange`, `faker`, `location`, `logos`, `news`, `stocks`, `time`, `users`, `uuid`, `verification`, `weather`---

## 3. Static Scan Findings

### Incomplete Work / Placeholder Copy

| File | Line | Issue ||------|------|-------|| [`Accounts.tsx`](moneymap-v2/src/components/dashboard/Accounts.tsx) | 492 | "Connect with Plaid (Coming Soon)" || [`CurrencyConverter.tsx`](moneymap-v2/src/components/dashboard/CurrencyConverter.tsx) | 193-196 | Placeholder crypto rate `0.000023` hardcoded || [`CurrencyConverter.tsx`](moneymap-v2/src/components/dashboard/CurrencyConverter.tsx) | 282 | Comment "Placeholder Exchange Rate Info" |

### Duplicate DebugPanel Components (BUG)

Two different DebugPanel components are rendered simultaneously:

1. [`src/components/debug/DebugPanel.tsx`](moneymap-v2/src/components/debug/DebugPanel.tsx) - imported in root `layout.tsx`
2. [`src/components/dashboard/DebugPanel.tsx`](moneymap-v2/src/components/dashboard/DebugPanel.tsx) - imported in `dashboard/page.tsx`

This causes UI overlap with two debug panels visible at bottom-right.

### Environment Variables

| Variable | File | Status ||----------|------|--------|| `FRED_API_KEY` | `api/economy/route.ts` | Falls back to `'demo'` || `OPENWEATHER_API_KEY` | `api/weather/route.ts` | Falls back to `'demo'` (route unused) |

### Hard-Coded API Keys (Security Risk)

| File | Key ||------|-----|| `api/news/route.ts` | `NEWS_API_KEY` hardcoded || `api/verification/route.ts` | `ABSTRACT_API_KEY` hardcoded |

### Empty Directory

- `src/lib/services/` - empty folder, can be deleted

### Lint Errors (from [`lint.log`](moneymap-v2/lint.log))

**3 Errors:**

1. `Fees.tsx:90` - `@typescript-eslint/no-explicit-any`
2. `Fees.tsx:103` - `@typescript-eslint/no-explicit-any`
3. `Accounts.tsx:112` - setState in useMemo (OUTDATED - code shows `useEffect` now)

**51 Warnings:** Mostly unused imports/variables and missing `useEffect` dependencies. Also several `<img>` tags that should use `next/image`.

### Console Statements

58 `console.log/warn/error` calls across 21 files - many may be debug output to clean up.---

## 4. Smoke-Test Checklist (Chrome/Browser)

### Core Flow

- [ ] `/` (landing) - renders, "Try Demo" and "Upload Statement" buttons work
- [ ] Click "Try Demo" -> navigates to `/dashboard`
- [ ] `/dashboard` - Dashboard tab renders with data
- [ ] Tab navigation: Overview, Statement, Recurring, Fees, Cashflow, Budget, My Money, Stocks, Crypto, Review
- [ ] Check each tab renders without blank screens

### Generate/Analyze Flow

- [ ] Debug Panel: "New Statements" generates fresh data
- [ ] Statement tab: transactions load, search works
- [ ] Overview tab: pie chart, category breakdown visible
- [ ] Recurring tab: recurring transactions detected
- [ ] Fees tab: fee transactions grouped
- [ ] Cashflow tab: chart renders
- [ ] Review tab: suspicious items if any

### Dedicated Pages

- [ ] `/dashboard/stocks` - loads stock data, search works
- [ ] `/dashboard/crypto` - loads crypto data, search works

### Actions

- [ ] "Restart Demo" in sidebar -> returns to landing and regenerates
- [ ] localStorage persistence: refresh page, data persists
- [ ] Clear localStorage -> data resets on refresh

### Error Checks

- [ ] No console errors/warnings (especially hydration)
- [ ] No blank/white screens on any tab
- [ ] All API widgets show data or graceful loading states

### Responsive (Mobile Width ~375px)

- [ ] Sidebar collapses/shows hamburger menu
- [ ] Content remains usable
- [ ] No horizontal overflow

### Missing Route

- [ ] `/about` - Currently 404. Decision: create page or remove from checklist?

---

## 5. Terminal Verification Order

Run from repo root:

```bash
# 1. Lint
npm run lint

# 2. Typecheck (via build, no separate script)
cd moneymap-v2 && npx tsc --noEmit

# 3. Build
npm run build
```

Expected outcomes:

- Lint: Should pass (may show warnings)
- Typecheck: Should pass
- Build: Should complete with all 22 pages generated

---

## 6. High-Risk Areas

1. **Duplicate DebugPanel** - UI bug, easy fix
2. **Placeholder crypto converter** - Non-functional feature, visible to users
3. **"Coming Soon" Plaid text** - May confuse users expecting functionality
4. **Hard-coded API keys** - Security issue if repo is public
5. **Missing `/about` route** - 404 if users navigate there
6. **51 lint warnings** - Tech debt, some may indicate real issues

---

## 7. Fixes: Agent vs User Decision

### I Will Fix (No Decision Needed)

- Remove duplicate DebugPanel (keep dashboard version, remove from root layout)
- Fix 2 `any` type errors in `Fees.tsx`
- Remove or stub empty `lib/services/` directory
- Clean up clearly unused imports flagged by lint

### Needs Your Decision

| Issue | Options ||-------|---------|| Missing `/about` route | A) Create simple About page, B) Remove from checklist || "Coming Soon" Plaid text | A) Remove/hide button, B) Keep as-is || Placeholder crypto rate | A) Wire to real API, B) Hide crypto converter, C) Add "demo only" label |