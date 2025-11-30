"use client"
import { useCallback, useEffect, useMemo, useState } from "react";
import { isInternalTransfer, type OwnershipMode } from "../../lib/fakeData";
import {
  accountTypeOptions,
  categoryOptions,
  internetGuideline,
  months,
  STORAGE_FLOW_KEY,
  STORAGE_STATEMENT_KEY,
  STORAGE_TAB_KEY,
  tabs,
  transportGuideline,
} from "../../lib/dashboard/config";
import { getDisplayCategory, getTransactionDisplayCategory } from "../../lib/dashboard/categories";
import type { OverviewGroupKey, TabId } from "../../lib/dashboard/config";
import AddTransactionRow from "./components/AddTransactionRow";
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
