"use client";

import React, { useMemo, useState } from "react";
import { useDataStore } from "../../lib/store/useDataStore";
import { useDateStore } from "../../lib/store/useDateStore";
import {
    getTransactionsInDateRange,
    getSubscriptionTransactions,
    getTotalSubscriptions
} from "../../lib/selectors/transactionSelectors";
import { getSurroundingContext, getSuspiciousTypeLabel } from "../../lib/derived/suspiciousSummary";
import { GlassCard } from "../ui/GlassCard";
import { cn } from "../../lib/utils";
import { ChevronDown, ChevronUp, AlertTriangle, X, Info } from "lucide-react";
import { Transaction } from "../../lib/types";

// Group transactions by merchant
type MerchantGroup = {
    merchant: string;
    transactions: Transaction[];
    total: number;
    hasSuspicious: boolean;
    unreviewedCount: number;
};

export function Subscriptions() {
    const { transactions, duplicateDecisions, setDuplicateDecision } = useDataStore();
    const { viewStart, viewEnd } = useDateStore();
    const [showSuspiciousDetails, setShowSuspiciousDetails] = useState(false);
    const [expandedMerchants, setExpandedMerchants] = useState<Set<string>>(new Set());
    const [selectedSuspiciousTx, setSelectedSuspiciousTx] = useState<Transaction | null>(null);

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

    // 2. Get subscription transactions
    const subscriptionTxns = useMemo(() => {
        return getSubscriptionTransactions(filteredTransactions);
    }, [filteredTransactions]);

    // 3. Group by merchant
    const merchantGroups = useMemo(() => {
        const groups = new Map<string, MerchantGroup>();

        subscriptionTxns.forEach(tx => {
            const merchant = tx.merchantName || tx.description.split(' ')[0];

            if (!groups.has(merchant)) {
                groups.set(merchant, {
                    merchant,
                    transactions: [],
                    total: 0,
                    hasSuspicious: false,
                    unreviewedCount: 0
                });
            }

            const group = groups.get(merchant)!;
            group.transactions.push(tx);
            group.total += Math.abs(tx.amount);

            if (tx.isSuspicious) {
                group.hasSuspicious = true;
                if (!duplicateDecisions[tx.id]) {
                    group.unreviewedCount++;
                }
            }
        });

        // Sort transactions within each group by date descending
        groups.forEach(group => {
            group.transactions.sort((a, b) =>
                new Date(b.date).getTime() - new Date(a.date).getTime()
            );
        });

        // Return sorted by merchant name
        return Array.from(groups.values()).sort((a, b) =>
            a.merchant.localeCompare(b.merchant)
        );
    }, [subscriptionTxns, duplicateDecisions]);

    // 4. Calculate total
    const totalMonthly = useMemo(() => {
        return getTotalSubscriptions(filteredTransactions);
    }, [filteredTransactions]);

    // 5. Suspicious Subscriptions (ONLY in view range now)
    const suspiciousTransactions = useMemo(() => {
        return subscriptionTxns.filter(t => t.isSuspicious && !duplicateDecisions[t.id]);
    }, [subscriptionTxns, duplicateDecisions]);

    const hasSuspicious = suspiciousTransactions.length > 0;

    // Get surrounding context for More Info modal (D13)
    const surroundingContext = useMemo(() => {
        if (!selectedSuspiciousTx) return [];
        return getSurroundingContext(selectedSuspiciousTx, filteredTransactions);
    }, [selectedSuspiciousTx, filteredTransactions]);

    const toggleMerchant = (merchant: string) => {
        setExpandedMerchants(prev => {
            const next = new Set(prev);
            if (next.has(merchant)) {
                next.delete(merchant);
            } else {
                next.add(merchant);
            }
            return next;
        });
    };

    return (
        <GlassCard intensity="medium" tint="purple" className="p-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-semibold text-white">Subscriptions</h2>
                <p className="text-zinc-400">Recurring services and memberships.</p>
            </div>

            {/* Suspicious Detection Banner - D12: Improved contrast */}
            {hasSuspicious && (
                <GlassCard className="mb-6 p-4 bg-amber-900/40 border-amber-500/50">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="h-6 w-6 text-amber-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-sm font-semibold mb-1 text-amber-100">
                                Suspicious subscriptions detected
                            </p>
                            <p className="text-xs mb-3 text-amber-200">
                                We found {suspiciousTransactions.length} subscription{suspiciousTransactions.length > 1 ? 's' : ''} that look like duplicates or overcharges.
                            </p>
                            <button
                                onClick={() => setShowSuspiciousDetails(!showSuspiciousDetails)}
                                className="text-xs bg-amber-500 text-black font-medium px-3 py-1.5 rounded-full hover:bg-amber-400 transition-colors"
                            >
                                {showSuspiciousDetails ? 'Hide Details' : 'Review Issues'}
                            </button>
                        </div>
                    </div>
                </GlassCard>
            )}

            {/* Suspicious Details Panel (grouped by merchant) */}
            {showSuspiciousDetails && hasSuspicious && (
                <GlassCard className="mb-6 p-4 bg-zinc-900/50">
                    <h3 className="text-sm font-semibold text-white mb-4">Review Suspicious Subscriptions</h3>
                    <div className="space-y-3">
                        {suspiciousTransactions.map(tx => (
                            <div key={tx.id} className="bg-zinc-800/50 p-3 rounded-lg border border-zinc-700">
                                <div className="flex justify-between items-start mb-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-amber-500 font-bold">⚠️</span>
                                        <span className="text-white font-medium">{tx.description}</span>
                                    </div>
                                    <span className="text-amber-400 font-semibold">{currency.format(tx.amount)}</span>
                                </div>
                                <div className="text-zinc-400 text-xs ml-6 mb-1">{dateFormatter.format(new Date(tx.date))}</div>
                                <div className="text-amber-300 text-xs ml-6 italic mb-2">
                                    {tx.suspiciousReason || "Unusual activity detected"}
                                </div>
                                <div className="flex gap-2 ml-6">
                                    <button
                                        onClick={() => setSelectedSuspiciousTx(tx)}
                                        className="text-xs bg-zinc-700 text-white px-2 py-1 rounded hover:bg-zinc-600 transition flex items-center gap-1"
                                    >
                                        <Info className="h-3 w-3" />
                                        More Info
                                    </button>
                                    <button
                                        onClick={() => setDuplicateDecision(tx.id, "confirmed")}
                                        className="text-xs bg-rose-600 text-white px-2 py-1 rounded hover:bg-rose-500 transition"
                                    >
                                        Mark Suspicious
                                    </button>
                                    <button
                                        onClick={() => setDuplicateDecision(tx.id, "dismissed")}
                                        className="text-xs bg-emerald-600 text-white px-2 py-1 rounded hover:bg-emerald-500 transition"
                                    >
                                        All Good
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </GlassCard>
            )}

            {/* Total */}
            <GlassCard
                className="mt-4 px-4 py-3 text-sm text-zinc-300 transition transform hover:-translate-y-0.5 hover:ring-purple-300/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-300/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 backdrop-blur-xl sm:backdrop-blur-2xl"
                tabIndex={0}
            >
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-zinc-400">Total this period</span>
                    <span className="text-lg font-semibold text-white">{currency.format(totalMonthly)}</span>
                </div>
            </GlassCard>

            {/* Grouped Merchant List */}
            <div className="mt-4 space-y-2">
                {merchantGroups.length === 0 ? (
                    <div className="px-3 py-6 text-center text-zinc-400">
                        No subscriptions found for this period.
                    </div>
                ) : (
                    merchantGroups.map((group) => {
                        const isExpanded = expandedMerchants.has(group.merchant);

                        return (
                            <GlassCard key={group.merchant} className="overflow-hidden p-0">
                                {/* Merchant Header */}
                                <button
                                    onClick={() => toggleMerchant(group.merchant)}
                                    className={cn(
                                        "w-full flex items-center justify-between px-4 py-3 text-left transition hover:bg-zinc-800/60 focus:outline-none",
                                        group.hasSuspicious && "border-l-2 border-amber-500"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        {group.hasSuspicious && group.unreviewedCount > 0 && (
                                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                                        )}
                                        <div>
                                            <p className="font-semibold text-white">{group.merchant}</p>
                                            <p className="text-xs text-zinc-400">
                                                {group.transactions.length} charge{group.transactions.length !== 1 ? 's' : ''}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-medium text-white">
                                            {currency.format(group.total)}
                                        </span>
                                        {isExpanded ? (
                                            <ChevronUp className="h-4 w-4 text-zinc-400" />
                                        ) : (
                                            <ChevronDown className="h-4 w-4 text-zinc-400" />
                                        )}
                                    </div>
                                </button>

                                {/* Expanded Transaction List */}
                                {isExpanded && (
                                    <div className="border-t border-zinc-800">
                                        <div className="grid grid-cols-3 bg-zinc-900/80 px-4 py-2 text-xs font-semibold text-zinc-400">
                                            <span>Description</span>
                                            <span className="text-right">Amount</span>
                                            <span className="text-right">Date</span>
                                        </div>
                                        <div className="divide-y divide-zinc-800/50">
                                            {group.transactions.map(tx => {
                                                const isSuspicious = tx.isSuspicious && !duplicateDecisions[tx.id];

                                                return (
                                                    <div
                                                        key={tx.id}
                                                        className={cn(
                                                            "grid grid-cols-3 items-center px-4 py-2.5 text-xs",
                                                            isSuspicious
                                                                ? "bg-amber-500/5 text-amber-200"
                                                                : "text-zinc-200"
                                                        )}
                                                    >
                                                        <span className="flex items-center gap-2 truncate">
                                                            {isSuspicious && (
                                                                <AlertTriangle className="h-3 w-3 text-amber-500 flex-shrink-0" />
                                                            )}
                                                            <span className="truncate" title={tx.description}>
                                                                {tx.description}
                                                            </span>
                                                        </span>
                                                        <span className="text-right font-medium">
                                                            {currency.format(tx.amount)}
                                                        </span>
                                                        <span className="text-right text-zinc-400">
                                                            {dateFormatter.format(new Date(tx.date))}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </GlassCard>
                        );
                    })
                )}
            </div>

            {/* More Info Modal for Suspicious Transaction Context (D13) */}
            {selectedSuspiciousTx && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <GlassCard className="w-full max-w-lg p-6 relative animate-in zoom-in-95 duration-200 max-h-[80vh] flex flex-col">
                        <button
                            onClick={() => setSelectedSuspiciousTx(null)}
                            className="absolute top-4 right-4 text-zinc-400 hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {/* Header */}
                        <div className="mb-4 pb-4 border-b border-white/10">
                            <div className="flex items-center gap-2 mb-2">
                                <AlertTriangle className="w-5 h-5 text-amber-400" />
                                <span className="text-sm font-medium text-amber-400">
                                    {getSuspiciousTypeLabel(selectedSuspiciousTx.suspiciousType)}
                                </span>
                            </div>
                            <h3 className="text-lg font-bold text-white">{selectedSuspiciousTx.description}</h3>
                            <div className="flex items-center gap-4 mt-2 text-sm">
                                <span className="text-amber-400 font-medium">{currency.format(selectedSuspiciousTx.amount)}</span>
                                <span className="text-zinc-400">{dateFormatter.format(new Date(selectedSuspiciousTx.date))}</span>
                            </div>
                        </div>

                        {/* Reason */}
                        <div className="bg-amber-900/30 border border-amber-500/30 rounded-lg p-3 mb-4">
                            <p className="text-sm text-amber-200">
                                {selectedSuspiciousTx.suspiciousReason || "Unusual activity detected"}
                            </p>
                        </div>

                        {/* Surrounding Context */}
                        <div className="flex-1 overflow-y-auto min-h-0">
                            <h4 className="text-sm font-semibold text-zinc-400 mb-3">
                                Related Charges (±45 days)
                            </h4>
                            {surroundingContext.length === 0 ? (
                                <p className="text-sm text-zinc-500 italic">No related charges found in this period.</p>
                            ) : (
                                <div className="space-y-2">
                                    {surroundingContext.map(tx => (
                                        <div key={tx.id} className="flex justify-between items-center p-2 bg-zinc-900/50 rounded-lg">
                                            <div>
                                                <p className="text-sm text-white">{tx.description}</p>
                                                <p className="text-xs text-zinc-500">{dateFormatter.format(new Date(tx.date))}</p>
                                            </div>
                                            <span className="text-sm font-medium text-white">{currency.format(tx.amount)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 mt-4 pt-4 border-t border-white/10">
                            <button
                                onClick={() => {
                                    setDuplicateDecision(selectedSuspiciousTx.id, "confirmed");
                                    setSelectedSuspiciousTx(null);
                                }}
                                className="flex-1 bg-rose-600 hover:bg-rose-500 text-white py-2 rounded-lg font-medium transition"
                            >
                                Mark Suspicious
                            </button>
                            <button
                                onClick={() => {
                                    setDuplicateDecision(selectedSuspiciousTx.id, "dismissed");
                                    setSelectedSuspiciousTx(null);
                                }}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-lg font-medium transition"
                            >
                                All Good
                            </button>
                        </div>
                    </GlassCard>
                </div>
            )}
        </GlassCard>
    );
}
