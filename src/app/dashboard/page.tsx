"use client"
import { useCallback, useEffect, useMemo, useRef, useState, startTransition } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import {
  generateSampleStatement,
  getNetThisMonth,
  getTotalFees,
  getTotalIncome,
  getTotalSpending,
  getTotalSubscriptions,
  getSubscriptionTransactions,
  getFeeTransactions,
  getSpendingByCategory,
  getCashFlowByDate,
  getSummaryStats,
  getBudgetGuidance,
  getTransactionsByCategory,
  getTransferAccounts,
  transactions,
  Transaction,
  OwnershipMap,
  OwnershipMode,
  TransferAccount,
  isInternalTransfer,
  getRecurringDuplicateIds,
  parseInstitutionAndLast4,
} from "../../lib/fakeData";
type TabId = "overview" | "recurring" | "fees" | "cashflow" | "review";
const tabs: { id: TabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "recurring", label: "Recurring" },
  { id: "fees", label: "Fees" },
  { id: "cashflow", label: "Daily cash flow" },
  { id: "review", label: "Review" },
];
const STORAGE_TAB_KEY = "moneymap_active_tab";
const STORAGE_FLOW_KEY = "moneymap_dashboard_flow";
const STORAGE_STATEMENT_KEY = "moneymap_dashboard_statement";
const STORAGE_MONTH_FROM_KEY = "moneymap_month_from";
const STORAGE_YEAR_FROM_KEY = "moneymap_year_from";
const STORAGE_MONTH_TO_KEY = "moneymap_month_to";
const STORAGE_YEAR_TO_KEY = "moneymap_year_to";
const LEGACY_STORAGE_MONTH_KEY = "moneymap_month";
const LEGACY_STORAGE_YEAR_KEY = "moneymap_year";
const STORAGE_OWNERSHIP_MODES_KEY = "moneymap_ownership_modes";
const STORAGE_CUSTOM_ACCOUNTS_KEY = "moneymap_custom_accounts";
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const categoryOptions = [
  "Income",
  "Rent",
  "Groceries",
  "Dining",
  "Subscriptions",
  "Utilities",
  "Transport",
  "Fees",
  "Other",
];
const categoryEmojis: Record<string, string> = {
  Rent: "🏠",
  Groceries: "🛒",
  Dining: "🍽",
  Transport: "🚌",
  Subscriptions: "📺",
  Utilities: "💡",
  Fees: "💸",
  Other: "🧾",
};
const accountTypeLabels: Record<string, string> = {
  navy_checking: "Checking",
  cash_app: "Wallet",
  visa_debit: "Debit card",
};
const accountTypeOptions = [
  "Checking",
  "Savings",
  "Debit card",
  "Credit card",
  "Loan",
  "Mortgage",
  "Wallet",
  "Other",
];
const createDefaultOwnershipModes = (accounts: TransferAccount[]) => {
  try {
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem(STORAGE_OWNERSHIP_MODES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Record<string, OwnershipMode>;
        if (parsed && typeof parsed === "object") {
          return parsed;
        }
      }
    }
  } catch {
    // ignore bad data
  }
  return Object.fromEntries(
    accounts.map((acc) => [acc.id, acc.ownedByDefault ? ("spending" as OwnershipMode) : "notMine"]),
  );
};
const deriveOwnershipFromModes = (modes: Record<string, OwnershipMode>): OwnershipMap =>
  Object.fromEntries(
    Object.entries(modes).map(([id, mode]) => [id, mode === "spending" || mode === "payment"]),
  );
const getAccountTypeLabel = (account: TransferAccount) =>
  account.accountType ??
  accountTypeLabels[account.id] ??
  (account.label.toLowerCase().includes("credit") ? "Credit card" : "Other");
const descriptionKey = (description: string) =>
  description
    .toLowerCase()
    .split(/\s+/)
    .slice(0, 3)
    .join(" ")
    .trim();
const titleCase = (value: string) =>
  value
    .split(" ")
    .map((part) => (part ? `${part[0].toUpperCase()}${part.slice(1)}` : ""))
    .join(" ")
    .trim();
const loadCustomAccounts = (): TransferAccount[] => {
  try {
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem(STORAGE_CUSTOM_ACCOUNTS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as TransferAccount[];
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    }
  } catch {
    // ignore bad data
  }
  return [];
};
type AddTransactionRowProps = {
  rangeStartMonth: number;
  rangeStartYear: number;
  rangeEndMonth: number;
  rangeEndYear: number;
  onAdd: (details: {
    date: string;
    description: string;
    category: string;
    amount: string;
  }) => boolean;
};
function AddTransactionRow({
  rangeStartMonth,
  rangeStartYear,
  rangeEndMonth,
  rangeEndYear,
  onAdd,
}: AddTransactionRowProps) {
  const [date, setDate] = useState(
    `${rangeStartYear}-${String(rangeStartMonth + 1).padStart(2, "0")}-01`,
  );
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Groceries");
  const [amount, setAmount] = useState<string>("-25.00");
  useEffect(() => {
    setDate(`${rangeStartYear}-${String(rangeStartMonth + 1).padStart(2, "0")}-01`);
  }, [rangeStartMonth, rangeStartYear]);
  const minDate = `${rangeStartYear}-${String(rangeStartMonth + 1).padStart(2, "0")}-01`;
  const maxDay = new Date(Date.UTC(rangeEndYear, rangeEndMonth + 1, 0)).getUTCDate();
  const maxDate = `${rangeEndYear}-${String(rangeEndMonth + 1).padStart(2, "0")}-${String(maxDay).padStart(2, "0")}`;
  const handleAdd = () => {
    const success = onAdd({
      date,
      description,
      category,
      amount,
    });
    if (success) {
      setDescription("");
      setAmount("-25.00");
    }
  };
  return (
    <div className="grid grid-cols-4 items-center gap-2 text-xs text-zinc-200 sm:text-sm">
      <input
        type="date"
        className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-white outline-none"
        value={date}
        min={minDate}
        max={maxDate}
        onChange={(e) => setDate(e.target.value)}
      />
      <input
        type="text"
        className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-white outline-none"
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <select
        className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-white outline-none"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
      >
        {categoryOptions.map((cat) => (
          <option key={cat} value={cat}>
            {cat}
          </option>
        ))}
      </select>
      <div className="flex items-center justify-end gap-2">
        <input
          type="number"
          step="0.01"
          className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-right text-xs text-white outline-none"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <button
          type="button"
          onClick={handleAdd}
          className="rounded-full border border-zinc-700 px-2 py-1 text-[11px] font-semibold text-white transition hover:border-zinc-500 hover:bg-zinc-800"
        >
          Add
        </button>
      </div>
    </div>
  );
}
type OverviewGroupKey =
  | "rentUtilities"
  | "groceriesDining"
  | "transport"
  | "subscriptions"
  | "otherFees";
const overviewGroupMeta: Record<
  OverviewGroupKey,
  { label: string; categories: string[]; color: string; emoji: string }
