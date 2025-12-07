"use client";

import React, { useMemo, useState } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { useDataStore } from "../../lib/store/useDataStore";
import { useDateStore } from "../../lib/store/useDateStore";
import { overviewGroupMeta, categoryEmojis, OverviewGroupKey, overviewGroupOrder } from "../../lib/config";
import {
    getTransactionsInDateRange,
    getCategoryTotals
} from "../../lib/selectors/transactionSelectors";
import { computeSummaryMetrics } from "../../lib/math/transactionMath";
import { GlassCard } from "../ui/GlassCard";
import { InfoTooltip } from "../ui/InfoTooltip";
import { cn } from "../../lib/utils";
import { TrendingUp, TrendingDown, Wallet, CreditCard, DollarSign, Search } from "lucide-react";
import { EconomicWidget } from "./EconomicWidget";
import { Transaction } from "../../lib/types";

// Helper to get categories for a group
const getCategoriesForGroup = (groupId: OverviewGroupKey): string[] => {
    return overviewGroupMeta[groupId]?.categories || [];
};

// Helper to get display category
const getTransactionDisplayCategory = (tx: Transaction): string => {
    return tx.category;
};

export type SpendingGroup = {
    id: OverviewGroupKey;
    label: string;
    value: number;
    categories: { name: string; amount: number }[];
    color: string;
    emoji: string;
    percent: number;
};

type DetailCardConfig = {
    label: string;
    categories: string[];
    groupId: OverviewGroupKey;
    emoji: string;
};

const detailCardsConfig: DetailCardConfig[] = [
    { label: "Rent", categories: ["Rent"], groupId: "rent_utils", emoji: categoryEmojis.Rent },
    { label: "Utilities", categories: ["Utilities"], groupId: "rent_utils", emoji: categoryEmojis.Utilities },
    { label: "Auto", categories: ["Transport"], groupId: "auto", emoji: categoryEmojis.Transport },
    { label: "Subscriptions", categories: ["Subscriptions"], groupId: "subscriptions", emoji: categoryEmojis.Subscriptions },
    { label: "Bills and services", categories: ["Bills & services"], groupId: "bills_services", emoji: categoryEmojis["Bills & services"] },
    { label: "Stores", categories: ["Groceries"], groupId: "groceries_dining", emoji: categoryEmojis.Groceries },
    { label: "Dining", categories: ["Dining"], groupId: "groceries_dining", emoji: categoryEmojis.Dining ?? categoryEmojis.Groceries },
    { label: "Fees", categories: ["Fees"], groupId: "other_fees", emoji: categoryEmojis.Fees },
    { label: "Insurance", categories: ["Insurance"], groupId: "insurance", emoji: categoryEmojis.Insurance },
    { label: "Transfers", categories: ["Transfer"], groupId: "transfers", emoji: categoryEmojis.Transfer },
    { label: "Online Shopping", categories: ["Education"], groupId: "education", emoji: categoryEmojis.Education },
    { label: "Other", categories: ["Other", "Loans"], groupId: "other_fees", emoji: categoryEmojis.Other },
];

