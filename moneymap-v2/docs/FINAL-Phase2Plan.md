# MoneyMap v2 – FINAL Phase 2 Implementation Plan

Phase 2 covers deep logic: transaction generation, lifestyle modeling, suspicious detection, math/selectors, and API infrastructure. This is the **execution checklist** for all Phase 2 work.

---

## Source Documents

- **PLAN.md** — Master spec (Phase 2 = §5, Phase 3 = §6)
- `docs/Phase2Plan_Unrevised.md` — Original long-form spec
- `docs/lifestyle_merchant_pools_v1.md` — Canonical merchant pool definitions
- `.gemini/phase2_step1_date_audit.md` — Date system architecture
- `.gemini/phase2_step2_lifestyle_architecture.md` — LifestyleProfile structure
- `.gemini/phase2_step3_transaction_engine_architecture.md` — 12-stage pipeline
- `.gemini/phase2_step4_id_sorting_architecture.md` — ID generation logic
- `.gemini/.../phase2_status_analysis.md` — Current implementation status

> **PLAN.md is the master spec; this file is the execution checklist for Phase 2.**

---

## Phase 2 Areas

### 1. Date & Stores

- [x] Create `useDateStore` with dataset/view ranges — Status: DONE
- [x] Create `useDataStore` with generateData action — Status: DONE
- [x] Persistence and hydration for dates — Status: DONE
- [x] Create Debug Panel for date controls — Status: DONE
  - Spec: PLAN.md §5.8
  - Files: `src/components/dashboard/DebugPanel.tsx`

### 2. Lifestyle Profile & Merchant Pools

- [x] Align merchantPools.ts with canonical doc — Status: DONE
- [x] Implement target counts per §5.4.2 — Status: DONE
- [x] pickDistinct helper for range selection — Status: DONE
- [x] Housing exclusive (rent XOR mortgage) — Status: DONE

### 3. Transaction Engine

- [x] 12-stage pipeline structure — Status: DONE
- [x] Month-by-month iteration — Status: DONE
- [x] Fixed recurring (rent, utilities) — Status: DONE
- [x] Subscriptions (streaming, music, gym) — Status: DONE
- [x] Income generation — Status: DONE
- [x] Variable spending (groceries, dining, gas) — Status: DONE
- [x] VISA* and ACH prefixes — Status: DONE
  - Spec: PLAN.md §5.4.4
  - Files: transactionEngine.ts
- [x] Recurring subscription stability — Status: DONE
  - Spec: PLAN.md §5.3 (same amounts each cycle)
- [x] Expand fees to 3-6 types — Status: DONE
  - Spec: PLAN.md §5.5
  - Files: transactionEngine.ts

### 4. IDs & Sorting

- [x] FNV-1a stable ID generation — Status: DONE
- [x] Pattern fingerprinting — Status: DONE
- [x] Final sort by date+ID — Status: DONE

### 5. Selectors & Math

- [x] getTransactionsInDateRange — Status: DONE
- [x] getNetIncome, getTotalSpending — Status: DONE
- [x] getCategoryTotals — Status: DONE
- [x] getDailyCashflow — Status: DONE
- [x] Transfer exclusion from totals — Status: DONE
- [x] pairInternalTransfers — Status: DONE

### 6. Suspicious Detection

- [x] Basic duplicate injection — Status: DONE
- [x] 3-day forgiveness window — Status: DONE
  - Spec: PLAN.md §5.6.3 Example B
- [x] Multi-plan merchant handling — Status: DONE
  - Spec: PLAN.md §5.6.3 Example C (Apple iCloud + AppleCare)
- [x] Overcharge detection complete — Status: DONE
- [x] Unexpected charge detection complete — Status: DONE
- [x] Inject 2-6 different suspicious merchants — Status: DONE
  - Spec: PLAN.md §5.6.2
- [x] $0.10 amount grace tolerance — Status: DONE

### 7. UI Integration

- [x] Overview uses new selectors — Status: DONE
- [x] Cashflow uses new selectors — Status: DONE
- [x] Recurring uses new selectors — Status: DONE
- [x] Fees uses new selectors — Status: DONE
- [x] Review uses new selectors — Status: DONE
- [x] Subscriptions uses new selectors — Status: DONE
- [x] Suspicious "Review now" prominent button — Status: DONE (already in Review.tsx)
- [x] Mark suspicious / All good buttons — Status: DONE (already in Review.tsx modal)
- [x] Delete fakeDataService.ts — Status: DONE

### 8. APIs & Debug Panel — *Moved to Phase 3*

> API rate limiting and related UX are now Phase 3 responsibilities. See `docs/Phase3_Plan.md`.

- [x] Debug Panel created with stub API status — Status: DONE
- [ ] Rate limit wrapper for all APIs — **Phase 3**
- [ ] Debounce for search fields (300-500ms) — **Phase 3**
- [ ] Real API token display — **Phase 3**

### 9. Review Tab Enhancements — *Partial, rest in Phase 3*

- [x] Rename "Duplicate charges" → "Suspicious charges" — Status: DONE
- [ ] Increase font in 6 top boxes — **Phase 3** (PLAN.md §5.13.3)
- [ ] Internal transfers detail list — **Phase 3** (PLAN.md §5.13.7)

### 10. Category & Description Polish — *Moved to Phase 3*

> These polish items are now in `docs/Phase3_Plan.md`.

- [ ] Education → Online Shopping rename — **Phase 3** (PLAN.md §5.4.6)
- [ ] Add descriptors ("Gas", "Transfer") — **Phase 3** (PLAN.md §5.4.5)

---

## Execution Order (Remaining Tasks)

1. ~~Create DebugPanel.tsx~~ — **DONE**
2. ~~Complete suspicious detection~~ — **DONE**
3. ~~Inject 2-6 suspicious merchants~~ — **DONE**
4. ~~Add VISA* prefixes~~ — **DONE**
5. ~~Expand fees to 3-6 types~~ — **DONE**
6. ~~Subscription amount stability~~ — **DONE**
7. ~~Rename "Duplicate charges"~~ — **DONE** (was already correct)
8. ~~Mark suspicious/All good buttons~~ — **DONE** (already in Review modal)
9. ~~Delete fakeDataService.ts~~ — **DONE**
10. ~~API rate limiting~~ — **Moved to Phase 3**

---

## Phase 2 Completion Status

**Phase 2 core engine + suspicious detection complete and build passing as of 2025-12-05.**

See `docs/Phase3_Plan.md` for remaining polish and API work.

---

## Notes

- **Phase 2.1–2.9 are complete** — All core tasks done, build passes
- **API infrastructure moved to Phase 3** — Not blocking for demo
- **Polish items moved to Phase 3** — Font sizes, category rename, descriptors
- **QA checklist available** — See `docs/Phase2_QA_Checklist.md`

