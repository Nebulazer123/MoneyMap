# Budget Tab: Car Insurance Box Specification

**Date:** December 5, 2025

## 1. Requirement Overview

The Budget tab currently displays 5 summary boxes. A 6th box is required to provide users with a budget and benchmark for their Car Insurance spending.

## 2. Box Details

### 2.1 Title and Placement
- **Title:** `Car insurance`
- **Placement:** Displayed alongside the other 5 boxes, maintaining a consistent grid layout (e.g., 3x2 on desktop).

### 2.2 User's Monthly Spend
- **Label:** "Your car insurance"
- **Value:** Calculated as the sum of all transactions within the current view range (e.g., monthly) that match merchant names from the "Car Insurance" pool defined in `docs/lifestyle_merchant_pools_v1.md`.
- **Normalization:** If the view range is not exactly one month, the value should be normalized to an estimated monthly spend.
- **Source:** Merchant name matching against the canonical pool.

### 2.3 Benchmark: "Typical in your area"
- **Label:** "Typical in your area"
- **Value:** A benchmark monthly car insurance cost.
- **Implementation:** Initially, this will be a configurable constant (e.g., `CAR_INSURANCE_BENCHMARK_MONTHLY = $150`).
- **Display:** e.g., `Typical in your area: $150/mo`
- **Note:** A small annotation should indicate this is an estimate/average and not real-time, area-specific data (until a future API integration).

### 2.4 Comparison
- The card must include a comparison between the user's spend and the benchmark.
- **Examples:**
  - Text: "You're paying $25 more than typical." / "You're paying $10 less than typical."
  - Visual: A subtle up/down arrow or chip (e.g., "Above typical", "Below typical").
- The exact visual representation is TBD, but the comparison data point is required.

## 3. Merchant Pool Reference
The list of car insurance merchants (State Farm, GEICO, Progressive, Allstate, etc.) is defined in `docs/lifestyle_merchant_pools_v1.md`.

## 4. Dependencies
- This feature is separate from the general "Transport" budget category.
- The benchmark value is initially a constant.
- Fee/ATM behavior is handled separately as per `Phase2_QA_Checklist.md`.

## 5. QA Status
This feature is **IMPLEMENTED** ✅ as of Phase 2.3 (December 6, 2025).

### Implementation Notes
- **View Range Integration:** The box respects the active view range from `useDateStore` and filters transactions via `getTransactionsInDateRange`.
- **Merchant Pool:** Uses the canonical `CAR_INSURANCE` pool from `merchantPools.ts` with case-insensitive matching.
- **Monthly Normalization:** If view range is 28-31 days, uses total as-is. Otherwise, computes daily average and multiplies by 30 for monthly estimate.
- **Benchmark:** Constant value of $150/mo (configurable in `Budget.tsx`).
- **Comparison Logic:** Shows "About typical" (delta < $10), "more than typical" (delta > 0), or "less than typical" (delta < 0) with up/down arrows.

#### How to verify once implemented:
To verify this box, go to the **Budget** tab, zoom/scroll to see all category boxes, and confirm a **Car insurance** card is visible alongside the other budget categories, with fields for: *Your car insurance*, *Typical in your area*, and a *comparison indicator*.

