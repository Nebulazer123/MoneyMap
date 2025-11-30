import { useMemo } from "react";

import {
  getNetThisMonth,
  getTotalFees,
  getTotalIncome,
  getTotalSpending,
  getTotalSubscriptions,
  getSubscriptionTransactions,
  getFeeTransactions,
  getCashFlowByDate,
  getSummaryStats,
  getInternalTransfersTotal,
  getBudgetGuidance,
  isInternalTransfer,
  isRealSpending,
  type Transaction,
  type OwnershipMap,
  type OwnershipMode,
} from "../../../lib/fakeData";
import {
  getOverviewGroupForCategory,
  getTransactionDisplayCategory,
} from "../../../lib/dashboard/categories";
import { overviewGroupMeta, overviewGroupOrder, type OverviewGroupKey, months } from "../../../lib/dashboard/config";

export function useDerivedMetrics({
  statementTransactions,
  ownership,
  ownershipModes,
}: {
  statementTransactions: Transaction[];
  ownership: OwnershipMap;
  ownershipModes: Record<string, OwnershipMode>;
}) {
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

  const totalIncome = getTotalIncome(statementTransactions, ownership, ownershipModes);
  const totalSpending = getTotalSpending(statementTransactions, ownership, ownershipModes);
  const netThisMonth = getNetThisMonth(statementTransactions, ownership, ownershipModes);
  const totalSubscriptions = getTotalSubscriptions(statementTransactions, ownership, ownershipModes);

  const internalTransfersTotal = useMemo(
    () => getInternalTransfersTotal(statementTransactions, ownership, ownershipModes),
    [ownership, ownershipModes, statementTransactions],
  );

  const subscriptionRows = getSubscriptionTransactions(statementTransactions, ownership, ownershipModes);
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

  // Essentials vs everything else
  const essentialsBuckets = ["Rent", "Groceries", "Bills & services", "Insurance", "Loans", "Education", "Health", "Transport"];

  const essentialsTotal = essentialsBuckets.reduce(
    (sum, cat) => sum + (categoryAmountMap.get(cat) ?? 0),
    0,
  );

  const leftAfterBills = totalIncome - essentialsTotal;

  const transportSpend = categoryAmountMap.get("Transport") ?? 0;
  const internetSpend = categoryAmountMap.get("Bills & services") ?? 0;

  const transportPercent = totalIncome > 0 ? (transportSpend / totalIncome) * 100 : 0;
  const internetPercent = totalIncome > 0 ? (internetSpend / totalIncome) * 100 : 0;

  const essentialsPercent = (() => {
    const totalEssentials = essentialsTotal;
    const totalOther = Math.max(totalSpending - essentialsTotal, 0);
    const denom = totalEssentials + totalOther;
    return denom > 0 ? Math.round((totalEssentials / denom) * 100) : 0;
  })();

  const otherPercent = Math.max(0, 100 - essentialsPercent);

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
      .filter((item): item is typeof baseBudgetGuidance[number] => Boolean(item));
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

  const groupedTransactionsByGroup = useMemo(() => {
    const map = new Map<OverviewGroupKey, Transaction[]>();
    overviewGroupOrder.forEach((groupId) => map.set(groupId, []));
    statementTransactions.forEach((tx) => {
      if (!isRealSpending(tx, ownership, ownershipModes)) return;
      const displayCategory = getTransactionDisplayCategory(tx);
      const groupId = getOverviewGroupForCategory(displayCategory) ?? "other_fees";
      const list = map.get(groupId);
      if (!list) return;
      list.push(tx);
    });
    map.forEach((list) => {
      list.sort((a, b) => Date.parse(`${a.date}T00:00:00Z`) - Date.parse(`${b.date}T00:00:00Z`));
    });
    return map;
  }, [ownership, ownershipModes, statementTransactions]);

  const groupedSpendingData = useMemo(() => {
    const groups = overviewGroupOrder.map((groupId) => {
      const meta = overviewGroupMeta[groupId];
      const transactions = groupedTransactionsByGroup.get(groupId) ?? [];
      const categoryTotals = new Map<string, number>();
      transactions.forEach((tx) => {
        const displayCategory = getTransactionDisplayCategory(tx);
        const prev = categoryTotals.get(displayCategory) ?? 0;
        categoryTotals.set(displayCategory, prev + Math.abs(tx.amount));
      });
      const categories = Array.from(categoryTotals.entries()).map(([name, amount]) => ({
        name,
        amount,
      }));
      const value = categories.reduce((sum, entry) => sum + entry.amount, 0);
      return {
        id: groupId,
        label: meta.label,
        value,
        categories,
        color: meta.color,
        emoji: meta.emoji,
      };
    });
    const filtered = groups.filter((group) => group.value > 0);
    const total = filtered.reduce((sum, group) => sum + group.value, 0);
    return filtered.map((group) => ({
      ...group,
      percent: total > 0 ? Math.round((group.value / total) * 100) : 0,
    }));
  }, [groupedTransactionsByGroup]);

  const resolvedActiveSpendingGroup = (activeSpendingGroup: OverviewGroupKey | null) =>
    activeSpendingGroup ?? groupedSpendingData[0]?.id ?? null;

  return {
    statementTransactionsSorted,
    statementMonths,
    showGroupedTable,
    monthsSignature,
    cashFlowRows,
    cashflowMonths,
    showGroupedCashflow,
    totalIncome,
    totalSpending,
    netThisMonth,
    totalSubscriptions,
    internalTransfersTotal,
    feeRows,
    totalFees,
    recurringRows,
    categoryBreakdown,
    summaryStats,
    budgetGuidance,
    topSpendingCategories,
    groupedSpendingData,
    resolvedActiveSpendingGroup,
    groupedTransactionsByGroup,
    subscriptionRows,
    leftAfterBills,
    transportPercent,
    internetPercent,
    essentialsPercent,
    otherPercent,
  };
}
