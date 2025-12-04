"use client";

import React, { useMemo, useState } from "react";
import { useDataStore } from "../../lib/store/useDataStore";
import { useUIStore } from "../../lib/store/useUIStore";
import { GlassCard } from "../ui/GlassCard";
import { cn, isDateInRange } from "../../lib/utils";
import { Transaction } from "../../lib/types";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

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
    const { dateRange } = useUIStore();
    const [expandedMonths, setExpandedMonths] = useState<Set<number>>(new Set());
    const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});
    const [chartTimeRange, setChartTimeRange] = useState<'1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL'>('ALL');

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

    // Prepare chart data
    const chartData = useMemo(() => {
        const monthlyData: Record<string, { name: string; income: number; expenses: number; sortKey: number; fullDate: Date }> = {};

        filteredTransactions.forEach(t => {
            const date = new Date(t.date);
            // For shorter ranges (1W, 1M), we might want daily data instead of monthly
            // But for now, let's stick to monthly aggregation but filter the source transactions first based on range
            // Actually, for 1W/1M, monthly bars are too coarse.
            // Let's switch aggregation based on range?
            // User asked for "1 week, 1 month, etc."
            // If 1W or 1M, show daily data.
            // If > 1M, show monthly data.

            // Let's keep it simple first: Filter by time range relative to the latest transaction date
        });

        // 1. Determine the cutoff date based on range
        const now = new Date(); // Or latest transaction date? Let's use current date for "Last 1M" semantics
        let cutoff = new Date(0); // Default ALL

        if (chartTimeRange !== 'ALL') {
            const latestTxDate = filteredTransactions.length > 0
                ? new Date(Math.max(...filteredTransactions.map(t => new Date(t.date).getTime())))
                : new Date();

            cutoff = new Date(latestTxDate);
            if (chartTimeRange === '1W') cutoff.setDate(cutoff.getDate() - 7);
            if (chartTimeRange === '1M') cutoff.setMonth(cutoff.getMonth() - 1);
            if (chartTimeRange === '3M') cutoff.setMonth(cutoff.getMonth() - 3);
            if (chartTimeRange === '6M') cutoff.setMonth(cutoff.getMonth() - 6);
            if (chartTimeRange === '1Y') cutoff.setFullYear(cutoff.getFullYear() - 1);
        }

        const rangeTransactions = filteredTransactions.filter(t => new Date(t.date) >= cutoff);

        // 2. Aggregate
        // If range is 1W or 1M, aggregate by day. Else by month.
        const isDaily = chartTimeRange === '1W' || chartTimeRange === '1M';

        if (isDaily) {
            const dailyData: Record<string, { name: string; income: number; expenses: number; sortKey: number }> = {};
            rangeTransactions.forEach(t => {
                const date = new Date(t.date);
                const key = date.toISOString().split('T')[0];
                const name = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                const sortKey = date.getTime();

                if (!dailyData[key]) {
                    dailyData[key] = { name, income: 0, expenses: 0, sortKey };
                }
                if (t.amount > 0) dailyData[key].income += t.amount;
                else dailyData[key].expenses += Math.abs(t.amount);
            });
            return Object.values(dailyData).sort((a, b) => a.sortKey - b.sortKey);
        } else {
            const monthlyData: Record<string, { name: string; income: number; expenses: number; sortKey: number }> = {};
            rangeTransactions.forEach(t => {
                const date = new Date(t.date);
                const key = `${date.getFullYear()}-${date.getMonth()}`;
                const name = date.toLocaleDateString('en-US', { month: 'short' });
                const sortKey = date.getFullYear() * 100 + date.getMonth();

                if (!monthlyData[key]) {
                    monthlyData[key] = { name, income: 0, expenses: 0, sortKey };
                }
                if (t.amount > 0) monthlyData[key].income += t.amount;
                else monthlyData[key].expenses += Math.abs(t.amount);
            });
            return Object.values(monthlyData).sort((a, b) => a.sortKey - b.sortKey);
        }
    }, [filteredTransactions, chartTimeRange]);

    const transactionsByDate = useMemo(() => {
        const map: Record<string, Transaction[]> = {};
        for (const tx of filteredTransactions) {
            // Filter out internal transfers for cashflow
            if (tx.kind === 'transferInternal') continue;

            const key = tx.date;
            (map[key] ||= []).push(tx);
        }
        return map;
    }, [filteredTransactions]);

    const cashFlowRows = useMemo(() => {
        const dates = Object.keys(transactionsByDate).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
        return dates.map(date => {
            const txs = transactionsByDate[date];
            let inflow = 0;
            let outflow = 0;

            txs.forEach(tx => {
                if (tx.amount > 0) inflow += tx.amount;
                else outflow += Math.abs(tx.amount);
            });

            return {
                date,
                totalInflowForThatDate: inflow,
                totalOutflowForThatDate: outflow,
                netForThatDate: inflow - outflow
            };
        });
    }, [transactionsByDate]);

    const cashflowMonths = useMemo(() => {
        const monthsMap = new Map<number, CashflowMonth>();

        cashFlowRows.forEach(row => {
            const d = new Date(row.date);
            // Key by YYYYMM
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
            month.rows.push(row);
            month.totalIn += row.totalInflowForThatDate;
            month.totalOut += row.totalOutflowForThatDate;
            month.totalNet += row.netForThatDate;
        });

        return Array.from(monthsMap.values()).sort((a, b) => b.key - a.key);
    }, [cashFlowRows]);

    // Auto-expand the first month if only one or none expanded
    useMemo(() => {
        if (cashflowMonths.length > 0 && expandedMonths.size === 0) {
            setExpandedMonths(new Set([cashflowMonths[0].key]));
        }
    }, [cashflowMonths]); // Run only when months change significantly

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
        const dayTransactions = transactionsByDate[row.date] ?? [];

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
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                        <XAxis
                            dataKey="name"
                            stroke="#71717a"
                            tick={{ fill: '#71717a', fontSize: 12 }}
                            tickLine={false}
                            axisLine={false}
                            dy={10}
                        />
                        <YAxis
                            stroke="#71717a"
                            tick={{ fill: '#71717a', fontSize: 12 }}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `$${value}`}
                            dx={-10}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                            itemStyle={{ color: '#fff' }}
                            formatter={(value: number) => currency.format(value)}
                            labelStyle={{ color: '#a1a1aa', marginBottom: '0.5rem' }}
                        />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} dot={false} name="Income" activeDot={{ r: 6, strokeWidth: 0 }} />
                        <Line type="monotone" dataKey="expenses" stroke="#f43f5e" strokeWidth={2} dot={false} name="Expenses" activeDot={{ r: 6, strokeWidth: 0 }} />
                    </LineChart>
                </ResponsiveContainer>
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
