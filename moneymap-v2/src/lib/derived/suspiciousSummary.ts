/**
 * Suspicious Summary Helper
 * 
 * Pure utility functions for computing suspicious transaction summaries.
 * Used by Subscriptions, Recurring, and Review tabs for consistent counts.
 * 
 * This file does NOT modify transactionSelectors.ts as per frozen file rules.
 */

import { Transaction } from '../types';

export type SuspiciousDecision = "confirmed" | "dismissed";

export interface SuspiciousSummary {
    /** Total flagged by engine (isSuspicious === true) */
    totalFlagged: number;
    /** Flagged minus dismissed */
    unresolved: number;
    /** User marked as confirmed issue */
    confirmed: number;
    /** User dismissed as not an issue */
    dismissed: number;
}

/**
 * Compute summary counts for suspicious transactions.
 * 
 * @param suspiciousTxns - Transactions where isSuspicious === true
 * @param decisions - Map of transaction ID to user decision
 * @returns Summary object with counts
 */
export function computeSuspiciousSummary(
    suspiciousTxns: Transaction[],
    decisions: Record<string, SuspiciousDecision>
): SuspiciousSummary {
    let confirmed = 0;
    let dismissed = 0;

    suspiciousTxns.forEach(tx => {
        const decision = decisions[tx.id];
        if (decision === 'confirmed') confirmed++;
        else if (decision === 'dismissed') dismissed++;
    });

    const totalFlagged = suspiciousTxns.length;
    const unresolved = totalFlagged - dismissed;

    return {
        totalFlagged,
        unresolved,
        confirmed,
        dismissed
    };
}

/**
 * Get suspicious transactions that are NOT dismissed.
 * These should be displayed in the review UI.
 * 
 * @param suspiciousTxns - Transactions where isSuspicious === true
 * @param decisions - Map of transaction ID to user decision
 * @returns Filtered list excluding dismissed transactions
 */
export function getUnresolvedSuspicious(
    suspiciousTxns: Transaction[],
    decisions: Record<string, SuspiciousDecision>
): Transaction[] {
    return suspiciousTxns.filter(tx => decisions[tx.id] !== 'dismissed');
}

/**
 * Get surrounding transactions for context in "More Info" modal.
 * Finds same-merchant transactions within a date window.
 * 
 * @param targetTx - The suspicious transaction to get context for
 * @param allTransactions - All transactions to search
 * @param daysWindow - Number of days before and after (default 45)
 * @returns Array of related transactions sorted by date
 */
export function getSurroundingContext(
    targetTx: Transaction,
    allTransactions: Transaction[],
    daysWindow: number = 45
): Transaction[] {
    const targetDate = new Date(targetTx.date);
    const minDate = new Date(targetDate);
    minDate.setDate(minDate.getDate() - daysWindow);
    const maxDate = new Date(targetDate);
    maxDate.setDate(maxDate.getDate() + daysWindow);

    const merchantName = targetTx.merchantName || targetTx.description.split(' ')[0];

    return allTransactions
        .filter(tx => {
            // Skip the target transaction itself
            if (tx.id === targetTx.id) return false;

            // Must be same merchant
            const txMerchant = tx.merchantName || tx.description.split(' ')[0];
            if (txMerchant.toLowerCase() !== merchantName.toLowerCase()) return false;

            // Must be within date window
            const txDate = new Date(tx.date);
            return txDate >= minDate && txDate <= maxDate;
        })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

/**
 * Get a human-readable label for the suspicious type.
 * 
 * @param type - The suspicious type from the transaction
 * @returns Human-readable label
 */
export function getSuspiciousTypeLabel(type: string | undefined): string {
    switch (type) {
        case 'duplicate': return 'Potential Duplicate';
        case 'overcharge': return 'Unusual Amount';
        case 'unexpected': return 'Unexpected Charge';
        default: return 'Suspicious Activity';
    }
}
