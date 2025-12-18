import { Transaction, Category, OwnershipMode } from '../types';
import { isBillLikeCategory, isSubscriptionCategory, isBillishDescription, categoryToGroups } from '../categoryRules';
import { transportGuideline, internetGuideline } from '../config';
import { computeSummaryMetrics } from '../math/transactionMath';
import { getInternalTransferTotals } from '../selectors/transactionSelectors';

export interface SummaryStats {
    totalIncome: number;
    totalSpending: number;
    net: number;
    subscriptionCount: number;
    totalSubscriptions: number;
    totalFees: number;
    internalTransfersTotal: number;
    largestSingleExpense: { amount: number; description: string; category: string; date: string } | null;
}

export const calculateSummaryStats = (
    transactions: Transaction[],
    ownershipModes: Record<string, OwnershipMode>
): SummaryStats => {
    // Use centralized computeSummaryMetrics for core calculations
    const metrics = computeSummaryMetrics(transactions);
    
    // Calculate Budget-specific fields
    let subscriptionCount = 0;
    const internalTransfersTotal = getInternalTransferTotals(transactions);
    let largestSingleExpense: { amount: number; description: string; category: string; date: string } | null = null;

    transactions.forEach(tx => {
        // Count subscriptions (using same comprehensive logic)
        if (tx.amount < 0 && (tx.kind === 'subscription' || tx.isSubscription || isSubscriptionCategory(tx.category))) {
            subscriptionCount++;
        }

        // Find largest single expense
        if (tx.amount < 0 && tx.kind !== 'transferInternal') {
            const amount = Math.abs(tx.amount);
            if (!largestSingleExpense || amount > largestSingleExpense.amount) {
                largestSingleExpense = {
                    amount,
                    description: tx.description,
                    category: tx.category,
                    date: tx.date
                };
            }
        }
    });

    return {
        totalIncome: metrics.income,
        totalSpending: metrics.spending,
        net: metrics.netCashFlow,
        subscriptionCount,
        totalSubscriptions: metrics.subscriptionTotal,
        totalFees: metrics.feeTotal,
        internalTransfersTotal,
        largestSingleExpense
    };
};

export const calculateBudgetGuidance = (
    transactions: Transaction[],
    totalIncome: number
) => {
    // Simplified guidance logic
    // In a real app, this would be more configurable
    const categories = [
        { name: 'Rent', targetPercent: 30 },
        { name: 'Groceries', targetPercent: 10 },
        { name: 'Dining', targetPercent: 5 },
        { name: 'Transport', targetPercent: transportGuideline },
        { name: 'Utilities', targetPercent: internetGuideline }, // Using internet guideline as proxy for utilities/bills
    ];

    const spendingByCategory: Record<string, number> = {};
    transactions.forEach(tx => {
        if (tx.amount < 0 && tx.kind !== 'transferInternal') {
            spendingByCategory[tx.category] = (spendingByCategory[tx.category] || 0) + Math.abs(tx.amount);
        }
    });

    return categories.map(cat => {
        const actualAmount = spendingByCategory[cat.name] || 0;
        const recommendedAmount = (totalIncome * cat.targetPercent) / 100;
        const differenceAmount = Math.abs(actualAmount - recommendedAmount);
        const differenceDirection = actualAmount > recommendedAmount ? 'over' : 'under';

        return {
            category: cat.name,
            name: cat.name,
            actual: actualAmount,
            actualAmount,
            recommendedMax: recommendedAmount,
            recommendedAmount,
            differenceAmount,
            differenceDirection: differenceDirection as 'over' | 'under'
        };
    });
};

export const calculateTopSpendingCategories = (
    transactions: Transaction[]
) => {
    const spendingByCategory: Record<string, number> = {};
    transactions.forEach(tx => {
        if (tx.amount < 0 && tx.kind !== 'transferInternal') {
            spendingByCategory[tx.category] = (spendingByCategory[tx.category] || 0) + Math.abs(tx.amount);
        }
    });

    return Object.entries(spendingByCategory)
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);
};

export const calculateNeedsVsWants = (
    transactions: Transaction[],
    totalIncome: number
) => {
    let needs = 0;
    let wants = 0;

    transactions.forEach(tx => {
        if (tx.amount < 0 && tx.kind !== 'transferInternal') {
            const amount = Math.abs(tx.amount);
            const group = (categoryToGroups as Record<string, readonly string[]>)[tx.category];

            // Heuristic: Rent, Utilities, Groceries, Insurance, Education are needs
            if (group && group.some(g => ['rent_utils', 'groceries_dining', 'insurance', 'education'].includes(g))) {
                // Refine: Dining is usually a want, Groceries is a need.
                // But they are in the same group in config.
                // Let's use category name directly for better accuracy
                if (['Dining', 'Subscriptions', 'Entertainment', 'Shopping'].includes(tx.category)) {
                    wants += amount;
                } else {
                    needs += amount;
                }
            } else {
                wants += amount;
            }
        }
    });

    const total = needs + wants;
    const essentialsPercent = total > 0 ? Math.round((needs / total) * 100) : 0;
    const otherPercent = total > 0 ? Math.round((wants / total) * 100) : 0;

    return {
        needs,
        wants,
        essentialsPercent,
        otherPercent
    };
};
