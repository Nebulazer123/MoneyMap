"use client";

import React, { useMemo, useState } from "react";
import { useDataStore } from "../../lib/store/useDataStore";
import { useDateStore } from "../../lib/store/useDateStore";
import { useUIStore } from "../../lib/store/useUIStore";
import {
    getTransactionsInDateRange,
    getNetIncome,
    getTotalSpending,
    getTotalSubscriptions,
    getCategoryTotals,
    getInternalTransferTotals
} from "../../lib/selectors/transactionSelectors";
import { GlassCard } from "../ui/GlassCard";
import { InfoTooltip } from "../ui/InfoTooltip";
import { cn } from "../../lib/utils";
import { detectAccountCandidates, CandidateAccount } from "../../lib/logic/accounts";
import { Check, X, AlertTriangle } from "lucide-react";
import { Account, Transaction } from "../../lib/types";
import { isEssentialCategory } from "../../lib/categoryRules";

export function Review() {
    const { transactions, accounts, addAccount, duplicateDecisions, setDuplicateDecision } = useDataStore();
    const { viewStart, viewEnd } = useDateStore();
    const { setActiveTab } = useUIStore();
    const [isSubscriptionsOverlayOpen, setIsSubscriptionsOverlayOpen] = useState(false);
    const [isDuplicatesOverlayOpen, setIsDuplicatesOverlayOpen] = useState(false);
    const [selectedCandidate, setSelectedCandidate] = useState<CandidateAccount | null>(null);

    const currency = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    });

    const dateFormatter = new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
    });

    // 1. Filter transactions by date range
    const filteredTransactions = useMemo(() => {
        return getTransactionsInDateRange(transactions, viewStart, viewEnd);
    }, [transactions, viewStart, viewEnd]);

    // 2. Calculate Stats using Selectors
    const totalIncome = useMemo(() => getNetIncome(filteredTransactions), [filteredTransactions]);
    const totalSpending = useMemo(() => getTotalSpending(filteredTransactions), [filteredTransactions]);
    const net = totalIncome - totalSpending;
    const totalSubscriptions = useMemo(() => getTotalSubscriptions(filteredTransactions), [filteredTransactions]);
    const subscriptionCount = useMemo(() => filteredTransactions.filter(t => t.kind === 'subscription').length, [filteredTransactions]);
    const internalTransfersTotal = useMemo(() => getInternalTransferTotals(filteredTransactions), [filteredTransactions]);

    // Calculate Average Daily Spending (I4)
    const avgDailySpending = useMemo(() => {
        const daysDiff = Math.max(1, Math.ceil((viewEnd.getTime() - viewStart.getTime()) / (1000 * 60 * 60 * 24)));
        return totalSpending / daysDiff;
    }, [totalSpending, viewStart, viewEnd]);

    // Calculate Account Totals from store (shared with My Money)
    const accountTotals = useMemo(() => {
        const includedAccounts = accounts.filter(a => a.includeInNetWorth !== false);

        const cashAccounts = includedAccounts.filter(a => a.type === 'checking' || a.type === 'savings');
        const totalCash = cashAccounts.reduce((sum, a) => sum + a.balance, 0);

        const debtAccounts = includedAccounts.filter(a => a.type === 'credit' || a.type === 'loan');
        const totalDebt = debtAccounts.reduce((sum, a) => sum + Math.abs(a.balance), 0);

        const assets = includedAccounts.filter(a => a.balance > 0).reduce((sum, a) => sum + a.balance, 0);
        const liabilities = includedAccounts.filter(a => a.balance < 0).reduce((sum, a) => sum + Math.abs(a.balance), 0);
        const netWorth = assets - liabilities;

        // Get top 3 accounts for display
        const topAccounts = includedAccounts
            .slice(0, 3)
            .map(a => ({
                name: a.name,
                institution: a.institution,
                last4: a.last4,
                balance: a.balance,
                type: a.type
            }));

        return { totalCash, totalDebt, netWorth, topAccounts };
    }, [accounts]);

    // 3. Top Categories
    const topCategories = useMemo(() => {
        const totals = getCategoryTotals(filteredTransactions);
        return Array.from(totals.entries())
            .map(([category, amount]) => ({ category, amount }))
            .sort((a, b) => b.amount - a.amount);
    }, [filteredTransactions]);

    // 4. Needs vs Wants
    const needsVsWants = useMemo(() => {
        let essentials = 0;
        let others = 0;

        topCategories.forEach(item => {
            if (isEssentialCategory(item.category)) {
                essentials += item.amount;
            } else {
                others += item.amount;
            }
        });

        const total = essentials + others;
        if (total === 0) return { essentialsPercent: 0, otherPercent: 0 };

        return {
            essentialsPercent: Math.round((essentials / total) * 100),
            otherPercent: Math.round((others / total) * 100)
        };
    }, [topCategories]);

    // 5. Suspicious Transactions (Global check, not just view range)
    const suspiciousTransactions = useMemo(() => {
        return transactions.filter(t => t.isSuspicious);
    }, [transactions]);

    const duplicateStats = useMemo(() => {
        const totalSuspicious = suspiciousTransactions.length;
        let unresolvedCount = 0;
        let confirmedCount = 0;

        suspiciousTransactions.forEach(t => {
            if (!duplicateDecisions[t.id]) {
                unresolvedCount++;
            } else if (duplicateDecisions[t.id] === "confirmed") {
                confirmedCount++;
            }
        });

        return { totalSuspicious, unresolvedCount, confirmedCount };
    }, [suspiciousTransactions, duplicateDecisions]);

    // Group suspicious by type for display
    const suspiciousGroups = useMemo(() => {
        const groups: Record<string, Transaction[]> = {
            duplicate: [],
            overcharge: [],
            unexpected: []
        };

        suspiciousTransactions.forEach(t => {
            const type = t.suspiciousType || 'unexpected';
            if (groups[type]) groups[type].push(t);
            else groups['unexpected'].push(t);
        });

        return groups;
    }, [suspiciousTransactions]);

    // Account detection
    const existingAccountKeys = useMemo(() => new Set(accounts.map(a => a.id)), [accounts]);
    const detectedCandidates = useMemo(() => detectAccountCandidates(filteredTransactions, existingAccountKeys), [filteredTransactions, existingAccountKeys]);

    return (
        <GlassCard intensity="medium" tint="zinc" className="p-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-semibold text-white">Review</h2>
                <p className="text-zinc-400">Big picture summary for this month.</p>
            </div>

            {/* Main Layout */}
            <div className="space-y-6">
                {/* Metrics Grid - 3 Columns */}
                <div className="grid gap-4 sm:grid-cols-3">
                    {/* My Accounts */}
                    <GlassCard className="p-5">
                        <p className="text-sm font-semibold text-white mb-4">My Accounts</p>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between items-center">
                                <span className="text-zinc-400">Income</span>
                                <span className="font-medium text-emerald-400">{currency.format(totalIncome)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-zinc-400">Spending</span>
                                <span className="font-medium text-rose-400">{currency.format(totalSpending)}</span>
                            </div>
                            <div className="pt-2 border-t border-white/5 flex justify-between items-center">
                                <span className="text-zinc-400">Net</span>
                                <span className={cn("font-bold", net >= 0 ? "text-emerald-400" : "text-rose-400")}>
                                    {currency.format(net)}
                                </span>
                            </div>
                        </div>
                    </GlassCard>

                    {/* Subscriptions */}
                    <GlassCard className="p-5 hover:ring-purple-500/30 transition cursor-pointer" onClick={() => setIsSubscriptionsOverlayOpen(true)}>
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-sm font-semibold text-white">Subscriptions</p>
                            <InfoTooltip text="Click to view details" />
                        </div>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between items-center">
                                <span className="text-zinc-400">Active</span>
                                <span className="font-medium text-white">{subscriptionCount} services</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-zinc-400">Total Cost</span>
                                <span className="font-bold text-white">{currency.format(totalSubscriptions)}</span>
                            </div>
                            <div className="pt-2 border-t border-white/5">
                                <button
                                    onClick={() => setActiveTab('subscriptions')}
                                    className="text-xs text-purple-400 hover:text-purple-300 transition w-full text-center"
                                >
                                    Tap to manage subscriptions →
                                </button>
                            </div>
                        </div>
                    </GlassCard>

                    {/* Top Spending */}
                    <GlassCard className="p-5">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-sm font-semibold text-white">Top Categories</p>
                            <InfoTooltip text="Common transaction types are included in there" />
                        </div>
                        <div className="space-y-3 text-sm">
                            {topCategories.slice(0, 3).map((item) => (
                                <div key={item.category} className="flex justify-between items-center">
                                    <span className="text-zinc-400 truncate">{item.category}</span>
                                    <span className="font-medium text-white">{currency.format(item.amount)}</span>
                                </div>
                            ))}
                        </div>
                    </GlassCard>
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-6 mb-6">
                <GlassCard className="p-5">
                    <p className="text-sm font-semibold text-white">Internal transfers</p>
                    <p className="mt-2 text-xl font-semibold text-white">{currency.format(internalTransfersTotal)}</p>
                    <p className="mt-1 text-xs text-zinc-400">Money moved between your own accounts.</p>
                </GlassCard>

                {/* Duplicate Charges Card */}
                <GlassCard
                    className={cn(
                        "p-5 transition cursor-pointer hover:ring-2",
                        duplicateStats.totalSuspicious === 0 ? "hover:ring-emerald-500/50" : "hover:ring-amber-500/50"
                    )}
                    onClick={() => setIsDuplicatesOverlayOpen(true)}
                >
                    <div className="flex items-center gap-2">
                        {duplicateStats.totalSuspicious === 0 ? (
                            <Check className="w-5 h-5 text-emerald-400" />
                        ) : (
                            <AlertTriangle className="w-5 h-5 text-amber-400" />
                        )}
                        <p className="text-sm font-semibold text-white">Suspicious charges</p>
                    </div>
                    <div className="mt-2">
                        {duplicateStats.totalSuspicious === 0 ? (
                            <>
                                <p className="text-xl font-semibold text-white">All looks good</p>
                                <p className="mt-1 text-xs text-zinc-400">None found</p>
                            </>
                        ) : (
                            <>
                                <p className="text-xl font-semibold text-white">
                                    {duplicateStats.totalSuspicious} transaction{duplicateStats.totalSuspicious === 1 ? '' : 's'}
                                </p>
                                <p className="mt-1 text-xs text-zinc-400">
                                    {duplicateStats.unresolvedCount > 0
                                        ? "needing review"
                                        : "all reviewed"}
                                </p>
                            </>
                        )}
                    </div>
                </GlassCard>

                <GlassCard className="p-5">
                    <p className="text-sm font-semibold text-white">Money left after bills</p>
                    <p className="mt-2 text-xl font-semibold text-white">{currency.format(net)}</p>
                    <p className="mt-1 text-xs text-zinc-400">Approximate savings.</p>
                </GlassCard>
            </div>

            <GlassCard className="p-5 mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-white">Needs vs Wants</h3>
                        <InfoTooltip text="Essentials include Housing, Groceries, Utilities, Transport. Everything else is considered a Want." />
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-medium text-emerald-400">
                            Saved this month: {currency.format(net)}
                        </p>
                        <p className="text-xs text-zinc-500">
                            {totalIncome > 0 ? Math.round((net / totalIncome) * 100) : 0}% of income
                        </p>
                    </div>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full border border-zinc-800 bg-zinc-900 mb-2">
                    <div className="flex h-full w-full">
                        <div className="h-full bg-emerald-500/70" style={{ width: `${needsVsWants.essentialsPercent}%` }} />
                        <div className="h-full bg-rose-500/70" style={{ width: `${needsVsWants.otherPercent}%` }} />
                    </div>
                </div>
                <div className="flex justify-between text-xs text-zinc-400">
                    <span>Essentials (needs) {needsVsWants.essentialsPercent}%</span>
                    <span>Everything else (wants) {needsVsWants.otherPercent}%</span>
                </div>
            </GlassCard>

            {/* Account Balances Section - Now with real data from shared store (I3, I4) */}
            <GlassCard className="p-5 mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-white">Account Balances</h3>
                        <InfoTooltip text="Balances from My Money page. Synced with include/exclude toggles." />
                    </div>
                </div>

                {/* Account list - showing top accounts from store */}
                <div className="space-y-3 mb-4">
                    {accountTotals.topAccounts.map((account, idx) => {
                        const bgColors: Record<string, string> = {
                            checking: 'bg-blue-500/20',
                            savings: 'bg-emerald-500/20',
                            credit: 'bg-purple-500/20',
                            investment: 'bg-lime-500/20',
                            loan: 'bg-rose-500/20',
                            wallet: 'bg-orange-500/20',
                            other: 'bg-zinc-500/20'
                        };
                        const textColors: Record<string, string> = {
                            checking: 'text-blue-400',
                            savings: 'text-emerald-400',
                            credit: 'text-purple-400',
                            investment: 'text-lime-400',
                            loan: 'text-rose-400',
                            wallet: 'text-orange-400',
                            other: 'text-zinc-400'
                        };
                        const initials = account.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

                        return (
                            <div key={idx} className="flex justify-between items-center p-3 rounded-lg bg-zinc-900/30 border border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", bgColors[account.type] || bgColors.other)}>
                                        <span className={cn("text-xs font-bold", textColors[account.type] || textColors.other)}>{initials}</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-white">{account.name}</p>
                                        <p className="text-xs text-zinc-500">
                                            {account.institution && `${account.institution} `}
                                            {account.last4 && `••••${account.last4}`}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={cn(
                                        "text-sm font-medium",
                                        account.balance < 0 ? "text-rose-400" : "text-emerald-400"
                                    )}>{currency.format(account.balance)}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Summary with real values from store */}
                <div className="border-t border-white/5 pt-4 mt-4">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-sm text-zinc-400">Total Net Worth</span>
                        <span className={cn(
                            "text-lg font-bold",
                            accountTotals.netWorth >= 0 ? "text-white" : "text-rose-400"
                        )}>{currency.format(accountTotals.netWorth)}</span>
                    </div>
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-sm text-zinc-400">Total Cash</span>
                        <span className="text-sm font-medium text-emerald-400">{currency.format(accountTotals.totalCash)}</span>
                    </div>
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-sm text-zinc-400">Total Debt</span>
                        <span className="text-sm font-medium text-rose-400">{currency.format(accountTotals.totalDebt)}</span>
                    </div>
                    {/* Average Daily Spending (I4) */}
                    <div className="flex justify-between items-center pt-3 border-t border-white/5">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-zinc-400">Avg. Daily Spending</span>
                            <InfoTooltip text="Average spending per day over the current view range, excluding internal transfers." />
                        </div>
                        <span className="text-sm font-bold text-amber-400">{currency.format(avgDailySpending)}</span>
                    </div>
                </div>
            </GlassCard>

            {detectedCandidates.length > 0 && (
                <GlassCard className="p-5">
                    <h3 className="text-base font-semibold text-white mb-4">Detected Accounts</h3>
                    <div className="space-y-3">
                        {detectedCandidates.map(cand => (
                            <div key={cand.key} className="flex justify-between items-center bg-zinc-900/50 p-3 rounded-lg">
                                <div>
                                    <p className="text-sm font-medium text-white">{cand.label}</p>
                                    <p className="text-xs text-zinc-400">{cand.count} transactions</p>
                                </div>
                                <button
                                    onClick={() => setSelectedCandidate(cand)}
                                    className="text-xs bg-amber-500 text-white px-3 py-1 rounded-full hover:bg-amber-400 transition-colors"
                                >
                                    Review
                                </button>
                            </div>
                        ))}
                    </div>
                </GlassCard>
            )}

            {/* Candidate Review Modal */}
            {selectedCandidate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <GlassCard className="w-full max-w-md p-6 relative animate-in zoom-in-95 duration-200">
                        <button
                            onClick={() => setSelectedCandidate(null)}
                            className="absolute top-4 right-4 text-zinc-400 hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <h3 className="text-xl font-bold text-white mb-1">{selectedCandidate.label}</h3>
                        <p className="text-sm text-zinc-400 mb-4">Detected from {selectedCandidate.count} transactions</p>

                        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                            {selectedCandidate.transactions.map(({ tx, side }, idx: number) => (
                                <div key={idx} className="bg-zinc-900/50 p-3 rounded-lg border border-white/5">
                                    <div className="flex justify-between mb-1">
                                        <span className="text-sm text-white font-medium">{tx.description}</span>
                                        <span className={cn(
                                            "text-sm font-bold",
                                            tx.amount > 0 ? "text-emerald-400" : "text-rose-400"
                                        )}>
                                            {currency.format(tx.amount)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-xs text-zinc-500">
                                        <span>{tx.date}</span>
                                        <span>{side === 'source' ? 'Outgoing' : 'Incoming'}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 flex gap-3">
                            <button
                                onClick={() => {
                                    const newAccount = {
                                        id: selectedCandidate.key,
                                        name: selectedCandidate.label,
                                        label: selectedCandidate.label,
                                        type: (selectedCandidate.accountType as Account["type"]) ?? "other",
                                        balance: 0,
                                        last4: selectedCandidate.ending,
                                    };
                                    addAccount(newAccount);
                                    setSelectedCandidate(null);
                                }}
                                className="flex-1 bg-purple-600 hover:bg-purple-500 text-white py-2 rounded-lg font-medium transition"
                            >
                                Add Account
                            </button>
                            <button
                                onClick={() => setSelectedCandidate(null)}
                                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-2 rounded-lg font-medium transition"
                            >
                                Dismiss
                            </button>
                        </div>
                    </GlassCard>
                </div>
            )}

            {/* Suspicious Review Modal */}
            {isDuplicatesOverlayOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-8">
                    <GlassCard className="w-full max-w-2xl p-6 relative animate-in zoom-in-95 duration-200 max-h-[70vh] flex flex-col">
                        <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/5 flex-shrink-0">
                            <div>
                                <h3 className="text-xl font-bold text-white">Suspicious Charges Review</h3>
                                <p className="text-sm text-zinc-400">
                                    {duplicateStats.totalSuspicious === 0
                                        ? "No suspicious transactions found."
                                        : `Review ${duplicateStats.totalSuspicious} suspicious transaction${duplicateStats.totalSuspicious === 1 ? '' : 's'}.`}
                                </p>
                            </div>
                            <button
                                onClick={() => setIsDuplicatesOverlayOpen(false)}
                                className="text-zinc-400 hover:text-white"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="overflow-y-auto pr-4 pb-4 space-y-4 flex-1 min-h-0 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-zinc-700/50 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
                            {suspiciousTransactions.length === 0 ? (
                                <div className="text-center py-12 text-zinc-500">
                                    <Check className="w-12 h-12 mx-auto mb-3 text-emerald-500/50" />
                                    <p>Everything looks clean!</p>
                                </div>
                            ) : (
                                Object.entries(suspiciousGroups).map(([type, txs]) => {
                                    if (txs.length === 0) return null;
                                    const label = type === 'duplicate' ? 'Potential Duplicates' :
                                        type === 'overcharge' ? 'Unusual Amounts' : 'Unexpected Charges';

                                    return (
                                        <div key={type} className="space-y-2">
                                            <h4 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">{label}</h4>
                                            {txs.map(tx => {
                                                const decision = duplicateDecisions[tx.id];
                                                return (
                                                    <div key={tx.id} className={cn(
                                                        "p-3 rounded-lg border flex items-center justify-between gap-3",
                                                        "bg-amber-500/5 border-amber-500/20"
                                                    )}>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <AlertTriangle className="w-3 h-3 text-amber-500 flex-shrink-0" />
                                                                <p className="text-sm font-medium truncate text-amber-100">
                                                                    {tx.description}
                                                                </p>
                                                            </div>
                                                            <div className="flex items-center gap-3 text-xs text-zinc-500">
                                                                <span>{dateFormatter.format(new Date(tx.date))}</span>
                                                                <span className="text-amber-500/80 italic">
                                                                    {tx.suspiciousReason}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-4">
                                                            <span className="font-medium text-amber-400">
                                                                {currency.format(tx.amount)}
                                                            </span>

                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => setDuplicateDecision(tx.id, "confirmed")}
                                                                    className={cn(
                                                                        "p-1.5 rounded transition",
                                                                        decision === 'confirmed'
                                                                            ? "bg-emerald-500 text-white"
                                                                            : "bg-zinc-800 text-zinc-400 hover:bg-emerald-500/20 hover:text-emerald-400"
                                                                    )}
                                                                    title="Confirm Issue"
                                                                >
                                                                    <Check className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => setDuplicateDecision(tx.id, "dismissed")}
                                                                    className={cn(
                                                                        "p-1.5 rounded transition",
                                                                        decision === 'dismissed'
                                                                            ? "bg-zinc-600 text-white"
                                                                            : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white"
                                                                    )}
                                                                    title="Dismiss"
                                                                >
                                                                    <X className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </GlassCard>
                </div>
            )}
        </GlassCard>
    );
}
