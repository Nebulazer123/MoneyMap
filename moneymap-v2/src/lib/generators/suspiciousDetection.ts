import { Transaction, LifestyleProfile } from '../types';
import { generateTransactionId, GenerationPhase } from './idGenerator';

/**
 * Suspicious Charge Detection Logic
 * Implements algorithms for Duplicate, Overcharge, and Unexpected charge detection
 * per PLAN.md §5.6.3
 */

// Constants
const DAY_MS = 1000 * 60 * 60 * 24;
const AMOUNT_TOLERANCE = 0.10; // $0.10 tolerance
const FORGIVENESS_WINDOW = 3; // 3-day forgiveness window

// --- Helper Functions ---

const getDaysBetween = (d1: string, d2: string): number => {
    const t1 = new Date(d1).getTime();
    const t2 = new Date(d2).getTime();
    return Math.abs(t1 - t2) / DAY_MS;
};

const isSameAmount = (a: number, b: number): boolean => {
    return Math.abs(Math.abs(a) - Math.abs(b)) <= AMOUNT_TOLERANCE;
};

const getDayOfMonth = (date: string): number => {
    return new Date(date).getDate();
};

// --- Merchant Pattern Analysis ---

interface MerchantPattern {
    merchant: string;
    normalAmounts: number[]; // All distinct "normal" amounts (e.g., $9.99, $14.99 for multi-plan)
    expectedInterval: number; // Days between charges (30 = monthly, 14 = bi-weekly)
    expectedDayOfMonth: number; // Typical billing day
}

const analyzeMerchantPattern = (transactions: Transaction[], merchant: string): MerchantPattern | null => {
    const merchantTxs = transactions
        .filter(t => t.merchantName === merchant)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (merchantTxs.length < 2) return null;

    // Find all distinct amounts (multi-plan support)
    const amountCounts = new Map<string, number>();
    merchantTxs.forEach(t => {
        const key = Math.abs(t.amount).toFixed(2);
        amountCounts.set(key, (amountCounts.get(key) || 0) + 1);
    });

    // Amounts that appear at least twice are considered "normal"
    const normalAmounts: number[] = [];
    amountCounts.forEach((count, key) => {
        if (count >= 2) {
            normalAmounts.push(parseFloat(key));
        }
    });

    // If no repeated amounts, use all amounts
    if (normalAmounts.length === 0) {
        amountCounts.forEach((_, key) => normalAmounts.push(parseFloat(key)));
    }

    // Calculate expected interval
    const intervals: number[] = [];
    for (let i = 1; i < merchantTxs.length; i++) {
        const days = getDaysBetween(merchantTxs[i].date, merchantTxs[i - 1].date);
        if (days > 0) intervals.push(days);
    }

    // Mode of intervals
    let expectedInterval = 30; // Default monthly
    if (intervals.length > 0) {
        const intervalCounts = new Map<number, number>();
        intervals.forEach(i => {
            const rounded = Math.round(i / 7) * 7; // Round to nearest week
            if (rounded === 0) return;
            intervalCounts.set(rounded, (intervalCounts.get(rounded) || 0) + 1);
        });

        let maxCount = 0;
        intervalCounts.forEach((count, interval) => {
            if (count > maxCount) {
                maxCount = count;
                expectedInterval = interval;
            }
        });
    }

    // Expected day of month (mode)
    const dayOfMonthCounts = new Map<number, number>();
    merchantTxs.forEach(t => {
        const day = getDayOfMonth(t.date);
        dayOfMonthCounts.set(day, (dayOfMonthCounts.get(day) || 0) + 1);
    });

    let expectedDayOfMonth = 15;
    let maxCount = 0;
    dayOfMonthCounts.forEach((count, day) => {
        if (count > maxCount) {
            maxCount = count;
            expectedDayOfMonth = day;
        }
    });

    return {
        merchant,
        normalAmounts,
        expectedInterval,
        expectedDayOfMonth
    };
};

// --- Detection Algorithms ---

export type SuspiciousType = 'duplicate' | 'overcharge' | 'unexpected';

export interface SuspiciousResult {
    isSuspicious: boolean;
    type: SuspiciousType | null;
    reason: string;
    parentId?: string;
}

/**
 * Detect if a transaction is a duplicate charge
 * A charge is duplicate if: same merchant & amount appears again far before expected interval
 * Exception: 3-day forgiveness window around expected billing date
 */
