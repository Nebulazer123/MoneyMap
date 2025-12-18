"use client";

import React, { useMemo, useState, useEffect } from "react";
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
    { label: "Rent", categories: ["Rent", "Mortgage"], groupId: "rent_utils", emoji: categoryEmojis.Rent },
    { label: "Utilities", categories: ["Utilities"], groupId: "rent_utils", emoji: categoryEmojis.Utilities },
    { label: "Phone", categories: ["Phone"], groupId: "rent_utils", emoji: "📱" },
    { label: "Stores & shopping", categories: ["Groceries", "Shopping"], groupId: "stores_shopping", emoji: categoryEmojis.Shopping },
    { label: "Dining", categories: ["Dining"], groupId: "dining", emoji: categoryEmojis.Dining },
    { label: "Auto", categories: ["Transport"], groupId: "auto", emoji: categoryEmojis.Transport },
    { label: "Credit / Loans", categories: ["Loans"], groupId: "credit_loans", emoji: categoryEmojis.Loans },
    { label: "Subscriptions", categories: ["Subscriptions"], groupId: "subscriptions", emoji: categoryEmojis.Subscriptions },
    { label: "Insurance", categories: ["Insurance"], groupId: "insurance", emoji: categoryEmojis.Insurance },
    { label: "Transfers", categories: ["Transfer"], groupId: "transfers", emoji: categoryEmojis.Transfer },
    { label: "Fees", categories: ["Fees"], groupId: "other_fees", emoji: categoryEmojis.Fees },
    { label: "Other", categories: ["Other"], groupId: "other_fees", emoji: categoryEmojis.Other },
];

