import { Transaction } from '../types';
import * as MathLogic from '../math/transactionMath';
import { isSubscriptionCategory } from '../categoryRules';

/**
 * Transaction Selectors - Public API Layer
 * 
 * This module provides the public API for filtering and aggregating transactions.
 * Components should import from this module for consistency.
 * 
 * Architecture:
 * - Selectors layer: Public API (this file) - filtering, grouping, aggregations
 * - Math layer: Pure calculation functions (transactionMath.ts) - implementation details
 * - Components should use selectors, not math functions directly
 */

// --- Core Filtering ---

// Phase 2.1 view-range: Parse transaction date string to normalized local midnight Date
// Handles both "YYYY-MM-DD" and full ISO strings like "2025-12-01T06:00:00.000Z"
export const parseTransactionLocalDate = (txDate: string): Date => {
    // For "YYYY-MM-DD" format, parse directly as local date components
    if (txDate.length === 10 && txDate.includes('-')) {
        const [year, month, day] = txDate.split('-').map(Number);
        return new Date(year, month - 1, day); // month is 0-indexed
    }
    // For ISO strings, parse and normalize to local midnight
    const d = new Date(txDate);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};

/**
 * Phase 2.1 view-range: Filter transactions by date range.
 * 
 * MONTH-BASED, DATEKEY-BASED, TIMEZONE-SAFE FILTERING:
 * - viewStart and viewEnd represent "From month" and "To month"
 * - We compute canonical month boundaries using local calendar fields only
 * - We use integer YYYYMMDD dateKeys for comparison (no time components, no UTC)
 * - This approach is immune to timezone drift and JSON serialization issues
 * 
 * Rules:
 * - startBoundary = 1st day of From month
 * - endBoundary = last day of To month (NOT exclusive - we use <= comparison)
 * - Transaction is included if: startKey <= txKey <= endKey
 * 
 * Examples:
 * - Dec-Dec: startKey=20251201, endKey=20251231 → includes Dec 1-31 only
 * - Nov-Dec: startKey=20251101, endKey=20251231 → includes Nov 1 - Dec 31
 * 
 * @param transactions - Array of transactions to filter
 * @param start - Date representing the "From month" (day is ignored)
 * @param end - Date representing the "To month" (day is ignored)
 * @returns Filtered transactions within the month range (inclusive)
 */
export const getTransactionsInDateRange = (
    transactions: Transaction[],
    start: Date,
    end: Date
): Transaction[] => {
    // Extract year/month from inputs (ignore day component)
    const fromYear = start.getFullYear();
    const fromMonth = start.getMonth();
    const toYear = end.getFullYear();
    const toMonth = end.getMonth();

    // Compute canonical month boundaries
    const startBoundary = new Date(fromYear, fromMonth, 1);           // 1st of From month
    const endBoundary = new Date(toYear, toMonth + 1, 0);             // Last day of To month

    // Convert to integer dateKeys (YYYYMMDD format)
    const dateKey = (d: Date): number =>
        d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();

    const startKey = dateKey(startBoundary);
    const endKey = dateKey(endBoundary);

    return transactions.filter((tx) => {
        // Parse transaction date to local Date
        const txDate = parseTransactionLocalDate(tx.date);
        const txKey = dateKey(txDate);

        // Inclusive comparison: startKey <= txKey <= endKey
        return txKey >= startKey && txKey <= endKey;
    });
};

// --- Derived Selectors (Category Filters) ---

export const getIncomeTransactions = (transactions: Transaction[]): Transaction[] => {
    return transactions.filter(t => t.kind === 'income');
};

export const getExpenseTransactions = (transactions: Transaction[]): Transaction[] => {
    return transactions.filter(t => t.kind === 'expense');
};

/**
 * Get all subscription transactions using comprehensive detection.
 * Matches the logic used in getTotalSubscriptions for consistency.
 */
export const getSubscriptionTransactions = (transactions: Transaction[]): Transaction[] => {
    return transactions.filter(t => t.kind === 'subscription' || t.isSubscription || isSubscriptionCategory(t.category));
};

export const getFeeTransactions = (transactions: Transaction[]): Transaction[] => {
    return transactions.filter(t => t.kind === 'fee');
};

export const getTransferTransactions = (transactions: Transaction[]): Transaction[] => {
    return transactions.filter(t => MathLogic.isInternalTransfer(t) || t.kind === 'transferExternal');
};

export const getRecurringCandidates = (transactions: Transaction[]): Transaction[] => {
    return transactions.filter(t => t.isRecurring || t.kind === 'subscription' || t.category === 'Rent' || t.category === 'Utilities');
};

// --- Computed Selectors (Aggregations) ---

export const getCategoryTotals = (transactions: Transaction[]): Map<string, number> => {
    return MathLogic.getCategoryTotals(transactions);
};

export const getDailyCashflow = (transactions: Transaction[]) => {
    return MathLogic.getDailyCashflowBuckets(transactions);
};

export const getNetIncome = (transactions: Transaction[]): number => {
    return MathLogic.getNetIncome(transactions);
};

export const getTotalSpending = (transactions: Transaction[]): number => {
    return MathLogic.getTotalSpending(transactions);
};

export const getFeeTotals = (transactions: Transaction[]): number => {
    return MathLogic.getFeeTotals(transactions);
};

/**
 * Comprehensive subscription detection: checks kind, isSubscription flag, and category.
 * This is the canonical way to identify subscription transactions.
 */
export const getTotalSubscriptions = (transactions: Transaction[]): number => {
    return transactions
        .filter(t => t.kind === 'subscription' || t.isSubscription || isSubscriptionCategory(t.category))
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
};

export const getInternalTransferTotals = (transactions: Transaction[]): number => {
    return transactions
        .filter(t => MathLogic.isInternalTransfer(t))
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
};

export const getInternalTransferTransactions = (transactions: Transaction[]): Transaction[] => {
    return transactions.filter(t => MathLogic.isInternalTransfer(t));
};

// Re-export isInternalTransfer helper for direct use in components
export const isInternalTransfer = MathLogic.isInternalTransfer;