export const detectDuplicate = (
    tx: Transaction,
    history: Transaction[],
    pattern: MerchantPattern | null
): SuspiciousResult => {
    if (!pattern) return { isSuspicious: false, type: null, reason: '' };

    // Check if this amount is one of the normal amounts
    const isNormalAmount = pattern.normalAmounts.some(amt => isSameAmount(amt, Math.abs(tx.amount)));
    if (!isNormalAmount) return { isSuspicious: false, type: null, reason: '' };

    // Find all same-merchant, same-amount charges
    const sameCharges = history.filter(h =>
        h.merchantName === tx.merchantName &&
        isSameAmount(h.amount, tx.amount) &&
        h.id !== tx.id &&
        new Date(h.date) < new Date(tx.date)
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (sameCharges.length === 0) return { isSuspicious: false, type: null, reason: '' };

    const lastCharge = sameCharges[0];
    const daysSinceLast = getDaysBetween(lastCharge.date, tx.date);

    // Expected interval with forgiveness
    const minExpected = pattern.expectedInterval - FORGIVENESS_WINDOW;

    // If charge came way too early (less than expected minus forgiveness)
    if (daysSinceLast < minExpected && daysSinceLast < pattern.expectedInterval * 0.5) {
        return {
            isSuspicious: true,
            type: 'duplicate',
            reason: `Charged ${Math.round(daysSinceLast)} days after last charge (expected ~${pattern.expectedInterval} days)`,
            parentId: lastCharge.id
        };
    }

    return { isSuspicious: false, type: null, reason: '' };
};

/**
 * Detect if a transaction is an overcharge
 * A charge is overcharge if: amount > normal amount + $0.10, within expected billing window
 */
export const detectOvercharge = (
    tx: Transaction,
    history: Transaction[],
    pattern: MerchantPattern | null
): SuspiciousResult => {
    if (!pattern) return { isSuspicious: false, type: null, reason: '' };

    const txAmount = Math.abs(tx.amount);

    // Check if amount exceeds all known normal amounts
    const maxNormalAmount = Math.max(...pattern.normalAmounts);

    if (txAmount > maxNormalAmount + AMOUNT_TOLERANCE) {
        // Check if we're within expected billing window (+/- 3 days of expected day)
        const txDay = getDayOfMonth(tx.date);
        const inBillingWindow = Math.abs(txDay - pattern.expectedDayOfMonth) <= FORGIVENESS_WINDOW;

        if (inBillingWindow) {
            const overchargeAmount = txAmount - maxNormalAmount;
            return {
                isSuspicious: true,
                type: 'overcharge',
                reason: `Charged $${txAmount.toFixed(2)} instead of usual $${maxNormalAmount.toFixed(2)} (+$${overchargeAmount.toFixed(2)})`
            };
        }
    }

    return { isSuspicious: false, type: null, reason: '' };
};

/**
 * Detect if a transaction is an unexpected charge
 * A charge is unexpected if: amount doesn't match any known normal amount for this merchant
 */
export const detectUnexpected = (
    tx: Transaction,
    history: Transaction[],
    pattern: MerchantPattern | null
): SuspiciousResult => {
    if (!pattern) return { isSuspicious: false, type: null, reason: '' };

    const txAmount = Math.abs(tx.amount);

    // Check if this amount matches any normal amount
    const matchesNormal = pattern.normalAmounts.some(amt => isSameAmount(amt, txAmount));

    if (!matchesNormal && pattern.normalAmounts.length > 0) {
        // Look for this amount in last 3 months and next 3 months of history
        const txDate = new Date(tx.date);
        const threeMonthsAgo = new Date(txDate);
        threeMonthsAgo.setMonth(txDate.getMonth() - 3);
        const threeMonthsAhead = new Date(txDate);
        threeMonthsAhead.setMonth(txDate.getMonth() + 3);

        const sameMerchantInWindow = history.filter(h =>
            h.merchantName === tx.merchantName &&
            h.id !== tx.id &&
            new Date(h.date) >= threeMonthsAgo &&
            new Date(h.date) <= threeMonthsAhead
        );

        const amountSeenBefore = sameMerchantInWindow.some(h => isSameAmount(h.amount, tx.amount));

        if (!amountSeenBefore) {
            return {
                isSuspicious: true,
                type: 'unexpected',
                reason: `Unusual amount $${txAmount.toFixed(2)} for ${tx.merchantName} (normal: $${pattern.normalAmounts.map(a => a.toFixed(2)).join(', $')})`
            };
        }
    }

    return { isSuspicious: false, type: null, reason: '' };
};

// --- Full Detection Pipeline ---

export const analyzeTransaction = (tx: Transaction, allTransactions: Transaction[]): SuspiciousResult => {
    const pattern = analyzeMerchantPattern(allTransactions, tx.merchantName || '');

    // Check in order of severity
    const duplicateResult = detectDuplicate(tx, allTransactions, pattern);
    if (duplicateResult.isSuspicious) return duplicateResult;

    const overchargeResult = detectOvercharge(tx, allTransactions, pattern);
    if (overchargeResult.isSuspicious) return overchargeResult;

    const unexpectedResult = detectUnexpected(tx, allTransactions, pattern);
    if (unexpectedResult.isSuspicious) return unexpectedResult;

    return { isSuspicious: false, type: null, reason: '' };
};

// --- Injection Logic for Generation ---

// Candidates for suspicious charges
const SUSPICIOUS_MERCHANT_CANDIDATES = [
    'Netflix', 'Spotify', 'Apple', 'Amazon Prime', 'Hulu', 'Disney+',
    'Adobe', 'Microsoft 365', 'iCloud', 'YouTube Premium', 'HBO Max',
    'Planet Fitness', 'LA Fitness', 'Anytime Fitness',
    'AT&T', 'Verizon', 'T-Mobile',
    'State Farm', 'Geico', 'Progressive'
];

export interface InjectionConfig {
    targetMin: number;
    targetMax: number;
}

/**
 * Inject suspicious charges into transaction list
 * Ensures 2-6 different suspicious merchants with variety of types
 */
export const injectSuspiciousCharges = (
    transactions: Transaction[],
    profile: LifestyleProfile,
    config: InjectionConfig = { targetMin: 2, targetMax: 6 }
): Transaction[] => {
    const result = [...transactions];

    // Find subscription/recurring transactions that are good candidates
    const subscriptions = result.filter(t =>
        (t.kind === 'subscription' || t.isRecurring) &&
        t.merchantName
    );

    if (subscriptions.length === 0) return result;

    // Determine target number of suspicious merchants
    const targetCount = config.targetMin + Math.floor(Math.random() * (config.targetMax - config.targetMin + 1));

    // Group subscriptions by merchant
    const merchantGroups = new Map<string, Transaction[]>();
    subscriptions.forEach(t => {
        const group = merchantGroups.get(t.merchantName!) || [];
        group.push(t);
        merchantGroups.set(t.merchantName!, group);
    });

    // Pick random merchants from available ones
    const availableMerchants = Array.from(merchantGroups.keys());
    const selectedMerchants: string[] = [];

    for (let i = 0; i < Math.min(targetCount, availableMerchants.length); i++) {
        const idx = Math.floor(Math.random() * availableMerchants.length);
        const merchant = availableMerchants.splice(idx, 1)[0];
        selectedMerchants.push(merchant);
    }

    // Assign suspicious types with variety
    const types: SuspiciousType[] = ['duplicate', 'overcharge', 'unexpected'];

    selectedMerchants.forEach((merchant, idx) => {
        const group = merchantGroups.get(merchant);
        if (!group || group.length === 0) return;

        // Rotate through types to ensure variety
        const suspiciousType = types[idx % types.length];

        // Pick a random transaction from this merchant to be suspicious
        const targetTx = group[Math.floor(Math.random() * group.length)];

        if (suspiciousType === 'duplicate') {
            // Create a duplicate 2-4 days later
            const originalDate = new Date(targetTx.date);
            const dupDate = new Date(originalDate);
            dupDate.setDate(originalDate.getDate() + 2 + Math.floor(Math.random() * 2));

            const dup: Transaction = {
                ...targetTx,
                id: generateTransactionId(profile.id, dupDate, 'X' as GenerationPhase, 900 + idx),
                date: dupDate.toISOString().split('T')[0],
                isSuspicious: true,
                suspiciousType: 'duplicate',
                suspiciousReason: `Duplicate charge detected - ${Math.round(getDaysBetween(targetTx.date, dupDate.toISOString()))} days after original`,
                parentId: targetTx.id
            };
            result.push(dup);
        } else if (suspiciousType === 'overcharge') {
            // Find and modify a charge to be higher
            const overchargeAmount = Math.abs(targetTx.amount) * (1.1 + Math.random() * 0.2); // 10-30% higher
            const txIndex = result.findIndex(t => t.id === targetTx.id);
            if (txIndex >= 0) {
                result[txIndex] = {
                    ...result[txIndex],
                    amount: -overchargeAmount,
                    isSuspicious: true,
                    suspiciousType: 'overcharge',
                    suspiciousReason: `Amount $${overchargeAmount.toFixed(2)} is higher than usual $${Math.abs(targetTx.amount).toFixed(2)}`
                };
            }
        } else if (suspiciousType === 'unexpected') {
            // Create a charge with unusual amount
            const originalDate = new Date(targetTx.date);
            const unexpDate = new Date(originalDate);
            unexpDate.setDate(originalDate.getDate() + 5 + Math.floor(Math.random() * 5));

            const unusualAmount = 4.99 + Math.random() * 10; // Random $5-$15

            const unexp: Transaction = {
                ...targetTx,
                id: generateTransactionId(profile.id, unexpDate, 'X' as GenerationPhase, 950 + idx),
                date: unexpDate.toISOString().split('T')[0],
                amount: -unusualAmount,
                isSuspicious: true,
                suspiciousType: 'unexpected',
                suspiciousReason: `Unexpected charge of $${unusualAmount.toFixed(2)} from ${targetTx.merchantName}`
            };
            result.push(unexp);
        }
    });

    return result;
};

/**
 * Run detection on all transactions and mark suspicious ones
 * Called after initial generation to catch any naturally suspicious patterns
 */
export const runDetectionPass = (transactions: Transaction[]): Transaction[] => {
    return transactions.map(tx => {
        if (tx.isSuspicious) return tx; // Already marked

        const result = analyzeTransaction(tx, transactions);
        if (result.isSuspicious) {
            return {
                ...tx,
                isSuspicious: true,
                suspiciousType: result.type!,
                suspiciousReason: result.reason,
                parentId: result.parentId
            };
        }
        return tx;
    });
};
