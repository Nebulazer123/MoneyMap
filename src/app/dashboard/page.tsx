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
  getCashFlowByDate,
  getSummaryStats,
  getBudgetGuidance,
  transactions,
  Transaction,
  BudgetGuidanceItem,
  OwnershipMap,
  OwnershipMode,
  TransferAccount,
  isInternalTransfer,
  isRealSpending,
  parseInstitutionAndLast4,
} from "../../lib/fakeData";
import {
  accountTypeLabels,
  accountTypeOptions,
  categoryEmojis,
  categoryOptions,
  internetGuideline,
  LEGACY_STORAGE_MONTH_KEY,
  LEGACY_STORAGE_YEAR_KEY,
  months,
  overviewGroupMeta,
  STORAGE_ACCOUNT_OVERRIDES_KEY,
  STORAGE_CUSTOM_ACCOUNTS_KEY,
  STORAGE_DUPLICATE_DECISIONS_KEY,
  STORAGE_FLOW_KEY,
  STORAGE_HIDDEN_ACCOUNTS_KEY,
  STORAGE_MONTH_FROM_KEY,
  STORAGE_MONTH_TO_KEY,
  STORAGE_OWNERSHIP_MODES_KEY,
  STORAGE_STATEMENT_KEY,
  STORAGE_TAB_KEY,
  STORAGE_YEAR_FROM_KEY,
  STORAGE_YEAR_TO_KEY,
  tabs,
  transportGuideline,
} from "../../lib/dashboard/config";
import { descriptionKey, getDisplayCategory, getTransactionDisplayCategory, titleCase } from "../../lib/dashboard/categories";
import type { OverviewGroupKey, TabId } from "../../lib/dashboard/config";
import AddTransactionRow from "./components/AddTransactionRow";
import InfoTip from "./components/InfoTip";
import { useDuplicates } from "./hooks/useDuplicates";
import { useExpansionState } from "./hooks/useExpansionState";
import { useGestureTabs } from "./hooks/useGestureTabs";
import { currency, dateFormatter } from "./utils/format";
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
  const inferAccountTypeFromLabel = (label: string) => {
    const lower = label.toLowerCase();
    if (/(checking)/.test(lower)) return "Checking";
    if (/(savings)/.test(lower)) return "Savings";
    if (/(cash app|wallet|venmo|paypal)/.test(lower)) return "Wallet";
    if (/(visa|card|debit)/.test(lower)) return "Debit card";
    if (/(loan|mortgage|finance|auto)/.test(lower)) return "Loan";
    return "Other";
  };
  const deriveAccountsFromTransactions = useCallback((list: Transaction[]): TransferAccount[] => {
    const counts = new Map<string, { label: string; ending?: string; accountType?: string; count: number }>();
    list
      .filter((t) => t.kind.startsWith("transfer"))
      .forEach((t) => {
        const candidates = [t.source, t.target].filter(Boolean) as string[];
        const parsed = parseInstitutionAndLast4(t.description);
        if (parsed.institution) {
          candidates.push(parsed.institution);
        }
        candidates.forEach((raw) => {
          const label = titleCase(raw);
          const ending = parsed.last4 ?? undefined;
          const key = `${label.toLowerCase()}::${ending ?? ""}`;
          const existing = counts.get(key) ?? {
            label,
            ending,
            accountType: inferAccountTypeFromLabel(label),
            count: 0,
          };
          existing.count += 1;
          counts.set(key, existing);
        });
      });
    return Array.from(counts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map((item, idx) => ({
        id: `auto_account_${idx}_${item.label.replace(/\s+/g, "_").toLowerCase()}`,
        label: item.label,
        ownedByDefault: true,
        ending: item.ending,
        accountType: item.accountType,
      }));
  }, []);
  const getDefaultThreeMonthRange = useCallback(() => {
    const now = new Date();
    const currentMonth = now.getUTCMonth();
    const currentYear = now.getUTCFullYear();
    const endDate = new Date(Date.UTC(currentYear, currentMonth, 1));
    endDate.setUTCMonth(endDate.getUTCMonth() - 1);
    const toMonth = endDate.getUTCMonth();
    const toYear = endDate.getUTCFullYear();
    const startDate = new Date(Date.UTC(toYear, toMonth, 1));
    startDate.setUTCMonth(startDate.getUTCMonth() - 2);
    return {
      fromMonth: startDate.getUTCMonth(),
      fromYear: startDate.getUTCFullYear(),
      toMonth,
      toYear,
    };
  }, []);
  const defaultRange = useMemo(() => getDefaultThreeMonthRange(), [getDefaultThreeMonthRange]);
  const baseSampleDate = useMemo(
    () => new Date(transactions[0]?.date ?? new Date()),
    [],
  );
  const lastGeneratedRangeRef = useRef<string | null>(null);
  const hasTouchedRangeRef = useRef(false);
  const hydratedFromStorageRef = useRef(false);
  const [selectedMonthFrom, setSelectedMonthFrom] = useState<number>(defaultRange.fromMonth);
  const [selectedYearFrom, setSelectedYearFrom] = useState<number>(defaultRange.fromYear);
  const [selectedMonthTo, setSelectedMonthTo] = useState<number>(defaultRange.toMonth);
  const [selectedYearTo, setSelectedYearTo] = useState<number>(defaultRange.toYear);
  const inferredAccounts = useMemo(
    () => deriveAccountsFromTransactions(fullStatementTransactions),
    [fullStatementTransactions, deriveAccountsFromTransactions],
  );
  const [customAccounts, setCustomAccounts] = useState<TransferAccount[]>(() => loadCustomAccounts());
  const [accountOverrides, setAccountOverrides] = useState<
    Record<string, { label: string; accountType?: string; ending?: string }>
  >(() => {
    if (typeof window === "undefined") return {};
    try {
      const stored = window.localStorage.getItem(STORAGE_ACCOUNT_OVERRIDES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Record<string, { label: string; accountType?: string; ending?: string }>;
        if (parsed && typeof parsed === "object") return parsed;
      }
    } catch {
      // ignore
    }
    return {};
  });
  const [hiddenAccountIds, setHiddenAccountIds] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const stored = window.localStorage.getItem(STORAGE_HIDDEN_ACCOUNTS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as string[];
        if (Array.isArray(parsed)) return new Set(parsed);
      }
    } catch {
      // ignore
    }
    return new Set();
  });
  const activeCustomAccounts = useMemo(
    () =>
      customAccounts.filter((acc) =>
        fullStatementTransactions.some(
          (tx) =>
            tx.source?.toLowerCase().includes(acc.label.toLowerCase()) ||
            tx.target?.toLowerCase().includes(acc.label.toLowerCase()) ||
            tx.description.toLowerCase().includes(acc.label.toLowerCase()),
        ),
      ),
    [customAccounts, fullStatementTransactions],
  );
  const transferAccounts = useMemo(() => {
    const overrides = accountOverrides;
    const combined = [...inferredAccounts, ...activeCustomAccounts];
    return combined
      .filter((acc) => !hiddenAccountIds.has(acc.id))
      .map((acc) => {
        const override = overrides[acc.id];
        if (!override) return acc;
        return {
          ...acc,
          label: override.label,
          accountType: override.accountType ?? acc.accountType,
          ending: override.ending ?? acc.ending,
        };
      });
  }, [accountOverrides, activeCustomAccounts, hiddenAccountIds, inferredAccounts]);
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
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [editingAccountName, setEditingAccountName] = useState("");
  const [editingAccountType, setEditingAccountType] = useState(accountTypeOptions[0]);
  const {
    duplicateClusters,
    activeDuplicateIds,
    duplicateMetaById,
    duplicateDecisions,
    resetDuplicates,
    showDuplicateOverlay,
    handleOpenDuplicateOverlay,
    handleCloseDuplicateOverlay,
    expandedDuplicateClusters,
    toggleDuplicateCluster,
    handleDismissDuplicate,
    handleConfirmDuplicate,
    duplicateOverlayRef,
  } = useDuplicates(fullStatementTransactions);
  const { handleSwipeStart, handleSwipeMove, handleSwipeEnd } = useGestureTabs(activeTab, setActiveTab);
  useEffect(() => {
    setOwnership(deriveOwnershipFromModes(ownershipModes));
  }, [ownershipModes]);
  useEffect(() => {
    lastGeneratedRangeRef.current = null;
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_CUSTOM_ACCOUNTS_KEY, JSON.stringify(customAccounts));
    }
  }, [customAccounts]);
  useEffect(() => {
    const activeIds = new Set(transferAccounts.map((acc) => acc.id));
    setOwnershipModes((prev) => {
      const next: Record<string, OwnershipMode> = {};
      Object.entries(prev).forEach(([id, mode]) => {
        if (activeIds.has(id)) {
          next[id] = mode;
        }
      });
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_OWNERSHIP_MODES_KEY, JSON.stringify(next));
      }
      return next;
    });
  }, [transferAccounts]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_ACCOUNT_OVERRIDES_KEY, JSON.stringify(accountOverrides));
  }, [accountOverrides]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      STORAGE_HIDDEN_ACCOUNTS_KEY,
      JSON.stringify(Array.from(hiddenAccountIds)),
    );
  }, [hiddenAccountIds]);
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
  const statementTransactionsSorted = useMemo(
    () =>
      [...statementTransactions].sort((a, b) => {
        const aTs = Date.parse(`${a.date}T00:00:00Z`);
        const bTs = Date.parse(`${b.date}T00:00:00Z`);
        return aTs - bTs;
      }),
    [statementTransactions],
  );
  const statementMonths = useMemo(() => {
    const monthMap = new Map<
      number,
      { key: number; label: string; transactions: Transaction[] }
    >();
    statementTransactionsSorted.forEach((tx) => {
      const date = new Date(`${tx.date}T00:00:00Z`);
      if (Number.isNaN(date.getTime())) return;
      const month = date.getUTCMonth();
      const year = date.getUTCFullYear();
      const key = year * 12 + month;
      if (!monthMap.has(key)) {
        monthMap.set(key, {
          key,
          label: `${months[month]} ${year}`,
          transactions: [],
        });
      }
      const bucket = monthMap.get(key);
      if (bucket) {
        bucket.transactions.push(tx);
      }
    });
    const monthsArray = Array.from(monthMap.values());
    monthsArray.forEach((bucket) => {
      bucket.transactions.sort((a, b) => {
        const aTs = Date.parse(`${a.date}T00:00:00Z`);
        const bTs = Date.parse(`${b.date}T00:00:00Z`);
        return aTs - bTs;
      });
    });
    return monthsArray;
  }, [statementTransactionsSorted]);
  const showGroupedTable = statementMonths.length > 3;
  const monthsSignature = useMemo(
    () => statementMonths.map((m) => m.key).join("|"),
    [statementMonths],
  );
  const cashFlowRows = getCashFlowByDate(statementTransactions, ownership, ownershipModes);
  const cashflowMonths = useMemo(() => {
    const monthMap = new Map<
      number,
      {
        key: number;
        label: string;
        rows: (typeof cashFlowRows)[number][];
        totalIn: number;
        totalOut: number;
        totalNet: number;
      }
    >();
    cashFlowRows.forEach((row) => {
      const date = new Date(`${row.date}T00:00:00Z`);
      if (Number.isNaN(date.getTime())) return;
      const month = date.getUTCMonth();
      const year = date.getUTCFullYear();
      const key = year * 12 + month;
      if (!monthMap.has(key)) {
        monthMap.set(key, {
          key,
          label: `${months[month]} ${year}`,
          rows: [],
          totalIn: 0,
          totalOut: 0,
          totalNet: 0,
        });
      }
      const bucket = monthMap.get(key);
      if (!bucket) return;
      bucket.rows.push(row);
      bucket.totalIn += row.totalInflowForThatDate;
      bucket.totalOut += row.totalOutflowForThatDate;
      bucket.totalNet += row.netForThatDate;
    });
    const sortedMonths = Array.from(monthMap.values()).sort((a, b) => a.key - b.key);
    sortedMonths.forEach((bucket) => {
      bucket.rows.sort((a, b) => Date.parse(`${a.date}T00:00:00Z`) - Date.parse(`${b.date}T00:00:00Z`));
    });
    return sortedMonths;
  }, [cashFlowRows]);
  const showGroupedCashflow = cashflowMonths.length > 1;
  const {
    expandedMonths,
    setExpandedMonths,
    expandedCashflowMonths,
    setExpandedCashflowMonths,
    expandedCashflowDates,
    setExpandedCashflowDates,
  } = useExpansionState({ showGroupedTable, monthsSignature, cashflowMonths });
  const totalIncome = getTotalIncome(statementTransactions, ownership, ownershipModes);
  const totalSpending = getTotalSpending(statementTransactions, ownership, ownershipModes);
  const netThisMonth = getNetThisMonth(statementTransactions, ownership, ownershipModes);
  const totalSubscriptions = getTotalSubscriptions(statementTransactions, ownership, ownershipModes);
  const internalTransfersTotal = useMemo(
    () =>
      statementTransactions.reduce((sum, tx) => {
        if (!isInternalTransfer(tx, ownership, ownershipModes)) return sum;
        return sum + Math.abs(tx.amount);
      }, 0),
    [ownership, ownershipModes, statementTransactions],
  );
  const subscriptionRows = getSubscriptionTransactions(
    statementTransactions,
    ownership,
    ownershipModes,
  );
  const feeRows = getFeeTransactions(statementTransactions, ownership, ownershipModes);
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
  const transferTransactions = statementTransactions.filter((t) => t.kind.startsWith("transfer"));
  useEffect(() => {
    if (isAddingAccount && !addBaseTransactionId && transferTransactions.length > 0) {
      const first = transferTransactions[0];
      setAddBaseTransactionId(first.id);
    }
  }, [isAddingAccount, addBaseTransactionId, transferTransactions]);
  const categoryBreakdown = useMemo(() => {
    const totals = new Map<string, number>();
    statementTransactions.forEach((tx) => {
      if (!isRealSpending(tx, ownership, ownershipModes)) return;
      const bucket = getTransactionDisplayCategory(tx);
      const prev = totals.get(bucket) ?? 0;
      totals.set(bucket, prev + Math.abs(tx.amount));
    });
    return Array.from(totals.entries()).map(([category, amount]) => ({ category, amount }));
  }, [statementTransactions, ownership, ownershipModes]);
  const categoryAmountMap = useMemo(
    () => new Map(categoryBreakdown.map((item) => [item.category, item.amount])),
    [categoryBreakdown],
  );
  const summaryStats = getSummaryStats(statementTransactions, ownership, ownershipModes);
  const baseBudgetGuidance = useMemo(
    () => getBudgetGuidance(statementTransactions, ownership, ownershipModes),
    [statementTransactions, ownership, ownershipModes],
  );
  const budgetGuidance = useMemo(() => {
    const billsBuckets = ["Insurance", "Loans", "Education", "Bills & services"];
    const billsActualTotal = billsBuckets.reduce(
      (sum, cat) => sum + (categoryAmountMap.get(cat) ?? 0),
      0,
    );
    const billsBase = baseBudgetGuidance.find((item) => item.category === "Bills & services");
    const billsRecommendedTotal = billsBase?.recommendedAmount ?? 0;
    const splitBills = billsBuckets
      .map((cat) => {
        const actual = categoryAmountMap.get(cat) ?? 0;
        if (actual <= 0) return null;
        const share = billsActualTotal > 0 ? actual / billsActualTotal : 0;
        const recommendedAmount = billsRecommendedTotal * share;
        const delta = actual - recommendedAmount;
        return {
          category: cat,
          name: cat,
          actual,
          actualAmount: actual,
          recommendedMax: recommendedAmount,
          recommendedAmount,
          delta,
          differenceAmount: Math.abs(delta),
          differenceDirection: delta > 0 ? ("over" as const) : ("under" as const),
        };
      })
      .filter((item): item is BudgetGuidanceItem => Boolean(item));
    const nonBills = baseBudgetGuidance
      .filter((item) => item.category !== "Bills & services")
      .map((item) => {
        const actual = categoryAmountMap.get(item.category) ?? item.actualAmount;
        const delta = actual - item.recommendedAmount;
        return {
          ...item,
          actual,
          actualAmount: actual,
          delta,
          differenceAmount: Math.abs(delta),
          differenceDirection: delta > 0 ? ("over" as const) : ("under" as const),
        };
      });
    return [...nonBills, ...splitBills];
  }, [baseBudgetGuidance, categoryAmountMap]);
  const topSpendingCategories = useMemo(
    () => [...categoryBreakdown].sort((a, b) => b.amount - a.amount).slice(0, 3),
    [categoryBreakdown],
  );
  const overviewTransactions = useMemo(
    () =>
      statementTransactions.filter(
        (t) =>
          getTransactionDisplayCategory(t) === activeOverviewCategory &&
          !isInternalTransfer(t, ownership, ownershipModes),
      ),
    [activeOverviewCategory, ownership, ownershipModes, statementTransactions],
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
  const essentialsTotal = categoryBreakdown
    .filter((item) => ["Rent", "Utilities", "Groceries", "Fees"].includes(item.category))
    .reduce((sum, item) => sum + Math.abs(item.amount), 0);
  const essentialsPercent =
    totalIncome > 0 ? Math.min(100, Math.round((essentialsTotal / totalIncome) * 100)) : 0;
  const otherPercent = Math.max(0, 100 - essentialsPercent);
  const leftAfterBills = totalIncome - essentialsTotal;
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
    const defaultRange = getDefaultThreeMonthRange();
    const fallbackMonth = defaultRange.fromMonth;
    const fallbackYear = defaultRange.fromYear;
    const fallbackToMonth = defaultRange.toMonth;
    const fallbackToYear = defaultRange.toYear;
    const parsedFromMonth = parseNumber(storedMonthFrom) ?? parseNumber(legacyMonth);
    const parsedFromYear = parseNumber(storedYearFrom) ?? parseNumber(legacyYear);
    const parsedToMonth =
      parseNumber(storedMonthTo) ?? parseNumber(storedMonthFrom) ?? parseNumber(legacyMonth);
    const parsedToYear =
      parseNumber(storedYearTo) ?? parseNumber(storedYearFrom) ?? parseNumber(legacyYear);
    startTransition(() => {
      setSelectedMonthFrom(parsedFromMonth ?? fallbackMonth);
      setSelectedYearFrom(parsedFromYear ?? fallbackYear);
      setSelectedMonthTo(parsedToMonth ?? parsedFromMonth ?? fallbackToMonth);
      setSelectedYearTo(parsedToYear ?? parsedFromYear ?? fallbackToYear);
    });
  }, [getDefaultThreeMonthRange]);
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
          const storedMonthFrom = window.localStorage.getItem(STORAGE_MONTH_FROM_KEY);
          const storedYearFrom = window.localStorage.getItem(STORAGE_YEAR_FROM_KEY);
          const storedMonthTo = window.localStorage.getItem(STORAGE_MONTH_TO_KEY);
          const storedYearTo = window.localStorage.getItem(STORAGE_YEAR_TO_KEY);
          const legacyMonth = window.localStorage.getItem(LEGACY_STORAGE_MONTH_KEY);
          const legacyYear = window.localStorage.getItem(LEGACY_STORAGE_YEAR_KEY);
          const parseNumber = (value: string | null) => {
            if (value === null) return null;
            const next = Number(value);
            return Number.isNaN(next) ? null : next;
          };
          const fallbackRange = defaultRange;
          const fallbackMonth = fallbackRange.fromMonth;
          const fallbackYear = fallbackRange.fromYear;
          const fallbackToMonth = fallbackRange.toMonth;
          const fallbackToYear = fallbackRange.toYear;
          const parsedFromMonth = parseNumber(storedMonthFrom) ?? parseNumber(legacyMonth);
          const parsedFromYear = parseNumber(storedYearFrom) ?? parseNumber(legacyYear);
          const parsedToMonth =
            parseNumber(storedMonthTo) ?? parseNumber(storedMonthFrom) ?? parseNumber(legacyMonth);
          const parsedToYear =
            parseNumber(storedYearTo) ?? parseNumber(storedYearFrom) ?? parseNumber(legacyYear);
          const resolvedFromMonth = parsedFromMonth ?? fallbackMonth;
          const resolvedFromYear = parsedFromYear ?? fallbackYear;
          const resolvedToMonth = parsedToMonth ?? parsedFromMonth ?? fallbackToMonth;
          const resolvedToYear = parsedToYear ?? parsedFromYear ?? fallbackToYear;
          lastGeneratedRangeRef.current = `${resolvedFromYear}-${resolvedFromMonth}:${resolvedToYear}-${resolvedToMonth}`;
          startTransition(() => {
            setFullStatementTransactions(parsed);
            if (flow === "statement" || flow === "results") {
              setFlowStep(flow);
              setShowStatement(flow === "results" ? false : true);
            }
          });
          hydratedFromStorageRef.current = true;
          hasTouchedRangeRef.current = flow === "results" || flow === "statement" || flow === "analyzing";
        }
      } catch {
        // ignore bad data
      }
    }
  }, [defaultRange]);
  useEffect(() => {
    if (lastGeneratedRangeRef.current !== null) return;
    if (fullStatementTransactions.length === 0) return;
    lastGeneratedRangeRef.current = `${selectedYearFrom}-${selectedMonthFrom}:${selectedYearTo}-${selectedMonthTo}`;
  }, [
    fullStatementTransactions.length,
    selectedMonthFrom,
    selectedMonthTo,
    selectedYearFrom,
    selectedYearTo,
  ]);
  const startStatement = useCallback(() => {
    const generated = generateSampleStatement(
      selectedMonthFrom,
      selectedYearFrom,
      selectedMonthTo,
      selectedYearTo,
    );
    lastGeneratedRangeRef.current = `${selectedYearFrom}-${selectedMonthFrom}:${selectedYearTo}-${selectedMonthTo}`;
    hasTouchedRangeRef.current = true;
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
    setSelectedMonthFrom(defaultRange.fromMonth);
    setSelectedYearFrom(defaultRange.fromYear);
    setSelectedMonthTo(defaultRange.toMonth);
    setSelectedYearTo(defaultRange.toYear);
    lastGeneratedRangeRef.current = null;
    hasTouchedRangeRef.current = false;
    resetDuplicates();
    hydratedFromStorageRef.current = false;
    setCustomAccounts([]);
    setAccountOverrides({});
    setHiddenAccountIds(new Set());
    setOwnershipModes({});
    setOwnership({});
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_FLOW_KEY);
      window.localStorage.removeItem(STORAGE_STATEMENT_KEY);
      window.localStorage.removeItem(STORAGE_MONTH_FROM_KEY);
      window.localStorage.removeItem(STORAGE_YEAR_FROM_KEY);
      window.localStorage.removeItem(STORAGE_MONTH_TO_KEY);
      window.localStorage.removeItem(STORAGE_YEAR_TO_KEY);
      window.localStorage.removeItem(LEGACY_STORAGE_MONTH_KEY);
      window.localStorage.removeItem(LEGACY_STORAGE_YEAR_KEY);
      window.localStorage.removeItem(STORAGE_DUPLICATE_DECISIONS_KEY);
      window.localStorage.removeItem(STORAGE_CUSTOM_ACCOUNTS_KEY);
      window.localStorage.removeItem(STORAGE_ACCOUNT_OVERRIDES_KEY);
      window.localStorage.removeItem(STORAGE_HIDDEN_ACCOUNTS_KEY);
      window.localStorage.removeItem(STORAGE_OWNERSHIP_MODES_KEY);
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
    const hasTouchedRange = hasTouchedRangeRef.current;
    if (!hasTouchedRange && flowStep === "idle" && !hasStatement) return;
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
  const startEditingAccount = (acc: TransferAccount) => {
    setEditingAccountId(acc.id);
    setEditingAccountName(acc.label);
    setEditingAccountType(acc.accountType ?? getAccountTypeLabel(acc));
  };
  const resetEditingAccount = () => {
    setEditingAccountId(null);
    setEditingAccountName("");
    setEditingAccountType(accountTypeOptions[0]);
  };
  const handleSaveEditedAccount = (acc: TransferAccount) => {
    if (!editingAccountId) return;
    if (!editingAccountName.trim()) return;
    if (customAccounts.some((c) => c.id === acc.id)) {
      setCustomAccounts((prev) =>
        prev.map((c) =>
          c.id === acc.id ? { ...c, label: editingAccountName.trim(), accountType: editingAccountType } : c,
        ),
      );
    } else {
      setAccountOverrides((prev) => ({
        ...prev,
        [acc.id]: {
          label: editingAccountName.trim(),
          accountType: editingAccountType,
          ending: acc.ending,
        },
      }));
    }
    resetEditingAccount();
  };
  const handleDeleteAccount = (acc: TransferAccount) => {
    if (customAccounts.some((c) => c.id === acc.id)) {
      setCustomAccounts((prev) => prev.filter((c) => c.id !== acc.id));
    } else {
      setHiddenAccountIds((prev) => {
        const next = new Set(prev);
        next.add(acc.id);
        return next;
      });
      setAccountOverrides((prev) => {
        const next = { ...prev };
        delete next[acc.id];
        return next;
      });
    }
    setOwnershipModes((prev) => {
      const next = { ...prev };
      delete next[acc.id];
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_OWNERSHIP_MODES_KEY, JSON.stringify(next));
      }
      return next;
    });
    resetEditingAccount();
  };
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
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 pb-16 pt-10 sm:space-y-8 sm:px-6 sm:pt-12 lg:px-8 lg:pt-16">
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
              <div className="mt-2 flex flex-col gap-3 text-xs text-zinc-300 sm:gap-4 md:flex-row md:items-start md:gap-6">
                <div className="flex w-full flex-col gap-2 rounded-lg border border-zinc-800/80 bg-zinc-900/60 p-3 sm:gap-3 md:w-auto">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
                    From
                  </span>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
                    <label className="flex flex-col gap-1 text-zinc-400" htmlFor="month-from-select">
                      <span>Month</span>
                      <select
                        id="month-from-select"
                        className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-white"
                        value={selectedMonthFrom}
                        onChange={(e) => {
                          hasTouchedRangeRef.current = true;
                          setSelectedMonthFrom(Number(e.target.value));
                        }}
                      >
                        {months.map((m, idx) => (
                          <option key={m} value={idx}>
                            {m}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="flex flex-col gap-1 text-zinc-400" htmlFor="year-from-select">
                      <span>Year</span>
                      <select
                        id="year-from-select"
                        className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-white"
                        value={selectedYearFrom}
                        onChange={(e) => {
                          hasTouchedRangeRef.current = true;
                          setSelectedYearFrom(Number(e.target.value));
                        }}
                      >
                        {yearOptions.map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>
                <div className="flex w-full flex-col gap-2 rounded-lg border border-zinc-800/80 bg-zinc-900/60 p-3 sm:gap-3 md:w-auto">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
                    To
                  </span>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
                    <label className="flex flex-col gap-1 text-zinc-400" htmlFor="month-to-select">
                      <span>Month</span>
                      <select
                        id="month-to-select"
                        className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-white"
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
                    </label>
                    <label className="flex flex-col gap-1 text-zinc-400" htmlFor="year-to-select">
                      <span>Year</span>
                      <select
                        id="year-to-select"
                        className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-white"
                        value={selectedYearTo}
                        onChange={(e) => {
                          hasTouchedRangeRef.current = true;
                          setSelectedYearTo(Number(e.target.value));
                        }}
                      >
                        {yearOptions.map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>
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
                    className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs font-semibold text-black shadow-sm transition hover:bg-zinc-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-white/80 focus-visible:ring-offset-zinc-900 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Analyze this statement
                    <svg
                      className="h-3.5 w-3.5"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden="true"
                    >
                      <path
                        d="M3.75 8h8.5m0 0L9.5 4.75M12.25 8 9.5 11.25"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
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
            <div className="mt-4">
              {showGroupedTable ? (
                <div className="space-y-3">
                  {statementMonths.map((month) => {
                    const isOpen = expandedMonths.has(month.key);
                    const monthTotal = month.transactions.reduce((sum, tx) => sum + tx.amount, 0);
                    return (
                      <div key={month.key} className="rounded-xl border border-zinc-800 bg-zinc-900/70">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedMonths((prev) => {
                              const next = new Set(prev);
                              if (next.has(month.key)) {
                                next.delete(month.key);
                              } else {
                                next.add(month.key);
                              }
                              return next;
                            })
                          }
                          className="flex w-full items-center justify-between rounded-t-xl px-4 py-3 text-left transition hover:bg-zinc-800/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                        >
                          <div>
                            <p className="text-sm font-semibold text-white">{month.label}</p>
                            <p className="text-xs text-zinc-400">
                              {month.transactions.length} transactions · {currency.format(monthTotal)}
                            </p>
                          </div>
                          <svg
                            className={`h-4 w-4 text-zinc-400 transition-transform ${isOpen ? "rotate-90" : ""}`}
                            viewBox="0 0 16 16"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            aria-hidden="true"
                          >
                            <path
                              d="M6 3.75 11 8l-5 4.25"
                              stroke="currentColor"
                              strokeWidth="1.6"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                        {isOpen && (
                          <div className="overflow-x-auto border-t border-zinc-800">
                            <div className="min-w-[520px]">
                              <div className="grid grid-cols-4 bg-zinc-900/80 px-3 py-2 text-left text-xs font-semibold text-zinc-300 sm:px-4 sm:text-sm">
                                <span>Date</span>
                                <span>Description</span>
                                <span>Category</span>
                                <span className="text-right">Amount</span>
                              </div>
                              <div className="divide-y divide-zinc-800">
                                {month.transactions.map((tx) => (
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
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-zinc-800">
                  <div className="min-w-[520px]">
                    <div className="grid grid-cols-4 bg-zinc-900/80 px-3 py-2 text-left text-xs font-semibold text-zinc-300 sm:px-4 sm:text-sm">
                      <span>Date</span>
                      <span>Description</span>
                      <span>Category</span>
                      <span className="text-right">Amount</span>
                    </div>
                    {statementTransactionsSorted.length === 0 ? (
                      <div className="px-3 py-3 text-xs text-zinc-400 sm:px-4 sm:text-sm">
                        No transactions in this view.
                      </div>
                    ) : (
                      <div className="divide-y divide-zinc-800">
                        {statementTransactionsSorted.map((tx) => (
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
              {isEditing && showGroupedTable && (
                <div className="mt-3 rounded-xl border border-zinc-800 bg-zinc-900/70 px-3 py-3 sm:px-4">
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
        <div
          className="space-y-4"
          onTouchStart={handleSwipeStart}
          onTouchMove={handleSwipeMove}
          onTouchEnd={handleSwipeEnd}
        >
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
            <div className="relative pt-2">
              <div className="absolute inset-x-0 top-0 h-px bg-zinc-800" />
              <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-zinc-900 to-transparent sm:hidden" />
              <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-zinc-900 to-transparent sm:hidden" />
              <div className="flex items-center gap-2">
                <div className="flex w-full snap-x snap-mandatory items-center gap-3 overflow-x-auto px-2 pb-2 sm:justify-center">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        setActiveTab(tab.id);
                      }}
                      className={`snap-start rounded-full border px-5 py-3 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${
                        activeTab === tab.id
                          ? "border-zinc-500 bg-zinc-800 text-white shadow-sm"
                          : "border-zinc-700 bg-zinc-900 text-zinc-200 hover:border-zinc-500 hover:bg-zinc-800"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className="hidden sm:inline-flex items-center justify-center rounded-full border border-zinc-800 px-3 py-2 text-xs font-medium text-zinc-300 transition hover:border-zinc-600 hover:bg-zinc-800"
                  onClick={() => handleToggleEditing()}
                >
                  {isEditing ? "Done editing" : "Edit statement transactions"}
                </button>
              </div>
              <button
                type="button"
                className="mt-2 inline-flex items-center justify-center rounded-full border border-zinc-800 px-3 py-2 text-xs font-medium text-zinc-300 transition hover:border-zinc-600 hover:bg-zinc-800 sm:hidden"
                onClick={() => handleToggleEditing()}
              >
                {isEditing ? "Done editing" : "Edit statement transactions"}
              </button>
            </div>
            {activeTab === "overview" && (
              <div className="rounded-xl border border-dashed border-zinc-700 bg-zinc-900/60 px-4 py-6 text-zinc-300 sm:px-6 sm:py-8">
                <h2 className="text-lg font-semibold text-white text-center">Overview</h2>
                <p className="mt-2 text-center text-sm text-zinc-400">
                  Where your money went this month.
                </p>
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
                            <div className="flex items-center gap-3 text-zinc-200">
                              <span
                                aria-hidden="true"
                                className="h-2.5 w-2.5 rounded-full"
                                style={{ backgroundColor: item.color }}
                              />
                              <span className="flex items-center gap-1">
                                <span aria-hidden="true">{item.emoji}</span>
                                <span>{item.label === "Transport" ? "Auto" : item.label}</span>
                              </span>
                            </div>
                            <div className="text-right text-xs text-zinc-400">
                              <div className="text-base font-semibold text-white">{`${item.percent}%`}</div>
                              <div className="text-[11px] text-zinc-500">{currency.format(item.value)}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    {activeSpendingGroupDetails && (
                      <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-900/80 px-4 py-3 text-sm text-zinc-200">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-white">
                            {activeSpendingGroupDetails.emoji}{" "}
                            {activeSpendingGroupDetails.label === "Transport"
                              ? "Auto"
                              : activeSpendingGroupDetails.label}
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
                        <span>{getDisplayCategory(item.category)}</span>
                      </p>
                      <p className="mt-1 text-lg font-semibold text-white">
                        {currency.format(item.amount)}
                      </p>
                    </button>
                  ))}
                </div>
                <div className="mt-6 space-y-2 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white">
                      Transactions for {getDisplayCategory(activeOverviewCategory)}
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
                <h2 className="text-lg font-semibold text-white">Recurring charges</h2>
                <p className="mt-1 text-sm text-zinc-400">
                  Subscriptions, bills, and payments for this month.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  {activeDuplicateIds.size > 0 ? (
                    <p className="text-xs text-amber-200">
                      We spotted charges that look off-pattern. Review them to confirm or dismiss.
                    </p>
                  ) : (
                    <p className="text-xs text-zinc-500">No suspected duplicates right now.</p>
                  )}
                  <button
                    type="button"
                    onClick={(e) => handleOpenDuplicateOverlay(e.currentTarget)}
                    className="ml-auto inline-flex items-center justify-center rounded-full border border-zinc-700 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:border-zinc-500 hover:bg-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                  >
                    Show possible duplicates
                  </button>
                </div>
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
                        const duplicateDecision = duplicateDecisions[row.id];
                        const isDuplicate = activeDuplicateIds.has(row.id);
                        const meta = duplicateMetaById.get(row.id);
                        const lastCharged = meta?.lastNormalDate ?? row.date;
                        return (
                        <div
                          key={row.id}
                          className="grid grid-cols-4 items-center px-3 py-3 text-xs text-zinc-200 sm:px-4 sm:text-sm"
                        >
                          <div className="flex flex-col gap-1">
                            <span className="flex items-center gap-2 truncate" title={row.description}>
                              <span className="truncate">{row.description}</span>
                              {isDuplicate && duplicateDecision !== "dismissed" && (
                                <div className="group relative inline-flex items-center">
                                  <span className="rounded-full border border-amber-300/50 bg-amber-900/30 px-2 py-[2px] text-[10px] font-medium text-amber-100">
                                    possible duplicate
                                  </span>
                                  <div className="pointer-events-none absolute left-0 top-full z-10 mt-2 hidden w-max flex-col gap-2 rounded-lg border border-zinc-700 bg-zinc-900/90 px-3 py-2 text-[11px] text-zinc-200 shadow-lg group-hover:flex group-focus-within:flex">
                                    <div className="flex flex-wrap gap-2">
                                      <button
                                        type="button"
                                        className="rounded-full border border-amber-300/50 px-2 py-[3px] font-semibold text-amber-100 transition hover:border-amber-200 hover:bg-amber-900/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-200/70"
                                        onClick={() => handleConfirmDuplicate(row.id)}
                                      >
                                        Confirm problem
                                      </button>
                                      <button
                                        type="button"
                                        className="rounded-full border border-zinc-700 px-2 py-[3px] font-semibold text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                                        onClick={() => handleDismissDuplicate(row.id)}
                                      >
                                        Dismiss
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </span>
                            <p className="text-[11px] text-zinc-500">
                              Last charged on {dateFormatter.format(new Date(lastCharged))}
                            </p>
                          </div>
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
                  Daily inflow and outflow for this period.
                </p>
                {showGroupedCashflow ? (
                  <div className="mt-4 space-y-3">
                    {cashflowMonths.map((month) => {
                      const isExpanded = expandedCashflowMonths.has(month.key);
                      const toggle = () =>
                        setExpandedCashflowMonths((prev) => {
                          const next = new Set(prev);
                          if (next.has(month.key)) {
                            next.delete(month.key);
                          } else {
                            next.add(month.key);
                          }
                          return next;
                        });
                      return (
                        <div key={month.key} className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
                          <div
                            role="button"
                            tabIndex={0}
                            onClick={toggle}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                toggle();
                              }
                            }}
                            className="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-zinc-800/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                          >
                            <div className="space-y-1 text-sm">
                              <p className="font-semibold text-white">{month.label}</p>
                              <div className="flex flex-wrap gap-4 text-[11px] text-zinc-400">
                                <span>In: {currency.format(month.totalIn)}</span>
                                <span>Out: {currency.format(month.totalOut)}</span>
                                <span
                                  className={`font-semibold ${
                                    month.totalNet >= 0 ? "text-emerald-300" : "text-rose-300"
                                  }`}
                                >
                                  Net: {currency.format(month.totalNet)}
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              aria-label="Toggle daily rows for this month"
                              aria-expanded={isExpanded}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggle();
                              }}
                              className="text-zinc-400 transition hover:text-zinc-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                            >
                              <svg
                                className="h-4 w-4"
                                viewBox="0 0 16 16"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                aria-hidden="true"
                              >
                                <path
                                  d={isExpanded ? "M4 10 8 6l4 4" : "M4 6l4 4 4-4"}
                                  stroke="currentColor"
                                  strokeWidth="1.6"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </button>
                          </div>
                          {isExpanded && (
                            <div className="overflow-x-auto border-t border-zinc-800">
                              <div className="min-w-[520px]">
                                <div className="grid grid-cols-4 bg-zinc-900/80 px-3 py-2 text-left text-xs font-semibold text-zinc-300 sm:px-4 sm:text-sm">
                                  <span>Date</span>
                                  <span className="text-right">Inflow</span>
                                  <span className="text-right">Outflow</span>
                                  <span className="text-right">Net</span>
                                </div>
                                <div className="divide-y divide-zinc-800">
                                  {month.rows.map((row) => {
                                    const isDayExpanded = expandedCashflowDates[row.date];
                                    const dayTransactions = statementTransactions.filter((tx) => tx.date === row.date);
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
                                            className={`text-zinc-400 transition-transform ${isDayExpanded ? "rotate-90" : ""}`}
                                          >
                                            {isDayExpanded ? "▾" : "▸"}
                                          </span>
                                            {currency.format(row.netForThatDate)}
                                          </span>
                                        </button>
                                        {isDayExpanded && (
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
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
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
                          const isDayExpanded = expandedCashflowDates[row.date];
                          const dayTransactions = statementTransactions.filter((tx) => tx.date === row.date);
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
                                    className={`text-zinc-400 transition-transform ${isDayExpanded ? "rotate-90" : ""}`}
                                  >
                                    {isDayExpanded ? "▾" : "▸"}
                                  </span>
                                  {currency.format(row.netForThatDate)}
                                </span>
                              </button>
                              {isDayExpanded && (
                                <div className="border-t border-zinc-800 bg-zinc-900/70 px-4 py-3 text-zinc-200">
                                  {dayTransactions.length === 0 ? (
                                    <p className="text-[11px] text-zinc-400">
                                      No transactions for this day.
                                    </p>
                                  ) : (
                                    <div className="space-y-2 text-[11px] sm:text-xs">
                                      {dayTransactions.map((tx) => (
                                        <div key={tx.id} className="flex items-center justify-between">
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
                )}
              </div>
            )}            {activeTab === "review" && (
              <div className="space-y-4">
                <div className="text-center">
                  <h2 className="text-lg font-semibold text-white">Review</h2>
                  <div className="mt-1 flex items-center justify-center gap-2 text-sm text-zinc-400">
                    <p className="text-sm text-zinc-400">Snapshot for this period across your accounts.</p>
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
                      {feeRows.length > 0 && (
                        <div className="flex justify-between text-xs text-zinc-400">
                          <span>Largest fee</span>
                          <span className="text-white">
                            {currency.format(
                              Math.max(
                                ...feeRows.map((f) => Math.abs(f.amount)),
                              ),
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-5 shadow-sm">
                    <p className="text-sm font-semibold text-white">Top spending categories</p>
                    <div className="mt-3 space-y-2 text-sm">
                      {topSpendingCategories.map((item) => (
                        <div key={item.category} className="flex justify-between">
                          <span className="text-zinc-400">{getDisplayCategory(item.category)}</span>
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
                    <p className="text-sm font-semibold text-white">Internal transfers this period</p>
                    <p className="mt-2 text-xl font-semibold text-white">
                      {currency.format(internalTransfersTotal)}
                    </p>
                    <p className="mt-1 text-xs text-zinc-400">
                      Money moved between your own accounts. Ignored for income and spending.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => handleOpenDuplicateOverlay(e.currentTarget)}
                    className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-600 hover:bg-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-600"
                  >
                    <div className="flex items-center gap-2">
                      <span aria-hidden="true" className="text-amber-300">
                        ⚠️
                      </span>
                      <p className="text-sm font-semibold text-white">Duplicate charges</p>
                    </div>
                    <p className="mt-2 text-xl font-semibold text-white">
                      {duplicateClusters.length === 0
                        ? "No suspected duplicates"
                        : `${duplicateClusters.length} merchant${duplicateClusters.length === 1 ? "" : "s"} with possible duplicates`}
                    </p>
                    <p className="mt-1 text-xs text-zinc-400">
                      Review potential duplicate charges and confirm or dismiss them.
                    </p>
                  </button>
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-5 shadow-sm">
                    <p className="text-sm font-semibold text-white">Money left after bills</p>
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
                              {getDisplayCategory(item.category)}
                            </span>
                            <span className="text-zinc-400">
                              {currency.format(item.actualAmount)}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-zinc-400">
                            {getDisplayCategory(item.category)} is about {actualPercent.toFixed(1)}% of this
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
                      <InfoTip label={"Needs: rent, utilities, groceries, basic fees.\nWants: dining out, shopping, extras."} />
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
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-400">
                      <span>Essentials (needs) {essentialsPercent}%</span>
                      <span>Everything else (wants) {otherPercent}%</span>
                    </div>
                    <div className="mt-3 text-xs text-zinc-300">
                      {netThisMonth > 0 ? (
                        <>
                          <p className="font-semibold text-white">
                            Saved this month: {currency.format(netThisMonth)}
                          </p>
                          <p className="text-[11px] text-zinc-400">
                            {Math.round((netThisMonth / Math.max(totalIncome, 1)) * 100)} percent of income
                          </p>
                        </>
                      ) : netThisMonth === 0 ? (
                        <p className="font-semibold text-white">No net savings this month</p>
                      ) : (
                        <p className="font-semibold text-white">
                          Overspent by {currency.format(Math.abs(netThisMonth))} this month
                        </p>
                      )}
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
                        const isEditingAccount = editingAccountId === acc.id;
                        return (
                          <div
                            key={acc.id}
                            className="group flex flex-col gap-3 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-200"
                          >
                            <div className="grid gap-2 sm:grid-cols-[120px,1fr] sm:items-center">
                              <div className="flex items-center">
                                {isEditingAccount ? (
                                  <select
                                    className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-white"
                                    value={editingAccountType}
                                    onChange={(e) => setEditingAccountType(e.target.value)}
                                  >
                                    {accountTypeOptions.map((opt) => (
                                      <option key={opt} value={opt}>
                                        {opt}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  <span className="w-[110px] rounded-full border border-zinc-700 bg-zinc-800 px-2 py-[2px] text-[11px] font-semibold uppercase tracking-wide text-zinc-200">
                                    {typeLabel}
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-2">
                                {isEditingAccount ? (
                                  <>
                                    <input
                                      type="text"
                                      value={editingAccountName}
                                      onChange={(e) => setEditingAccountName(e.target.value)}
                                      className="min-w-[200px] flex-1 rounded-md border border-zinc-700 bg-zinc-900 px-2 py-2 text-sm text-white"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleSaveEditedAccount(acc)}
                                      className="rounded-full border border-emerald-400 bg-emerald-900/40 px-3 py-1 text-[11px] font-semibold text-emerald-100 transition hover:border-emerald-300 hover:bg-emerald-900"
                                    >
                                      Save
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteAccount(acc)}
                                      className="rounded-full border border-rose-400 bg-rose-900/30 px-3 py-1 text-[11px] font-semibold text-rose-100 transition hover:border-rose-300 hover:bg-rose-900/50"
                                    >
                                      Delete
                                    </button>
                                    <button
                                      type="button"
                                      onClick={resetEditingAccount}
                                      className="rounded-full border border-zinc-700 px-3 py-1 text-[11px] font-semibold text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-800"
                                    >
                                      Cancel
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <span className="font-medium text-white">{displayLabel}</span>
                                    <button
                                      type="button"
                                      aria-label={`Edit ${displayLabel}`}
                                      onClick={() => startEditingAccount(acc)}
                                      className="opacity-0 transition focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 group-hover:opacity-100"
                                    >
                                      <svg
                                        className="h-4 w-4 text-zinc-400"
                                        viewBox="0 0 16 16"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                      >
                                        <path
                                          d="M3.5 10.5 10 4l2 2-6.5 6.5H3.5v-2z"
                                          stroke="currentColor"
                                          strokeWidth="1.4"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                        />
                                      </svg>
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2 sm:pl-[120px]">
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
                                Personal money
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
                                Bills and debt
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
                            Cancel add account
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
      {showDuplicateOverlay && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 px-3 py-6">
          <div
            ref={duplicateOverlayRef}
            tabIndex={-1}
            className="relative w-full max-w-5xl rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl focus:outline-none"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 px-4 py-4 sm:px-5">
              <div>
                <h3 className="text-lg font-semibold text-white">Possible duplicate charges</h3>
                <p className="text-sm text-zinc-400">
                  {duplicateClusters.length === 0
                    ? "No suspected duplicates in this range."
                    : `${activeDuplicateIds.size} suspicious charge${activeDuplicateIds.size === 1 ? "" : "s"} across ${duplicateClusters.length} merchant${duplicateClusters.length === 1 ? "" : "s"}.`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="rounded-full border border-zinc-700 px-3 py-2 text-xs font-semibold text-white transition hover:border-zinc-500 hover:bg-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                  onClick={handleCloseDuplicateOverlay}
                  data-autofocus
                >
                  Close
                </button>
              </div>
            </div>
            <div className="max-h-[70vh] overflow-y-auto p-4 sm:p-5">
              {duplicateClusters.length === 0 ? (
                <p className="text-sm text-zinc-400">
                  We did not find any suspected duplicates for this statement.
                </p>
              ) : (
                <div className="space-y-3">
                  {duplicateClusters.map((cluster) => {
                    const isExpanded = expandedDuplicateClusters.has(cluster.key);
                    const flaggedSet = cluster.flaggedIds;
                    return (
                      <div
                        key={cluster.key}
                        className="rounded-xl border border-zinc-800 bg-zinc-900/70"
                      >
                        <button
                          type="button"
                          onClick={() => toggleDuplicateCluster(cluster.key)}
                          className="flex w-full items-center justify-between rounded-t-xl px-4 py-3 text-left transition hover:bg-zinc-800/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                        >
                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-white">
                              {cluster.label}
                              {cluster.category ? (
                                <span className="text-zinc-400">{` · ${cluster.category}`}</span>
                              ) : null}
                            </p>
                            <p className="text-[11px] text-zinc-400">
                              {cluster.suspiciousTransactions.length} suspicious charge
                              {cluster.suspiciousTransactions.length === 1 ? "" : "s"} ·{" "}
                              {currency.format(cluster.suspiciousTotal)}
                            </p>
                          </div>
                          <svg
                            className={`h-4 w-4 text-zinc-400 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                            viewBox="0 0 16 16"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            aria-hidden="true"
                          >
                            <path
                              d="M6 3.75 11 8l-5 4.25"
                              stroke="currentColor"
                              strokeWidth="1.6"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                        {isExpanded && (
                          <div className="overflow-x-auto border-t border-zinc-800">
                            <div className="min-w-[560px] divide-y divide-zinc-800">
                              <div className="grid grid-cols-5 bg-zinc-900/80 px-3 py-2 text-left text-xs font-semibold text-zinc-300 sm:px-4 sm:text-sm">
                                <span>Date</span>
                                <span>Description</span>
                                <span className="text-right">Amount</span>
                                <span className="text-right">Category</span>
                                <span className="text-right">Actions</span>
                              </div>
                              {cluster.allTransactions.map((tx) => {
                                const decision = duplicateDecisions[tx.id];
                                const isFlagged = flaggedSet.has(tx.id);
                                const showActions = isFlagged && decision !== "dismissed";
                                return (
                                  <div
                                    key={tx.id}
                                    className="grid grid-cols-5 items-center px-3 py-3 text-xs text-zinc-200 sm:px-4 sm:text-sm"
                                  >
                                    <span className="text-zinc-300">
                                      {dateFormatter.format(new Date(tx.date))}
                                    </span>
                                    <span className="truncate pr-2" title={tx.description}>
                                      {tx.description}
                                    </span>
                                    <span
                                      className={`text-right font-semibold ${
                                        tx.amount > 0
                                          ? "text-emerald-400"
                                          : tx.amount < 0
                                            ? "text-red-300"
                                            : "text-zinc-200"
                                      }`}
                                    >
                                      {currency.format(tx.amount)}
                                    </span>
                                    <span className="flex items-center justify-end gap-2 text-right text-zinc-400">
                                      <span>{tx.category}</span>
                                      <span
                                        className={`rounded-full px-2 py-[2px] text-[10px] font-semibold ${
                                          isFlagged ? "border border-amber-300/60 bg-amber-900/40 text-amber-100" : "border border-zinc-700 bg-zinc-800 text-zinc-300"
                                        }`}
                                      >
                                        {isFlagged ? "Suspicious" : "Normal"}
                                      </span>
                                    </span>
                                    <div className="flex justify-end gap-2 text-[11px] text-zinc-400">
                                      {showActions ? (
                                        <>
                                          <button
                                            type="button"
                                            className="rounded-full border border-amber-300/50 px-2 py-[3px] font-semibold text-amber-100 transition hover:border-amber-200 hover:bg-amber-900/50"
                                            onClick={() => handleConfirmDuplicate(tx.id)}
                                          >
                                            Confirm problem
                                          </button>
                                          <button
                                            type="button"
                                            className="rounded-full border border-zinc-700 px-2 py-[3px] font-semibold text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-800"
                                            onClick={() => handleDismissDuplicate(tx.id)}
                                          >
                                            Dismiss
                                          </button>
                                        </>
                                      ) : isFlagged && decision === "dismissed" ? (
                                        <span className="rounded-full border border-zinc-700 px-2 py-[3px] text-[10px] font-semibold text-zinc-300">
                                          Dismissed
                                        </span>
                                      ) : isFlagged && decision === "confirmed" ? (
                                        <span className="rounded-full border border-amber-400/50 bg-amber-900/40 px-2 py-[2px] text-[10px] font-semibold text-amber-100">
                                          Marked as problem
                                        </span>
                                      ) : (
                                        <span className="text-[10px] text-zinc-500">Normal</span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
