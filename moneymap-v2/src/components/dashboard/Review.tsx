"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useDataStore } from "../../lib/store/useDataStore";
import { useUIStore } from "../../lib/store/useUIStore";
import { GlassCard } from "../ui/GlassCard";
import { InfoTooltip } from "../ui/InfoTooltip";
import { cn, isDateInRange } from "../../lib/utils";
import { calculateSummaryStats, calculateBudgetGuidance, calculateTopSpendingCategories, calculateNeedsVsWants } from "../../lib/logic/metrics";
import { detectAccountCandidates, CandidateAccount } from "../../lib/logic/accounts";
import { analyzeDuplicateCharges } from "../../lib/fakeData";
import { ChevronDown, ChevronUp, Check, X, AlertTriangle, Loader2 } from "lucide-react";
import { Account } from "../../lib/types";

export function Review() {
    const { transactions, ownershipModes, accounts, addAccount, duplicateDecisions, setDuplicateDecision } = useDataStore();
    const { dateRange } = useUIStore();
    const [isSubscriptionsOverlayOpen, setIsSubscriptionsOverlayOpen] = useState(false);
    const [isDuplicatesOverlayOpen, setIsDuplicatesOverlayOpen] = useState(false);
    const [selectedCandidate, setSelectedCandidate] = useState<CandidateAccount | null>(null);
    const [expandedClusters, setExpandedClusters] = useState<Set<string>>(new Set());
    const [isAnalyzing, setIsAnalyzing] = useState(true);

    const currency = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    });

    const dateFormatter = new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
    });

    // Filter transactions by date range
    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => isDateInRange(t.date, dateRange));
    }, [transactions, dateRange]);

    const stats = useMemo(() => calculateSummaryStats(filteredTransactions, ownershipModes), [filteredTransactions, ownershipModes]);
    const topCategories = useMemo(() => calculateTopSpendingCategories(filteredTransactions), [filteredTransactions]);
    const needsVsWants = useMemo(() => calculateNeedsVsWants(filteredTransactions, stats.totalIncome), [filteredTransactions, stats.totalIncome]);

    const duplicateAnalysis = useMemo(() => analyzeDuplicateCharges(transactions), [transactions]);
    const duplicateClusters = duplicateAnalysis.clusters;

    // Simulate analysis delay
    useEffect(() => {
        const startId = setTimeout(() => setIsAnalyzing(true), 0);
        const timer = setTimeout(() => {
            setIsAnalyzing(false);
        }, 800);
        return () => {
            clearTimeout(startId);
            clearTimeout(timer);
        };
    }, [transactions]);

    // Duplicate stats
    const duplicateStats = useMemo(() => {
        let totalSuspicious = 0;
        let unresolvedCount = 0;
        let confirmedCount = 0;

        duplicateClusters.forEach(cluster => {
            cluster.suspiciousTransactionIds.forEach(id => {
                totalSuspicious++;
                if (!duplicateDecisions[id]) {
                    unresolvedCount++;
                } else if (duplicateDecisions[id] === "confirmed") {
                    confirmedCount++;
                }
            });
        });

        return { totalSuspicious, unresolvedCount, confirmedCount };
    }, [duplicateClusters, duplicateDecisions]);

    const toggleCluster = (key: string) => {
        const newExpanded = new Set(expandedClusters);
        if (newExpanded.has(key)) {
            newExpanded.delete(key);
        } else {
            newExpanded.add(key);
        }
        setExpandedClusters(newExpanded);
    };

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
                                <span className="font-medium text-emerald-400">{currency.format(stats.totalIncome)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-zinc-400">Spending</span>
                                <span className="font-medium text-rose-400">{currency.format(stats.totalSpending)}</span>
                            </div>
                            <div className="pt-2 border-t border-white/5 flex justify-between items-center">
                                <span className="text-zinc-400">Net</span>
                                <span className={cn("font-bold", stats.net >= 0 ? "text-emerald-400" : "text-rose-400")}>
                                    {currency.format(stats.net)}
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
                                <span className="font-medium text-white">{stats.subscriptionCount} services</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-zinc-400">Total Cost</span>
                                <span className="font-bold text-white">{currency.format(stats.totalSubscriptions)}</span>
                            </div>
                            <div className="pt-2 border-t border-white/5">
                                <p className="text-xs text-purple-400 text-center">Tap to manage subscriptions</p>
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
                    <p className="mt-2 text-xl font-semibold text-white">{currency.format(stats.internalTransfersTotal)}</p>
                    <p className="mt-1 text-xs text-zinc-400">Money moved between your own accounts.</p>
                </GlassCard>

                {/* Duplicate Charges Card */}
                <GlassCard
                    className={cn(
                        "p-5 transition cursor-pointer hover:ring-2",
                        isAnalyzing
                            ? "hover:ring-zinc-500/50 cursor-wait"
                            : (duplicateStats.totalSuspicious === 0 ? "hover:ring-emerald-500/50" : "hover:ring-amber-500/50")
                    )}
                    onClick={() => !isAnalyzing && setIsDuplicatesOverlayOpen(true)}
                >
                    {isAnalyzing ? (
                        <div className="flex flex-col items-center justify-center h-full py-1">
                            <Loader2 className="w-6 h-6 text-purple-400 animate-spin mb-2" />
                            <p className="text-xs text-zinc-400">Analyzing...</p>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center gap-2">
                                {duplicateStats.totalSuspicious === 0 ? (
                                    <Check className="w-5 h-5 text-emerald-400" />
                                ) : (
                                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                                )}
                                <p className="text-sm font-semibold text-white">Duplicate charges</p>
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
                                                ? "with possible duplicates"
                                                : "confirmed duplicate(s)"}
                                        </p>
                                    </>
                                )}
                            </div>
                        </>
                    )}
                </GlassCard>

                <GlassCard className="p-5">
                    <p className="text-sm font-semibold text-white">Money left after bills</p>
                    <p className="mt-2 text-xl font-semibold text-white">{currency.format(stats.net)}</p>
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
                            Saved this month: {currency.format(stats.net)}
                        </p>
                        <p className="text-xs text-zinc-500">
                            {Math.round((stats.net / stats.totalIncome) * 100)}% of income
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

            {/* Account Balances Section - Placeholder */}
            <GlassCard className="p-5 mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-white">Account Balances</h3>
                        <InfoTooltip text="Connect your accounts to see real-time balances and track your net worth." />
                    </div>
                    <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-1 rounded-full">Coming Soon</span>
                </div>
                
                {/* Placeholder accounts with mock data */}
                <div className="space-y-3 mb-4">
                    <div className="flex justify-between items-center p-3 rounded-lg bg-zinc-900/30 border border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                <span className="text-blue-400 text-xs font-bold">CH</span>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-white">Checking Account</p>
                                <p className="text-xs text-zinc-500">••••4521</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-medium text-zinc-500">—</p>
                            <p className="text-xs text-zinc-600">No data</p>
                        </div>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 rounded-lg bg-zinc-900/30 border border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                                <span className="text-emerald-400 text-xs font-bold">SV</span>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-white">Savings Account</p>
                                <p className="text-xs text-zinc-500">••••8832</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-medium text-zinc-500">—</p>
                            <p className="text-xs text-zinc-600">No data</p>
                        </div>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 rounded-lg bg-zinc-900/30 border border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                <span className="text-purple-400 text-xs font-bold">CC</span>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-white">Credit Card</p>
                                <p className="text-xs text-zinc-500">••••7291</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-medium text-zinc-500">—</p>
                            <p className="text-xs text-zinc-600">No data</p>
                        </div>
                    </div>
                </div>
                
                {/* Summary */}
                <div className="border-t border-white/5 pt-4 mt-4">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-sm text-zinc-400">Total Net Worth</span>
                        <span className="text-lg font-bold text-zinc-500">—</span>
                    </div>
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-sm text-zinc-400">Avg. Daily Balance</span>
                        <span className="text-sm font-medium text-zinc-500">—</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-zinc-400">Monthly Change</span>
                        <span className="text-sm font-medium text-zinc-500">—</span>
                    </div>
                </div>
                
                {/* CTA */}
                <div className="mt-5 p-4 rounded-xl bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-cyan-500/10 border border-purple-500/20">
                    <p className="text-sm font-medium text-white mb-1">🔗 Connect Your Accounts</p>
                    <p className="text-xs text-zinc-400 mb-3">
                        Link your bank accounts to see real balances, track net worth over time, and get personalized insights.
                    </p>
                    <div className="flex gap-2">
                        <button className="text-xs bg-purple-500/20 text-purple-300 px-3 py-1.5 rounded-lg hover:bg-purple-500/30 transition-colors border border-purple-500/30">
                            Connect Bank
                        </button>
                        <button className="text-xs bg-white/5 text-zinc-400 px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors border border-white/10">
                            Enter Manually
                        </button>
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

            {/* Duplicate Review Modal */}
            {isDuplicatesOverlayOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-8">
                    <GlassCard className="w-full max-w-2xl p-6 relative animate-in zoom-in-95 duration-200 max-h-[70vh] flex flex-col">
                        <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/5 flex-shrink-0">
                            <div>
                                <h3 className="text-xl font-bold text-white">Duplicate Review</h3>
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
                            {duplicateClusters.length === 0 ? (
                                <div className="text-center py-12 text-zinc-500">
                                    <Check className="w-12 h-12 mx-auto mb-3 text-emerald-500/50" />
                                    <p>Everything looks clean!</p>
                                </div>
                            ) : (
                                duplicateClusters.map(cluster => {
                                    const isExpanded = expandedClusters.has(cluster.key);
                                    const allClusterTransactions = cluster.transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                                    const suspiciousCount = cluster.suspiciousTransactionIds.length;

                                    return (
                                        <div key={cluster.key} className="bg-zinc-900/50 rounded-lg border border-zinc-800 overflow-hidden">
                                            <button
                                                onClick={() => toggleCluster(cluster.key)}
                                                className="w-full p-4 flex items-center justify-between hover:bg-zinc-800/50 transition"
                                            >
                                                <div className="text-left">
                                                    <p className="font-semibold text-white">{cluster.label}</p>
                                                    <div className="flex items-center gap-2 text-xs mt-1">
                                                        <span className="text-amber-400">{suspiciousCount} suspicious</span>
                                                        <span className="text-zinc-500">•</span>
                                                        <span className="text-zinc-400">{allClusterTransactions.length} total transactions</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    {cluster.lastNormalChargeDate && (
                                                        <div className="text-right hidden sm:block">
                                                            <p className="text-xs text-zinc-500">Last normal charge</p>
                                                            <p className="text-xs text-zinc-300">{dateFormatter.format(new Date(cluster.lastNormalChargeDate))}</p>
                                                        </div>
                                                    )}
                                                    {isExpanded ? <ChevronUp className="w-5 h-5 text-zinc-400" /> : <ChevronDown className="w-5 h-5 text-zinc-400" />}
                                                </div>
                                            </button>

                                            {isExpanded && (
                                                <div className="border-t border-zinc-800 bg-black/20 p-4 space-y-3">
                                                    {allClusterTransactions.map(tx => {
                                                        const isSuspicious = cluster.suspiciousTransactionIds.includes(tx.id);
                                                        const decision = duplicateDecisions[tx.id];

                                                        return (
                                                            <div key={tx.id} className={cn(
                                                                "p-3 rounded-lg border flex items-center justify-between gap-3",
                                                                isSuspicious
                                                                    ? "bg-amber-500/5 border-amber-500/20"
                                                                    : "bg-zinc-800/30 border-zinc-700/50"
                                                            )}>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        {isSuspicious && <AlertTriangle className="w-3 h-3 text-amber-500 flex-shrink-0" />}
                                                                        <p className={cn("text-sm font-medium truncate", isSuspicious ? "text-amber-100" : "text-zinc-300")}>
                                                                            {tx.description}
                                                                        </p>
                                                                    </div>
                                                                    <div className="flex items-center gap-3 text-xs text-zinc-500">
                                                                        <span>{dateFormatter.format(new Date(tx.date))}</span>
                                                                        {isSuspicious && (
                                                                            <span className="text-amber-500/80 italic">
                                                                                {decision === 'confirmed' ? 'Confirmed duplicate' : decision === 'dismissed' ? 'Dismissed' : 'Potential duplicate'}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center gap-4">
                                                                    <span className={cn("font-medium", isSuspicious ? "text-amber-400" : "text-zinc-400")}>
                                                                        {currency.format(tx.amount)}
                                                                    </span>

                                                                    {isSuspicious && (
                                                                        <div className="flex gap-2">
                                                                            <button
                                                                                onClick={() => setDuplicateDecision(tx.id, "confirmed")}
                                                                                className={cn(
                                                                                    "p-1.5 rounded transition",
                                                                                    decision === 'confirmed'
                                                                                        ? "bg-emerald-500 text-white"
                                                                                        : "bg-zinc-800 text-zinc-400 hover:bg-emerald-500/20 hover:text-emerald-400"
                                                                                )}
                                                                                title="Confirm Duplicate"
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
                    </GlassCard>
                </div>
            )}
        </GlassCard>
    );
}
