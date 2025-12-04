"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useDataStore } from "../../lib/store/useDataStore";
import { useUIStore } from "../../lib/store/useUIStore";
import { GlassCard } from "../ui/GlassCard";
import { cn, isDateInRange } from "../../lib/utils";
import { isSubscriptionCategory } from "../../lib/categoryRules";
import { analyzeDuplicateCharges } from "../../lib/fakeData";
import { Loader2 } from "lucide-react";
import { Transaction } from "../../lib/types";

export function Subscriptions() {
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

    // Filter for subscription transactions
    const subscriptionRows = useMemo(() => {
        return transactions.filter(t => {
            if (!isDateInRange(t.date, dateRange)) return false;
            return t.kind === "subscription" || isSubscriptionCategory(t.category);
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [transactions, dateRange]);

    const totalMonthly = useMemo(() => {
        return subscriptionRows.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    }, [subscriptionRows]);

    // Duplicate detection
    const duplicateAnalysis = useMemo(() => analyzeDuplicateCharges(transactions), [transactions]);
    const duplicateClusters = useMemo(() => {
        // Filter to only subscription-related duplicates
        return duplicateAnalysis.clusters.filter(cluster =>
            cluster.category === "Subscriptions" || isSubscriptionCategory(cluster.category)
        );
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
        <GlassCard intensity="medium" tint="purple" className="p-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-semibold text-white">Subscriptions</h2>
                <p className="text-zinc-400">Recurring services and memberships.</p>
            </div>

            {/* Loading State */}
            {isAnalyzing && (
                <GlassCard intensity="medium" tint="purple" className="mb-6 p-6">
                    <div className="flex flex-col items-center justify-center gap-3">
                        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                        <p className="text-sm text-zinc-400">Analyzing transactions...</p>
                    </div>
                </GlassCard>
            )}

            {/* Duplicate Detection Banner */}
            {!isAnalyzing && duplicateClusters.length > 0 && (
                <GlassCard
                    intensity="light"
                    tint={allResolved ? "emerald" : "amber"}
                    className="mb-6 p-4"
                >
                    <div className="flex items-start gap-3">
                        <span className="text-2xl">{allResolved ? "✅" : "⚠️"}</span>
                        <div className="flex-1">
                            <p className={cn(
                                "text-sm font-semibold mb-1",
                                allResolved ? "text-emerald-200" : "text-amber-200"
                            )}>
                                {allResolved
                                    ? (hasConfirmedSuspicious ? "All suspicious charges reviewed" : "All transactions look good")
                                    : "Possible duplicate subscriptions detected"}
                            </p>
                            <p className={cn(
                                "text-xs mb-3",
                                allResolved ? "text-emerald-300/80" : "text-amber-300/80"
                            )}>
                                {allResolved
                                    ? (hasConfirmedSuspicious
                                        ? `You marked ${confirmedSuspicious.length} charge${confirmedSuspicious.length > 1 ? 's' : ''} as suspicious. Nice work keeping an eye on things!`
                                        : "Everything checks out. No issues found!")
                                    : `We spotted ${unresolvedClusters.length} subscription${unresolvedClusters.length > 1 ? 's' : ''} that look off-pattern. Review them to confirm or dismiss.`
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

            {/* Rest of the component continues... */}
            <GlassCard
                className="mt-4 px-4 py-3 text-sm text-zinc-300 transition transform hover:-translate-y-0.5 hover:ring-purple-300/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-300/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 backdrop-blur-xl sm:backdrop-blur-2xl"
                tabIndex={0}
            >
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-zinc-400">Total this period</span>
                    <span className="text-lg font-semibold text-white">{currency.format(totalMonthly)}</span>
                </div>
            </GlassCard>

            <div className="mt-4 overflow-x-auto rounded-lg border border-zinc-800">
                <div className="min-w-[480px]">
                    <div className="grid grid-cols-3 bg-zinc-900/80 px-3 py-2 text-left text-xs font-semibold text-zinc-300 sm:px-4 sm:text-sm">
                        <span>Name</span>
                        <span className="text-right">Amount</span>
                        <span className="text-right">Date</span>
                    </div>
                    {subscriptionRows.length === 0 ? (
                        <div className="px-3 py-3 text-xs text-zinc-400 sm:px-4 sm:text-sm">
                            No subscriptions found for this period.
                        </div>
                    ) : (
                        <div className="divide-y divide-zinc-800">
                            {subscriptionRows.map((row) => {
                                const isSuspicious = flaggedIds.has(row.id) && !duplicateDecisions[row.id];

                                return (
                                    <div
                                        key={row.id}
                                        className={cn(
                                            "grid grid-cols-3 items-center px-3 py-3 text-xs text-zinc-200 sm:px-4 sm:text-sm",
                                            isSuspicious && "bg-amber-500/5 border-l-2 border-amber-500"
                                        )}
                                    >
                                        <span className="truncate flex items-center gap-2" title={row.description}>
                                            {isSuspicious && <span className="text-amber-500">⚠</span>}
                                            {row.description}
                                        </span>
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
