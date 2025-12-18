"use client";

import React, { useMemo } from "react";
import { useDataStore } from "../../lib/store/useDataStore";
import { useDateStore } from "../../lib/store/useDateStore";
import { GlassCard } from "../ui/GlassCard";
import { InfoTooltip } from "../ui/InfoTooltip";
import { cn } from "../../lib/utils";
import { calculateSummaryStats, calculateBudgetGuidance } from "../../lib/logic/metrics";
import { getTransactionsInDateRange } from "../../lib/selectors/transactionSelectors";
import { computeCarInsuranceMonthlySpend } from "../../lib/math/transactionMath";
import { CAR_INSURANCE } from "../../lib/data/merchantPools";

export function Budget() {
    const { transactions } = useDataStore();
    const { viewStart, viewEnd } = useDateStore();

    const currency = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    });

    // Phase 2.1 view-range: Filter ALL transactions through centralized helper
    // This ensures consistent month-based filtering across the entire Budget tab
    // eslint-disable-next-line react-hooks/preserve-manual-memoization
    const filteredTransactions = useMemo(() => {
        return getTransactionsInDateRange(transactions, viewStart, viewEnd);
    }, [transactions, viewStart, viewEnd]);

    // Use the centralized filtered transactions for all calculations (no legacy dateRange)
    const stats = useMemo(() => calculateSummaryStats(filteredTransactions), [filteredTransactions]);
    const budgetGuidance = useMemo(() => calculateBudgetGuidance(filteredTransactions, stats.totalIncome), [filteredTransactions, stats.totalIncome]);

    // Phase 2.3 car-insurance-box: Calculate car insurance monthly spend
    const CAR_INSURANCE_BENCHMARK_MONTHLY = 150;
    const yourCarInsuranceMonthly = useMemo(() => {
        return computeCarInsuranceMonthlySpend(filteredTransactions, viewStart, viewEnd, CAR_INSURANCE);
    }, [filteredTransactions, viewStart, viewEnd]);

    return (
        <GlassCard intensity="medium" tint="emerald" className="p-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-semibold text-white">Budget Guidance</h2>
                <p className="text-zinc-400">Smart spending recommendations based on your income.</p>
            </div>

            {/* Summary Stats */}
            <div className="grid gap-4 sm:grid-cols-3 mb-8">
                <GlassCard className="p-5">
                    <p className="text-sm text-zinc-400 mb-2">Total Income</p>
                    <p className="text-2xl font-bold text-emerald-400">{currency.format(stats.totalIncome)}</p>
                </GlassCard>

                <GlassCard className="p-5">
                    <p className="text-sm text-zinc-400 mb-2">Total Spending</p>
                    <p className="text-2xl font-bold text-rose-400">{currency.format(stats.totalSpending)}</p>
                </GlassCard>

                <GlassCard className="p-5">
                    <p className="text-sm text-zinc-400 mb-2">Total Fees</p>
                    <p className="text-2xl font-bold text-amber-400">{currency.format(stats.totalFees)}</p>
                    {stats.largestSingleExpense && stats.largestSingleExpense.category === 'Fees' && (
                        <p className="text-xs text-zinc-500 mt-1">Largest: {currency.format(stats.largestSingleExpense.amount)}</p>
                    )}
                </GlassCard>
            </div>

            {/* Budget Guidance Cards */}
            <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Category Breakdown</h3>
                    <InfoTooltip text="These recommendations are based on the 50/30/20 rule and your actual income." />
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {budgetGuidance.map((item) => (
                        <GlassCard key={item.category} className="p-5 hover:ring-2 hover:ring-white/10 transition">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h4 className="font-semibold text-white text-lg">{item.name}</h4>
                                    <p className="text-xs text-zinc-500">Budget Category</p>
                                </div>
                                <span className={cn(
                                    "text-xs font-medium px-2 py-1 rounded-full",
                                    item.differenceDirection === "under"
                                        ? "bg-emerald-500/10 text-emerald-400"
                                        : "bg-rose-500/10 text-rose-400"
                                )}>
                                    {item.differenceDirection === "under" ? "✓ On Track" : "⚠ Over Budget"}
                                </span>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-zinc-400">You Spent</span>
                                        <span className="text-white font-semibold">{currency.format(item.actual)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-zinc-400">Recommended Max</span>
                                        <span className="text-zinc-300">{currency.format(item.recommendedMax)}</span>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                                        <div
                                            className={cn(
                                                "h-full transition-all duration-500",
                                                item.differenceDirection === "under" ? "bg-emerald-500" : "bg-rose-500"
                                            )}
                                            style={{ width: `${Math.min((item.actual / item.recommendedMax) * 100, 100)}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="pt-3 border-t border-white/5">
                                    <p className={cn(
                                        "text-sm font-medium text-center",
                                        item.differenceDirection === "under" ? "text-emerald-400" : "text-rose-400"
                                    )}>
                                        {item.differenceDirection === "under"
                                            ? `${currency.format(item.differenceAmount)} under budget`
                                            : `${currency.format(item.differenceAmount)} over budget`}
                                    </p>
                                </div>
                            </div>
                        </GlassCard>
                    ))}
                </div>
            </div>

            {/* Phase 2.3 car-insurance-box: Car Insurance Box */}
            <div className="mt-8">
                <h3 className="text-lg font-semibold text-white mb-4">Insurance</h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <GlassCard className="p-5 hover:ring-2 hover:ring-white/10 transition">
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <h4 className="font-semibold text-white text-lg">Car insurance</h4>
                                <p className="text-xs text-zinc-500">Monthly Estimate</p>
                            </div>
                            <span className="text-xl">🚗</span>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-zinc-400">Your car insurance</span>
                                    <span className="text-white font-semibold">{currency.format(yourCarInsuranceMonthly)}</span>
                                </div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-zinc-400">Typical in your area</span>
                                    <span className="text-zinc-300">{currency.format(CAR_INSURANCE_BENCHMARK_MONTHLY)}/mo</span>
                                </div>
                            </div>

                            <div className="pt-3 border-t border-white/5">
                                {(() => {
                                    const delta = yourCarInsuranceMonthly - CAR_INSURANCE_BENCHMARK_MONTHLY;
                                    const absDelta = Math.abs(delta);
                                    const isNearEqual = absDelta < 10;

                                    if (isNearEqual) {
                                        return (
                                            <p className="text-sm font-medium text-center text-emerald-400">
                                                ✓ About typical for your area
                                            </p>
                                        );
                                    } else if (delta > 0) {
                                        return (
                                            <p className="text-sm font-medium text-center text-rose-400">
                                                ▲ {currency.format(absDelta)} more than typical
                                            </p>
                                        );
                                    } else {
                                        return (
                                            <p className="text-sm font-medium text-center text-emerald-400">
                                                ▼ {currency.format(absDelta)} less than typical
                                            </p>
                                        );
                                    }
                                })()}
                            </div>
                        </div>
                    </GlassCard>
                </div>
            </div>

            {/* Helpful Tips */}
            <GlassCard className="p-6 mt-8 bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/20">
                <div className="flex items-start gap-3">
                    <div className="text-2xl">💡</div>
                    <div>
                        <h4 className="font-semibold text-white mb-2">Budget Tips</h4>
                        <ul className="space-y-2 text-sm text-zinc-300">
                            <li className="flex items-start gap-2">
                                <span className="text-emerald-400 mt-0.5">•</span>
                                <span>Try to keep housing costs (rent/mortgage) under 30% of your income</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-emerald-400 mt-0.5">•</span>
                                <span>Aim for groceries to be around 10% of your monthly income</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-emerald-400 mt-0.5">•</span>
                                <span>Transportation should ideally stay below 15-20% of income</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-emerald-400 mt-0.5">•</span>
                                <span>Review and cancel unused subscriptions to reduce recurring costs</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </GlassCard>
        </GlassCard>
    );
}
