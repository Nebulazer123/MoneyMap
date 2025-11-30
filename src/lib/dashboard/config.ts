// Centralized dashboard config: tabs, localStorage keys, option lists, and display metadata (categories, accounts, overview groups, guideline targets) used across dashboard helpers/components.
import { categoryEmojis as categoryEmojiMap } from "../fakeData";

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

export const categoryOptions = [
  "Income",
  "Rent",
  "Groceries",
  "Dining",
  "Subscriptions",
  "Utilities",
  "Transport",
  "Fees",
  "Transfer",
  "Other",
] as const;

export const categoryEmojis = {
  ...categoryEmojiMap,
  Rent: "🏘️",
  Groceries: "🛍️",
  Dining: "🍣",
  Transport: "🚙",
  Subscriptions: "♾️",
  Utilities: "⚡",
  "Bills & services": "📋",
  Fees: "💰",
  Other: "✨",
  Insurance: "🔒",
  Loans: "🏛️",
  Education: "📚",
  Transfer: "🔄",
};

export const displayCategoryLabels: Record<string, string> = {
  Transport: "Auto",
  "Bills & services": "Bills & services",
  Insurance: "Insurance",
  Loans: "Loans",
  Education: "Education",
};

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
    color: "#f97316",
    emoji: categoryEmojis.Rent,
  },
  groceries_dining: {
    label: "Groceries and dining",
    categories: ["Groceries", "Dining"],
    color: "#22d3ee",
    emoji: categoryEmojis.Groceries,
  },
  auto: {
    label: "Auto",
    categories: ["Transport"],
    color: "#0ea5e9",
    emoji: categoryEmojis.Transport,
  },
  subscriptions: {
    label: "Subscriptions",
    categories: ["Subscriptions"],
    color: "#c084fc",
    emoji: categoryEmojis.Subscriptions,
  },
  insurance: {
    label: "Insurance",
    categories: ["Insurance"],
    color: "#22c55e",
    emoji: categoryEmojis.Insurance,
  },
  bills_services: {
    label: "Bills and services",
    categories: ["Bills & services", "Bills"],
    color: "#38bdf8",
    emoji: categoryEmojis["Bills & services"],
  },
  education: {
    label: "Education",
    categories: ["Education"],
    color: "#3b82f6",
    emoji: categoryEmojis.Education,
  },
  transfers: {
    label: "Transfers",
    categories: ["Transfer"],
    color: "#f59e0b",
    emoji: categoryEmojis.Transfer,
  },
  other_fees: {
    label: "Other including fees",
    categories: ["Fees", "Other", "Loans"],
    color: "#a855f7",
    emoji: categoryEmojis.Other,
  },
};

export const transportGuideline = 15;
export const internetGuideline = 5;
