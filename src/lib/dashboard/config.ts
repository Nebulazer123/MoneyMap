// Centralized dashboard config: tabs, localStorage keys, option lists, and display metadata (categories, accounts, overview groups, guideline targets) used across dashboard helpers/components.
import { categoryEmojis as categoryEmojiMap } from "../fakeData";

export type TabId = "overview" | "recurring" | "fees" | "cashflow" | "review";

export const tabs: { id: TabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "recurring", label: "Recurring charges" },
  { id: "fees", label: "Fees" },
  { id: "cashflow", label: "Daily cash flow" },
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
  "Other",
] as const;

export const categoryEmojis = {
  ...categoryEmojiMap,
  "Bills & services": "??",
  Insurance: "???",
  Loans: "??",
  Education: "??",
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
  | "rentUtilities"
  | "groceriesDining"
  | "transport"
  | "subscriptions"
  | "insurance"
  | "loans"
  | "education"
  | "billsServices"
  | "otherFees";

export const overviewGroupMeta: Record<
  OverviewGroupKey,
  { label: string; categories: string[]; color: string; emoji: string }
> = {
  rentUtilities: {
    label: "Rent and utilities",
    categories: ["Rent", "Utilities"],
    color: "#f97316",
    emoji: categoryEmojis.Rent,
  },
  groceriesDining: {
    label: "Groceries and dining",
    categories: ["Groceries", "Dining"],
    color: "#22d3ee",
    emoji: categoryEmojis.Groceries,
  },
  transport: {
    label: "Transport",
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
  loans: {
    label: "Loans",
    categories: ["Loans"],
    color: "#f43f5e",
    emoji: categoryEmojis.Loans,
  },
  education: {
    label: "Education",
    categories: ["Education"],
    color: "#3b82f6",
    emoji: categoryEmojis.Education,
  },
  billsServices: {
    label: "Bills & services",
    categories: ["Bills & services", "Bills"],
    color: "#10b981",
    emoji: categoryEmojis["Bills & services"],
  },
  otherFees: {
    label: "Other including fees",
    categories: ["Fees", "Other"],
    color: "#fbbf24",
    emoji: categoryEmojis.Other,
  },
};

export const transportGuideline = 15;
export const internetGuideline = 5;
