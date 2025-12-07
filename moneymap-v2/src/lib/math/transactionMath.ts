import { Transaction } from '../types';

/**
 * Pure math functions for transaction calculations.
 * These functions are stateless and rely solely on the input Transaction array.
 */

// --- Classification Helpers ---

export const isInternalTransfer = (tx: Transaction): boolean => {
    if (tx.kind === 'transferInternal') return true;
    // Fallback for legacy data or incomplete tagging
    if (tx.category === 'Transfer' && tx.kind !== 'transferExternal') return true;
    return false;
};

// --- Core Aggregations ---

export const getNetIncome = (transactions: Transaction[]): number => {
    return transactions
        .filter(t => t.kind === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
};

export const getTotalSpending = (transactions: Transaction[]): number => {
    return transactions
        .filter(t =>
            t.kind === 'expense' ||
            t.kind === 'subscription' ||
            t.kind === 'fee' ||
            t.kind === 'transferExternal'
        )
        // Explicitly exclude internal transfers and refunds (refunds handled separately or netted?)
        // Architecture says: refunds have positive amount, kind='refund', so they reduce spending if we sum them?
        // Wait, refunds usually come in as positive income-like or negative expense-like?
        // If refund is positive amount (credit), and we want net spending:
        // Net Spending = (Sum of Expenses) - (Sum of Refunds)
        // Let's check the architecture: "Refunds: - from spending (credit back)"
        // If refund is stored as positive amount (credit), we subtract it.
        // If refund is stored as negative amount (like expense), we add it?
        // Convention: Expenses are negative, Income is positive.
        // So `getTotalSpending` usually returns a positive magnitude of spending.
        // Let's assume input amounts: Expense = -100, Income = +1000.
        // Refund = +100.
        // Total Spending = abs(-100) - (+100) = 0?
        // Or do we just sum raw amounts and take abs?
        // Let's stick to the architecture:
        // "getTotalSpending: return transactions.filter(expense/sub/fee).reduce(sum + abs(amount))"
        // And Refunds? "Refunds: - from spending".
        // So we should subtract refunds from the total spending magnitude.
        .reduce((sum, t) => sum + Math.abs(t.amount), 0)
        - getRefundTotal(transactions);
};

const getRefundTotal = (transactions: Transaction[]): number => {
    return transactions
        .filter(t => t.kind === 'refund')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
};

export const getFeeTotals = (transactions: Transaction[]): number => {
    return transactions
        .filter(t => t.kind === 'fee')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
};

export const getCategoryTotals = (transactions: Transaction[]): Map<string, number> => {
    return transactions
        .filter(t =>
            t.kind !== 'income' &&
            !isInternalTransfer(t) &&
            t.kind !== 'refund' // Exclude refunds from category totals? Or net them?
            // Usually we want category totals to reflect net spending.
            // If I bought $100 shoes and returned them, Clothing spend should be 0.
            // But if we filter out refunds here, we can't net them.
            // Let's handle refunds by category if possible.
            // For now, following architecture: "expense, subscription".
        )
        .reduce((map, t) => {
            const current = map.get(t.category) ?? 0;
            // If it's a refund, it should reduce the total.
            // But we filtered out refunds above.
            // Let's stick to the simple version first: Gross spending per category.
            // Architecture says: "map.set(t.category, current + Math.abs(t.amount))"
            map.set(t.category, current + Math.abs(t.amount));
            return map;
        }, new Map<string, number>());
};

// --- Cashflow ---

export interface DailyCashflow {
    date: string; // YYYY-MM-DD
    income: number;
    expense: number;
    net: number;
}

export const getDailyCashflowBuckets = (transactions: Transaction[]): DailyCashflow[] => {
    const buckets = new Map<string, DailyCashflow>();

    transactions.forEach(t => {
        if (isInternalTransfer(t)) return;

        // Normalize date to string YYYY-MM-DD (assuming t.date is ISO string)
        const dateKey = t.date.split('T')[0];

        const bucket = buckets.get(dateKey) ?? { date: dateKey, income: 0, expense: 0, net: 0 };

        if (t.kind === 'income') {
            bucket.income += t.amount;
            bucket.net += t.amount;
        } else if (t.kind === 'expense' || t.kind === 'subscription' || t.kind === 'fee' || t.kind === 'transferExternal') {
            const absAmount = Math.abs(t.amount);
            bucket.expense += absAmount;
            bucket.net -= absAmount; // Net decreases with expense
        } else if (t.kind === 'refund') {
            // Refund increases net, decreases effective expense?
            // Or counts as income?
            // Let's treat refund as positive net impact, effectively income for cashflow purposes
            // or negative expense.
            // Let's add to income for visualization simplicity, or subtract from expense?
            // Architecture didn't specify refund placement in cashflow.
            // Let's treat as "income" (inflow) for cashflow chart.
            bucket.income += t.amount;
            bucket.net += t.amount;
        }

        buckets.set(dateKey, bucket);
    });

    return Array.from(buckets.values()).sort((a, b) => a.date.localeCompare(b.date));
};

// --- Transfer Pairing ---

export interface TransferPair {
    outbound: Transaction | null;
    inbound: Transaction | null;
}

export const pairInternalTransfers = (transactions: Transaction[]): TransferPair[] => {
    const internal = transactions.filter(isInternalTransfer);
    const outbound = internal.filter(t => t.amount < 0);
    const inbound = internal.filter(t => t.amount > 0);

    // Create a mutable copy of inbound to "consume" matches
    const availableInbound = [...inbound];
    const pairs: TransferPair[] = [];

    outbound.forEach(out => {
        // Find matching inbound: same amount (abs), same date (approx?), logic says same day
        // And ideally matching accounts if we had that data reliable.
        // For now, match by amount and date.
        const matchIndex = availableInbound.findIndex(inc =>
            Math.abs(inc.amount) === Math.abs(out.amount) &&
            inc.date === out.date // Exact date match for generated data
        );

        if (matchIndex !== -1) {
            pairs.push({ outbound: out, inbound: availableInbound[matchIndex] });
            availableInbound.splice(matchIndex, 1);
        } else {
            pairs.push({ outbound: out, inbound: null });
        }
    });

    // Remaining inbound are orphans
    availableInbound.forEach(inc => {
        pairs.push({ outbound: null, inbound: inc });
    });

    return pairs;
};

// --- Phase 2.2: Centralized Summary Metrics ---

/**
 * Summary metrics interface for Dashboard and Overview consistency.
 * These are the 5 key metrics shown in summary boxes on both pages.
 */
export interface SummaryMetrics {
    income: number;           // Total income
    spending: number;         // Total spending (excluding internal transfers)
    netCashFlow: number;      // Income minus spending  
    subscriptionTotal: number; // Total subscriptions
    feeTotal: number;         // Total fees
}

/**
 * Phase 2.2 transaction-math: Compute all summary metrics from a filtered transaction list.
 * This is the single source of truth for Dashboard and Overview summary boxes.
 * 
 * @param transactions - Pre-filtered transactions (e.g., by date range)
 * @returns SummaryMetrics object with all 5 key values
 */
export const computeSummaryMetrics = (transactions: Transaction[]): SummaryMetrics => {
    const income = getNetIncome(transactions);
    const spending = getTotalSpending(transactions);
    const subscriptionTotal = transactions
        .filter(t => t.kind === 'subscription' || t.isSubscription)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const feeTotal = getFeeTotals(transactions);

    return {
        income,
        spending,
        netCashFlow: income - spending,
        subscriptionTotal,
        feeTotal
    };
};

// --- Phase 2.3: Budget Car Insurance Box ---

/**
 * Phase 2.3 car-insurance-box: Compute monthly car insurance spending.
 * 
 * @param transactions - Transactions filtered to the active view range
 * @param viewStart - Start date of the view range
 * @param viewEnd - End date of the view range
 * @param carInsurancemerchants - Array of car insurance merchant names from canonical pool
 * @returns Normalized monthly car insurance spend
 */
export const computeCarInsuranceMonthlySpend = (
    transactions: Transaction[],
    viewStart: Date,
    viewEnd: Date,
    carInsuranceMerchants: string[]
): number => {
    // Normalize merchant names for case-insensitive matching
    const normalizedPool = carInsuranceMerchants.map(m => m.toLowerCase().trim());

    // Filter transactions matching car insurance merchants
    const carInsuranceTransactions = transactions.filter(t => {
        const merchantName = (t.merchantName || t.description || '').toLowerCase().trim();
        return normalizedPool.some(poolMerchant => merchantName.includes(poolMerchant));
    });

    // Sum total car insurance spending (all amounts are negative for expenses)
    const totalSpend = carInsuranceTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);

    // Normalize to monthly estimate based on view range
    const startNormalized = new Date(viewStart.getFullYear(), viewStart.getMonth(), viewStart.getDate());
    const endNormalized = new Date(viewEnd.getFullYear(), viewEnd.getMonth(), viewEnd.getDate());

    // Calculate days in range (inclusive)
    const daysInRange = Math.ceil((endNormalized.getTime() - startNormalized.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // If range is roughly one month (28-31 days), use total directly
    if (daysInRange >= 28 && daysInRange <= 31) {
        return totalSpend;
    }

    // Otherwise, normalize to 30-day average
    const dailyAverage = totalSpend / daysInRange;
    return dailyAverage * 30;
};


