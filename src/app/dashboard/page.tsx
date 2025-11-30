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
import { TabsBar } from "./components/TabsBar";
import { OverviewTab } from "./components/OverviewTab";
import { RecurringTab } from "./components/RecurringTab";
import { FeesTab } from "./components/FeesTab";
import { CashflowTab } from "./components/CashflowTab";
import { StatementPanel } from "./components/StatementPanel";
import { ReviewTab } from "./components/ReviewTab";
import { DuplicateOverlay } from "./components/DuplicateOverlay";
import { GlassPanel } from "./components/GlassPanel";
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
    detectedAccountCandidates,
    candidateDrafts,
    handleUpdateCandidateDraft,
    handleSaveDetectedAccount,
    handleCancelCandidate,
  } = useOwnershipAccounts({
    fullStatementTransactions,
    statementTransactions,
    setFullStatementTransactions,
  });

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
  } = useDuplicates(recurringRows);

  const handleRestartAll = useCallback(() => {
    handleRestart();
    resetDuplicates();
    resetAccounts();
  }, [handleRestart, resetAccounts, resetDuplicates]);

  const { handleSwipeStart, handleSwipeMove, handleSwipeEnd } = useGestureTabs(activeTab, setActiveTab);

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

  const showResults = flowStep === "results";
  const hasResults = showResults && statementTransactions.length > 0;

  const summaryTiles = useMemo(
    () => {
      const placeholderValue = "—";
      const placeholderSubtext = "Run the analysis to see totals";
      const formatValue = (amount: number) => (hasResults ? currency.format(amount) : placeholderValue);
      const formatSubtext = (copy: string) => (hasResults ? copy : placeholderSubtext);
      return [
        {
          label: "Income this period",
          value: formatValue(totalIncome),
          subtext: formatSubtext("Money in after taxes"),
          icon: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          ),
          color: "text-emerald-400",
          borderColor: "border-l-emerald-500/40",
        },
        {
          label: "Spending this period",
          value: formatValue(totalSpending),
          subtext: formatSubtext("Out the door on everything"),
          icon: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          ),
          color: "text-rose-400",
          borderColor: "border-l-rose-500/40",
        },
        {
          label: "Net cash flow",
          value: formatValue(netThisMonth),
          subtext: formatSubtext("What is left after the dust settles"),
          icon: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
          ),
          color: netThisMonth >= 0 ? "text-emerald-400" : "text-rose-400",
          borderColor: netThisMonth >= 0 ? "border-l-emerald-500/40" : "border-l-rose-500/40",
        },
        {
          label: "Subscriptions and bills",
          value: formatValue(totalSubscriptions),
          subtext: formatSubtext("Auto charges that hit every month"),
          icon: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          ),
          color: "text-purple-400",
          borderColor: "border-l-purple-500/40",
        },
        {
          label: "Fees and charges",
          value: formatValue(totalFees),
          subtext: formatSubtext("Bank and card fees for this range"),
          icon: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          color: "text-amber-400",
          borderColor: "border-l-amber-500/40",
        },
      ];
    },
    [hasResults, netThisMonth, totalFees, totalIncome, totalSpending, totalSubscriptions],
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
      {showResults && (
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 sm:gap-4 animate-fade-rise">
          {summaryTiles.map((tile) => (
            <GlassPanel
              key={tile.label}
              variant="card"
              tabIndex={0}
              className={`h-full transform transition border-l-4 ${tile.borderColor} hover:-translate-y-0.5 hover:border-white/30 hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)] focus-visible:-translate-y-0.5 focus-visible:border-white/30 focus-visible:ring-2 focus-visible:ring-purple-300/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900`}
            >
              <div className="flex h-full flex-col gap-3">
                <div className="flex items-start justify-between">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-purple-100/70">{tile.label}</p>
                  <div className={`flex-shrink-0 transition-transform duration-300 ${tile.color}`}>
                    {tile.icon}
                  </div>
                </div>
                <div>
                  <p className={`text-xl font-semibold sm:text-2xl ${tile.color}`}>{tile.value}</p>
                  <p className="text-[11px] text-zinc-400 mt-1">{tile.subtext}</p>
                </div>
              </div>
            </GlassPanel>
          ))}
        </div>
      )}
      <GlassPanel variant="hero" className="space-y-6 sm:space-y-8 animate-fade-rise">
        {showResults && (
          <TabsBar activeTab={activeTab} onSelectTab={setActiveTab} isEditing={isEditing} onToggleEditing={handleToggleEditing} />
        )}

        {showResults && activeTab === "overview" && (
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

        {showResults && activeTab === "recurring" && (
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

        {showResults && activeTab === "fees" && (
          <FeesTab currency={currency} dateFormatter={dateFormatter} feeRows={feeRows} totalFees={totalFees} />
        )}

        {showResults && activeTab === "cashflow" && (
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

        {showResults && activeTab === "review" && (
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
            detectedAccountCandidates={detectedAccountCandidates}
            candidateDrafts={candidateDrafts}
            handleUpdateCandidateDraft={handleUpdateCandidateDraft}
            handleSaveDetectedAccount={handleSaveDetectedAccount}
            handleCancelCandidate={handleCancelCandidate}
          />
        )}
      </GlassPanel>

      {showDuplicateOverlay && (
        <DuplicateOverlay
          duplicateClusters={duplicateClusters}
          duplicateDecisions={duplicateDecisions}
          expandedDuplicateClusters={expandedDuplicateClusters}
          toggleDuplicateCluster={toggleDuplicateCluster}
          handleCloseDuplicateOverlay={handleCloseDuplicateOverlay}
          handleConfirmDuplicate={handleConfirmDuplicate}
          handleDismissDuplicate={handleDismissDuplicate}
          duplicateOverlayRef={duplicateOverlayRef}
          currency={currency}
          dateFormatter={dateFormatter}
        />
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
