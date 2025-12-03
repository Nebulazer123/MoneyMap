import React, { useMemo, useState } from "react";

import type { DuplicateClusterView } from "../../../lib/dashboard/duplicates";
import type { Transaction, OwnershipMode } from "../../../lib/fakeData";
import type { TransferAccount } from "../hooks/useOwnershipAccounts";
import InfoTip from "./InfoTip";
import { SubscriptionsOverlay } from "./SubscriptionsOverlay";
import { SectionHeader } from "./SectionHeader";
import { GlassPanel } from "./GlassPanel";

export type BudgetItem = {
  category: string;
  actualAmount: number;
  recommendedAmount: number;
  differenceAmount: number;
  differenceDirection: "over" | "under";
};

type Props = {
  currency: Intl.NumberFormat;
  dateFormatter: Intl.DateTimeFormat;
  summaryStats: {
    totalIncome: number;
    totalSpending: number;
    net: number;
    subscriptionCount: number;
    totalSubscriptions: number;
    totalFees: number;
    internalTransfersTotal: number;
  };
  subscriptionRows: Transaction[];
  feeRows: Transaction[];
  topSpendingCategories: { category: string; amount: number }[];
  duplicateClusters: DuplicateClusterView[];
  leftAfterBills: number;
  budgetGuidance: BudgetItem[];
  transportPercent: number;
  transportGuideline: number;
  internetPercent: number;
  internetGuideline: number;
  essentialsPercent: number;
  otherPercent: number;
  netThisMonth: number;
  totalIncome: number;
  handleOpenDuplicateOverlay: (trigger?: HTMLElement | null) => void;
  transferAccounts: TransferAccount[];
  ownership: Record<string, boolean>;
  ownershipModes: Record<string, OwnershipMode>;
  handleOwnershipModeChange: (id: string, mode: OwnershipMode) => void;
  editingAccountId: string | null;
  editingAccountName: string;
  editingAccountType: string;
  setEditingAccountName: (name: string) => void;
  setEditingAccountType: (type: string) => void;
  startEditingAccount: (acc: TransferAccount) => void;
  handleSaveEditedAccount: (acc: TransferAccount) => void;
  handleDeleteAccount: (acc: TransferAccount) => void;
  resetEditingAccount: () => void;
  accountTypeOptions: readonly string[];
  isAddingAccount: boolean;
  setIsAddingAccount: React.Dispatch<React.SetStateAction<boolean>>;
  addAccountName: string;
  setAddAccountName: (name: string) => void;
  addAccountType: string;
  setAddAccountType: React.Dispatch<React.SetStateAction<string>>;
  addBaseTransactionId: string;
  setAddBaseTransactionId: (id: string) => void;
  transferTransactions: Transaction[];
  unassignedTransferTransactions: Transaction[];
  assignedTransactionIds: Set<string>;
  attachTransactionsToAccount: (accountId: string, txIds: string[]) => void;
  suggestedAccountTransactions: Transaction[];
  selectedAccountTxIds: Set<string>;
  setSelectedAccountTxIds: (next: Set<string>) => void;
  handleSelectBaseTransaction: (id: string) => void;
  handleToggleAccountTransaction: (id: string) => void;
  handleSaveNewAccount: () => void;
  detectedAccountCandidates: {
    key: string;
    label: string;
    ending?: string;
    accountType: string;
    transactions: { tx: Transaction; side: "source" | "target" }[];
    count: number;
  }[];
  candidateDrafts: Record<string, { name: string; accountType: string; mode: OwnershipMode; expanded: boolean }>;
  handleUpdateCandidateDraft: (key: string, draft: Partial<{ name: string; accountType: string; mode: OwnershipMode; expanded: boolean }>) => void;
  handleSaveDetectedAccount: (candidate: {
    key: string;
    label: string;
    ending?: string;
    accountType: string;
    transactions: { tx: Transaction; side: "source" | "target" }[];
    count: number;
  }) => void;
  handleCancelCandidate: (key: string) => void;
};

