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
    includeInNetWorth?: boolean;
}

export interface Transaction {
    id: string;
    date: string; // ISO 8601 YYYY-MM-DD
    amount: number;
    description: string;
    merchantName?: string;
    category: string;
    kind: TransactionKind;
    accountId: string;

    // Legacy support
    source: string;
    target?: string;
    sourceKey?: string;
    targetKey?: string;

    // Recurring & Subscription flags
    isRecurring?: boolean;
    isSubscription?: boolean;
    notes?: string;

    // Phase 2: Suspicious Detection Fields
    isSuspicious?: boolean;
    suspiciousType?: 'duplicate' | 'overcharge' | 'unexpected';
    suspiciousReason?: string;
    parentId?: string; // ID of the "normal" transaction this one mimics or relates to
    patternFingerprint?: string;
    userReviewed?: boolean;
    userVerdict?: 'ok' | 'fraud';
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

// --- Phase 2 New Types ---

export interface GlobalDateState {
    datasetStart: Date;
    datasetEnd: Date;
    viewStart: Date;
    viewEnd: Date;
    today: Date;
    lastGeneratedAt: number;
    profileId: string;
}

export interface SubscriptionPlan {
    merchant: string;
    displayName: string;
    amount: number;
    billingDay: number;
    frequency: 'monthly' | 'biweekly' | 'annual';
    planLabel?: string;
}

export interface BankMerchant {
    name: string;
    type: 'checking' | 'savings' | 'mmsa';
}

export interface P2PMerchant {
    name: string;
    app: string;
}

export interface CreditCardMerchant {
    issuer: string;
    name: string;
}

export interface UtilityMerchant {
    name: string;
    type: 'electric' | 'gas' | 'water' | 'internet' | 'combined';
}

export interface LifestyleProfile {
    id: string;
    createdAt: number;

    // Financial Accounts
    primaryBank: BankMerchant;
    secondaryBanks: BankMerchant[];
    p2pWallets: P2PMerchant[];
    creditCards: CreditCardMerchant[];
    investmentBrokerages: string[];
    cryptoExchanges: string[];

    // Housing
    housingType: 'rent' | 'mortgage';
    housingProvider: string;

    // Utilities + Bills
    utilities: UtilityMerchant[];
    phoneCarrier: string;
    internetProvider: string;

    // Insurance
    autoInsurance: string;
    healthInsurance: string;
    homeOrRentersInsurance: string;
    lifeInsurance: string | null;

    // Loans
    carLender: string | null;
    studentLoanServicer: string | null;
    otherLoans: string[];

    // Subscriptions
    streamingServices: SubscriptionPlan[];
    musicService: SubscriptionPlan;
    cloudStorage: SubscriptionPlan[];
    gym: SubscriptionPlan | null;
    softwareSubscriptions: SubscriptionPlan[];

    // Daily Spending Merchants
    groceryStores: string[];
    fastFoodSpots: string[];
    coffeeShops: string[];
    casualDining: string[];
    gasStations: string[];
    rideshareApps: string[];
    foodDeliveryApps: string[];

    // Shopping
    retailStores: string[];
    onlineShops: string[];
    unknownMerchants: string[];
}

export type DescriptionStyle = 'visa_pos' | 'visa_online' | 'ach' | 'subscription' | 'p2p' | 'atm' | 'loan';

export interface MerchantMeta {
    name: string;
    displayName: string;
    preferredStyle: DescriptionStyle;
    typicalAmountRange: [number, number];
    category: string;
    chargeType: 'visa' | 'ach' | 'both';
    addLocationSuffix: boolean;
    addReferenceSuffix: boolean;
}
