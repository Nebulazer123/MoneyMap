# MoneyMap QA Readiness Checklist

Quick re-run checklist (5-10 minutes)

---

## Pre-flight (Terminal)

```powershell
cd moneymap-v2
npm install
npm run lint
npx tsc --noEmit
npm run build
```

**Expected:** All commands exit with code 0

---

## Smoke Test (Browser)

### 1. Landing Page
- [ ] Navigate to `http://localhost:3000`
- [ ] Page loads without errors
- [ ] "Try Demo" button visible

### 2. Demo Flow
- [ ] Click "Try Demo"
- [ ] Dashboard loads at `/dashboard`
- [ ] Summary cards show income/spending values

### 3. Tab Navigation
Test each tab renders without crash:
- [ ] Dashboard
- [ ] Overview (pie chart visible)
- [ ] Statement (transaction list)
- [ ] Subscriptions
- [ ] Recurring
- [ ] Fees
- [ ] Cashflow (line chart visible)
- [ ] Budget

### 4. Console Check
- [ ] Open DevTools → Console
- [ ] No red errors (warnings OK)
- [ ] No hydration errors

### 5. Responsive (Optional)
- [ ] Resize to mobile width (375px)
- [ ] Sidebar collapses to hamburger
- [ ] Content readable

---

## Quick Commands

| Task | Command |
|------|---------|
| Start dev server | `npm run dev` |
| Production build | `npm run build` |
| Lint only | `npm run lint` |
| Type check only | `npx tsc --noEmit` |

---

## Pass Criteria

✅ **PASS** if:
- All terminal commands exit 0
- No console errors in browser
- All 8 tabs render content
- Charts display data

❌ **FAIL** if:
- Build fails
- Hydration errors appear
- Tabs crash or show blank content
- Charts throw exceptions
