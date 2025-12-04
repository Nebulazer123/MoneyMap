export type TransactionKind =
    | 'income'
    | 'expense'
    | 'subscription'
    | 'fee'
    | 'transferInternal'
    | 'transferExternal'
    | 'refund';

export type OwnershipMode = 'spending' | 'payment' | 'notMine';

export interface Account {
    id: string;
    name: string;
    type: 'checking' | 'savings' | 'credit' | 'investment' | 'loan' | 'other' | 'wallet';
    balance: number;
    last4?: string;
    institution?: string;
    color?: string;
    ownershipMode?: OwnershipMode;
    matchedTransactionIds?: string[];
}

export interface Transaction {
    id: string;
    date: string; // ISO 8601 YYYY-MM-DD
    amount: number;
    description: string;
    merchantName?: string;
    category: string;
    kind: TransactionKind; // Replaces 'type' for more granularity
    accountId: string; // The primary account this transaction belongs to (if applicable)

    // Legacy support for transfers and detailed tracking
    source: string;
    target?: string;
    sourceKey?: string;
    targetKey?: string;

    isRecurring?: boolean;
    isSubscription?: boolean;
    notes?: string;
}

export interface Category {
    id: string;
    name: string;
    type: 'income' | 'expense';
    color?: string;
    budget?: number;
}

export interface DateRange {
    from: Date;
    to: Date;
}

export interface BudgetGuidanceItem {
    category: string;
    name: string;
    actual: number;
    actualAmount: number;
    recommendedMax: number;
    recommendedAmount: number;
    delta: number;
    differenceAmount: number;
    differenceDirection: "over" | "under";
}
