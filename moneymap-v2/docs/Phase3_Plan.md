# Phase 3 Plan

## Overview

Phase 2 delivered the core transaction engine, suspicious detection logic, and data stores. Phase 3 focuses on **polish, UX improvements, edit flows, and optional API infrastructure**. All Phase 3 work builds on the stable Phase 2 foundation without major architectural changes.

---

## Phase 3 Areas & Tasks

### A. UI Polish & Review Tab

- [ ] Increase font size in the six top summary boxes on Review tab (PLAN.md §5.13.3)
- [ ] Improve visual emphasis of suspicious charges (better copy, spacing, subtle styling)
- [ ] Add internal transfer detail view/list on Review tab (PLAN.md §5.13.7)
- [ ] Ensure consistent spacing and alignment across all dashboard tabs

### B. Categories & Descriptions

- [ ] Rename "Education" → "Online Shopping" everywhere (PLAN.md §5.4.6)
- [ ] Add clearer description suffixes: "GAS", "TRANSFER", etc. (PLAN.md §5.4.5)
- [ ] Ensure all descriptors generated in `transactionEngine.ts` respect `docs/lifestyle_merchant_pools_v1.md`
- [ ] Review category colors and emojis for consistency

### C. Transaction Editing & Accounts

- [ ] Implement basic transaction editing: category change, add notes (PLAN.md §5.7)
- [ ] Ensure edits update derived selectors and counts immediately
- [ ] Expand "My Accounts" to support editing balances (PLAN.md §5.10)
- [ ] Add simple net worth calculation from account balances
- [ ] Add "Add Account" and "Remove Account" flows

### D. Optional API Infrastructure

- [ ] Design rate limit wrapper module for external APIs (PLAN.md §5.1)
- [ ] Implement per-session call counters and delay logic
- [ ] Wire Debug Panel to show real rate-limit status when APIs are introduced
- [ ] Add debounce (300–500ms) to search inputs that hit APIs
- [ ] Create `src/lib/api/` directory for centralized API handling

### E. Visual Polish & Animations

- [ ] Glass under-glow effects for key popups/cards (PLAN.md §5.14)
- [ ] Smooth transitions between date range changes
- [ ] Subtle hover animations on interactive elements
- [ ] Loading state animations for data regeneration

---

## Out of Scope (Future)

The following items are intentionally deferred beyond Phase 3:

- Multi-user profiles and authentication
- Data export (CSV, PDF statements)
- Advanced AI-powered insights or recommendations
- Real bank account linking (Plaid integration)
- Mobile app or responsive mobile-first redesign
- Historical data comparison (year-over-year)
- Budget goal setting and tracking
- Push notifications

---

## Success Criteria

Phase 3 is complete when:

1. Review tab has improved typography and internal transfer details
2. Category naming is consistent across all components
3. Basic transaction editing works without breaking derived data
4. API rate limiting infrastructure is in place (even if unused)
5. Visual polish passes subjective quality bar

---

## Reference Documents

- `PLAN.md` - Master specification (Phase 3 = §6)
- `docs/FINAL-Phase2Plan.md` - Phase 2 completion status
- `docs/Phase2_QA_Checklist.md` - Manual QA verification
- `docs/lifestyle_merchant_pools_v1.md` - Canonical merchant data