export function Overview() {
    const { transactions } = useDataStore();
    const { viewStart, viewEnd } = useDateStore();

    const [activeCategoryIds, setActiveCategoryIds] = useState<string[]>([]);
    const [chartInteractive, setChartInteractive] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    // Delay chart render until after first paint to prevent recharts -1 dimension warning
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsMounted(true);
    }, []);

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

    // Compute category totals directly from filtered transactions for detail cards
    const categoryTotalsForDetails = useMemo(() => {
        const totals = new Map<string, number>();
        filteredTransactions.forEach(tx => {
            if (tx.amount < 0) { // Only count expenses
                const cat = tx.category;
                totals.set(cat, (totals.get(cat) ?? 0) + Math.abs(tx.amount));
            }
        });
        return totals;
    }, [filteredTransactions]);

    const detailCards = useMemo(() => {
        return detailCardsConfig.map((card) => {
            // Sum amounts for all categories this card covers
            const amount = card.categories.reduce((sum, catName) => {
                return sum + (categoryTotalsForDetails.get(catName) ?? 0);
            }, 0);
            return { ...card, amount };
        });
    }, [categoryTotalsForDetails]);

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
                    {/* HERO PIE - Large, dimensional, premium */}
                    <div className="h-[420px] w-full relative flex items-center justify-center" style={{
                        pointerEvents: chartInteractive ? "auto" : "none"
                    }}>
                        {/* Multi-layer glow effect */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-[340px] h-[340px] rounded-full" style={{
                                background: 'radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, rgba(139, 92, 246, 0.08) 40%, transparent 70%)',
                                filter: 'blur(40px)'
                            }} />
                        </div>
                        {isMounted && (
                            <div className="absolute inset-0 w-full h-full flex items-center justify-center">
                                <ResponsiveContainer width={340} height={340}>
                                <PieChart>
                                    <defs>
                                        {/* Enhanced linear gradients for gem-like depth - Onyx Gem Wheel theme */}
                                        {groupedSpendingData.map((entry) => {
                                            const gradientId = `gradient-${entry.id}`;
                                            return (
                                                <linearGradient key={gradientId} id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                                                    <stop offset="0%" stopColor={entry.color} stopOpacity={1.0} />
                                                    <stop offset="50%" stopColor={entry.color} stopOpacity={0.85} />
                                                    <stop offset="100%" stopColor={entry.color} stopOpacity={0.65} />
                                                </linearGradient>
                                            );
                                        })}
                                    </defs>
                                    <Pie
                                        data={groupedSpendingData}
                                        dataKey="value"
                                        nameKey="label"
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={0}
                                        outerRadius={165}
                                        paddingAngle={0}
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
                                        {groupedSpendingData.map((entry, index) => (
                                            <Cell
                                                key={entry.id}
                                                fill={`url(#gradient-${entry.id})`}
                                                className="transition-all duration-300 cursor-pointer"
                                                style={{
                                                    filter: activeCategoryIds.length === 0 || entry.id === activeGroupId
                                                        ? 'brightness(1.1) saturate(1.15)' // Brightens and saturates on active
                                                        : 'brightness(0.5) saturate(0.7)', // Strong dimming for contrast
                                                }}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                const data = payload[0].payload;
                                                return (
                                                    <div
                                                        className="bg-zinc-900/95 backdrop-blur-xl p-4 rounded-xl shadow-2xl"
                                                        style={{
                                                            borderWidth: 1,
                                                            borderStyle: 'solid',
                                                            borderColor: data.color + '40'
                                                        }}
                                                    >
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <span className="text-2xl">{data.emoji}</span>
                                                            <span className="font-semibold text-white text-lg">{data.label}</span>
                                                        </div>
                                                        <div className="text-3xl font-bold text-white">
                                                            {currency.format(data.value)}
                                                        </div>
                                                        <div className="text-sm text-zinc-400 mt-2">
                                                            {data.percent.toFixed(1)}% of total spending
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
                        )}
                    </div>

                    {/* Legend cards with liquid glass pills matching pie slices */}
                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
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
                                        "group relative flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all duration-300",
                                        "border backdrop-blur-sm",
                                        isActive
                                            ? "border-white/20 bg-white/10 shadow-lg"
                                            : "border-zinc-800/80 bg-zinc-900/60 hover:border-zinc-700 hover:bg-zinc-800/70"
                                    )}
                                    style={{
                                        boxShadow: isActive
                                            ? `0 4px 20px ${item.color}25, 0 0 0 1px ${item.color}30`
                                            : undefined
                                    }}
                                >
                                    {/* Liquid Glass Color Pill - matches pie slice exactly */}
                                    <div
                                        className="relative flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden"
                                        style={{
                                            background: `linear-gradient(135deg, ${item.color}ee 0%, ${item.color}aa 50%, ${item.color}66 100%)`,
                                            boxShadow: `0 2px 12px ${item.color}40, inset 0 1px 2px rgba(255,255,255,0.2)`
                                        }}
                                    >
                                        {/* Inner glass highlight */}
                                        <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent" />
                                        <span className="relative text-lg drop-shadow-sm">{item.emoji}</span>
                                    </div>

                                    {/* Category info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-white truncate">{item.label}</span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span
                                                className="text-sm font-bold"
                                                style={{ color: item.color }}
                                            >
                                                {item.percent.toFixed(1)}%
                                            </span>
                                            <span className="text-xs text-zinc-500">•</span>
                                            <span className="text-xs text-zinc-400">{currency.format(item.value)}</span>
                                        </div>
                                    </div>

                                    {/* Hover glow effect */}
                                    <div
                                        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                                        style={{
                                            boxShadow: `inset 0 0 20px ${item.color}15`
                                        }}
                                    />
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

            {/* CATEGORY DETAIL TILES - Rich liquid-glass with strong color linkage */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
                {detailCards.map((card) => {
                    const isActive = card.categories.some((cat) => activeCategoryIds.includes(cat));
                    const groupMeta = overviewGroupMeta[card.groupId as OverviewGroupKey];
                    const cardColor = groupMeta?.color || '#6366f1';

                    return (
                        <button
                            key={card.label}
                            type="button"
                            onClick={() => {
                                const categoriesInGroup = getCategoriesForGroup(card.groupId);
                                onSelectGroup(categoriesInGroup);
                            }}
                            className={cn(
                                "group relative w-full text-left rounded-2xl p-5 transition-all duration-300 overflow-hidden",
                                "border backdrop-blur-sm",
                                isActive
                                    ? "border-white/30 scale-[1.02]"
                                    : "border-zinc-800/60 hover:border-zinc-700 hover:scale-[1.01]"
                            )}
                            style={{
                                background: isActive
                                    ? `linear-gradient(135deg, ${cardColor}20 0%, ${cardColor}10 50%, rgba(24,24,27,0.9) 100%)`
                                    : 'linear-gradient(135deg, rgba(39,39,42,0.8) 0%, rgba(24,24,27,0.95) 100%)',
                                boxShadow: isActive
                                    ? `0 8px 32px ${cardColor}30, 0 0 0 1px ${cardColor}40, inset 0 1px 0 rgba(255,255,255,0.1)`
                                    : '0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)'
                            }}
                        >
                            {/* Color accent bar */}
                            <div
                                className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
                                style={{
                                    background: `linear-gradient(90deg, ${cardColor} 0%, ${cardColor}80 100%)`,
                                    opacity: isActive ? 1 : 0.6
                                }}
                            />

                            {/* Glass pill icon */}
                            <div
                                className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 relative overflow-hidden"
                                style={{
                                    background: `linear-gradient(135deg, ${cardColor}dd 0%, ${cardColor}88 50%, ${cardColor}55 100%)`,
                                    boxShadow: `0 4px 12px ${cardColor}40, inset 0 1px 2px rgba(255,255,255,0.3)`
                                }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent" />
                                <span className="relative text-2xl drop-shadow-sm">{card.emoji}</span>
                            </div>

                            {/* Label */}
                            <p className="text-sm font-medium text-zinc-300 mb-1">{card.label}</p>

                            {/* Amount with color accent */}
                            <p
                                className="text-2xl font-bold"
                                style={{ color: isActive ? cardColor : 'white' }}
                            >
                                {currency.format(card.amount)}
                            </p>

                            {/* Hover glow */}
                            <div
                                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                                style={{
                                    boxShadow: `inset 0 0 30px ${cardColor}15`
                                }}
                            />
                        </button>
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

        </GlassCard>
    );
}