> = {
  rentUtilities: {
    label: "Rent and utilities",
    categories: ["Rent", "Utilities", "Bills & services", "Bills"],
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
  otherFees: {
    label: "Other including fees",
    categories: ["Fees", "Other"],
    color: "#f43f5e",
    emoji: categoryEmojis.Other,
  },
};
function InfoTip({ label }: { label: string }) {
  return (
    <div className="group relative inline-flex">
      <button
        type="button"
        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-zinc-600 text-xs text-zinc-300 transition hover:border-zinc-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-zinc-500"
      >
        i
      </button>
      <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 hidden w-64 -translate-x-1/2 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs leading-relaxed text-zinc-100 shadow-lg whitespace-pre-line group-hover:block group-focus-within:block">
        {label}
      </span>
    </div>
  );
}
export default function DemoPage() {
  const [flowStep, setFlowStep] = useState<"idle" | "statement" | "analyzing" | "results">("idle");
  const [fullStatementTransactions, setFullStatementTransactions] = useState<Transaction[]>([]);
  const [showStatement, setShowStatement] = useState(true);
  const analyzeTimeoutRef = useRef<number | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [activeOverviewCategory, setActiveOverviewCategory] =
    useState<string>("Rent");
  const [activeSpendingGroup, setActiveSpendingGroup] =
    useState<OverviewGroupKey | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [expandedCashflowDates, setExpandedCashflowDates] = useState<Record<string, boolean>>(
    {},
  );
  const [showLargestExpenseDetail, setShowLargestExpenseDetail] = useState(false);
  const baseSampleDate = useMemo(
    () => new Date(transactions[0]?.date ?? new Date()),
    [],
  );
  const lastGeneratedRangeRef = useRef<string | null>(null);
   const hasTouchedRangeRef = useRef(false);
  const [selectedMonthFrom, setSelectedMonthFrom] = useState<number>(baseSampleDate.getUTCMonth());
  const [selectedYearFrom, setSelectedYearFrom] = useState<number>(baseSampleDate.getUTCFullYear());
  const [selectedMonthTo, setSelectedMonthTo] = useState<number>(baseSampleDate.getUTCMonth());
  const [selectedYearTo, setSelectedYearTo] = useState<number>(baseSampleDate.getUTCFullYear());
  const baseTransferAccounts = useMemo(() => getTransferAccounts(), []);
  const [customAccounts, setCustomAccounts] = useState<TransferAccount[]>(() => loadCustomAccounts());
  const transferAccounts = useMemo(
    () => [...baseTransferAccounts, ...customAccounts],
    [baseTransferAccounts, customAccounts],
  );
  const initialOwnershipModes = useMemo(
    () => createDefaultOwnershipModes(transferAccounts),
    [transferAccounts],
  );
  const [ownershipModes, setOwnershipModes] = useState<Record<string, OwnershipMode>>(
    initialOwnershipModes,
  );
  const [ownership, setOwnership] = useState<OwnershipMap>(() =>
    deriveOwnershipFromModes(initialOwnershipModes),
  );
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [addAccountName, setAddAccountName] = useState("");
  const [addAccountType, setAddAccountType] = useState("Checking");
  const [addBaseTransactionId, setAddBaseTransactionId] = useState("");
  const [selectedAccountTxIds, setSelectedAccountTxIds] = useState<Set<string>>(new Set());
  useEffect(() => {
    setOwnership(deriveOwnershipFromModes(ownershipModes));
  }, [ownershipModes]);
  useEffect(() => {
    lastGeneratedRangeRef.current = null;
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_CUSTOM_ACCOUNTS_KEY, JSON.stringify(customAccounts));
    }
  }, [customAccounts]);
  const normalizedRange = useMemo(() => {
    const startValue = selectedYearFrom * 12 + selectedMonthFrom;
    const endValue = selectedYearTo * 12 + selectedMonthTo;
    if (startValue <= endValue) {
      return {
        start: { month: selectedMonthFrom, year: selectedYearFrom },
        end: { month: selectedMonthTo, year: selectedYearTo },
      };
    }
    return {
      start: { month: selectedMonthTo, year: selectedYearTo },
      end: { month: selectedMonthFrom, year: selectedYearFrom },
    };
  }, [selectedMonthFrom, selectedYearFrom, selectedMonthTo, selectedYearTo]);
  const rangeStartDateString = `${normalizedRange.start.year}-${String(normalizedRange.start.month + 1).padStart(2, "0")}-01`;
  const rangeEndDay = new Date(
    Date.UTC(normalizedRange.end.year, normalizedRange.end.month + 1, 0),
  ).getUTCDate();
  const rangeEndDateString = `${normalizedRange.end.year}-${String(normalizedRange.end.month + 1).padStart(2, "0")}-${String(rangeEndDay).padStart(2, "0")}`;
  const yearOptions = useMemo(() => {
    const baseYear = baseSampleDate.getUTCFullYear();
    const candidates = [
      baseYear,
      selectedYearFrom,
      selectedYearTo,
      selectedYearFrom - 1,
      selectedYearFrom + 1,
      selectedYearTo - 1,
      selectedYearTo + 1,
    ];
    return Array.from(new Set(candidates)).sort((a, b) => a - b);
  }, [baseSampleDate, selectedYearFrom, selectedYearTo]);
  // The full list stays in state/localStorage; filter only the view when in results.
  const statementTransactions = useMemo(() => {
    if (flowStep !== "results") {
      return fullStatementTransactions;
    }
    const startTimestamp = Date.parse(`${rangeStartDateString}T00:00:00Z`);
    const endTimestamp = Date.parse(`${rangeEndDateString}T23:59:59Z`);
    if (Number.isNaN(startTimestamp) || Number.isNaN(endTimestamp)) {
      return fullStatementTransactions;
    }
    return fullStatementTransactions.filter((tx) => {
      const ts = Date.parse(`${tx.date}T00:00:00Z`);
      if (Number.isNaN(ts)) return false;
      return ts >= startTimestamp && ts <= endTimestamp;
    });
  }, [flowStep, fullStatementTransactions, rangeEndDateString, rangeStartDateString]);
  const totalIncome = getTotalIncome(statementTransactions, ownership, ownershipModes);
  const totalSpending = getTotalSpending(statementTransactions, ownership, ownershipModes);
  const netThisMonth = getNetThisMonth(statementTransactions, ownership, ownershipModes);
  const totalSubscriptions = getTotalSubscriptions(statementTransactions, ownership, ownershipModes);
  const subscriptionRows = getSubscriptionTransactions(
    statementTransactions,
    ownership,
    ownershipModes,
  );
  const feeRows = getFeeTransactions(statementTransactions, ownership, ownershipModes);
  const cashFlowRows = getCashFlowByDate(statementTransactions, ownership, ownershipModes);
  const totalFees = getTotalFees(statementTransactions, ownership, ownershipModes);
  const recurringRows = statementTransactions.filter((t) => {
    if (isInternalTransfer(t, ownership, ownershipModes)) return false;
    const categoryLower = t.category.toLowerCase();
    const isSubscription = t.kind === "subscription";
    const isBillCategory =
      categoryLower === "utilities" || categoryLower === "bills & services" || categoryLower === "bills";
    const isPaymentDescription = /loan|mortgage|credit|card payment|car payment|auto payment|internet|wifi|phone|cable/i.test(
      t.description,
    );
    return isSubscription || isBillCategory || isPaymentDescription;
  });
  const recurringDuplicateIds = useMemo(
    () => getRecurringDuplicateIds(fullStatementTransactions, recurringRows),
    [fullStatementTransactions, recurringRows],
  );
  const transferTransactions = statementTransactions.filter((t) => t.kind.startsWith("transfer"));
  useEffect(() => {
    if (isAddingAccount && !addBaseTransactionId && transferTransactions.length > 0) {
      const first = transferTransactions[0];
      setAddBaseTransactionId(first.id);
    }
  }, [isAddingAccount, addBaseTransactionId, transferTransactions]);
  const categoryBreakdown = getSpendingByCategory(
    statementTransactions,
    ownership,
    ownershipModes,
  );
  const summaryStats = getSummaryStats(statementTransactions, ownership, ownershipModes);
  const budgetGuidance = getBudgetGuidance(statementTransactions, ownership, ownershipModes);
  const overviewTransactions = getTransactionsByCategory(
    activeOverviewCategory,
    statementTransactions,
    ownership,
    ownershipModes,
  );
  const transportSpend =
    categoryBreakdown.find((item) => item.category === "Transport")?.amount ?? 0;
  const transportPercent =
    totalIncome > 0 ? (Math.abs(transportSpend) / totalIncome) * 100 : 0;
  const internetRecurringSpend = subscriptionRows
    .filter((row) =>
      /internet|wifi|cable/i.test(row.description),
    )
    .reduce((sum, row) => sum + Math.abs(row.amount), 0);
  const internetPercent =
    totalIncome > 0 ? (internetRecurringSpend / totalIncome) * 100 : 0;
  const transportGuideline = 15;
  const internetGuideline = 5;
  const essentialsTotal = categoryBreakdown
    .filter((item) => ["Rent", "Utilities", "Groceries", "Fees"].includes(item.category))
    .reduce((sum, item) => sum + Math.abs(item.amount), 0);
  const essentialsPercent =
    totalIncome > 0 ? Math.min(100, Math.round((essentialsTotal / totalIncome) * 100)) : 0;
  const otherPercent = Math.max(0, 100 - essentialsPercent);
  const leftAfterBills = totalIncome - essentialsTotal;
  const currency = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });
  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const summaryCards = [
    { label: "Net this month", value: currency.format(netThisMonth), to: "review" as TabId },
    { label: "Total income", value: currency.format(totalIncome), to: "cashflow" as TabId },
    { label: "Total spending", value: currency.format(totalSpending), to: "overview" as TabId },
    { label: "Total subscriptions", value: currency.format(totalSubscriptions), to: "recurring" as TabId },
  ];
  const groupedSpendingData = (() => {
    const capturedCategories = new Set<string>();
    const groups: {
      id: OverviewGroupKey;
      label: string;
      value: number;
      categories: { name: string; amount: number }[];
      color: string;
      emoji: string;
    }[] = [];
    const categoryAmountMap = new Map<string, number>();
    categoryBreakdown.forEach((item) => {
      categoryAmountMap.set(item.category, Math.abs(item.amount));
    });
    (Object.entries(overviewGroupMeta) as [OverviewGroupKey, (typeof overviewGroupMeta)[OverviewGroupKey]][]).forEach(
      ([id, meta]) => {
        if (id === "otherFees") return;
        meta.categories.forEach((cat) => capturedCategories.add(cat));
        const categories = meta.categories
          .map((name) => ({ name, amount: categoryAmountMap.get(name) ?? 0 }))
          .filter((entry) => entry.amount > 0);
        const value = categories.reduce((sum, entry) => sum + entry.amount, 0);
        groups.push({
          id,
          label: meta.label,
          value,
          categories,
          color: meta.color,
          emoji: meta.emoji,
        });
      },
    );
    const otherCategories = categoryBreakdown.filter(
      (item) => !capturedCategories.has(item.category),
    );
    const otherValue = otherCategories.reduce(
      (sum, item) => sum + Math.abs(item.amount),
      0,
    );
    const otherCategoryDetails = otherCategories.map((item) => ({
      name: item.category,
      amount: Math.abs(item.amount),
    }));
    groups.push({
      id: "otherFees",
      label: overviewGroupMeta.otherFees.label,
      value: otherValue,
      categories: otherCategoryDetails,
      color: overviewGroupMeta.otherFees.color,
      emoji: overviewGroupMeta.otherFees.emoji,
    });
    const filtered = groups.filter((group) => group.value > 0);
    const total = filtered.reduce((sum, group) => sum + group.value, 0);
    return filtered.map((group) => ({
      ...group,
      percent: total > 0 ? Math.max(1, Math.round((group.value / total) * 100)) : 0,
    }));
  })();
  const resolvedActiveSpendingGroup =
    activeSpendingGroup && groupedSpendingData.some((group) => group.id === activeSpendingGroup)
      ? activeSpendingGroup
      : groupedSpendingData[0]?.id ?? null;
  const activeSpendingGroupDetails = groupedSpendingData.find(
    (group) => group.id === resolvedActiveSpendingGroup,
  );
  const getGroupIdFromEntry = (entry: unknown): OverviewGroupKey | null => {
    if (!entry || typeof entry !== "object") return null;
    const candidate = entry as { id?: string; payload?: { id?: string } };
    return (candidate.id ?? candidate.payload?.id ?? null) as OverviewGroupKey | null;
  };
  const handleSelectSpendingGroup = (groupId: OverviewGroupKey | null) => {
    if (!groupId) return;
    setActiveSpendingGroup(groupId);
  };
  const baseAccountParse = useMemo(() => {
    const baseTx = fullStatementTransactions.find((tx) => tx.id === addBaseTransactionId);
    if (!baseTx) return { institution: null as string | null, last4: null as string | null };
    return parseInstitutionAndLast4(baseTx.description);
  }, [addBaseTransactionId, fullStatementTransactions]);
  const suggestedAccountTransactions = useMemo(() => {
    if (!addBaseTransactionId) return [];
    const baseTx = fullStatementTransactions.find((tx) => tx.id === addBaseTransactionId);
    if (!baseTx) return [];
    const baseParsed = parseInstitutionAndLast4(baseTx.description);
    const baseKey = descriptionKey(baseTx.description);
    const keywordPattern = /(added|transfer|payment|to|from)/i;
    return fullStatementTransactions.filter((tx) => {
      if (tx.id === addBaseTransactionId) return true;
      const parsed = parseInstitutionAndLast4(tx.description);
      const descLower = tx.description.toLowerCase();
      const looksTransfer = keywordPattern.test(descLower);
      const last4Match =
        baseParsed.last4 !== null && parsed.last4 !== null && baseParsed.last4 === parsed.last4;
      const institutionMatch =
        baseParsed.institution !== null &&
        parsed.institution !== null &&
        baseParsed.institution === parsed.institution &&
        looksTransfer;
      const fallback =
        (baseParsed.institution === null && baseParsed.last4 === null) ||
        (parsed.institution === null && parsed.last4 === null);
      if (last4Match || institutionMatch) return true;
      if (fallback) {
        return descriptionKey(tx.description) === baseKey;
      }
      return false;
    });
  }, [addBaseTransactionId, fullStatementTransactions]);
  useEffect(() => {
    if (!addBaseTransactionId) {
      setSelectedAccountTxIds(new Set());
      return;
    }
    if (suggestedAccountTransactions.length > 0) {
      setSelectedAccountTxIds(new Set(suggestedAccountTransactions.map((tx) => tx.id)));
    } else {
      setSelectedAccountTxIds(new Set([addBaseTransactionId]));
    }
  }, [addBaseTransactionId, suggestedAccountTransactions]);
  useEffect(() => {
    if (!addBaseTransactionId) return;
    if (addAccountName.trim()) return;
    const parsed = baseAccountParse;
    if (parsed.institution) {
      setAddAccountName(titleCase(parsed.institution));
    }
  }, [addBaseTransactionId, baseAccountParse, addAccountName]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STORAGE_TAB_KEY) as TabId | null;
    if (stored && tabs.some((t) => t.id === stored)) {
      const id = window.requestAnimationFrame(() => setActiveTab(stored));
      return () => window.cancelAnimationFrame(id);
    }
  }, []);
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_TAB_KEY, activeTab);
  }, [activeTab]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedMonthFrom = window.localStorage.getItem(STORAGE_MONTH_FROM_KEY);
    const storedYearFrom = window.localStorage.getItem(STORAGE_YEAR_FROM_KEY);
    const storedMonthTo = window.localStorage.getItem(STORAGE_MONTH_TO_KEY);
    const storedYearTo = window.localStorage.getItem(STORAGE_YEAR_TO_KEY);
    const legacyMonth = window.localStorage.getItem(LEGACY_STORAGE_MONTH_KEY);
    const legacyYear = window.localStorage.getItem(LEGACY_STORAGE_YEAR_KEY);
    const parseNumber = (value: string | null) => {
      if (value === null) return null;
      const parsed = Number(value);
      return Number.isNaN(parsed) ? null : parsed;
    };
    const fallbackMonth = baseSampleDate.getUTCMonth();
    const fallbackYear = baseSampleDate.getUTCFullYear();
    const parsedFromMonth = parseNumber(storedMonthFrom) ?? parseNumber(legacyMonth);
    const parsedFromYear = parseNumber(storedYearFrom) ?? parseNumber(legacyYear);
    const parsedToMonth =
      parseNumber(storedMonthTo) ?? parseNumber(storedMonthFrom) ?? parseNumber(legacyMonth);
    const parsedToYear =
      parseNumber(storedYearTo) ?? parseNumber(storedYearFrom) ?? parseNumber(legacyYear);
    startTransition(() => {
      setSelectedMonthFrom(parsedFromMonth ?? fallbackMonth);
      setSelectedYearFrom(parsedFromYear ?? fallbackYear);
      setSelectedMonthTo(parsedToMonth ?? parsedFromMonth ?? fallbackMonth);
      setSelectedYearTo(parsedToYear ?? parsedFromYear ?? fallbackYear);
    });
  }, [baseSampleDate]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_MONTH_FROM_KEY, String(selectedMonthFrom));
    window.localStorage.setItem(STORAGE_YEAR_FROM_KEY, String(selectedYearFrom));
    window.localStorage.setItem(STORAGE_MONTH_TO_KEY, String(selectedMonthTo));
    window.localStorage.setItem(STORAGE_YEAR_TO_KEY, String(selectedYearTo));
  }, [selectedMonthFrom, selectedYearFrom, selectedMonthTo, selectedYearTo]);
  useEffect(() => {
    return () => {
      if (analyzeTimeoutRef.current !== null) {
        window.clearTimeout(analyzeTimeoutRef.current);
      }
    };
  }, []);
  const resetTab = useCallback(() => {
    setActiveTab("overview");
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_TAB_KEY, "overview");
    }
  }, []);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const flow = window.localStorage.getItem(STORAGE_FLOW_KEY) as
      | "idle"
      | "statement"
      | "analyzing"
      | "results"
      | null;
    const saved = window.localStorage.getItem(STORAGE_STATEMENT_KEY);
    if (flow && saved) {
      try {
        const parsed: Transaction[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          startTransition(() => {
            setFullStatementTransactions(parsed);
            if (flow === "statement" || flow === "results") {
              setFlowStep(flow);
              setShowStatement(flow === "results" ? false : true);
            }
          });
        }
      } catch {
        // ignore bad data
      }
    }
  }, []);
  const startStatement = useCallback(() => {
    const generated = generateSampleStatement(
      selectedMonthFrom,
      selectedYearFrom,
      selectedMonthTo,
      selectedYearTo,
    );
    lastGeneratedRangeRef.current = `${selectedYearFrom}-${selectedMonthFrom}:${selectedYearTo}-${selectedMonthTo}`;
    setFullStatementTransactions(generated);
    setFlowStep("statement");
    setShowStatement(true);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_FLOW_KEY, "statement");
      window.localStorage.setItem(
        STORAGE_STATEMENT_KEY,
        JSON.stringify(generated),
      );
    }
    resetTab();
  }, [resetTab, selectedMonthFrom, selectedMonthTo, selectedYearFrom, selectedYearTo]);
  const handleStart = () => {
    startStatement();
  };
  const handleRegenerate = () => {
    startStatement();
  };
  const handleAnalyze = () => {
    if (statementTransactions.length === 0) return;
    setFlowStep("analyzing");
    analyzeTimeoutRef.current = window.setTimeout(() => {
      setFlowStep("results");
      setShowStatement(false);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_FLOW_KEY, "results");
        window.localStorage.setItem(
          STORAGE_STATEMENT_KEY,
          JSON.stringify(fullStatementTransactions),
        );
      }
      analyzeTimeoutRef.current = null;
    }, 700);
  };
  const handleRestart = () => {
    if (analyzeTimeoutRef.current !== null) {
      window.clearTimeout(analyzeTimeoutRef.current);
      analyzeTimeoutRef.current = null;
    }
    setFlowStep("idle");
    setFullStatementTransactions([]);
    setShowStatement(true);
    setIsEditing(false);
    setSelectedMonthFrom(baseSampleDate.getUTCMonth());
    setSelectedYearFrom(baseSampleDate.getUTCFullYear());
    setSelectedMonthTo(baseSampleDate.getUTCMonth());
    setSelectedYearTo(baseSampleDate.getUTCFullYear());
    lastGeneratedRangeRef.current = null;
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_FLOW_KEY);
      window.localStorage.removeItem(STORAGE_STATEMENT_KEY);
      window.localStorage.removeItem(STORAGE_MONTH_FROM_KEY);
      window.localStorage.removeItem(STORAGE_YEAR_FROM_KEY);
      window.localStorage.removeItem(STORAGE_MONTH_TO_KEY);
      window.localStorage.removeItem(STORAGE_YEAR_TO_KEY);
      window.localStorage.removeItem(LEGACY_STORAGE_MONTH_KEY);
      window.localStorage.removeItem(LEGACY_STORAGE_YEAR_KEY);
    }
    resetTab();
  };
  const handleAddTransaction = (details: {
    date: string;
    description: string;
    category: string;
    amount: string;
  }): boolean => {
    const trimmedDescription = details.description.trim();
    const parsedAmount = Number(details.amount);
    if (!trimmedDescription || Number.isNaN(parsedAmount)) return false;
    const kind: Transaction["kind"] =
      details.category === "Income"
        ? "income"
        : details.category === "Subscriptions"
          ? "subscription"
          : details.category === "Fees"
            ? "fee"
            : "expense";
    const newTx: Transaction = {
      id: `manual_${Date.now()}`,
      date: details.date,
      description: trimmedDescription,
      amount: parsedAmount,
      category: details.category,
      kind,
      source: "Manual entry",
    };
    setFullStatementTransactions((prev) => {
      const updated = [...prev, newTx];
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_STATEMENT_KEY, JSON.stringify(updated));
        window.localStorage.setItem(
          STORAGE_FLOW_KEY,
          flowStep === "results" ? "results" : "statement",
        );
      }
      return updated;
    });
    return true;
  };
  useEffect(() => {
    const currentRangeKey = `${selectedYearFrom}-${selectedMonthFrom}:${selectedYearTo}-${selectedMonthTo}`;
    const startValue = selectedYearFrom * 12 + selectedMonthFrom;
    const endValue = selectedYearTo * 12 + selectedMonthTo;
    const isRangeValid = startValue <= endValue;
    if (flowStep === "results") {
      lastGeneratedRangeRef.current = currentRangeKey;
      return;
    }
    if (!isRangeValid) return;
    const hasStatement = fullStatementTransactions.length > 0;
    if (currentRangeKey === lastGeneratedRangeRef.current && hasStatement) return;
    startStatement();
  }, [
    selectedMonthFrom,
    selectedYearFrom,
    selectedMonthTo,
    selectedYearTo,
    flowStep,
    startStatement,
    fullStatementTransactions.length,
  ]);
  const handleToggleEditing = (force?: boolean) => {
    setIsEditing((prev) => {
      const next = typeof force === "boolean" ? force : !prev;
      setShowStatement(next ? true : false);
      return next;
    });
  };
  const handleSelectBaseTransaction = (txId: string) => {
    setAddBaseTransactionId(txId);
    setSelectedAccountTxIds(new Set());
  };
  const handleToggleAccountTransaction = (txId: string) => {
    setSelectedAccountTxIds((prev) => {
      const next = new Set(prev);
      if (next.has(txId)) {
        next.delete(txId);
      } else {
        next.add(txId);
      }
      return next;
    });
  };
  const defaultModeForAccountType = (type: string): OwnershipMode =>
    /credit|loan|mortgage/i.test(type) ? "payment" : "spending";
  const handleSaveNewAccount = () => {
    if (!addAccountName.trim() || selectedAccountTxIds.size === 0) return;
    const newId = `account_${Date.now()}`;
    const accountType = addAccountType;
    const baseTx = fullStatementTransactions.find((tx) => tx.id === addBaseTransactionId);
    const parsed = baseTx ? parseInstitutionAndLast4(baseTx.description) : { institution: null, last4: null };
    const institutionTitle = parsed.institution ? titleCase(parsed.institution) : addAccountName.trim();
    const accountLabelBase = `${institutionTitle} ${accountType.toLowerCase()}`.trim();
    const displayLabel = parsed.last4 ? `${accountLabelBase} ending ${parsed.last4}` : accountLabelBase;
    const newAccount: TransferAccount = {
      id: newId,
      label: accountLabelBase,
      ownedByDefault: true,
      accountType,
      ending: parsed.last4 ?? undefined,
    };
    setCustomAccounts((prev) => [...prev, newAccount]);
    setOwnershipModes((prev) => {
      const next = { ...prev, [newId]: defaultModeForAccountType(accountType) };
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_OWNERSHIP_MODES_KEY, JSON.stringify(next));
      }
      return next;
    });
    setFullStatementTransactions((prev) => {
      const updated = prev.map((tx) => {
        if (!selectedAccountTxIds.has(tx.id)) return tx;
        if (tx.kind.startsWith("transfer")) {
          if (tx.amount < 0) {
            return {
              ...tx,
              sourceKey: tx.sourceKey ?? newId,
              source: tx.source ?? displayLabel,
            };
          }
          return {
            ...tx,
            targetKey: tx.targetKey ?? newId,
            target: tx.target ?? displayLabel,
          };
        }
        return tx;
      });
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_STATEMENT_KEY, JSON.stringify(updated));
      }
      return updated;
    });
    setIsAddingAccount(false);
    setAddAccountName("");
    setAddAccountType("Checking");
    setAddBaseTransactionId("");
    setSelectedAccountTxIds(new Set());
  };
  const handleOwnershipModeChange = (accountId: string, mode: OwnershipMode) => {
    setOwnershipModes((prev) => {
      const next = { ...prev, [accountId]: mode };
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_OWNERSHIP_MODES_KEY, JSON.stringify(next));
      }
      const derived = deriveOwnershipFromModes(next);
      setOwnership(derived);
      return next;
    });
  };
  const hasResults = flowStep === "results" && fullStatementTransactions.length > 0;
  return (
    <div className="space-y-6 sm:space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-zinc-400">Phase one demo using sample data only.</p>
      </header>
      {flowStep === "idle" && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 px-5 py-8 text-center text-zinc-200">
          <h2 className="text-xl font-semibold text-white">Start your demo analysis</h2>
          <p className="mt-2 text-sm text-zinc-400">
            MoneyMap will generate a randomized demo statement and analyze it locally.
          </p>
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={handleStart}
              className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black transition hover:bg-zinc-200"
            >
              Generate sample statement
            </button>
          </div>
        </div>
      )}
      {(flowStep === "statement" || flowStep === "analyzing" || flowStep === "results") && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 px-5 py-6 text-zinc-200 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Demo statement</h2>
              <p className="text-sm text-zinc-400">
                Randomized transactions across your selected months - income, bills, subscriptions, fees, and transfers.
              </p>
              {isEditing && (
                <p className="mt-1 text-xs text-zinc-500">
                  Editing only affects this demo and saves locally on this device.
                </p>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-zinc-300">
                <label className="text-zinc-400" htmlFor="month-from-select">
                  Month from
                </label>
                <select
                  id="month-from-select"
                  className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-white"
                  value={selectedMonthFrom}
                  onChange={(e) => setSelectedMonthFrom(Number(e.target.value))}
                >
                  {months.map((m, idx) => (
                    <option key={m} value={idx}>
                      {m}
                    </option>
                  ))}
                </select>
                <label className="text-zinc-400" htmlFor="year-from-select">
                  Year from
                </label>
                <select
                  id="year-from-select"
                  className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-white"
                  value={selectedYearFrom}
                  onChange={(e) => setSelectedYearFrom(Number(e.target.value))}
                >
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
                <label className="text-zinc-400" htmlFor="month-to-select">
                  Month to
                </label>
                <select
                  id="month-to-select"
                  className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-white"
                  value={selectedMonthTo}
                   onChange={(e) => {
                    hasTouchedRangeRef.current = true;
                    setSelectedMonthTo(Number(e.target.value));
                  }}
                >
                  {months.map((m, idx) => (
                    <option key={m} value={idx}>
                      {m}
                    </option>
                  ))}
                </select>
                <label className="text-zinc-400" htmlFor="year-to-select">
                  Year to
                </label>
                <select
                  id="year-to-select"
                  className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-white"
                  value={selectedYearTo}
                  onChange={(e) => setSelectedYearTo(Number(e.target.value))}
                >
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleToggleEditing()}
                className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
                  isEditing
                    ? "border-emerald-400 bg-emerald-900/40 text-emerald-100"
                    : "border-zinc-700 bg-zinc-900 text-white hover:border-zinc-500 hover:bg-zinc-800"
                }`}
              >
                {isEditing ? "Done editing" : "Edit transactions"}
              </button>
              {flowStep !== "results" && (
                <>
                  <button
                    type="button"
                    onClick={handleRegenerate}
                    disabled={flowStep === "analyzing"}
                    className="rounded-full border border-zinc-700 px-4 py-2 text-xs font-semibold text-white transition hover:border-zinc-500 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Regenerate statement
                  </button>
                  <button
                    type="button"
                    onClick={handleAnalyze}
                    disabled={flowStep === "analyzing" || statementTransactions.length === 0}
                    className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Analyze this statement
                  </button>
                </>
              )}
              {flowStep === "results" && (
                <button
                  type="button"
                  onClick={() => {
                    if (isEditing) {
                      handleToggleEditing(false);
                    } else {
                      setShowStatement((prev) => !prev);
                    }
                  }}
                  className="rounded-full border border-zinc-700 px-4 py-2 text-xs font-semibold text-white transition hover:border-zinc-500 hover:bg-zinc-800"
                >
                  {showStatement ? "Hide statement" : "Show statement"}
                </button>
              )}
            </div>
          </div>
          {flowStep === "analyzing" && (
            <div className="mt-4 flex items-center gap-2 text-sm text-zinc-300">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent" />
              <span>Analyzing...</span>
            </div>
          )}
          {showStatement && (
            <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-800">
              <div className="min-w-[520px]">
                <div className="grid grid-cols-4 bg-zinc-900/80 px-3 py-2 text-left text-xs font-semibold text-zinc-300 sm:px-4 sm:text-sm">
                  <span>Date</span>
                  <span>Description</span>
                  <span>Category</span>
                  <span className="text-right">Amount</span>
                </div>
                {statementTransactions.length === 0 ? (
                  <div className="px-3 py-3 text-xs text-zinc-400 sm:px-4 sm:text-sm">
                    No transactions in this view.
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-800">
                    {statementTransactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="grid grid-cols-4 items-center px-3 py-3 text-xs text-zinc-200 sm:px-4 sm:text-sm"
                      >
                        <span className="text-zinc-300">
                          {dateFormatter.format(new Date(tx.date))}
                        </span>
                        <span className="truncate" title={tx.description}>
                          {tx.description}
                        </span>
                        <span className="text-zinc-400">
                          {isEditing ? (
                            <select
                              className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-200 outline-none"
                              value={tx.category}
                              onChange={(e) => {
                                const newCategory = e.target.value;
                                setFullStatementTransactions((prev) => {
                                  const updated = prev.map((row) =>
                                    row.id === tx.id ? { ...row, category: newCategory } : row,
                                  );
                                  if (typeof window !== "undefined") {
                                    window.localStorage.setItem(
                                      STORAGE_STATEMENT_KEY,
                                      JSON.stringify(updated),
                                    );
                                    window.localStorage.setItem(
                                      STORAGE_FLOW_KEY,
                                      flowStep === "results" ? "results" : "statement",
                                    );
                                  }
                                  return updated;
                                });
                                if (flowStep === "results") {
                                  setFlowStep("results");
                                }
                              }}
                            >
                              {categoryOptions.map((cat) => (
                                <option key={cat} value={cat}>
                                  {cat}
                                </option>
                              ))}
                            </select>
                          ) : (
                            tx.category
                          )}
                        </span>
                        <span
                          className={`text-right font-medium ${
                            tx.amount > 0
                              ? "text-emerald-400"
                              : tx.amount < 0
                                ? "text-red-300"
                                : "text-zinc-200"
                          }`}
                        >
                          {currency.format(tx.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {isEditing && (
                <div className="border-t border-zinc-800 bg-zinc-900/70 px-3 py-3 sm:px-4">
                  <AddTransactionRow
                    rangeStartMonth={normalizedRange.start.month}
                    rangeStartYear={normalizedRange.start.year}
                    rangeEndMonth={normalizedRange.end.month}
                    rangeEndYear={normalizedRange.end.year}
                    onAdd={handleAddTransaction}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}
      {flowStep === "results" && hasResults && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleRestart}
              className="rounded-full border border-zinc-700 px-4 py-2 text-xs font-semibold text-white transition hover:border-zinc-500 hover:bg-zinc-800"
            >
              Start over
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {summaryCards.map((card) => (
              <button
                key={card.label}
                type="button"
                onClick={() => setActiveTab(card.to)}
                className="w-full cursor-pointer rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-600 hover:bg-zinc-800 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-zinc-600"
              >
                <p className="text-sm text-zinc-400">{card.label}</p>
                <p className="mt-2 text-xl font-semibold text-white sm:text-2xl">
                  {card.value}
                </p>
                <p className="mt-2 text-xs text-right text-zinc-500">Click for details</p>
              </button>
            ))}
          </div>
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id);
                  }}
                  className={`rounded-full border px-3 py-2 text-xs font-medium transition sm:px-4 sm:text-sm ${
                    activeTab === tab.id
                      ? "border-zinc-600 bg-zinc-800 text-white shadow-sm"
                      : "border-zinc-800 bg-zinc-900 text-zinc-200 hover:border-zinc-700 hover:bg-zinc-800"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
              <button
                type="button"
                className="ml-auto inline-flex items-center justify-center rounded-full border border-zinc-800 px-3 py-2 text-xs font-medium text-zinc-300 transition hover:border-zinc-600 hover:bg-zinc-800"
                onClick={() => handleToggleEditing()}
              >
                {isEditing ? "Done editing" : "Edit transactions"}
              </button>
            </div>
            {activeTab === "overview" && (
              <div className="rounded-xl border border-dashed border-zinc-700 bg-zinc-900/60 px-4 py-6 text-zinc-300 sm:px-6 sm:py-8">
                <h2 className="text-lg font-semibold text-white text-center">Overview</h2>
                <p className="mt-2 text-center text-sm text-zinc-400">
                  Where your money went this month.
                </p>
                <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {categoryBreakdown.map((item) => (
                    <button
                      key={item.category}
                      type="button"
                      onClick={() => setActiveOverviewCategory(item.category)}
                      className={`w-full rounded-lg border px-4 py-3 text-left transition ${
                        activeOverviewCategory === item.category
                          ? "border-zinc-600 bg-zinc-800"
                          : "border-zinc-800 bg-zinc-900 hover:border-zinc-700 hover:bg-zinc-800"
                      }`}
                    >
                      <p className="flex items-center gap-2 text-sm text-zinc-400">
                        <span aria-hidden="true">{categoryEmojis[item.category] ?? ""}</span>
                        <span>{item.category}</span>
                      </p>
                      <p className="mt-1 text-lg font-semibold text-white">
                        {currency.format(item.amount)}
                      </p>
                    </button>
                  ))}
                </div>
                {flowStep === "results" && groupedSpendingData.length > 0 && (
                  <div
                    className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-5 sm:px-6"
                    tabIndex={-1}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-white">Spending by category</h3>
                    </div>
                    <div className="mt-4 h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={groupedSpendingData}
                            dataKey="value"
                            nameKey="label"
                            innerRadius={0}
                            outerRadius={125}
                            paddingAngle={0}
                            stroke="none"
                            strokeWidth={0}
                            isAnimationActive
                            animationDuration={800}
                            onClick={(entry) =>
                              handleSelectSpendingGroup(getGroupIdFromEntry(entry))
                            }
                            onMouseEnter={(entry) =>
                              handleSelectSpendingGroup(getGroupIdFromEntry(entry))
                            }
                          >
                            {groupedSpendingData.map((item) => (
                              <Cell
                                key={item.id}
                                fill={item.color}
                                cursor="pointer"
                              />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      {groupedSpendingData.map((item) => {
                        const isActive = item.id === resolvedActiveSpendingGroup;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleSelectSpendingGroup(item.id)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                handleSelectSpendingGroup(item.id);
                              }
                            }}
                            className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${
                              isActive
                                ? "border-zinc-500 bg-zinc-800"
                                : "border-zinc-800 bg-zinc-900 hover:border-zinc-700 hover:bg-zinc-800"
                            }`}
                          >
                            <div className="flex items-center gap-2 text-zinc-200">
                              <span aria-hidden="true">{item.emoji}</span>
                              <span>{item.label}</span>
                            </div>
                            <div className="text-right text-xs text-zinc-400">
                              <div className="text-sm font-semibold text-white">{`${item.percent}%`}</div>
                              <div>{currency.format(item.value)}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    {activeSpendingGroupDetails && (
                      <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-900/80 px-4 py-3 text-sm text-zinc-200">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-white">
                            {activeSpendingGroupDetails.emoji} {activeSpendingGroupDetails.label}
                          </span>
                          <span className="text-xs text-zinc-400">
                            {currency.format(activeSpendingGroupDetails.value)}
                          </span>
                        </div>
                        {activeSpendingGroupDetails.categories.length === 0 ? (
                          <p className="mt-2 text-xs text-zinc-400">
                            No transactions in this group yet.
                          </p>
                        ) : (
                          <div className="mt-2 space-y-1">
                            {activeSpendingGroupDetails.categories.map((cat) => (
                              <div
                                key={cat.name}
                                className="flex items-center justify-between"
                              >
                                <span className="text-zinc-300">{cat.name}</span>
                                <span className="font-medium text-white">
                                  {currency.format(cat.amount)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                <div className="mt-6 space-y-2 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white">
                      Transactions for {activeOverviewCategory}
                    </h3>
                  </div>
                  <div className="overflow-x-auto rounded-lg border border-zinc-800">
                    <div className="min-w-[520px]">
                      <div className="grid grid-cols-3 bg-zinc-900/80 px-3 py-2 text-left text-xs font-semibold text-zinc-300 sm:px-4 sm:text-sm">
                        <span>Date</span>
                        <span>Description</span>
                        <span className="text-right">Amount</span>
                      </div>
                      {overviewTransactions.length === 0 ? (
                        <div className="px-3 py-3 text-xs text-zinc-400 sm:px-4 sm:text-sm">
                          No transactions for this category in this period.
                        </div>
                      ) : (
                        <div className="divide-y divide-zinc-800">
                          {overviewTransactions.map((tx) => (
                            <div
                              key={tx.id}
                              className="grid grid-cols-3 items-center px-3 py-3 text-xs text-zinc-200 sm:px-4 sm:text-sm"
                            >
                              <span className="text-zinc-300">
                                {dateFormatter.format(new Date(tx.date))}
                              </span>
                              <span className="truncate" title={tx.description}>
                                {tx.description}
                              </span>
                              <span className="text-right font-medium">
                                {currency.format(tx.amount)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeTab === "recurring" && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-6 text-zinc-200 sm:px-6">
                <h2 className="text-lg font-semibold text-white">Recurring</h2>
                <p className="mt-1 text-sm text-zinc-400">
                  Subscriptions, bills, and payments for this month.
                </p>
                {recurringDuplicateIds.size > 0 && (
                  <p className="mt-2 text-xs text-amber-200">
                    Some subscriptions show up more than once this month. You may want to check for double charges.
                  </p>
                )}
                <div className="mt-4 overflow-x-auto rounded-lg border border-zinc-800">
                  <div className="min-w-[520px]">
                    <div className="grid grid-cols-4 bg-zinc-900/80 px-3 py-2 text-left text-xs font-semibold text-zinc-300 sm:px-4 sm:text-sm">
                      <span>Name</span>
                      <span>Category</span>
                      <span className="text-right">Amount</span>
                      <span className="text-right">Date</span>
                    </div>
                    <div className="divide-y divide-zinc-800">
                      {recurringRows.map((row) => {
                        const displayCategory =
                          row.category === "Utilities" ||
                          row.category === "Bills & services" ||
                          row.category === "Bills"
                            ? "Bills and services"
                            : row.category;
                        return (
                        <div
                          key={row.id}
                          className="grid grid-cols-4 items-center px-3 py-3 text-xs text-zinc-200 sm:px-4 sm:text-sm"
                        >
                          <span className="flex items-center gap-2 truncate" title={row.description}>
                            <span className="truncate">{row.description}</span>
                            {recurringDuplicateIds.has(row.id) && (
                              <span className="rounded-full border border-amber-300/50 bg-amber-900/30 px-2 py-[2px] text-[10px] font-medium text-amber-100">
                                possible duplicate
                              </span>
                            )}
                          </span>
                          <span className="text-zinc-400">{displayCategory}</span>
                          <span className="text-right font-medium">
                            {currency.format(row.amount)}
                          </span>
                          <span className="text-right text-zinc-400">
                            {dateFormatter.format(new Date(row.date))}
                          </span>
                        </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeTab === "fees" && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-6 text-zinc-200 sm:px-6">
                <h2 className="text-lg font-semibold text-white">Fees</h2>
                <p className="mt-1 text-sm text-zinc-400">
                  Bank and service fees charged this month.
                </p>
                <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-900/70 px-4 py-3 text-sm text-zinc-300">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-zinc-400">Total fees this month</span>
                    <span className="text-lg font-semibold text-white">
                      {currency.format(totalFees)}
                    </span>
                  </div>
                </div>
                <div className="mt-4 overflow-x-auto rounded-lg border border-zinc-800">
                  <div className="min-w-[480px]">
                    <div className="grid grid-cols-3 bg-zinc-900/80 px-3 py-2 text-left text-xs font-semibold text-zinc-300 sm:px-4 sm:text-sm">
                      <span>Name</span>
                      <span className="text-right">Amount</span>
                      <span className="text-right">Date</span>
                    </div>
                    <div className="divide-y divide-zinc-800">
                      {feeRows.map((row) => (
                        <div
                          key={row.id}
                          className="grid grid-cols-3 items-center px-3 py-3 text-xs text-zinc-200 sm:px-4 sm:text-sm"
                        >
                          <span className="truncate" title={row.description}>
                            {row.description}
                          </span>
                          <span className="text-right font-medium">
                            {currency.format(row.amount)}
                          </span>
                          <span className="text-right text-zinc-400">
                            {dateFormatter.format(new Date(row.date))}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeTab === "cashflow" && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-6 text-zinc-200 sm:px-6">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-white">Daily cash flow</h2>
                    <InfoTip label={"Shows daily money in and out.\nInternal transfers between your own accounts are filtered out."} />
                </div>
                <p className="mt-1 text-sm text-zinc-400">
                  Daily inflow and outflow for this month.
                </p>
                <div className="mt-4 overflow-x-auto rounded-lg border border-zinc-800">
                  <div className="min-w-[520px]">
                    <div className="grid grid-cols-4 bg-zinc-900/80 px-3 py-2 text-left text-xs font-semibold text-zinc-300 sm:px-4 sm:text-sm">
                      <span>Date</span>
                      <span className="text-right">Inflow</span>
                      <span className="text-right">Outflow</span>
                      <span className="text-right">Net</span>
                    </div>
                    <div className="divide-y divide-zinc-800">
                      {cashFlowRows.map((row) => {
                        const isExpanded = expandedCashflowDates[row.date];
                        const dayTransactions = statementTransactions.filter(
                          (tx) => tx.date === row.date,
                        );
                        return (
                          <div key={row.date} className="text-xs sm:text-sm">
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedCashflowDates((prev) => ({
                                  ...prev,
                                  [row.date]: !prev[row.date],
                                }))
                              }
                              onKeyDown={(event) => {
                                if (event.key === "Enter" || event.key === " ") {
                                  event.preventDefault();
                                  setExpandedCashflowDates((prev) => ({
                                    ...prev,
                                    [row.date]: !prev[row.date],
                                  }));
                                }
                              }}
                              className="grid w-full grid-cols-4 items-center px-3 py-3 text-left text-zinc-200 transition hover:bg-zinc-900 sm:px-4"
                            >
                              <span className="text-zinc-300">
                                {dateFormatter.format(new Date(row.date))}
                              </span>
                              <span className="text-right font-medium">
                                {currency.format(row.totalInflowForThatDate)}
                              </span>
                              <span className="text-right font-medium text-zinc-300">
                                {currency.format(row.totalOutflowForThatDate)}
                              </span>
                              <span
                                className={`flex items-center justify-end gap-2 text-right font-semibold ${
                                  row.netForThatDate >= 0 ? "text-emerald-400" : "text-red-300"
                                }`}
                              >
                                <span
                                  aria-hidden="true"
                                  className={`text-zinc-400 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                                >
                                  ▸
                                </span>
                                {currency.format(row.netForThatDate)}
                              </span>
                            </button>
                            {isExpanded && (
                              <div className="border-t border-zinc-800 bg-zinc-900/70 px-4 py-3 text-zinc-200">
                                {dayTransactions.length === 0 ? (
                                  <p className="text-[11px] text-zinc-400">
                                    No transactions for this day.
                                  </p>
                                ) : (
                                  <div className="space-y-2 text-[11px] sm:text-xs">
                                    {dayTransactions.map((tx) => (
                                      <div
                                        key={tx.id}
                                        className="flex items-center justify-between"
                                      >
                                        <span className="truncate pr-2" title={tx.description}>
                                          {tx.description}
                                        </span>
                                        <span
                                          className={`font-semibold ${
                                            tx.amount > 0
                                              ? "text-emerald-400"
                                              : tx.amount < 0
                                                ? "text-red-300"
                                                : "text-zinc-200"
                                          }`}
                                        >
                                          {currency.format(tx.amount)}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeTab === "review" && (
              <div className="space-y-4">
                <div className="text-center">
                  <h2 className="text-lg font-semibold text-white">Review</h2>
                  <div className="mt-1 flex items-center justify-center gap-2 text-sm text-zinc-400">
                    <p className="text-sm text-zinc-400">Snapshot for this month across your accounts.</p>
                    <InfoTip label={"Snapshot of this month.\nHighlights key spending patterns and fees.\nRuns on sample data."} />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-5 shadow-sm">
                    <p className="text-sm font-semibold text-white">Snapshot</p>
                    <div className="mt-3 space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Income</span>
                        <span className="font-semibold text-white">
                          {currency.format(summaryStats.totalIncome)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Spending</span>
                        <span className="font-semibold text-white">
                          {currency.format(summaryStats.totalSpending)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Net</span>
                        <span
                          className={`font-semibold ${
                            summaryStats.net >= 0 ? "text-emerald-400" : "text-red-300"
                          }`}
                        >
                          {currency.format(summaryStats.net)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-5 shadow-sm">
                    <p className="text-sm font-semibold text-white">Subscriptions</p>
                    <div className="mt-3 space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Count</span>
                        <span className="font-semibold text-white">
                          {summaryStats.subscriptionCount}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Total</span>
                        <span className="font-semibold text-white">
                          {currency.format(summaryStats.totalSubscriptions)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-5 shadow-sm">
                    <p className="text-sm font-semibold text-white">Fees</p>
                    <div className="mt-3 space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Total fees</span>
                        <span className="font-semibold text-white">
                          {currency.format(summaryStats.totalFees)}
                        </span>
                      </div>
                      {summaryStats.largestSingleExpense && (
                        <div className="space-y-1 text-xs text-zinc-400">
                          <button
                            type="button"
                            onClick={() => setShowLargestExpenseDetail((prev) => !prev)}
                            className="flex w-full items-center justify-between rounded-md border border-transparent px-1 py-1 text-left transition hover:border-zinc-700 hover:bg-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-600"
                          >
                            <span>Largest expense</span>
                            <span className="text-white">
                              {currency.format(summaryStats.largestSingleExpense.amount)}
                            </span>
                          </button>
                          {showLargestExpenseDetail && (
                            <div className="rounded-md border border-zinc-800 bg-zinc-900/80 px-2 py-2 text-[11px] text-zinc-300">
                              <div className="flex justify-between">
                                <span className="text-zinc-400">Date</span>
                                <span className="text-white">
                                  {dateFormatter.format(new Date(summaryStats.largestSingleExpense.date))}
                                </span>
                              </div>
                              <div className="mt-1 flex justify-between">
                                <span className="text-zinc-400">Merchant</span>
                                <span className="truncate text-white" title={summaryStats.largestSingleExpense.description}>
                                  {summaryStats.largestSingleExpense.description}
                                </span>
                              </div>
                              <div className="mt-1 flex justify-between">
                                <span className="text-zinc-400">Amount</span>
                                <span className="text-white">
                                  {currency.format(summaryStats.largestSingleExpense.amount)}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-5 shadow-sm">
                    <p className="text-sm font-semibold text-white">Top spending categories</p>
                    <div className="mt-3 space-y-2 text-sm">
                      {summaryStats.topSpendingCategories.map((item) => (
                        <div key={item.category} className="flex justify-between">
                          <span className="text-zinc-400">{item.category}</span>
                          <span className="font-semibold text-white">
                            {currency.format(item.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-5 shadow-sm">
                    <p className="text-sm font-semibold text-white">Internal transfers this month</p>
                    <p className="mt-2 text-xl font-semibold text-white">
                      {currency.format(summaryStats.totalInternalTransfers)}
                    </p>
                    <p className="mt-1 text-xs text-zinc-400">
                      Money moved between your own accounts. Ignored for income and spending.
                    </p>
                  </div>
                  <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900 px-4 py-5 text-center shadow-sm">
                    <p className="text-sm font-semibold text-white">Coming soon</p>
                    <p className="mt-2 text-xs text-zinc-400">
                      Another snapshot will live here in a later version.
                    </p>
                  </div>
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-5 shadow-sm">
                    <p className="text-sm font-semibold text-white">Left after bills</p>
                    <p className="mt-2 text-xl font-semibold text-white">
                      {currency.format(leftAfterBills)}
                    </p>
                    <p className="mt-1 text-xs text-zinc-400">
                      Approximate money left after rent, utilities, groceries, and basic fees.
                    </p>
                  </div>
                </div>
                <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-5 shadow-sm">
                  <div className="flex flex-col items-center justify-center gap-1 text-center">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-white">
                        Budget guidance
                      </h3>
                      <InfoTip label={"Ranges based on this month's income.\nTransfers between your accounts are ignored."} />
                    </div>
                    <div className="flex items-center justify-center gap-2 text-xs text-zinc-400">
                      <span>Based on your income this month.</span>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {budgetGuidance.map((item) => {
                      const actualPercent =
                        totalIncome > 0 ? (item.actualAmount / totalIncome) * 100 : 0;
                      const targetPercent =
                        totalIncome > 0 && item.recommendedAmount > 0
                          ? (item.recommendedAmount / totalIncome) * 100
                          : 0;
                      const diffText =
                        item.differenceDirection === "over"
                          ? `Over by ${currency.format(item.differenceAmount)} compared to this guideline.`
                          : `Under by ${currency.format(item.differenceAmount)} compared to this guideline.`;
                      const diffClass =
                        item.differenceDirection === "over"
                          ? "text-rose-300 font-semibold"
                          : "text-emerald-300 font-semibold";
                      return (
                        <div
                          key={item.category}
                          className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-200"
                        >
                          <div className="flex justify-between">
                            <span className="font-medium text-white">
                              {item.category}
                            </span>
                            <span className="text-zinc-400">
                              {currency.format(item.actualAmount)}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-zinc-400">
                            {item.category} is about {actualPercent.toFixed(1)}% of this
                            month&apos;s income. A common target is about{" "}
                            {targetPercent.toFixed(1)}% (about{" "}
                            {currency.format(item.recommendedAmount)} for your income).
                          </p>
                          <p className={`mt-1 text-xs ${diffClass}`}>{diffText}</p>
                        </div>
                      );
                    })}
                  </div>
                  <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-xs text-zinc-300">
                    <p className="font-semibold text-white">Bill check</p>
                    <p className="mt-1">
                      Car and transport are about {transportPercent.toFixed(1)}% of your income
                      this month. A common target is roughly up to {transportGuideline}%.
                    </p>
                    <p className="mt-1">
                      Internet or home connection is about {internetPercent.toFixed(1)}% of your
                      income this month. Around {internetGuideline}% is a typical range.
                    </p>
                  </div>
                  <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-4 text-xs text-zinc-300">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-white">Needs vs wants</p>
                      <InfoTip label={"Needs: rent, utilities, groceries, basic fees.\nWants: dining out, shopping, extras.\nSimple visual split only."} />
                    </div>
                    <div className="mt-2 h-3 w-full overflow-hidden rounded-full border border-zinc-800 bg-zinc-900">
                      <div className="flex h-full w-full">
                        <div
                          className="h-full bg-emerald-500/70"
                          style={{ width: `${essentialsPercent}%` }}
                        />
                        <div
                          className="h-full bg-zinc-600/60"
                          style={{ width: `${otherPercent}%` }}
                        />
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-400">
                      <span>Essentials (needs) {essentialsPercent}%</span>
                      <span>Everything else (wants) {otherPercent}%</span>
                    </div>
                  </div>
                </div>
                {transferAccounts.length === 0 ? (
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-4 text-center text-sm text-zinc-400">
                    No transfer accounts detected in this statement.
                  </div>
                ) : (
                  <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-5 shadow-sm">
                    <div className="space-y-1 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <h3 className="text-base font-semibold text-white">
                        Your accounts
                      </h3>
                      <InfoTip label={"Mark your accounts vs payment vs not mine.\nKeeps internal moves separate from real spending.\nHelps MoneyMap treat transfers correctly."} />
                      </div>
                      <p className="text-xs text-zinc-400">
                        These settings only change how totals are counted here.
                      </p>
                    </div>
                    <div className="space-y-2">
                      {transferAccounts.map((acc) => {
                        const displayLabel = acc.ending
                          ? `${acc.label} ending ${acc.ending}`
                          : acc.label;
                        const mode =
                          ownershipModes[acc.id] ??
                          (ownership[acc.id] ? ("spending" as OwnershipMode) : "notMine");
                        const typeLabel = getAccountTypeLabel(acc);
                        return (
                          <div
                            key={acc.id}
                            className="flex flex-col gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-200 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="flex items-center gap-3">
                              <span className="rounded-full border border-zinc-700 bg-zinc-800 px-2 py-[2px] text-[11px] font-semibold uppercase tracking-wide text-zinc-200">
                                {typeLabel}
                              </span>
                              <span className="font-medium text-white">{displayLabel}</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                aria-pressed={mode === "spending"}
                                onClick={() => handleOwnershipModeChange(acc.id, "spending")}
                                className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                                  mode === "spending"
                                    ? "border-emerald-400 bg-emerald-900/40 text-emerald-100"
                                    : "border-zinc-700 bg-zinc-800 text-zinc-200 hover:border-zinc-600 hover:bg-zinc-700"
                                }`}
                              >
                                Spending account
                              </button>
                              <button
                                type="button"
                                aria-pressed={mode === "payment"}
                                onClick={() => handleOwnershipModeChange(acc.id, "payment")}
                                className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                                  mode === "payment"
                                    ? "border-amber-300 bg-amber-900/40 text-amber-100"
                                    : "border-zinc-700 bg-zinc-800 text-zinc-200 hover:border-zinc-600 hover:bg-zinc-700"
                                }`}
                              >
                                Payment account
                              </button>
                              <button
                                type="button"
                                aria-pressed={mode === "notMine"}
                                onClick={() => handleOwnershipModeChange(acc.id, "notMine")}
                                className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                                  mode === "notMine"
                                    ? "border-rose-300 bg-rose-900/30 text-rose-100"
                                    : "border-zinc-700 bg-zinc-800 text-zinc-200 hover:border-zinc-600 hover:bg-zinc-700"
                                }`}
                              >
                                Not mine
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => setIsAddingAccount((prev) => !prev)}
                        className="rounded-full border border-zinc-700 px-3 py-2 text-xs font-semibold text-white transition hover:border-zinc-500 hover:bg-zinc-800"
                      >
                        {isAddingAccount ? "Cancel add account" : "Add account"}
                      </button>
                    </div>
                    {isAddingAccount && (
                      <div className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-4 text-left text-sm text-zinc-200">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <label className="text-xs text-zinc-400">
                            Representative transaction
                            <select
                              className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 py-2 text-sm text-white"
                              value={addBaseTransactionId}
                              onChange={(e) => handleSelectBaseTransaction(e.target.value)}
                            >
                              <option value="">Select a transaction</option>
                              {transferTransactions.map((tx) => (
                                <option key={tx.id} value={tx.id}>
                                  {`${dateFormatter.format(new Date(tx.date))} • ${tx.description} (${currency.format(tx.amount)})`}
                                </option>
                              ))}
                            </select>
                          </label>
                          <div className="grid gap-2 sm:grid-cols-2">
                            <label className="text-xs text-zinc-400">
                              Account name
                              <input
                                type="text"
                                className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 py-2 text-sm text-white"
                                value={addAccountName}
                                onChange={(e) => setAddAccountName(e.target.value)}
                                placeholder="e.g., Capital One card"
                              />
                            </label>
                            <label className="text-xs text-zinc-400">
                              Account type
                              <select
                                className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 py-2 text-sm text-white"
                                value={addAccountType}
                                onChange={(e) => setAddAccountType(e.target.value)}
                              >
                                {accountTypeOptions.map((opt) => (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>
                            </label>
                          </div>
                        </div>
                        <div className="space-y-2 rounded-md border border-zinc-800 bg-zinc-900/70 px-3 py-3 text-xs">
                          <div className="flex items-center justify-between text-zinc-400">
                            <p>Suggested matches</p>
                            <p className="text-[11px] text-zinc-500">
                              Found {suggestedAccountTransactions.length} possible matches
                            </p>
                          </div>
                          {suggestedAccountTransactions.length === 0 ? (
                            <p className="text-[11px] text-zinc-500">Select a transaction to see matches.</p>
                          ) : (
                            suggestedAccountTransactions.map((tx) => (
                              <label key={tx.id} className="flex items-center justify-between gap-3 rounded-md px-2 py-1 hover:bg-zinc-900">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    className="h-4 w-4"
                                    checked={selectedAccountTxIds.has(tx.id)}
                                    onChange={() => handleToggleAccountTransaction(tx.id)}
                                  />
                                  <span className="truncate" title={tx.description}>
                                    {tx.description}
                                  </span>
                                </div>
                                <span className="text-right font-semibold">
                                  {currency.format(tx.amount)}
                                </span>
                              </label>
                            ))
                          )}
                          {selectedAccountTxIds.size > 0 && (
                            <p className="text-[11px] text-emerald-200">
                              {selectedAccountTxIds.size} transaction{selectedAccountTxIds.size > 1 ? "s" : ""} selected
                            </p>
                          )}
                        </div>
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setIsAddingAccount(false);
                              setAddAccountName("");
                              setAddBaseTransactionId("");
                              setSelectedAccountTxIds(new Set());
                            }}
                            className="rounded-full border border-zinc-700 px-3 py-2 text-xs font-semibold text-zinc-200 transition hover:border-zinc-600 hover:bg-zinc-800"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleSaveNewAccount}
                            className="rounded-full border border-emerald-400 bg-emerald-900/50 px-3 py-2 text-xs font-semibold text-emerald-100 transition hover:border-emerald-300 hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={!addAccountName.trim() || selectedAccountTxIds.size === 0}
                          >
                            Save account
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
