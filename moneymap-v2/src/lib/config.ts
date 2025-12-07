

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
    | "groceries_dining"
    | "auto"
    | "subscriptions"
    | "insurance"
    | "bills_services"
    | "education"
    | "transfers"
    | "other_fees";

export const overviewGroupOrder: OverviewGroupKey[] = [
    "rent_utils",
    "groceries_dining",
    "auto",
    "subscriptions",
    "insurance",
    "bills_services",
    "education",
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
    "Bills & services": "🧾",
    Fees: "💸",
    Insurance: "🛡️",
    Education: "🛍️",
    Transfer: "💸",
    Other: "📦",
};

export const overviewGroupMeta: Record<
    OverviewGroupKey,
    { label: string; categories: string[]; color: string; emoji: string }
> = {
    rent_utils: {
        label: "Rent and utilities",
        categories: ["Rent", "Mortgage", "Utilities"],
        color: "#f97316", // Ember Orange - warm essential spending
        emoji: categoryEmojis.Rent,
    },
    groceries_dining: {
        label: "Stores and dining",
        categories: ["Groceries", "Dining"],
        color: "#06b6d4", // Cyan Brilliant - vibrant daily spending
        emoji: categoryEmojis.Groceries,
    },
    auto: {
        label: "Auto",
        categories: ["Transport"],
        color: "#3b82f6", // Sapphire Blue - clear transportation
        emoji: categoryEmojis.Transport,
    },
    subscriptions: {
        label: "Subscriptions",
        categories: ["Subscriptions"],
        color: "#a855f7", // Vivid Purple - digital services
        emoji: categoryEmojis.Subscriptions,
    },
    insurance: {
        label: "Insurance",
        categories: ["Insurance"],
        color: "#22c55e", // Emerald Green - protective
        emoji: categoryEmojis.Insurance,
    },
    bills_services: {
        label: "Phone",
        categories: ["Phone"],
        color: "#6366f1", // Indigo Glow - steady obligations
        emoji: "📱",
    },
    education: {
        label: "Shopping",
        categories: ["Shopping"],
        color: "#c026d3", // Magenta Pulse - retail
        emoji: "🛒",
    },
    transfers: {
        label: "Transfers",
        categories: ["Transfer"],
        color: "#eab308", // Gold Stream - money movement
        emoji: categoryEmojis.Transfer,
    },
    other_fees: {
        label: "Other including fees",
        categories: ["Fees", "Other", "Loans"],
        color: "#f43f5e", // Rose Fire - miscellaneous
        emoji: categoryEmojis.Other,
    },
};

export const transportGuideline = 15;
export const internetGuideline = 5;