export function Overview() {
    const { transactions } = useDataStore();
    const { viewStart, viewEnd } = useDateStore();

    const [activeCategoryIds, setActiveCategoryIds] = useState<string[]>([]);
    const [chartInteractive, setChartInteractive] = useState(false);

    const currency = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    });

    const dateFormatter = new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
    });

    // Filter transactions by date range using new selector
    const filteredTransactions = useMemo(() => {
        return getTransactionsInDateRange(transactions, viewStart, viewEnd);
    }, [transactions, viewStart, viewEnd]);

    // Phase 2.2 transaction-math: Compute summary metrics using centralized logic
    const stats = useMemo(() => {
        return computeSummaryMetrics(filteredTransactions);
    }, [filteredTransactions]);

    // Calculate spending data
    const groupedSpendingData = useMemo(() => {
        const categoryTotalsMap = getCategoryTotals(filteredTransactions);

        // Convert Map to array format expected by logic below
        const spendingByCategory = Array.from(categoryTotalsMap.entries()).map(([category, amount]) => ({
            category,
            amount
        }));

        const totalSpending = spendingByCategory.reduce((sum, item) => sum + item.amount, 0);

        if (totalSpending === 0) return [];

        const groups: SpendingGroup[] = [];
        const groupMap = new Map<OverviewGroupKey, { value: number; categories: { name: string; amount: number }[] }>();

        // Initialize groups
        overviewGroupOrder.forEach(key => {
            groupMap.set(key, { value: 0, categories: [] });
        });

        // Distribute categories to groups
        spendingByCategory.forEach(item => {
            let foundGroup: OverviewGroupKey | null = null;
            for (const [groupKey, meta] of Object.entries(overviewGroupMeta)) {
                if (meta.categories.includes(item.category)) {
                    foundGroup = groupKey as OverviewGroupKey;
                    break;
                }
            }

            if (!foundGroup) return;

            const group = groupMap.get(foundGroup);
            if (group) {
                group.value += item.amount;
                group.categories.push({ name: item.category, amount: item.amount });
            }
        });

        // Build result array
        groupMap.forEach((data, id) => {
            if (data.value > 0) {
                groups.push({
                    id,
                    label: overviewGroupMeta[id].label,
                    value: data.value,
                    categories: data.categories.sort((a, b) => b.amount - a.amount),
                    color: overviewGroupMeta[id].color,
                    emoji: overviewGroupMeta[id].emoji,
                    percent: Math.round((data.value / totalSpending) * 100),
                });
            }
        });

        return groups.sort((a, b) => b.value - a.value);
    }, [filteredTransactions]);

    const activeGroupId = useMemo(() => {
        if (activeCategoryIds.length === 0) return null;
        for (const [groupKey, meta] of Object.entries(overviewGroupMeta)) {
            const groupCategories = new Set(meta.categories);
            const isActive = activeCategoryIds.every((cat) => groupCategories.has(cat));
            if (isActive) return groupKey as OverviewGroupKey;
        }
        return null;
    }, [activeCategoryIds]);

    const activeGroupDetails = useMemo(
        () => groupedSpendingData.find((group) => group.id === activeGroupId) ?? null,
        [activeGroupId, groupedSpendingData],
    );

    const groupCategoryAmountMap = useMemo(() => {
        const map = new Map<OverviewGroupKey, Map<string, number>>();
        groupedSpendingData.forEach((group) => {
            map.set(group.id, new Map(group.categories.map((cat) => [cat.name, cat.amount])));
        });
        return map;
    }, [groupedSpendingData]);

    const detailCards = detailCardsConfig.map((card) => {
        const amountsForGroup = groupCategoryAmountMap.get(card.groupId);
        const amount = card.categories.reduce((sum, name) => sum + (amountsForGroup?.get(name) ?? 0), 0);
        return { ...card, amount };
    });

    const overviewTransactions = useMemo(() => {
        if (activeCategoryIds.length === 0) return [];
        return filteredTransactions.filter(t => activeCategoryIds.includes(t.category));
    }, [filteredTransactions, activeCategoryIds]);

    const onSelectGroup = (categories: string[]) => {
        if (
            categories.length === activeCategoryIds.length &&
            categories.every((c) => activeCategoryIds.includes(c))
        ) {
            setActiveCategoryIds([]);
        } else {
            setActiveCategoryIds(categories);
        }
    };

    const getGroupIdFromEntry = (entry: unknown): OverviewGroupKey | null => {
        if (!entry || typeof entry !== "object") return null;
        const candidate = entry as { id?: OverviewGroupKey; payload?: { id?: OverviewGroupKey } };
        return candidate.id ?? candidate.payload?.id ?? null;
    };

    return (
        <GlassCard intensity="medium" tint="blue" className="p-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-semibold text-white">Overview</h2>
                <p className="text-zinc-400">Where your money went this month.</p>
            </div>

            {groupedSpendingData.length > 0 && (
                <GlassCard className="p-6 mb-6 bg-zinc-900/50 backdrop-blur-xl">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-white">Spending by group</h3>
                    </div>
                    <div className="h-80 w-full" style={{ pointerEvents: chartInteractive ? "auto" : "none" }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={groupedSpendingData}
                                    dataKey="value"
                                    nameKey="label"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={0}
                                    outerRadius={130}
                                    paddingAngle={2}
                                    cornerRadius={4}
                                    stroke="none"
                                    onMouseEnter={() => setChartInteractive(true)}
                                    onMouseLeave={() => setChartInteractive(false)}
                                    onClick={(data) => {
                                        const groupId = getGroupIdFromEntry(data);
                                        if (groupId) {
                                            const categories = getCategoriesForGroup(groupId);
                                            onSelectGroup(categories);
                                        }
                                    }}
                                >
                                    {groupedSpendingData.map((entry) => (
                                        <Cell
                                            key={entry.id}
                                            fill={entry.color}
                                            className="transition-all duration-300 hover:opacity-80 cursor-pointer stroke-zinc-900 stroke-2"
                                        />
                                    ))}
                                </Pie>
                                <Tooltip
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const data = payload[0].payload;
                                            return (
                                                <div className="bg-zinc-900/90 backdrop-blur-xl border border-white/10 p-3 rounded-xl shadow-xl">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-xl">{data.emoji}</span>
                                                        <span className="font-medium text-white">{data.label}</span>
                                                    </div>
                                                    <div className="text-2xl font-bold text-white">
                                                        {currency.format(data.value)}
                                                    </div>
                                                    <div className="text-xs text-zinc-400 mt-1">
                                                        {data.percent.toFixed(1)}% of spending
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        {groupedSpendingData.map((item) => {
                            const isActive = item.id === activeGroupId;
                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => {
                                        const categories = getCategoriesForGroup(item.id);
                                        onSelectGroup(categories);
                                    }}
                                    className={cn(
                                        "flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition transform focus:outline-none",
                                        isActive
                                            ? "border-zinc-500 bg-zinc-800"
                                            : "border-zinc-800 bg-zinc-900 hover:-translate-y-0.5 hover:border-zinc-600 hover:bg-zinc-800"
                                    )}
                                >
                                    <div className="flex items-center gap-3 text-zinc-200">
                                        <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                                        <span className="flex items-center gap-1">
                                            <span aria-hidden="true">{item.emoji}</span>
                                            <span>{item.label}</span>
                                        </span>
                                    </div>
                                    <div className="text-right text-xs text-zinc-400">
                                        <div className="text-base font-semibold text-white">{`${item.percent}%`}</div>
                                        <div className="text-[11px] text-zinc-500">{currency.format(item.value)}</div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </GlassCard>
            )}

            {/* Summary Metric Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
                <GlassCard accent="green" tint="emerald" intensity="light" hoverEffect className="p-4">
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2 text-zinc-400 text-xs">
                            <TrendingUp className="h-3 w-3" />
                            <span>Income</span>
                        </div>
                        <InfoTooltip text="Total earnings from all sources before taxes." />
                    </div>
                    <p className="text-lg font-bold text-white">
                        {currency.format(stats.income)}
                    </p>
                </GlassCard>
                <GlassCard accent="orange" tint="rose" intensity="light" hoverEffect className="p-4">
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2 text-zinc-400 text-xs">
                            <TrendingDown className="h-3 w-3" />
                            <span>Spending</span>
                        </div>
                        <InfoTooltip text="Total expenses excluding transfers and savings." />
                    </div>
                    <p className="text-lg font-bold text-white">
                        {currency.format(stats.spending)}
                    </p>
                </GlassCard>
                <GlassCard accent="cyan" tint="cyan" intensity="light" hoverEffect className="p-4">
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2 text-zinc-400 text-xs">
                            <Wallet className="h-3 w-3" />
                            <span>Net Cashflow</span>
                        </div>
                        <InfoTooltip text="What's left after all spending is deducted from income." />
                    </div>
                    <p className="text-lg font-bold text-white">
                        {currency.format(stats.netCashFlow)}
                    </p>
                </GlassCard>
                <GlassCard accent="purple" tint="purple" intensity="light" hoverEffect className="p-4">
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2 text-zinc-400 text-xs">
                            <CreditCard className="h-3 w-3" />
                            <span>Subscriptions</span>
                        </div>
                        <InfoTooltip text="Recurring payments identified as subscriptions." />
                    </div>
                    <p className="text-lg font-bold text-white">
                        {currency.format(stats.subscriptionTotal)}
                    </p>
                </GlassCard>
                <GlassCard accent="yellow" tint="yellow" intensity="light" hoverEffect className="p-4">
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2 text-zinc-400 text-xs">
                            <DollarSign className="h-3 w-3" />
                            <span>Fees</span>
                        </div>
                        <InfoTooltip text="Bank fees, service charges, and other costs." />
                    </div>
                    <p className="text-lg font-bold text-white">
                        {currency.format(stats.feeTotal)}
                    </p>
                </GlassCard>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mb-6">
                {detailCards.map((card) => {
                    const isActive = card.categories.some((cat) => activeCategoryIds.includes(cat));
                    return (
                        <GlassCard
                            key={card.label}
                            role="button"
                            tabIndex={0}
                            onClick={() => {
                                const categoriesInGroup = getCategoriesForGroup(card.groupId);
                                onSelectGroup(categoriesInGroup);
                            }}
                            className={cn(
                                "w-full px-4 py-3 text-left transition transform hover:-translate-y-0.5 cursor-pointer",
                                "hover:ring-1 hover:ring-white/20",
                                isActive ? "ring-2 ring-purple-400" : ""
                            )}
                        >
                            <p className="flex items-center gap-2 text-sm text-zinc-400">
                                <span aria-hidden="true">{card.emoji}</span>
                                <span>{card.label}</span>
                            </p>
                            <p className="mt-1 text-lg font-semibold text-white">{currency.format(card.amount)}</p>
                        </GlassCard>
                    );
                })}
            </div>

            <div className="space-y-2 rounded-xl border border-zinc-800 bg-zinc-950/70 px-4 py-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white">
                        Transactions for {activeGroupDetails ? activeGroupDetails.label : "selected category"}
                    </h3>
                </div>
                <div className="overflow-x-auto rounded-lg border border-zinc-800">
                    <div className="min-w-[640px]">
                        <div className="grid grid-cols-4 bg-zinc-900/80 px-3 py-2 text-left text-xs font-semibold text-zinc-300 sm:px-4 sm:text-sm">
                            <span>Date</span>
                            <span>Description</span>
                            <span>Category</span>
                            <span className="text-right">Amount</span>
                        </div>
                        {overviewTransactions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                                <div className="h-12 w-12 rounded-full bg-zinc-800/50 flex items-center justify-center mb-3">
                                    <Search className="h-6 w-6 text-zinc-500" />
                                </div>
                                <p className="text-lg font-medium text-zinc-300 mb-1">
                                    No transactions to display
                                </p>
                                <p className="text-sm text-zinc-500">
                                    Select a category group above to see details.
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-zinc-800">
                                {overviewTransactions.map((tx) => {
                                    const displayCategory = getTransactionDisplayCategory(tx);
                                    return (
                                        <div
                                            key={tx.id}
                                            className="grid grid-cols-4 items-center px-3 py-3 text-xs text-zinc-200 sm:px-4 sm:text-sm"
                                        >
                                            <span className="text-zinc-300">{dateFormatter.format(new Date(tx.date))}</span>
                                            <span className="truncate" title={tx.description}>
                                                {tx.description}
                                            </span>
                                            <span className="truncate text-zinc-400" title={displayCategory}>
                                                {displayCategory}
                                            </span>
                                            <span className="text-right font-medium">{currency.format(tx.amount)}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Economic Indicators Widget */}
            <div className="mb-8">
                <EconomicWidget />
            </div>

        </GlassCard>
    );
}
