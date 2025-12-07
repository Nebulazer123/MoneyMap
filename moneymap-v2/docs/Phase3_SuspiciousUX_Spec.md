# Phase 3: Suspicious UX Spec

**Date:** December 7, 2025  
**Scope:** D8, D11, D12, D13, I6 from Phase2_QA_Checklist.md

---

## Overview

This document describes the suspicious transaction management UX across Subscriptions, Recurring, and Review tabs.

## Decision States

Suspicious transactions can have one of three user decision states:

| State | Description | Effect |
|-------|-------------|--------|
| **unreviewed** | Default - no user action | Shown in suspicious list, counted as unresolved |
| **confirmed** | User pressed "Mark Suspicious" | Stays visible, tagged as confirmed, counted as unresolved |
| **dismissed** | User pressed "All Good" | Hidden from lists, removed from unresolved count |

## State Location

Decisions are stored in the Zustand data store:

```typescript
// src/lib/store/useDataStore.ts
duplicateDecisions: Record<string, "confirmed" | "dismissed">
setDuplicateDecision(id, decision): void
```

**Note:** Named `duplicateDecisions` for historical reasons but handles all suspicious types.

## Shared Helper

A new helper file centralizes summary calculations:

```typescript
// src/lib/derived/suspiciousSummary.ts
computeSuspiciousSummary(txns, decisions) → SuspiciousSummary
getUnresolvedSuspicious(txns, decisions) → Transaction[]
getSurroundingContext(tx, allTxns, daysWindow) → Transaction[]
getSuspiciousTypeLabel(type) → string
```

## Components Using This System

| Component | Usage |
|-----------|-------|
| `Subscriptions.tsx` | Shows subscription-related suspicious, More Info modal |
| `Recurring.tsx` | Shows recurring-related suspicious, More Info modal |
| `Review.tsx` | Shows combined counts, navigates to Subscriptions |

## QA Checklist Items Satisfied

| ID | Requirement | Status | How |
|----|-------------|--------|-----|
| D8 | Mark Suspicious/All Good updates counts | ✅ DONE | Buttons call `setDuplicateDecision`, counts update via Zustand reactivity |
| D11 | Review counts sync with Subscriptions/Recurring | ✅ DONE | All tabs use same `duplicateDecisions` store |
| D12 | Banner contrast/readability | ✅ DONE | Changed to `bg-amber-900/40` with `text-amber-100/200` |
| D13 | More Info shows surrounding context | ✅ DONE | Modal shows same-merchant charges ±45 days |
| I6 | "Tap to manage subscriptions" works | ✅ DONE | Button calls `setActiveTab('subscriptions')` |

## Banner Styling

Before:
```css
bg-amber-500/10 border-amber-500/30
text-amber-200, text-amber-300/80
```

After (WCAG-friendly):
```css
bg-amber-900/40 border-amber-500/50
text-amber-100, text-amber-200
text-black on amber-500 button
```

## More Info Modal Contents

1. **Header** - Transaction description, amount, date, type label
2. **Reason** - Suspicious reason from engine (amber box)
3. **Related Charges** - Same-merchant transactions within ±45 days
4. **Actions** - Mark Suspicious / All Good buttons
