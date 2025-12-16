

export type TabId = "overview" | "recurring" | "fees" | "cashflow" | "review";

export const tabs: { id: TabId; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "recurring", label: "Recurring" },
    { id: "fees", label: "Fees" },
    { id: "cashflow", label: "Cash flow" },
    { id: "review", label: "Review" },
];

export const STORAGE_TAB_KEY = "moneymap_active_tab";
export const STORAGE_FLOW_KEY = "moneymap_dashboard_flow";
export const STORAGE_STATEMENT_KEY = "moneymap_dashboard_statement";
export const STORAGE_MONTH_FROM_KEY = "moneymap_month_from";
export const STORAGE_YEAR_FROM_KEY = "moneymap_year_from";
export const STORAGE_MONTH_TO_KEY = "moneymap_month_to";
export const STORAGE_YEAR_TO_KEY = "moneymap_year_to";
export const STORAGE_DUPLICATE_DECISIONS_KEY = "moneymap_duplicate_decisions";
export const LEGACY_STORAGE_MONTH_KEY = "moneymap_month";
export const LEGACY_STORAGE_YEAR_KEY = "moneymap_year";
export const STORAGE_OWNERSHIP_MODES_KEY = "moneymap_ownership_modes";
export const STORAGE_CUSTOM_ACCOUNTS_KEY = "moneymap_custom_accounts";
export const STORAGE_ACCOUNT_OVERRIDES_KEY = "moneymap_account_overrides";
export const STORAGE_HIDDEN_ACCOUNTS_KEY = "moneymap_hidden_accounts";

export const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
] as const;

export const accountTypeLabels: Record<string, string> = {
    navy_checking: "Checking",
    cash_app: "Wallet",
    visa_debit: "Debit card",
};

export const accountTypeOptions = [
    "Checking",
    "Savings",
    "Debit card",
    "Credit card",
    "Loan",
    "Mortgage",
    "Wallet",
    "Other",
] as const;

export type OverviewGroupKey =
    | "rent_utils"
    | "stores_shopping"
    | "dining"
    | "auto"
    | "subscriptions"
    | "insurance"
    | "credit_loans"
    | "transfers"
    | "other_fees";

export const overviewGroupOrder: OverviewGroupKey[] = [
    "rent_utils",
    "stores_shopping",
    "dining",
    "auto",
    "subscriptions",
    "insurance",
    "credit_loans",
    "transfers",
    "other_fees",
];

export const categoryEmojis: Record<string, string> = {
    Rent: "🏠",
    Groceries: "🏪",
    Dining: "🍽",
    Transport: "🚌",
    Subscriptions: "📺",
    Utilities: "💡",
    Phone: "📱",
    Fees: "💸",
    Insurance: "🛡️",
    Shopping: "🛒",
    Transfer: "💸",
    Other: "📦",
    Loans: "💳",
};

export const overviewGroupMeta: Record<
    OverviewGroupKey,
    { label: string; categories: string[]; color: string; emoji: string }
> = {
    rent_utils: {
        label: "Rent and utilities",
        categories: ["Rent", "Mortgage", "Utilities", "Phone"],
        color: "#f97316", // Ember Orange
        emoji: categoryEmojis.Rent,
    },
    stores_shopping: {
        label: "Stores & shopping",
        categories: ["Groceries", "Shopping"],
        color: "#06b6d4", // Cyan Brilliant
        emoji: categoryEmojis.Shopping,
    },
    dining: {
        label: "Dining",
        categories: ["Dining"],
        color: "#db2777", // Pink/Magenta - distinct from Shopping
        emoji: categoryEmojis.Dining,
    },
    auto: {
        label: "Auto",
        categories: ["Transport"],
        color: "#3b82f6", // Sapphire Blue
        emoji: categoryEmojis.Transport,
    },
    subscriptions: {
        label: "Subscriptions",
        categories: ["Subscriptions"],
        color: "#a855f7", // Vivid Purple
        emoji: categoryEmojis.Subscriptions,
    },
    insurance: {
        label: "Insurance",
        categories: ["Insurance"],
        color: "#22c55e", // Emerald Green
        emoji: categoryEmojis.Insurance,
    },
    credit_loans: {
        label: "Credit / Loan payments",
        categories: ["Loans"],
        color: "#6366f1", // Indigo Glow
        emoji: categoryEmojis.Loans,
    },
    transfers: {
        label: "Transfers",
        categories: ["Transfer"],
        color: "#eab308", // Gold Stream
        emoji: categoryEmojis.Transfer,
    },
    other_fees: {
        label: "Other & fees",
        categories: ["Fees", "Other"],
        color: "#f43f5e", // Rose Fire
        emoji: categoryEmojis.Other,
    },
};

export const transportGuideline = 15;
export const internetGuideline = 5;
