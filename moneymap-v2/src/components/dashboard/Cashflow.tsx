"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useDataStore } from "../../lib/store/useDataStore";
import { useDateStore } from "../../lib/store/useDateStore";
import { getTransactionsInDateRange, getDailyCashflow, parseTransactionLocalDate } from "../../lib/selectors/transactionSelectors";
import { GlassCard } from "../ui/GlassCard";
import { cn } from "../../lib/utils";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';

type CashflowRow = {
    date: string;
    totalInflowForThatDate: number;
    totalOutflowForThatDate: number;
    netForThatDate: number;
};

type CashflowMonth = {
    key: number;
    label: string;
    rows: CashflowRow[];
    totalIn: number;
    totalOut: number;
    totalNet: number;
};

export function Cashflow() {
    const { transactions } = useDataStore();
    const { viewStart, viewEnd } = useDateStore();
    const [expandedMonths, setExpandedMonths] = useState<Set<number>>(new Set());
    const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});
    const [chartTimeRange, setChartTimeRange] = useState<'1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL'>('ALL');
    const [isMounted, setIsMounted] = useState(false);
    // Legend toggle state - all enabled by default
    const [legendVisibility, setLegendVisibility] = useState({
        income: true,
        expenses: true,
        net: true,
    });

    // Delay chart render until after first paint to prevent recharts -1 dimension warning
    useEffect(() => {
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

    // 1. Get transactions in the global view range
    const filteredTransactions = useMemo(() => {
        return getTransactionsInDateRange(transactions, viewStart, viewEnd);
    }, [transactions, viewStart, viewEnd]);

    // 2. Get daily buckets for these transactions using the selector
    const dailyBuckets = useMemo(() => {
        return getDailyCashflow(filteredTransactions);
    }, [filteredTransactions]);

    // 3. Prepare Chart Data (filtered by chartTimeRange)
    const chartData = useMemo(() => {
        // Determine cutoff
        let cutoff = new Date(0);
        const now = new Date(); // Use current date as reference for relative ranges if needed, but dailyBuckets is grounded in data.

        // Find latest date in data to anchor "relative" ranges if we wanted to anchor to data end.
        // However, standard UI usually anchors "1W" from "today" or "latest data". 
        // Let's stick to "latest data" or "today" logic. Existing logic used dailyBuckets last date.

        const latestDateStr = dailyBuckets.length > 0
            ? dailyBuckets[dailyBuckets.length - 1].date
            : new Date().toISOString().split('T')[0];

        const latest = new Date(latestDateStr);
        cutoff = new Date(latest);

        if (chartTimeRange === '1W') cutoff.setDate(cutoff.getDate() - 7);
        if (chartTimeRange === '1M') cutoff.setMonth(cutoff.getMonth() - 1);
        if (chartTimeRange === '3M') cutoff.setMonth(cutoff.getMonth() - 3);
        if (chartTimeRange === '6M') cutoff.setMonth(cutoff.getMonth() - 6);
        if (chartTimeRange === '1Y') cutoff.setFullYear(cutoff.getFullYear() - 1);

        // Filter buckets based on date cutoff
        // For 'ALL', cutoff is epoch so it includes everything.
        const filteredBuckets = chartTimeRange === 'ALL'
            ? dailyBuckets
            : dailyBuckets.filter(b => {
                const bucketDate = parseTransactionLocalDate(b.date);
                // Normalize cutoff to local midnight for fair comparison
                const cutoffLocal = new Date(cutoff.getFullYear(), cutoff.getMonth(), cutoff.getDate());
                return bucketDate >= cutoffLocal;
            });

        // --- Aggregation Logic ---

        // 1W, 1M, 3M -> Daily Data
        // 3M is special: Daily data but often wants weekly ticks (handled in Axis props if possible, or we just let it be dense).
        // The user request: "3m charted by day but only marked by week visible"
        // 6M -> Weekly Data ("all by week")
        // 1Y -> Monthly Data ("1 year view by month")
        // ALL -> Monthly Data ("all view by month")

        const isDaily = chartTimeRange === '1W' || chartTimeRange === '1M' || chartTimeRange === '3M';
        const isWeekly = chartTimeRange === '6M';
        const isMonthly = chartTimeRange === '1Y' || chartTimeRange === 'ALL';

        if (isDaily) {
            return filteredBuckets.map(b => {
                const dateObj = parseTransactionLocalDate(b.date);
                return {
                    name: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    dateObj,
                    income: b.income,
                    expenses: b.expense,
                    net: b.income - b.expense,
                    date: b.date
                };
            });
        } else if (isWeekly) {
            // Aggregate by Week
            // We'll define a week as starting on Sunday? or Monday? Let's say Monday for business logic, or standard Sunday.
            // Let's use the start of the week for grouping.
            const weeklyMap = new Map<string, { name: string, income: number, expenses: number, dateObj: Date }>();

            filteredBuckets.forEach(b => {
                // Use local date parsing to avoid timezone issues
                const d = parseTransactionLocalDate(b.date);
                // Adjust to start of week (Sunday)
                const day = d.getDay();
                const diff = d.getDate() - day; // adjust when day is sunday
                const weekStart = new Date(d);
                weekStart.setDate(diff);
                // Use local date formatting instead of ISO string to avoid timezone shifts
                const year = weekStart.getFullYear();
                const month = String(weekStart.getMonth() + 1).padStart(2, '0');
                const date = String(weekStart.getDate()).padStart(2, '0');
                const key = `${year}-${month}-${date}`;

                if (!weeklyMap.has(key)) {
                    weeklyMap.set(key, {
                        name: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), // e.g. "Oct 4"
                        income: 0,
                        expenses: 0,
                        dateObj: weekStart
                    });
                }
                const entry = weeklyMap.get(key)!;
                entry.income += b.income;
                entry.expenses += b.expense;
            });

            return Array.from(weeklyMap.values())
                .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime())
                .map(item => ({
                    ...item,
                    net: item.income - item.expenses
                }));

        } else {
            // Monthly Aggregation (1Y, ALL)
            const monthlyMap = new Map<string, { name: string, income: number, expenses: number, sortKey: number }>();

            filteredBuckets.forEach(b => {
                // Use local date parsing to avoid timezone issues
                const d = parseTransactionLocalDate(b.date);
                const key = `${d.getFullYear()}-${d.getMonth()}`;

                if (!monthlyMap.has(key)) {
                    monthlyMap.set(key, {
                        name: d.toLocaleDateString('en-US', { month: 'short' }),
                        income: 0,
                        expenses: 0,
                        sortKey: d.getFullYear() * 100 + d.getMonth()
                    });
                }

                const entry = monthlyMap.get(key)!;
                entry.income += b.income;
                entry.expenses += b.expense;
            });

            return Array.from(monthlyMap.values())
                .sort((a, b) => a.sortKey - b.sortKey)
                .map(item => ({
                    ...item,
                    net: item.income - item.expenses
                }));
        }
    }, [dailyBuckets, chartTimeRange]);

    // 4. Prepare List Data (Grouped by Month)
    const cashflowMonths = useMemo(() => {
        const monthsMap = new Map<number, CashflowMonth>();

        // We use dailyBuckets (which respects global view range)
        // Sort descending by date
        const sortedBuckets = [...dailyBuckets].sort((a, b) => b.date.localeCompare(a.date));

        sortedBuckets.forEach(bucket => {
            // Use local date parsing to avoid timezone issues
            const d = parseTransactionLocalDate(bucket.date);
            const key = d.getFullYear() * 100 + d.getMonth();

            if (!monthsMap.has(key)) {
                monthsMap.set(key, {
                    key,
                    label: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
                    rows: [],
                    totalIn: 0,
                    totalOut: 0,
                    totalNet: 0
                });
            }

            const month = monthsMap.get(key)!;
            const row: CashflowRow = {
                date: bucket.date,
                totalInflowForThatDate: bucket.income,
                totalOutflowForThatDate: bucket.expense,
                netForThatDate: bucket.net
            };

            month.rows.push(row);
            month.totalIn += bucket.income;
            month.totalOut += bucket.expense;
            month.totalNet += bucket.net;
        });

        return Array.from(monthsMap.values()).sort((a, b) => b.key - a.key);
    }, [dailyBuckets]);

    // Auto-expand first month (using useEffect instead of useMemo for setState)
    React.useEffect(() => {
        if (cashflowMonths.length > 0 && expandedMonths.size === 0) {
            setExpandedMonths(new Set([cashflowMonths[0].key]));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cashflowMonths.length]);

    const toggleMonth = (key: number) => {
        setExpandedMonths(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    const toggleDate = (date: string) => {
        setExpandedDates(prev => ({
            ...prev,
            [date]: !prev[date]
        }));
    };

    // Helper to get transactions for a specific date (for expanded view)
    const getTransactionsForDate = (date: string) => {
        return filteredTransactions.filter(t => t.date === date);
    };

    const TableHeader = () => (
        <div className="grid grid-cols-4 bg-zinc-900/80 px-3 py-2 text-left text-xs font-semibold text-zinc-300 sm:px-4 sm:text-sm">
            <span>Date</span>
            <span className="text-right">Inflow</span>
            <span className="text-right">Outflow</span>
            <span className="text-right">Net</span>
        </div>
    );

    const DayRow = ({ row }: { row: CashflowRow }) => {
        const isDayExpanded = expandedDates[row.date];
        const dayTransactions = isDayExpanded ? getTransactionsForDate(row.date) : [];

        return (
            <div className="text-xs sm:text-sm border-b border-zinc-800 last:border-0">
                <button
                    type="button"
                    onClick={() => toggleDate(row.date)}
                    className="grid w-full grid-cols-4 items-center px-3 py-3 text-left text-zinc-200 transition duration-200 hover:bg-zinc-800/60 sm:px-4 focus:outline-none"
                >
                    <span className="text-zinc-300">{dateFormatter.format(new Date(row.date))}</span>
                    <span className="text-right font-medium text-emerald-400">{currency.format(row.totalInflowForThatDate)}</span>
                    <span className="text-right font-medium text-rose-400">{currency.format(row.totalOutflowForThatDate)}</span>
                    <span className={cn(
                        "flex items-center justify-end gap-2 text-right font-semibold",
                        row.netForThatDate >= 0 ? "text-emerald-400" : "text-rose-400"
                    )}>
                        <svg className={cn("h-3 w-3 text-zinc-400 transition-transform", isDayExpanded && "rotate-90")} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                            <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {currency.format(row.netForThatDate)}
                    </span>
                </button>
                {isDayExpanded && (
                    <div className="bg-zinc-900/40 px-4 py-3 text-zinc-200 shadow-inner">
                        {dayTransactions.length === 0 ? (
                            <p className="text-[11px] text-zinc-400">No transactions for this day.</p>
                        ) : (
                            <div className="space-y-2 text-[11px] sm:text-xs">
                                {dayTransactions.map((tx) => (
                                    <div key={tx.id} className="flex items-center justify-between">
                                        <span className="truncate pr-2 text-zinc-300" title={tx.description}>
                                            {tx.description}
                                        </span>
                                        <span className={cn(
                                            "font-semibold",
                                            tx.amount > 0 ? "text-emerald-400" : tx.amount < 0 ? "text-rose-400" : "text-zinc-200"
                                        )}>
                                            {currency.format(tx.amount)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <GlassCard intensity="medium" tint="teal" className="p-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-semibold text-white">Cashflow</h2>
                <p className="text-zinc-400">Income and spending over time.</p>
            </div>

            <div className="flex justify-center gap-2 mb-6">
                {(['1W', '1M', '3M', '6M', '1Y', 'ALL'] as const).map((range) => (
                    <button
                        key={range}
                        onClick={() => setChartTimeRange(range)}
                        className={cn(
                            "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                            chartTimeRange === range
                                ? "bg-white text-zinc-900"
                                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
                        )}
                    >
                        {range}
                    </button>
                ))}
            </div>

            <div className="mb-8 h-[300px] w-full">
                {isMounted && (
                    <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100}>
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                            <XAxis
                                dataKey="name"
                                stroke="#71717a"
                                tick={{ fill: '#71717a', fontSize: 12 }}
                                tickLine={false}
                                axisLine={false}
                                dy={10}
                                minTickGap={30}
                            />
                            <YAxis
                                stroke="#71717a"
                                tick={{ fill: '#71717a', fontSize: 12 }}
                                tickLine={false}
                                tickFormatter={(value) => `$${value}`}
                                axisLine={false}
                                dx={-10}
                                domain={['auto', 'auto']} // Make the chart more "volatile" by not forcing 0
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                                itemStyle={{ color: '#fff' }}
                                formatter={(value: number) => currency.format(value)}
                                labelStyle={{ color: '#a1a1aa', marginBottom: '0.5rem' }}
                            />
                            <Legend wrapperStyle={{ display: 'none' }} />
                            {/* Changed type to linear for more jagged/volatile look */}
                            {legendVisibility.income && (
                                <Line type="linear" dataKey="income" stroke="#10b981" strokeWidth={2} dot={false} name="Income" activeDot={{ r: 6, strokeWidth: 0 }} />
                            )}
                            {legendVisibility.expenses && (
                                <Line type="linear" dataKey="expenses" stroke="#f43f5e" strokeWidth={2} dot={false} name="Expenses" activeDot={{ r: 6, strokeWidth: 0 }} />
                            )}
                            {legendVisibility.net && (
                                <Line type="linear" dataKey="net" stroke="#3b82f6" strokeWidth={2} dot={false} name="Net" activeDot={{ r: 6, strokeWidth: 0 }} />
                            )}
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </div>

            {/* Toggle Switches */}
            <div className="flex justify-center items-center gap-6 mt-4 mb-6">
                {/* Income Toggle */}
                <button
                    onClick={() => setLegendVisibility(prev => ({ ...prev, income: !prev.income }))}
                    className="flex items-center gap-2 group"
                >
                    <div className={cn(
                        "relative w-11 h-6 rounded-full transition-all duration-200",
                        legendVisibility.income ? "bg-emerald-500/30" : "bg-zinc-700/50"
                    )}>
                        <div className={cn(
                            "absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-all duration-200 shadow-md",
                            legendVisibility.income ? "translate-x-5 bg-emerald-400" : "translate-x-0 bg-zinc-400"
                        )} />
                    </div>
                    <div className="flex items-center gap-2">
                        <ArrowUpRight 
                            className={cn(
                                "h-4 w-4 transition-colors",
                                legendVisibility.income ? "text-emerald-400" : "text-zinc-500"
                            )}
                        />
                        <span className={cn(
                            "text-sm font-medium transition-colors",
                            legendVisibility.income ? "text-zinc-200" : "text-zinc-500"
                        )}>
                            Income
                        </span>
                    </div>
                </button>

                {/* Expenses Toggle */}
                <button
                    onClick={() => setLegendVisibility(prev => ({ ...prev, expenses: !prev.expenses }))}
                    className="flex items-center gap-2 group"
                >
                    <div className={cn(
                        "relative w-11 h-6 rounded-full transition-all duration-200",
                        legendVisibility.expenses ? "bg-rose-500/30" : "bg-zinc-700/50"
                    )}>
                        <div className={cn(
                            "absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-all duration-200 shadow-md",
                            legendVisibility.expenses ? "translate-x-5 bg-rose-400" : "translate-x-0 bg-zinc-400"
                        )} />
                    </div>
                    <div className="flex items-center gap-2">
                        <ArrowDownRight 
                            className={cn(
                                "h-4 w-4 transition-colors",
                                legendVisibility.expenses ? "text-rose-400" : "text-zinc-500"
                            )}
                        />
                        <span className={cn(
                            "text-sm font-medium transition-colors",
                            legendVisibility.expenses ? "text-zinc-200" : "text-zinc-500"
                        )}>
                            Expenses
                        </span>
                    </div>
                </button>

                {/* Net Toggle */}
                <button
                    onClick={() => setLegendVisibility(prev => ({ ...prev, net: !prev.net }))}
                    className="flex items-center gap-2 group"
                >
                    <div className={cn(
                        "relative w-11 h-6 rounded-full transition-all duration-200",
                        legendVisibility.net ? "bg-blue-500/30" : "bg-zinc-700/50"
                    )}>
                        <div className={cn(
                            "absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-all duration-200 shadow-md",
                            legendVisibility.net ? "translate-x-5 bg-blue-400" : "translate-x-0 bg-zinc-400"
                        )} />
                    </div>
                    <div className="flex items-center gap-2">
                        <Activity 
                            className={cn(
                                "h-4 w-4 transition-colors",
                                legendVisibility.net ? "text-blue-400" : "text-zinc-500"
                            )}
                        />
                        <span className={cn(
                            "text-sm font-medium transition-colors",
                            legendVisibility.net ? "text-zinc-200" : "text-zinc-500"
                        )}>
                            Net
                        </span>
                    </div>
                </button>
            </div>

            <div className="mt-4 space-y-3">
                {cashflowMonths.map((month) => {
                    const isExpanded = expandedMonths.has(month.key);

                    return (
                        <GlassCard
                            key={month.key}
                            className="overflow-hidden p-0 transition transform hover:-translate-y-0.5 hover:ring-white/10"
                        >
                            <button
                                type="button"
                                onClick={() => toggleMonth(month.key)}
                                className="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-zinc-800/60 focus:outline-none"
                            >
                                <div className="space-y-1 text-sm">
                                    <p className="font-semibold text-white">{month.label}</p>
                                    <div className="flex flex-wrap gap-4 text-[11px] text-zinc-400">
                                        <span>In: {currency.format(month.totalIn)}</span>
                                        <span>Out: {currency.format(month.totalOut)}</span>
                                        <span className={cn("font-semibold", month.totalNet >= 0 ? "text-emerald-400" : "text-rose-400")}>
                                            Net: {currency.format(month.totalNet)}
                                        </span>
                                    </div>
                                </div>
                                <svg className="h-4 w-4 text-zinc-400" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                    <path d={isExpanded ? "M4 10 8 6l4 4" : "M4 6l4 4 4-4"} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                            {isExpanded && (
                                <div className="overflow-x-auto border-t border-zinc-800">
                                    <div className="min-w-[520px]">
                                        <TableHeader />
                                        <div>
                                            {month.rows.map((row) => (
                                                <DayRow key={row.date} row={row} />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </GlassCard>
                    );
                })}
            </div>
        </GlassCard>
    );
}
