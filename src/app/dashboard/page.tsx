"use client"
import { useCallback, useEffect, useMemo, useState } from "react";
import { isInternalTransfer, type OwnershipMode } from "../../lib/fakeData";
import {
  accountTypeOptions,
  categoryOptions,
  internetGuideline,
  STORAGE_FLOW_KEY,
  STORAGE_STATEMENT_KEY,
  STORAGE_TAB_KEY,
  tabs,
  transportGuideline,
} from "../../lib/dashboard/config";
import { getDisplayCategory, getTransactionDisplayCategory } from "../../lib/dashboard/categories";
import type { OverviewGroupKey, TabId } from "../../lib/dashboard/config";
import InfoTip from "./components/InfoTip";
import { useDuplicates } from "./hooks/useDuplicates";
import { useExpansionState } from "./hooks/useExpansionState";
import { useDateRange } from "./hooks/useDateRange";
import { useDerivedMetrics } from "./hooks/useDerivedMetrics";
import { useStatementFlow } from "./hooks/useStatementFlow";
import { useGestureTabs } from "./hooks/useGestureTabs";
import { currency, dateFormatter } from "./utils/format";
import { useOwnershipAccounts } from "./hooks/useOwnershipAccounts";
import { SummaryCards } from "./components/SummaryCards";
import { TabsBar } from "./components/TabsBar";
import { OverviewTab } from "./components/OverviewTab";
import { RecurringTab } from "./components/RecurringTab";
import { FeesTab } from "./components/FeesTab";
import { CashflowTab } from "./components/CashflowTab";
import { StatementPanel } from "./components/StatementPanel";
export default function DemoPage() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [activeOverviewCategory, setActiveOverviewCategory] =
    useState<string>("Rent");
  const [activeSpendingGroup, setActiveSpendingGroup] =
    useState<OverviewGroupKey | null>(null);
  const {
    selectedMonthFrom,
    setSelectedMonthFrom,
    selectedYearFrom,
    setSelectedYearFrom,
    selectedMonthTo,
    setSelectedMonthTo,
    selectedYearTo,
    setSelectedYearTo,
    normalizedRange,
    rangeStartDateString,
    rangeEndDateString,
    yearOptions,
    defaultRange,
    hasTouchedRangeRef,
  } = useDateRange();
  const resetTab = useCallback(() => {
    setActiveTab("overview");
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_TAB_KEY, "overview");
    }
  }, []);
  const {
    flowStep,
    setFlowStep,
    fullStatementTransactions,
    setFullStatementTransactions,
    showStatement,
    setShowStatement,
    isEditing,
    statementTransactions,
    handleStart,
    handleRegenerate,
    handleAnalyze,
    handleRestart,
    handleToggleEditing,
    handleAddTransaction,
  } = useStatementFlow({
    selectedMonthFrom,
    selectedYearFrom,
    selectedMonthTo,
    selectedYearTo,
    defaultRange,
    setSelectedMonthFrom,
    setSelectedYearFrom,
    setSelectedMonthTo,
    setSelectedYearTo,
    rangeStartDateString,
    rangeEndDateString,
    hasTouchedRangeRef,
    resetTab,
  });
  const {
    transferAccounts,
    ownershipModes,
    ownership,
    handleOwnershipModeChange,
    isAddingAccount,
    setIsAddingAccount,
    addAccountName,
    setAddAccountName,
    addAccountType,
    setAddAccountType,
    addBaseTransactionId,
    setAddBaseTransactionId,
    selectedAccountTxIds,
    setSelectedAccountTxIds,
    editingAccountId,
    editingAccountName,
    editingAccountType,
    setEditingAccountType,
    setEditingAccountName,
    startEditingAccount,
    resetEditingAccount,
    handleSaveEditedAccount,
    handleDeleteAccount,
    handleSelectBaseTransaction,
    handleToggleAccountTransaction,
    handleSaveNewAccount,
    suggestedAccountTransactions,
    transferTransactions,
    resetAccounts,
    getAccountTypeLabel,
  } = useOwnershipAccounts({
    fullStatementTransactions,
    statementTransactions,
    setFullStatementTransactions,
  });
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
  const handleRestartAll = () => {
    handleRestart();
    resetDuplicates();
    resetAccounts();
  };
  const { handleSwipeStart, handleSwipeMove, handleSwipeEnd } = useGestureTabs(activeTab, setActiveTab);
  const {
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
  } = useDerivedMetrics({
    statementTransactions,
    ownership,
    ownershipModes,
  });
  const essentialsTotal = categoryBreakdown
    .filter((item) => ["Rent", "Utilities", "Groceries", "Fees"].includes(item.category))
    .reduce((sum, item) => sum + Math.abs(item.amount), 0);
  const essentialsPercent =
    totalIncome > 0 ? Math.min(100, Math.round((essentialsTotal / totalIncome) * 100)) : 0;
  const otherPercent = Math.max(0, 100 - essentialsPercent);
  const {
    expandedMonths,
    setExpandedMonths,
    expandedCashflowMonths,
    setExpandedCashflowMonths,
    expandedCashflowDates,
    setExpandedCashflowDates,
  } = useExpansionState({ showGroupedTable, monthsSignature, cashflowMonths });
  const activeSpendingGroupId = resolvedActiveSpendingGroup(activeSpendingGroup);
  const transportSpend =
    categoryBreakdown.find((item) => item.category === "Transport")?.amount ?? 0;
  const transportPercent =
    totalIncome > 0 ? (Math.abs(transportSpend) / totalIncome) * 100 : 0;
  const internetRecurringSpend = recurringRows
    .filter((row) =>
      /internet|wifi|cable/i.test(row.description),
    )
    .reduce((sum, row) => sum + Math.abs(row.amount), 0);
  const internetPercent =
    totalIncome > 0 ? (internetRecurringSpend / totalIncome) * 100 : 0;
  const leftAfterBills = totalIncome - essentialsTotal;
  const summaryCards = [
    { label: "Net this month", value: currency.format(netThisMonth), to: "review" as TabId },
    { label: "Total income", value: currency.format(totalIncome), to: "cashflow" as TabId },
    { label: "Total spending", value: currency.format(totalSpending), to: "overview" as TabId },
    { label: "Total subscriptions", value: currency.format(totalSubscriptions), to: "recurring" as TabId },
  ];
  const handleUpdateTransactionCategory = (txId: string, newCategory: string) => {
    setFullStatementTransactions((prev) => {
      const updated = prev.map((row) => (row.id === txId ? { ...row, category: newCategory } : row));
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_STATEMENT_KEY, JSON.stringify(updated));
        window.localStorage.setItem(STORAGE_FLOW_KEY, flowStep === "results" ? "results" : "statement");
      }
      return updated;
    });
    if (flowStep === "results") {
      setFlowStep("results");
    }
  };
  const overviewTransactions = useMemo(
    () =>
      statementTransactions.filter(
        (t) =>
          getTransactionDisplayCategory(t) === activeOverviewCategory &&
          !isInternalTransfer(t, ownership, ownershipModes),
      ),
    [activeOverviewCategory, ownership, ownershipModes, statementTransactions],
  );
  const handleSelectSpendingGroup = (groupId: OverviewGroupKey | null) => {
    if (!groupId) return;
    setActiveSpendingGroup(groupId);
  };
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
  const hasResults = flowStep === "results" && fullStatementTransactions.length > 0;
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 pb-16 pt-10 sm:space-y-8 sm:px-6 sm:pt-12 lg:px-8 lg:pt-16">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-zinc-400">Phase one demo using sample data only.</p>
      </header>
      <StatementPanel
        flowStep={flowStep}
        showStatement={showStatement}
        isEditing={isEditing}
        selectedMonthFrom={selectedMonthFrom}
        selectedYearFrom={selectedYearFrom}
        selectedMonthTo={selectedMonthTo}
        selectedYearTo={selectedYearTo}
        yearOptions={yearOptions}
        onStart={handleStart}
        onRegenerate={handleRegenerate}
        onAnalyze={handleAnalyze}
        onToggleEditing={() => handleToggleEditing()}
        onToggleShowStatement={() => setShowStatement((prev) => !prev)}
        setSelectedMonthFrom={(value) => {
          hasTouchedRangeRef.current = true;
          setSelectedMonthFrom(value);
        }}
        setSelectedYearFrom={(value) => {
          hasTouchedRangeRef.current = true;
          setSelectedYearFrom(value);
        }}
        setSelectedMonthTo={(value) => {
          hasTouchedRangeRef.current = true;
          setSelectedMonthTo(value);
        }}
        setSelectedYearTo={(value) => {
          hasTouchedRangeRef.current = true;
          setSelectedYearTo(value);
        }}
        statementMonths={statementMonths}
        showGroupedTable={showGroupedTable}
        expandedMonths={expandedMonths}
        setExpandedMonths={setExpandedMonths}
        statementTransactionsSorted={statementTransactionsSorted}
        statementTransactions={statementTransactions}
        currency={currency}
        dateFormatter={dateFormatter}
        categoryOptions={categoryOptions}
        normalizedRange={normalizedRange}
        onAddTransaction={handleAddTransaction}
        onChangeCategory={handleUpdateTransactionCategory}
      />
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
              onClick={handleRestartAll}
              className="rounded-full border border-zinc-700 px-4 py-2 text-xs font-semibold text-white transition hover:border-zinc-500 hover:bg-zinc-800"
            >
              Start over
            </button>
          </div>
          <SummaryCards cards={summaryCards} onSelect={setActiveTab} />
          <div className="space-y-4">
            <TabsBar activeTab={activeTab} onSelectTab={setActiveTab} isEditing={isEditing} onToggleEditing={handleToggleEditing} />
            {activeTab === "overview" && (
              <OverviewTab
                currency={currency}
                dateFormatter={dateFormatter}
                groupedSpendingData={groupedSpendingData}
                activeSpendingGroupId={activeSpendingGroupId}
                onSelectSpendingGroup={handleSelectSpendingGroup}
                categoryBreakdown={categoryBreakdown}
                activeOverviewCategory={activeOverviewCategory}
                onSelectOverviewCategory={setActiveOverviewCategory}
                overviewTransactions={overviewTransactions}
                flowStep={flowStep}
              />
            )}
            {activeTab === "recurring" && (
              <RecurringTab
                currency={currency}
                dateFormatter={dateFormatter}
                recurringRows={recurringRows}
                duplicateDecisions={duplicateDecisions}
                activeDuplicateIds={activeDuplicateIds}
                duplicateMetaById={duplicateMetaById}
                handleOpenDuplicateOverlay={handleOpenDuplicateOverlay}
                handleConfirmDuplicate={handleConfirmDuplicate}
                handleDismissDuplicate={handleDismissDuplicate}
                flowStep={flowStep}
              />
            )}
            {activeTab === "fees" && (
              <FeesTab currency={currency} dateFormatter={dateFormatter} feeRows={feeRows} totalFees={totalFees} />
            )}
            {activeTab === "cashflow" && (
              <CashflowTab
                currency={currency}
                dateFormatter={dateFormatter}
                statementTransactions={statementTransactions}
                cashFlowRows={cashFlowRows}
                cashflowMonths={cashflowMonths}
                showGroupedCashflow={showGroupedCashflow}
                expandedCashflowMonths={expandedCashflowMonths}
                setExpandedCashflowMonths={setExpandedCashflowMonths}
                expandedCashflowDates={expandedCashflowDates}
                setExpandedCashflowDates={setExpandedCashflowDates}
              />
            )}
            {activeTab === "review" && (
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
