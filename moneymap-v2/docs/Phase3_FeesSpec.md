# Phase 3 – Fees & ATM Logic Specification

## Overview
Fees are generated via `transactionEngine.ts` using distinct pools for ATM usage and Bank/Service fees. The Fees tab UI groups these separately for clarity.

## Merchant Pools
- **ATM Merchants**: `Chase ATM`, `Bank of America ATM`, `Wells Fargo ATM`, etc.
- **Bank Fee Types**: `Overdraft Fee`, `Monthly Service Fee`, `Wire Transfer Fee`, etc.

## Generation Logic
- **Distinct Types**: Each user profile is assigned 3-6 distinct fee types (mix of 1-2 ATM merchants and 2-4 Service fees).
- **ATM Fees**:
  - Consistent amount per merchant (e.g., Chase ATM always $4.00 for a given user).
  - Description: `[MERCHANT] FEE` (e.g., "CHASE ATM FEE").
- **Service Fees**:
  - Whole dollar amounts (e.g., $12.00, $35.00).
  - Merchant Name: "Bank Fee".
  - Description: Upper-case fee name (e.g., "OVERDRAFT FEE").

## UI Implementation (`Fees.tsx`)
- **Grouping**: Fees are split into two cards:
  1. **ATM Fees**: Icon 🏧
  2. **Service & Bank Fees**: Icon 🏦
- **Display**: Shows Description, Merchant Name, Date, and Amount.

## Verification
- QA Script: `npm run qa:fees` (checks for consistency, whole dollar info, and variety).
