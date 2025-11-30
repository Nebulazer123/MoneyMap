"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  accountTypeOptions,
  categoryOptions,
  internetGuideline,
  STORAGE_FLOW_KEY,
  STORAGE_STATEMENT_KEY,
  STORAGE_TAB_KEY,
  transportGuideline,
  type OverviewGroupKey,
  type TabId,
} from "../../lib/dashboard/config";
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
import { ReviewTab } from "./components/ReviewTab";

export default function DemoPage() {
  const [activeTab, setActiveTab] = useState<TabId>(() => {
    if (typeof window === "undefined") return "overview";
    return (window.localStorage.getItem(STORAGE_TAB_KEY) as TabId) ?? "overview";
  });
  const [activeSpendingGroup, setActiveSpendingGroup] = useState<OverviewGroupKey | null>(null);

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
    ownership,
    ownershipModes,
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

  const handleRestartAll = useCallback(() => {
    handleRestart();
    resetDuplicates();
    resetAccounts();
  }, [handleRestart, resetAccounts, resetDuplicates]);

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
  } = useDerivedMetrics({
    statementTransactions,
    ownership,
    ownershipModes,
  });
  const summaryStatsForReview = useMemo(
    () => ({
      totalIncome,
      totalSpending,
      net: netThisMonth,
      subscriptionCount: subscriptionRows.length,
      totalSubscriptions,
      totalFees,
      internalTransfersTotal,
    }),
    [
      totalIncome,
      totalSpending,
      netThisMonth,
      subscriptionRows.length,
      totalSubscriptions,
      totalFees,
      internalTransfersTotal,
    ],
  );

  const {
    expandedMonths,
    setExpandedMonths,
    expandedCashflowMonths,
    setExpandedCashflowMonths,
    expandedCashflowDates,
    setExpandedCashflowDates,
  } = useExpansionState({ showGroupedTable, monthsSignature, cashflowMonths });

  const summaryCards = useMemo(
    () => [
      { label: "Net this month", value: currency.format(netThisMonth), to: "review" as TabId },
      { label: "Total income", value: currency.format(totalIncome), to: "cashflow" as TabId },
      { label: "Total spending", value: currency.format(totalSpending), to: "overview" as TabId },
      { label: "Total subscriptions", value: currency.format(totalSubscriptions), to: "recurring" as TabId },
    ],
    [netThisMonth, totalIncome, totalSpending, totalSubscriptions],
  );

  const handleUpdateTransactionCategory = useCallback(
    (txId: string, newCategory: string) => {
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
    },
    [flowStep, setFlowStep, setFullStatementTransactions],
  );

  const activeSpendingGroupId = resolvedActiveSpendingGroup(activeSpendingGroup);
  const overviewTransactions = activeSpendingGroupId
    ? groupedTransactionsByGroup.get(activeSpendingGroupId) ?? []
    : [];
  const hasResults = flowStep === "results" && statementTransactions.length > 0;

  const { totalInflowStatement, totalOutflowStatement, netStatement } = useMemo(() => {
    const totals = statementTransactions.reduce(
      (acc, tx) => {
        if (tx.amount > 0) acc.in += tx.amount;
        if (tx.amount < 0) acc.out += Math.abs(tx.amount);
        return acc;
      },
      { in: 0, out: 0 },
    );
    return {
      totalInflowStatement: totals.in,
      totalOutflowStatement: totals.out,
      netStatement: totals.in - totals.out,
    };
  }, [statementTransactions]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_TAB_KEY, activeTab);
  }, [activeTab]);

  return (
    <div
      className="mx-auto w-full max-w-6xl space-y-6 px-4 pb-16 pt-10 sm:space-y-8 sm:px-6 sm:pt-12 lg:px-8 lg:pt-16"
      onTouchStart={handleSwipeStart}
      onTouchMove={handleSwipeMove}
      onTouchEnd={handleSwipeEnd}
    >
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
        totalInflowStatement={totalInflowStatement}
        totalOutflowStatement={totalOutflowStatement}
        netStatement={netStatement}
      />

      {hasResults && (
        <SummaryCards
          cards={summaryCards}
          onSelect={(tab) => {
            setActiveTab(tab);
            if (typeof window !== "undefined") {
              window.localStorage.setItem(STORAGE_TAB_KEY, tab);
            }
          }}
        />
      )}

      {flowStep === "results" && (
        <TabsBar activeTab={activeTab} onSelectTab={setActiveTab} isEditing={isEditing} onToggleEditing={handleToggleEditing} />
      )}

      {flowStep === "results" && activeTab === "overview" && (
        <OverviewTab
          currency={currency}
          dateFormatter={dateFormatter}
          groupedSpendingData={groupedSpendingData}
          activeGroupId={activeSpendingGroupId}
          onSelectGroup={(groupId) => setActiveSpendingGroup(groupId)}
          categoryBreakdown={categoryBreakdown}
          overviewTransactions={overviewTransactions}
          flowStep={flowStep}
        />
      )}

      {flowStep === "results" && activeTab === "recurring" && (
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

      {flowStep === "results" && activeTab === "fees" && (
        <FeesTab currency={currency} dateFormatter={dateFormatter} feeRows={feeRows} totalFees={totalFees} />
      )}

      {flowStep === "results" && activeTab === "cashflow" && (
        <CashflowTab
          currency={currency}
          dateFormatter={dateFormatter}
          statementTransactions={statementTransactions}
          cashflowMonths={cashflowMonths}
          expandedCashflowMonths={expandedCashflowMonths}
          setExpandedCashflowMonths={setExpandedCashflowMonths}
          expandedCashflowDates={expandedCashflowDates}
          setExpandedCashflowDates={setExpandedCashflowDates}
          cashFlowRows={cashFlowRows}
          internalTransfersTotal={internalTransfersTotal}
          showGroupedCashflow={showGroupedCashflow}
          flowStep={flowStep}
        />
      )}

      {flowStep === "results" && activeTab === "review" && (
        <ReviewTab
          currency={currency}
          dateFormatter={dateFormatter}
          summaryStats={summaryStatsForReview}
          feeRows={feeRows}
          topSpendingCategories={topSpendingCategories}
          duplicateClusters={duplicateClusters}
          subscriptionRows={subscriptionRows}
          leftAfterBills={leftAfterBills}
          budgetGuidance={budgetGuidance}
          transportPercent={transportPercent}
          transportGuideline={transportGuideline}
          internetPercent={internetPercent}
          internetGuideline={internetGuideline}
          essentialsPercent={essentialsPercent}
          otherPercent={otherPercent}
          netThisMonth={netThisMonth}
          totalIncome={totalIncome}
          duplicateMetaById={duplicateMetaById}
          duplicateDecisions={duplicateDecisions}
          activeDuplicateIds={activeDuplicateIds}
          handleOpenDuplicateOverlay={handleOpenDuplicateOverlay}
          transferAccounts={transferAccounts}
          ownership={ownership}
          ownershipModes={ownershipModes}
          handleOwnershipModeChange={handleOwnershipModeChange}
          editingAccountId={editingAccountId}
          editingAccountName={editingAccountName}
          editingAccountType={editingAccountType}
          setEditingAccountName={setEditingAccountName}
          setEditingAccountType={setEditingAccountType}
          startEditingAccount={startEditingAccount}
          handleSaveEditedAccount={handleSaveEditedAccount}
          handleDeleteAccount={handleDeleteAccount}
          resetEditingAccount={resetEditingAccount}
          accountTypeOptions={accountTypeOptions}
          isAddingAccount={isAddingAccount}
          setIsAddingAccount={setIsAddingAccount}
          addAccountName={addAccountName}
          setAddAccountName={setAddAccountName}
          addAccountType={addAccountType}
          setAddAccountType={setAddAccountType}
          addBaseTransactionId={addBaseTransactionId}
          setAddBaseTransactionId={setAddBaseTransactionId}
          transferTransactions={transferTransactions}
          suggestedAccountTransactions={suggestedAccountTransactions}
          selectedAccountTxIds={selectedAccountTxIds}
          setSelectedAccountTxIds={setSelectedAccountTxIds}
          handleSelectBaseTransaction={handleSelectBaseTransaction}
          handleToggleAccountTransaction={handleToggleAccountTransaction}
          handleSaveNewAccount={handleSaveNewAccount}
        />
      )}

      {showDuplicateOverlay && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 px-3 py-6">
          <div
            ref={duplicateOverlayRef}
            tabIndex={-1}
            className="w-full max-w-5xl rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl outline-none"
          >
            <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-4 sm:px-5">
              <h3 className="text-lg font-semibold text-white">Possible duplicate charges</h3>
              <button
                type="button"
                className="rounded-full border border-zinc-700 px-3 py-2 text-xs font-semibold text-white transition hover:border-zinc-500 hover:bg-zinc-800"
                onClick={handleCloseDuplicateOverlay}
              >
                Close
              </button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto p-4 sm:p-5 space-y-3 text-sm text-zinc-200">
              {duplicateClusters.length === 0 ? (
                <p className="text-zinc-400">No suspected duplicates for this statement.</p>
              ) : (
                duplicateClusters.map((cluster) => {
                  const isExpanded = expandedDuplicateClusters.has(cluster.key);
                  return (
                    <div key={cluster.key} className="rounded-xl border border-zinc-800 bg-zinc-900/70">
                      <button
                        type="button"
                        onClick={() => toggleDuplicateCluster(cluster.key)}
                        className="flex w-full items-center justify-between px-4 py-3 text-left text-white transition hover:bg-zinc-800/60"
                      >
                        <span>{cluster.label}</span>
                        <span className="text-xs text-zinc-400">
                          {cluster.suspiciousTransactions.length} suspicious · {currency.format(cluster.suspiciousTotal)}
                        </span>
                      </button>
                      {isExpanded && (
                        <div className="divide-y divide-zinc-800 text-xs text-zinc-200">
                          {cluster.allTransactions.map((tx) => {
                            const decision = duplicateDecisions[tx.id];
                            const isFlagged = cluster.flaggedIds.has(tx.id);
                            return (
                              <div key={tx.id} className="grid grid-cols-5 items-center px-4 py-2">
                                <span className="text-zinc-400">{dateFormatter.format(new Date(tx.date))}</span>
                                <span className="truncate pr-2" title={tx.description}>
                                  {tx.description}
                                </span>
                                <span
                                  className={`text-right font-semibold ${
                                    tx.amount > 0 ? "text-emerald-400" : tx.amount < 0 ? "text-red-300" : "text-zinc-200"
                                  }`}
                                >
                                  {currency.format(tx.amount)}
                                </span>
                                <span className="text-right text-zinc-400">{tx.category}</span>
                                <div className="flex justify-end gap-2">
                                  {isFlagged && decision !== "dismissed" ? (
                                    <>
                                      <button
                                        type="button"
                                        className="rounded-full border border-amber-300/60 px-2 py-[3px] text-[10px] font-semibold text-amber-100"
                                        onClick={() => handleConfirmDuplicate(tx.id)}
                                      >
                                        Confirm
                                      </button>
                                      <button
                                        type="button"
                                        className="rounded-full border border-zinc-700 px-2 py-[3px] text-[10px] font-semibold text-zinc-200"
                                        onClick={() => handleDismissDuplicate(tx.id)}
                                      >
                                        Dismiss
                                      </button>
                                    </>
                                  ) : decision === "dismissed" ? (
                                    <span className="text-[10px] text-zinc-500">Dismissed</span>
                                  ) : decision === "confirmed" ? (
                                    <span className="text-[10px] text-amber-200">Marked</span>
                                  ) : (
                                    <span className="text-[10px] text-zinc-500">Normal</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 text-xs text-zinc-400">
        <button
          type="button"
          onClick={handleRestartAll}
          className="rounded-full border border-zinc-700 px-3 py-2 font-semibold text-white transition hover:border-zinc-500 hover:bg-zinc-800"
        >
          Restart demo
        </button>
        <span className="text-zinc-500">
          Data generated locally. Internal transfers excluded from spending total: {currency.format(internalTransfersTotal)}
        </span>
      </div>
    </div>
  );
}
