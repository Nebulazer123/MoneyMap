"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useDataStore } from "../../lib/store/useDataStore";
import { useUIStore } from "../../lib/store/useUIStore";
import { GlassCard } from "../ui/GlassCard";
import { cn, isDateInRange } from "../../lib/utils";
import { isBillLikeCategory, isSubscriptionCategory, isBillishDescription } from "../../lib/categoryRules";
import { analyzeDuplicateCharges } from "../../lib/fakeData";
import { Loader2 } from "lucide-react";
import { Transaction } from "../../lib/types";

export function Recurring() {
    const { transactions, duplicateDecisions, setDuplicateDecision } = useDataStore();
    const { dateRange } = useUIStore();
    const [showDuplicates, setShowDuplicates] = useState(false);
    const [showConfirmed, setShowConfirmed] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(true);

    const currency = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    });

    const dateFormatter = new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
    });

    // Filter for recurring transactions in the current date range
    const recurringRows = useMemo(() => {
        return transactions.filter(t => {
            if (!isDateInRange(t.date, dateRange)) return false;

            const isSubscription = t.kind === "subscription" || isSubscriptionCategory(t.category);
            const isBill = isBillLikeCategory(t.category) || isBillishDescription(t.description);
            return isSubscription || isBill;
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [transactions, dateRange]);

    // Analyze duplicates on ALL transactions
    const duplicateAnalysis = useMemo(() => {
        return analyzeDuplicateCharges(transactions);
    }, [transactions]);

    const duplicateClusters = useMemo(() => {
        return duplicateAnalysis.clusters.filter(cluster => {
            // Only show clusters with recurring/bill transactions
            return cluster.category === "Subscriptions" ||
                cluster.category === "Bills and services" ||
                isSubscriptionCategory(cluster.category) ||
                isBillLikeCategory(cluster.category);
        });
    }, [duplicateAnalysis]);

    const flaggedIds = useMemo(() => duplicateAnalysis.flaggedTransactionIds, [duplicateAnalysis]);

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

    // Check if all suspicious transactions have been reviewed
    const unresolvedClusters = useMemo(() => {
        return duplicateClusters.filter(cluster => {
            return cluster.suspiciousTransactionIds.some(id => !duplicateDecisions[id]);
        });
    }, [duplicateClusters, duplicateDecisions]);

    // Get confirmed suspicious transactions
    const confirmedSuspicious = useMemo(() => {
        const confirmed: Transaction[] = [];
        duplicateClusters.forEach(cluster => {
            cluster.suspiciousTransactionIds.forEach(id => {
                if (duplicateDecisions[id] === "confirmed") {
                    const tx = transactions.find(t => t.id === id);
                    if (tx) confirmed.push(tx);
                }
            });
        });
        return confirmed.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [duplicateClusters, duplicateDecisions, transactions]);

    const allResolved = unresolvedClusters.length === 0 && duplicateClusters.length > 0;
    const hasConfirmedSuspicious = confirmedSuspicious.length > 0;

    return (
        <GlassCard intensity="medium" tint="amber" className="p-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-semibold text-white">Recurring</h2>
                <p className="text-zinc-400">Subscriptions, bills, and auto payments for this period.</p>
            </div>

            {/* Loading State */}
            {isAnalyzing && (
                <GlassCard className="mb-6 p-6 bg-zinc-900/50 border-zinc-700">
                    <div className="flex flex-col items-center justify-center gap-3">
                        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                        <p className="text-sm text-zinc-400">Analyzing transactions...</p>
                    </div>
                </GlassCard>
            )}

            {/* Duplicate Detection Banner */}
            {!isAnalyzing && duplicateClusters.length > 0 && (
                <GlassCard className={cn(
                    "mb-6 p-4",
                    allResolved ? "bg-emerald-500/10 border-emerald-500/30" : "bg-amber-500/10 border-amber-500/30"
                )}>
                    <div className="flex items-start gap-3">
                        <span className="text-2xl">{allResolved ? "✅" : "⚠️"}</span>
                        <div className="flex-1">
                            <p className={cn(
                                "text-sm font-semibold mb-1",
                                allResolved ? "text-emerald-200" : "text-amber-200"
                            )}>
                                {allResolved
                                    ? (hasConfirmedSuspicious ? "All suspicious charges reviewed" : "All transactions look good")
                                    : "Possible duplicate charges detected"}
                            </p>
                            <p className={cn(
                                "text-xs mb-3",
                                allResolved ? "text-emerald-300/80" : "text-amber-300/80"
                            )}>
                                {allResolved
                                    ? (hasConfirmedSuspicious
                                        ? `You marked ${confirmedSuspicious.length} charge${confirmedSuspicious.length > 1 ? 's' : ''} as suspicious. Nice work keeping an eye on things!`
                                        : "Everything checks out. No issues found!")
                                    : `We spotted ${unresolvedClusters.length} merchant${unresolvedClusters.length > 1 ? 's' : ''} with charges that look off. Take a look and let us know if they're legit or not.`
                                }
                            </p>
                            {!allResolved && (
                                <button
                                    onClick={() => setShowDuplicates(!showDuplicates)}
                                    className="text-xs bg-amber-500 text-white px-3 py-1.5 rounded-full hover:bg-amber-400 transition-colors"
                                >
                                    {showDuplicates ? 'Hide Details' : 'Show Details'}
                                </button>
                            )}
                        </div>
                    </div>
                </GlassCard>
            )}

            {/* Confirmed Suspicious Transactions Review */}
            {!isAnalyzing && allResolved && hasConfirmedSuspicious && (
                <GlassCard className="mb-6 p-4 bg-zinc-900/50 border-zinc-700">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-white">Confirmed Suspicious Charges</h3>
                        <button
                            onClick={() => setShowConfirmed(!showConfirmed)}
                            className="text-xs text-zinc-400 hover:text-white transition"
                        >
                            {showConfirmed ? 'Hide' : 'Review'}
                        </button>
                    </div>

                    {showConfirmed && (
                        <div className="space-y-2 mt-3">
                            {confirmedSuspicious.map(tx => (
                                <div key={tx.id} className="bg-zinc-800/50 border border-zinc-700 p-3 rounded text-xs">
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="flex items-center gap-2 flex-1">
                                            <span className="text-zinc-400">🔍</span>
                                            <span className="text-white font-medium">{tx.description}</span>
                                        </div>
                                        <span className="text-zinc-300 font-semibold ml-2">{currency.format(tx.amount)}</span>
                                    </div>
                                    <div className="text-zinc-500 ml-6 mb-2">{dateFormatter.format(new Date(tx.date))}</div>
                                    <div className="flex gap-2 ml-6">
                                        <button
                                            onClick={() => setDuplicateDecision(tx.id, "dismissed")}
                                            className="text-xs bg-zinc-700 text-white px-2 py-1 rounded hover:bg-zinc-600 transition"
                                        >
                                            Mark as Good
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </GlassCard>
            )}

            {/* Duplicate Details */}
            {!isAnalyzing && showDuplicates && unresolvedClusters.length > 0 && (
                <GlassCard className="mb-6 p-4 bg-zinc-900/50">
                    <h3 className="text-sm font-semibold text-white mb-4">Suspected Duplicates</h3>
                    <div className="space-y-3">
                        {unresolvedClusters.map(cluster => {
                            const clusterTransactions = transactions.filter(t =>
                                cluster.suspiciousTransactionIds.includes(t.id)
                            ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                            // Calculate reason for each transaction
                            const getTransactionReason = (tx: Transaction) => {
                                const txDate = new Date(tx.date);

                                // Check for double charge (same day or within 3 days)
                                const nearbyCharges = clusterTransactions.filter(t => {
                                    if (t.id === tx.id) return false;
                                    const otherDate = new Date(t.date);
                                    const daysDiff = Math.abs((txDate.getTime() - otherDate.getTime()) / (1000 * 60 * 60 * 24));
                                    return daysDiff <= 3;
                                });

                                if (nearbyCharges.length > 0) {
                                    const nearestDate = nearbyCharges[0].date;
                                    const daysDiff = Math.abs((txDate.getTime() - new Date(nearestDate).getTime()) / (1000 * 60 * 60 * 24));
                                    return `Double charge - also charged ${Math.round(daysDiff)} day${Math.round(daysDiff) === 1 ? '' : 's'} ${txDate > new Date(nearestDate) ? 'after' : 'before'} on ${new Date(nearestDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
                                }

                                // Check for unusual frequency - only if multiple charges are outside the expected window
                                if (cluster.medianIntervalDays > 0 && cluster.medianIntervalDays < 40) {
                                    // Get all transaction dates sorted
                                    const allClusterTxs = transactions.filter(t => cluster.transactionIds.includes(t.id))
                                        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

                                    const txIndex = allClusterTxs.findIndex(t => t.id === tx.id);
                                    if (txIndex > 0) {
                                        const prevTx = allClusterTxs[txIndex - 1];
                                        const actualDays = (txDate.getTime() - new Date(prevTx.date).getTime()) / (1000 * 60 * 60 * 24);
                                        const expectedDays = cluster.medianIntervalDays;
                                        const tolerance = 3;

                                        // Only flag if significantly outside the expected range
                                        if (Math.abs(actualDays - expectedDays) > tolerance) {
                                            return `Unusual frequency - normally charged every ${Math.round(expectedDays)} days, but this was ${Math.round(actualDays)} days`;
                                        }
                                    }
                                }

                                // Check for unusual amount
                                const amountDiff = Math.abs(Math.abs(tx.amount) - cluster.medianAmount);
                                if (amountDiff > cluster.medianAmount * 0.15) {
                                    return `Unusual amount - normally ${currency.format(cluster.medianAmount)}`;
                                }

                                return `Doesn't match usual pattern`;
                            };

                            return (
                                <div key={cluster.key} className="bg-zinc-800/50 p-3 rounded-lg border border-zinc-700">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <p className="text-sm font-medium text-white">{cluster.label}</p>
                                            <p className="text-xs text-zinc-400">{clusterTransactions.filter(tx => !duplicateDecisions[tx.id]).length} suspicious charge(s)</p>
                                        </div>
                                        <span className="text-xs text-amber-400 font-medium">
                                            ~{currency.format(cluster.medianAmount)} each
                                        </span>
                                    </div>

                                    {/* Suspicious Transactions */}
                                    <div className="space-y-2 mt-3">
                                        {clusterTransactions.map((tx) => {
                                            const decision = duplicateDecisions[tx.id];
                                            if (decision) return null; // Hide resolved transactions

                                            return (
                                                <div key={tx.id} className="bg-amber-500/10 border border-amber-500/30 p-2 rounded text-xs">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <div className="flex items-center gap-2 flex-1">
                                                            <span className="text-amber-500 font-bold">⚠️</span>
                                                            <span className="text-white font-medium">{tx.description}</span>
                                                        </div>
                                                        <span className="text-amber-400 font-semibold ml-2">{currency.format(tx.amount)}</span>
                                                    </div>
                                                    <div className="text-zinc-400 ml-5">{dateFormatter.format(new Date(tx.date))}</div>
                                                    <div className="text-amber-300 text-xs mt-1 ml-5 italic">
                                                        {getTransactionReason(tx)}
                                                    </div>
                                                    <div className="flex gap-2 mt-2 ml-5">
                                                        <button
                                                            onClick={() => setDuplicateDecision(tx.id, "confirmed")}
                                                            className="text-xs bg-emerald-600 text-white px-2 py-1 rounded hover:bg-emerald-500 transition"
                                                        >
                                                            Confirm
                                                        </button>
                                                        <button
                                                            onClick={() => setDuplicateDecision(tx.id, "dismissed")}
                                                            className="text-xs bg-zinc-700 text-white px-2 py-1 rounded hover:bg-zinc-600 transition"
                                                        >
                                                            Dismiss
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="flex gap-2 mt-3 pt-3 border-t border-zinc-700">
                                        <button
                                            onClick={() => {
                                                cluster.suspiciousTransactionIds.forEach((id: string) => {
                                                    if (!duplicateDecisions[id]) {
                                                        setDuplicateDecision(id, "confirmed");
                                                    }
                                                });
                                            }}
                                            className="text-xs bg-emerald-600 text-white px-2 py-1 rounded hover:bg-emerald-500 transition"
                                        >
                                            Confirm All Remaining
                                        </button>
                                        <button
                                            onClick={() => {
                                                cluster.suspiciousTransactionIds.forEach((id: string) => {
                                                    if (!duplicateDecisions[id]) {
                                                        setDuplicateDecision(id, "dismissed");
                                                    }
                                                });
                                            }}
                                            className="text-xs bg-zinc-700 text-white px-2 py-1 rounded hover:bg-zinc-600 transition"
                                        >
                                            Dismiss All Remaining
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </GlassCard>
            )}

            <div className="overflow-x-auto rounded-lg border border-zinc-800">
                <div className="min-w-[520px]">
                    <div className="grid grid-cols-4 bg-zinc-900/80 px-3 py-2 text-left text-xs font-semibold text-zinc-300 sm:px-4 sm:text-sm">
                        <span>Name</span>
                        <span>Category</span>
                        <span className="text-right">Amount</span>
                        <span className="text-right">Date</span>
                    </div>
                    {recurringRows.length === 0 ? (
                        <div className="px-3 py-3 text-xs text-zinc-400 sm:px-4 sm:text-sm">
                            No recurring transactions found for this period.
                        </div>
                    ) : (
                        <div className="divide-y divide-zinc-800">
                            {recurringRows.map((row) => {
                                const displayCategory = isBillLikeCategory(row.category)
                                    ? "Bills and services"
                                    : row.category;
                                const isSuspicious = flaggedIds.has(row.id) && !duplicateDecisions[row.id];

                                return (
                                    <div
                                        key={row.id}
                                        className={cn(
                                            "grid grid-cols-4 items-center px-3 py-3 text-xs text-zinc-200 sm:px-4 sm:text-sm",
                                            isSuspicious && "bg-amber-500/5 border-l-2 border-amber-500"
                                        )}
                                    >
                                        <span className="flex items-center gap-2 truncate" title={row.description}>
                                            {isSuspicious && <span className="text-amber-500">⚠</span>}
                                            {row.description}
                                        </span>
                                        <span className="text-zinc-400">{displayCategory}</span>
                                        <span className="text-right font-medium">{currency.format(row.amount)}</span>
                                        <span className="text-right text-zinc-400">{dateFormatter.format(new Date(row.date))}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </GlassCard>
    );
}
