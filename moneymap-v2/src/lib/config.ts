import { categoryEmojis } from "./fakeData";

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

export const overviewGroupMeta: Record<
    OverviewGroupKey,
    { label: string; categories: string[]; color: string; emoji: string }
> = {
    rent_utils: {
        label: "Rent and utilities",
        categories: ["Rent", "Utilities"],
        color: "#fb923c", // Orange-400
        emoji: categoryEmojis.Rent,
    },
    groceries_dining: {
        label: "Groceries and dining",
        categories: ["Groceries", "Dining"],
        color: "#2dd4bf", // Teal-400
        emoji: categoryEmojis.Groceries,
    },
    auto: {
        label: "Auto",
        categories: ["Transport", "Auto"],
        color: "#38bdf8", // Sky-400
        emoji: categoryEmojis.Transport,
    },
    subscriptions: {
        label: "Subscriptions",
        categories: ["Subscriptions"],
        color: "#c084fc", // Purple-400
        emoji: categoryEmojis.Subscriptions,
    },
    insurance: {
        label: "Insurance",
        categories: ["Insurance", "Health"],
        color: "#4ade80", // Green-400
        emoji: categoryEmojis.Insurance,
    },
    bills_services: {
        label: "Bills and services",
        categories: ["Bills & services"],
        color: "#60a5fa", // Blue-400
        emoji: categoryEmojis["Bills & services"],
    },
    education: {
        label: "Education",
        categories: ["Education"],
        color: "#818cf8", // Indigo-400
        emoji: categoryEmojis.Education,
    },
    transfers: {
        label: "Transfers",
        categories: ["Transfer"],
        color: "#facc15", // Yellow-400
        emoji: categoryEmojis.Transfer,
    },
    other_fees: {
        label: "Other including fees",
        categories: ["Fees", "Other", "Loans"],
        color: "#e879f9", // Fuchsia-400
        emoji: categoryEmojis.Other,
    },
};

export const transportGuideline = 15;
export const internetGuideline = 5;

export { categoryEmojis };