export function ReviewTab({
  currency,
  dateFormatter,
  summaryStats,
  subscriptionRows,
  feeRows,
  topSpendingCategories,
  duplicateClusters,
  leftAfterBills,
  budgetGuidance,
  transportPercent,
  transportGuideline,
  internetPercent,
  internetGuideline,
  essentialsPercent,
  otherPercent,
  netThisMonth,
  totalIncome,
  handleOpenDuplicateOverlay,
  transferAccounts,
  ownershipModes,
  ownership,
  handleOwnershipModeChange,
  editingAccountId,
  editingAccountName,
  editingAccountType,
  setEditingAccountName,
  setEditingAccountType,
  startEditingAccount,
  handleSaveEditedAccount,
  handleDeleteAccount,
  resetEditingAccount,
  accountTypeOptions,
  isAddingAccount,
  setIsAddingAccount,
  addAccountName,
  setAddAccountName,
  addAccountType,
  setAddAccountType,
  addBaseTransactionId,
  setAddBaseTransactionId,
  unassignedTransferTransactions,
  attachTransactionsToAccount,
  suggestedAccountTransactions,
  selectedAccountTxIds,
  setSelectedAccountTxIds,
  handleSelectBaseTransaction,
  handleToggleAccountTransaction,
  handleSaveNewAccount,
  detectedAccountCandidates,
  candidateDrafts,
  handleUpdateCandidateDraft,
  handleSaveDetectedAccount,
  handleCancelCandidate,
}: Props) {
  const [isSubscriptionsOverlayOpen, setIsSubscriptionsOverlayOpen] = useState(false);
  const [selectedExistingAccountId, setSelectedExistingAccountId] = useState<string>("");
  const hasSubscriptions = subscriptionRows.length > 0;
  
  // Normalize transfer description to extract counterparty name
  const normalizeCounterpartyName = (description: string): string => {
    // Strip "Transfer to/from" prefix
    const cleaned = description.replace(/^transfer\s+(to|from)\s+/i, "").trim();
    return cleaned;
  };
  
  // Sort unassigned transactions by counterparty name, then by date
  const sortedUnassignedTransactions = useMemo(() => {
    return [...unassignedTransferTransactions].sort((a, b) => {
      const nameA = normalizeCounterpartyName(a.description).toLowerCase();
      const nameB = normalizeCounterpartyName(b.description).toLowerCase();
      
      if (nameA !== nameB) {
        return nameA.localeCompare(nameB);
      }
      
      // Same counterparty, sort by date
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  }, [unassignedTransferTransactions]);
  
  // Check if creating a new account would duplicate an existing one
  const wouldCreateDuplicate = (accountName: string): TransferAccount | null => {
    const normalizedInput = accountName.toLowerCase().trim();
    
    for (const acc of transferAccounts) {
      const normalizedExisting = acc.label.toLowerCase().trim();
      if (normalizedExisting === normalizedInput) {
        return acc;
      }
      
      // Also check with "ending XXXX" pattern
      if (acc.ending) {
        const withEnding = `${normalizedExisting} ending ${acc.ending}`;
        if (withEnding === normalizedInput || normalizedInput.includes(normalizedExisting)) {
          return acc;
        }
      }
    }
    
    return null;
  };
  
  // Handle save with duplicate detection
  const handleSaveWithDuplicateCheck = () => {
    if (selectedExistingAccountId) {
      // Attaching to existing account
      const txIds = Array.from(selectedAccountTxIds);
      attachTransactionsToAccount(selectedExistingAccountId, txIds);
      
      // Reset form
      setIsAddingAccount(false);
      setAddAccountName("");
      setAddAccountType("Checking");
      setAddBaseTransactionId("");
      setSelectedAccountTxIds(new Set());
      setSelectedExistingAccountId("");
    } else {
      // Creating new account - check for duplicates
      const duplicate = wouldCreateDuplicate(addAccountName);
      if (duplicate) {
        const confirmAttach = window.confirm(
          `An account named "${duplicate.label}${duplicate.ending ? ` ending ${duplicate.ending}` : ""}" already exists. Would you like to add these transactions to that account instead?`
        );
        
        if (confirmAttach) {
          const txIds = Array.from(selectedAccountTxIds);
          attachTransactionsToAccount(duplicate.id, txIds);
          
          // Reset form
          setIsAddingAccount(false);
          setAddAccountName("");
          setAddAccountType("Checking");
          setAddBaseTransactionId("");
          setSelectedAccountTxIds(new Set());
          setSelectedExistingAccountId("");
        }
        return;
      }
      
      // No duplicate, proceed with normal save
      handleSaveNewAccount();
    }
  };

  return (
    <div className="space-y-4 animate-fade-rise">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <SectionHeader title="Review" caption="Big picture summary for this sample month." />
        <InfoTip label={"Snapshot of this month.\nHighlights key spending patterns and fees.\nRuns on sample data."} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <GlassPanel
          variant="card"
          className="px-4 py-5 text-zinc-200 shadow-sm transition transform hover:-translate-y-0.5 hover:ring-white/14 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-300/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
          tabIndex={0}
        >
          <p className="text-sm font-semibold text-white">My Accounts</p>
          <div className="mt-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-400">Income</span>
              <span className="font-semibold text-white">{currency.format(summaryStats.totalIncome)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Spending</span>
              <span className="font-semibold text-white">{currency.format(summaryStats.totalSpending)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Net</span>
              <span className={`font-semibold ${summaryStats.net >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {currency.format(summaryStats.net)}
              </span>
            </div>
          </div>
        </GlassPanel>
        <GlassPanel
          variant="card"
          role="button"
          tabIndex={0}
          onClick={() => setIsSubscriptionsOverlayOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              setIsSubscriptionsOverlayOpen(true);
            }
          }}
          className="px-4 py-5 text-left text-zinc-200 shadow-sm transition transform hover:-translate-y-0.5 hover:ring-purple-300/40 hover:shadow-lg hover:shadow-purple-500/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
        >
          <p className="text-sm font-semibold text-white">Subscriptions</p>
          <div className="mt-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-400">Count</span>
              <span className="font-semibold text-white">{summaryStats.subscriptionCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Total</span>
              <span className="font-semibold text-white">{currency.format(summaryStats.totalSubscriptions)}</span>
            </div>
            {!hasSubscriptions && (
              <p className="text-[11px] text-zinc-500">No subscriptions detected this period.</p>
            )}
          </div>
        </GlassPanel>
        <GlassPanel
          variant="card"
          className="px-4 py-5 text-zinc-200 shadow-sm transition transform hover:-translate-y-0.5 hover:ring-white/14 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-300/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
          tabIndex={0}
        >
          <p className="text-sm font-semibold text-white">Budget Guidance</p>
          <div className="mt-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-400">Total fees</span>
              <span className="font-semibold text-white">{currency.format(summaryStats.totalFees)}</span>
            </div>
            {feeRows.length > 0 && (
              <div className="flex justify-between text-xs text-zinc-400">
                <span>Largest fee</span>
                <span className="text-white">{currency.format(Math.max(...feeRows.map((f) => Math.abs(f.amount))))}</span>
              </div>
            )}
          </div>
        </GlassPanel>
        <GlassPanel
          variant="card"
          className="px-4 py-5 text-zinc-200 shadow-sm transition transform hover:-translate-y-0.5 hover:ring-white/14 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-300/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
          tabIndex={0}
        >
          <p className="text-sm font-semibold text-white">Duplicate Detection</p>
          <div className="mt-3 space-y-2 text-sm">
            {topSpendingCategories.map((item) => (
              <div key={item.category} className="flex justify-between">
                <span className="text-zinc-400">{item.category}</span>
                <span className="font-semibold text-white">{currency.format(item.amount)}</span>
              </div>
            ))}
          </div>
        </GlassPanel>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <GlassPanel
          variant="card"
          className="px-4 py-5 text-zinc-200 shadow-sm transition transform hover:-translate-y-0.5 hover:ring-white/14 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-300/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
          tabIndex={0}
        >
          <p className="text-sm font-semibold text-white">Internal transfers this period</p>
          <p className="mt-2 text-xl font-semibold text-white">
            {currency.format(summaryStats.internalTransfersTotal)}
          </p>
          <p className="mt-1 text-xs text-zinc-400">Money moved between your own accounts. Ignored for income and spending.</p>
        </GlassPanel>
        <GlassPanel
          variant="card"
          role="button"
          tabIndex={0}
          onClick={(e) => handleOpenDuplicateOverlay(e.currentTarget)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              handleOpenDuplicateOverlay(event.currentTarget as HTMLElement);
            }
          }}
          className="px-4 py-5 text-left text-zinc-200 shadow-sm transition transform hover:-translate-y-0.5 hover:ring-amber-300/50 hover:shadow-lg hover:shadow-amber-400/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
        >
          <div className="flex items-center gap-2">
            <span aria-hidden="true" className="text-amber-300">⚠️</span>
            <p className="text-sm font-semibold text-white">Duplicate charges</p>
          </div>
          <p className="mt-2 text-xl font-semibold text-white">
            {duplicateClusters.length === 0
              ? "No suspected duplicates"
              : `${duplicateClusters.length} merchant${duplicateClusters.length === 1 ? "" : "s"} with possible duplicates`}
          </p>
          <p className="mt-1 text-xs text-zinc-400">Review potential duplicate charges and confirm or dismiss them.</p>
        </GlassPanel>
        <GlassPanel
          variant="card"
          className="px-4 py-5 text-zinc-200 shadow-sm transition transform hover:-translate-y-0.5 hover:ring-white/14 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-300/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
          tabIndex={0}
        >
          <p className="text-sm font-semibold text-white">Money left after bills</p>
          <p className="mt-2 text-xl font-semibold text-white">{currency.format(leftAfterBills)}</p>
          <p className="mt-1 text-xs text-zinc-400">Approximate money left after rent, utilities, groceries, and basic fees.</p>
        </GlassPanel>
      </div>
      <GlassPanel variant="card" className="space-y-3 px-4 py-5 text-zinc-200 shadow-sm">
        <div className="flex flex-col items-center justify-center gap-1 text-center">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-white">Budget guidance</h3>
            <InfoTip label={"Ranges based on this month’s income.\nTransfers between your accounts are ignored."} />
          </div>
          <div className="flex items-center justify-center gap-2 text-xs text-zinc-400">
            <span>Based on your income this month.</span>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {budgetGuidance.map((item) => {
            const actualPercent = totalIncome > 0 ? (item.actualAmount / totalIncome) * 100 : 0;
            const targetPercent = totalIncome > 0 && item.recommendedAmount > 0 ? (item.recommendedAmount / totalIncome) * 100 : 0;
            const diffText =
              item.differenceDirection === "over"
                ? `Over by ${currency.format(item.differenceAmount)} compared to this guideline.`
                : `Under by ${currency.format(item.differenceAmount)} compared to this guideline.`;
            const diffClass = item.differenceDirection === "over" ? "text-rose-300 font-semibold" : "text-emerald-300 font-semibold";
            return (
              <GlassPanel key={item.category} variant="card" className="px-4 py-3 text-sm text-zinc-200">
                <div className="flex justify-between">
                  <span className="font-medium text-white">{item.category}</span>
                  <span className="text-zinc-400">{currency.format(item.actualAmount)}</span>
                </div>
                <p className="mt-1 text-xs text-zinc-400">
                  {item.category} is about {actualPercent.toFixed(1)}% of this month’s income. A common target is about {targetPercent.toFixed(1)}% (about {currency.format(item.recommendedAmount)} for your income).
                </p>
                <p className={`mt-1 text-xs ${diffClass}`}>{diffText}</p>
              </GlassPanel>
            );
          })}
        </div>
        <GlassPanel variant="card" className="px-4 py-3 text-xs text-zinc-300">
          <p className="font-semibold text-white">Bill check</p>
          <p className="mt-1">Car and transport are about {transportPercent.toFixed(1)}% of your income this month. A common target is roughly up to {transportGuideline}%.</p>
          <p className="mt-1">Internet or home connection is about {internetPercent.toFixed(1)}% of your income this month. Around {internetGuideline}% is a typical range.</p>
        </GlassPanel>
        <GlassPanel variant="card" className="px-4 py-4 text-xs text-zinc-300">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-white">Needs vs wants</p>
            <InfoTip label={"Needs: rent, utilities, groceries, basic fees.\nWants: dining out, shopping, extras."} />
          </div>
          <div className="mt-2 h-3 w-full overflow-hidden rounded-full border border-zinc-800 bg-zinc-900">
            <div className="flex h-full w-full">
              <div className="h-full bg-purple-500/70" style={{ width: `${essentialsPercent}%` }} />
              <div className="h-full bg-zinc-600/60" style={{ width: `${otherPercent}%` }} />
            </div>
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-400">
            <span>Essentials (needs) {essentialsPercent}%</span>
            <span>Everything else (wants) {otherPercent}%</span>
          </div>
          <div className="mt-3 text-xs text-zinc-300">
            {netThisMonth > 0 ? (
              <>
                <p className="font-semibold text-white">Saved this month: {currency.format(netThisMonth)}</p>
                <p className="text-[11px] text-zinc-400">{Math.round((netThisMonth / Math.max(totalIncome, 1)) * 100)} percent of income</p>
              </>
            ) : netThisMonth === 0 ? (
              <p className="font-semibold text-white">No net savings this month</p>
            ) : (
              <p className="font-semibold text-white">Overspent by {currency.format(Math.abs(netThisMonth))} this month</p>
            )}
          </div>
        </GlassPanel>
      </GlassPanel>
      {transferAccounts.length === 0 ? (
        <GlassPanel variant="card" className="px-4 py-4 text-center text-sm text-zinc-400">No transfer accounts detected in this statement.</GlassPanel>
      ) : (
        <GlassPanel variant="card" className="space-y-3 px-4 py-5 text-zinc-200 shadow-sm">
          <div className="space-y-1 text-center">
            <div className="flex items-center justify-center gap-2">
              <h3 className="text-base font-semibold text-white">Your accounts</h3>
              <InfoTip label={"Mark your accounts vs payment vs not mine.\nKeeps internal moves separate from real spending.\nHelps MoneyMap treat transfers correctly."} />
            </div>
            <p className="text-xs text-zinc-400">These settings only change how totals are counted here.</p>
          </div>
          {detectedAccountCandidates.length > 0 && (
            <GlassPanel variant="card" className="space-y-2 p-3 backdrop-blur-xl sm:backdrop-blur-2xl">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm font-semibold text-white">We detected accounts from transfers in this statement.</h4>
                  <p className="text-[11px] text-zinc-400">Review them below to keep transfers categorized once.</p>
                </div>
              </div>
              <div className="space-y-2">
                {detectedAccountCandidates.map((cand) => {
                  const draft = candidateDrafts[cand.key] ?? {
                    name: cand.label,
                    accountType: cand.accountType,
                    mode: "spending" as OwnershipMode,
                    expanded: false,
                  };
                  const mode = draft.mode;
                  return (
                    <GlassPanel key={cand.key} variant="card" className="p-3 backdrop-blur-xl sm:backdrop-blur-2xl">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-white">{draft.name}</p>
                          <p className="text-[11px] text-zinc-400">{cand.count} transfer{cand.count === 1 ? "" : "s"} matched</p>
                        </div>
                        <div className="flex gap-2 text-[11px]">
                          <button
                            type="button"
                            className="rounded-full border border-zinc-700 px-2 py-1 font-semibold text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-800"
                            onClick={() => handleSaveDetectedAccount(cand)}
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            className="rounded-full border border-zinc-700 px-2 py-1 font-semibold text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-800"
                            onClick={() => handleCancelCandidate(cand.key)}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        <label className="text-xs text-zinc-400">
                          Account name
                          <input
                            type="text"
                            value={draft.name}
                            onChange={(e) => handleUpdateCandidateDraft(cand.key, { name: e.target.value })}
                            className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 py-2 text-sm text-white"
                          />
                        </label>
                        <label className="text-xs text-zinc-400">
                          Account type
                          <select
                            className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 py-2 text-sm text-white"
                            value={draft.accountType}
                            onChange={(e) => handleUpdateCandidateDraft(cand.key, { accountType: e.target.value })}
                          >
                            {accountTypeOptions.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button
                          type="button"
                          aria-pressed={mode === "spending"}
                          onClick={() => handleUpdateCandidateDraft(cand.key, { mode: "spending" })}
                          className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${mode === "spending" ? "border-emerald-400 bg-emerald-900/40 text-emerald-100" : "border-zinc-700 bg-zinc-800 text-zinc-200 hover:border-zinc-600 hover:bg-zinc-700"}`}
                        >
                          Personal money
                        </button>
                        <button
                          type="button"
                          aria-pressed={mode === "payment"}
                          onClick={() => handleUpdateCandidateDraft(cand.key, { mode: "payment" })}
                          className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${mode === "payment" ? "border-amber-300 bg-amber-900/40 text-amber-100" : "border-zinc-700 bg-zinc-800 text-zinc-200 hover:border-zinc-600 hover:bg-zinc-700"}`}
                        >
                          Bills and debt
                        </button>
                        <button
                          type="button"
                          aria-pressed={mode === "notMine"}
                          onClick={() => handleUpdateCandidateDraft(cand.key, { mode: "notMine" })}
                          className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${mode === "notMine" ? "border-rose-300 bg-rose-900/30 text-rose-100" : "border-zinc-700 bg-zinc-800 text-zinc-200 hover:border-zinc-600 hover:bg-zinc-700"}`}
                        >
                          Not mine
                        </button>
                      </div>
                      <button
                        type="button"
                        className="mt-3 flex items-center gap-2 text-xs text-zinc-400 transition hover:text-zinc-200"
                        onClick={() => handleUpdateCandidateDraft(cand.key, { expanded: !draft.expanded })}
                      >
                        <span className={`transition-transform ${draft.expanded ? "rotate-90" : ""}`} aria-hidden="true">
                          &gt;
                        </span>
                        View matched transfers
                      </button>
                      {draft.expanded && (
                        <div className="mt-2 space-y-2 rounded-md border border-zinc-800 bg-zinc-900/70 p-3 text-xs text-zinc-200">
                          {cand.transactions.map(({ tx }) => (
                            <div key={tx.id} className="flex items-center justify-between gap-2">
                              <span className="truncate pr-2" title={tx.description}>
                                {dateFormatter.format(new Date(tx.date))} • {tx.description}
                              </span>
                              <span className={`font-semibold ${tx.amount >= 0 ? "text-purple-300" : "text-zinc-200"}`}>
                                {currency.format(tx.amount)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </GlassPanel>
                  );
                })}
              </div>
            </GlassPanel>
          )}
          <div className="space-y-2">
            {transferAccounts.map((acc) => {
              const displayLabel = acc.ending ? `${acc.label} ending ${acc.ending}` : acc.label;
              const mode = ownershipModes[acc.id] ?? (ownership[acc.id] ? ("spending" as OwnershipMode) : "notMine");
              const isEditingAccount = editingAccountId === acc.id;
              return (
                <GlassPanel key={acc.id} variant="card" className="group flex flex-col gap-3 px-4 py-3 text-sm text-zinc-200">
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
                          {acc.accountType ?? "Other"}
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
                            className="rounded-full border border-purple-400 bg-purple-900/40 px-3 py-1 text-[11px] font-semibold text-purple-100 transition hover:border-purple-300 hover:bg-purple-900"
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
                            <svg className="h-4 w-4 text-zinc-400" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M3.5 10.5 10 4l2 2-6.5 6.5H3.5v-2z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
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
                      className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${mode === "spending" ? "border-emerald-400 bg-emerald-900/40 text-emerald-100" : "border-zinc-700 bg-zinc-800 text-zinc-200 hover:border-zinc-600 hover:bg-zinc-700"}`}
                    >
                      Personal money
                    </button>
                    <button
                      type="button"
                      aria-pressed={mode === "payment"}
                      onClick={() => handleOwnershipModeChange(acc.id, "payment")}
                      className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${mode === "payment" ? "border-amber-300 bg-amber-900/40 text-amber-100" : "border-zinc-700 bg-zinc-800 text-zinc-200 hover:border-zinc-600 hover:bg-zinc-700"}`}
                    >
                      Bills and debt
                    </button>
                    <button
                      type="button"
                      aria-pressed={mode === "notMine"}
                      onClick={() => handleOwnershipModeChange(acc.id, "notMine")}
                      className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${mode === "notMine" ? "border-rose-300 bg-rose-900/30 text-rose-100" : "border-zinc-700 bg-zinc-800 text-zinc-200 hover:border-zinc-600 hover:bg-zinc-700"}`}
                    >
                      Not mine
                    </button>
                  </div>
                  </GlassPanel>
                );
              })}
            </div>
          <div className="pt-2">
            {unassignedTransferTransactions.length > 0 ? (
              <button
                type="button"
                onClick={() => setIsAddingAccount((prev) => !prev)}
                className="rounded-full border border-zinc-700 px-3 py-2 text-xs font-semibold text-white transition hover:border-zinc-500 hover:bg-zinc-800"
              >
                {isAddingAccount ? "Cancel add account" : "Add account"}
              </button>
            ) : (
              <div className="text-xs text-zinc-400 italic">
                No uncategorized transfers. All transfers are assigned to accounts.
              </div>
            )}
          </div>
          {isAddingAccount && unassignedTransferTransactions.length > 0 && (
            <GlassPanel variant="card" className="space-y-3 px-4 py-4 text-left text-sm text-zinc-200">
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingAccount(false);
                    setAddAccountName("");
                    setAddBaseTransactionId("");
                    setSelectedAccountTxIds(new Set());
                    setSelectedExistingAccountId("");
                  }}
                  className="rounded-full border border-zinc-700 px-3 py-2 text-xs font-semibold text-zinc-200 transition hover:border-zinc-600 hover:bg-zinc-800"
                >
                  Cancel add account
                </button>
                <button
                  type="button"
                  onClick={handleSaveWithDuplicateCheck}
                  className="rounded-full border border-purple-400 bg-purple-900/50 px-3 py-2 text-xs font-semibold text-purple-100 transition hover:border-purple-300 hover:bg-purple-900 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={selectedAccountTxIds.size === 0 || (!selectedExistingAccountId && !addAccountName.trim())}
                >
                  {selectedExistingAccountId ? "Add to account" : "Save account"}
                </button>
              </div>
              
              {/* Add to existing account option */}
              <div className="rounded-md border border-purple-500/30 bg-purple-900/20 px-3 py-2">
                <label className="text-xs text-zinc-400">
                  Add to existing account (optional)
                  <select
                    className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 py-2 text-sm text-white"
                    value={selectedExistingAccountId}
                    onChange={(e) => setSelectedExistingAccountId(e.target.value)}
                  >
                    <option value="">Create new account instead</option>
                    {transferAccounts.map((acc) => {
                      const displayLabel = acc.ending ? `${acc.label} ending ${acc.ending}` : acc.label;
                      return (
                        <option key={acc.id} value={acc.id}>
                          {displayLabel}
                        </option>
                      );
                    })}
                  </select>
                  {selectedExistingAccountId && (
                    <p className="mt-1 text-[11px] text-purple-200">
                      Selected transactions will be added to this existing account
                    </p>
                  )}
                </label>
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
                    {sortedUnassignedTransactions.map((tx) => (
                      <option key={tx.id} value={tx.id}>
                        {`${dateFormatter.format(new Date(tx.date))} • ${normalizeCounterpartyName(tx.description)} (${currency.format(tx.amount)})`}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="grid gap-2 sm:grid-cols-2">
                  <label className="text-xs text-zinc-400">
                    Account name
                    <input
                      type="text"
                      className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 py-2 text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      value={addAccountName}
                      onChange={(e) => setAddAccountName(e.target.value)}
                      placeholder="e.g., Capital One card"
                      disabled={!!selectedExistingAccountId}
                    />
                    {selectedExistingAccountId && (
                      <p className="mt-1 text-[11px] text-zinc-500">
                        Disabled (using existing account)
                      </p>
                    )}
                  </label>
                  <label className="text-xs text-zinc-400">
                    Account type
                    <select
                      className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 py-2 text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      value={addAccountType}
                      onChange={(e) => setAddAccountType(e.target.value)}
                      disabled={!!selectedExistingAccountId}
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
                  <p className="text-[11px] text-zinc-500">Found {suggestedAccountTransactions.length} possible matches</p>
                </div>
                {suggestedAccountTransactions.length === 0 ? (
                  <p className="text-[11px] text-zinc-500">Select a transaction to see matches.</p>
                ) : (
                  suggestedAccountTransactions.map((tx) => (
                    <label key={tx.id} className="flex items-center justify-between gap-3 rounded-md px-2 py-1 hover:bg-zinc-900">
                      <div className="flex items-center gap-2">
                        <input type="checkbox" className="h-4 w-4" checked={selectedAccountTxIds.has(tx.id)} onChange={() => handleToggleAccountTransaction(tx.id)} />
                        <span className="truncate" title={tx.description}>
                          {normalizeCounterpartyName(tx.description)}
                        </span>
                      </div>
                      <span className="text-right font-semibold">{currency.format(tx.amount)}</span>
                    </label>
                  ))
                )}
                {selectedAccountTxIds.size > 0 && <p className="text-[11px] text-purple-200">{selectedAccountTxIds.size} transaction{selectedAccountTxIds.size > 1 ? "s" : ""} selected</p>}
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingAccount(false);
                    setAddAccountName("");
                    setAddBaseTransactionId("");
                    setSelectedAccountTxIds(new Set());
                    setSelectedExistingAccountId("");
                  }}
                  className="rounded-full border border-zinc-700 px-3 py-2 text-xs font-semibold text-zinc-200 transition hover:border-zinc-600 hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveWithDuplicateCheck}
                  className="rounded-full border border-purple-400 bg-purple-900/50 px-3 py-2 text-xs font-semibold text-purple-100 transition hover:border-purple-300 hover:bg-purple-900 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={selectedAccountTxIds.size === 0 || (!selectedExistingAccountId && !addAccountName.trim())}
                >
                  {selectedExistingAccountId ? "Add to account" : "Save account"}
                </button>
              </div>
            </GlassPanel>
          )}
        </GlassPanel>
      )}
      {isSubscriptionsOverlayOpen && (
        <SubscriptionsOverlay
          subscriptions={subscriptionRows}
          currency={currency}
          dateFormatter={dateFormatter}
          onClose={() => setIsSubscriptionsOverlayOpen(false)}
        />
      )}
    </div>
  );
}

