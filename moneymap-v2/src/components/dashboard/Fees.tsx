"use client";

import React, { useMemo } from "react";
import { useDataStore } from "../../lib/store/useDataStore";
import { useDateStore } from "../../lib/store/useDateStore";
import { getTransactionsInDateRange, getFeeTransactions, getFeeTotals } from "../../lib/selectors/transactionSelectors";
import { GlassCard } from "../ui/GlassCard";

export function Fees() {
    const { transactions } = useDataStore();
    const { viewStart, viewEnd } = useDateStore();

    const currency = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    });

    const dateFormatter = new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
    });

    // 1. Filter transactions by date range
    // eslint-disable-next-line react-hooks/preserve-manual-memoization
    const filteredTransactions = useMemo(() => {
        return getTransactionsInDateRange(transactions, viewStart, viewEnd);
    }, [transactions, viewStart, viewEnd]);

    // 2. Get fee transactions
    const feeRows = useMemo(() => {
        return getFeeTransactions(filteredTransactions)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [filteredTransactions]);

    // 3. Calculate total fees
    const totalFees = useMemo(() => {
        return getFeeTotals(filteredTransactions);
    }, [filteredTransactions]);

    // 4. Split fees
    const { atmFees, otherFees } = useMemo(() => {
        const atm = feeRows.filter(f => f.description.includes('ATM') || f.merchantName?.includes('ATM'));
        const other = feeRows.filter(f => !f.description.includes('ATM') && !f.merchantName?.includes('ATM'));
        return { atmFees: atm, otherFees: other };
    }, [feeRows]);

    return (
        <GlassCard intensity="medium" tint="pink" className="p-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-semibold text-white">Fees</h2>
                <p className="text-zinc-400">Fees and charges that sneak in.</p>
            </div>

            <GlassCard
                className="mt-4 px-4 py-3 text-sm text-zinc-300 transition transform hover:-translate-y-0.5 hover:ring-purple-300/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-300/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 backdrop-blur-xl sm:backdrop-blur-2xl"
                tabIndex={0}
            >
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-zinc-400">Total fees this month</span>
                    <span className="text-lg font-semibold text-white">{currency.format(totalFees)}</span>
                </div>
            </GlassCard>

            {/* 4. Fee Listings Grouped */}
            <div className="mt-6 grid gap-6 md:grid-cols-2">
                {/* ATM Fees */}
                <FeeGroup
                    title="ATM Fees"
                    fees={atmFees}
                    icon="🏧"
                    emptyText="No ATM fees this period."
                    currency={currency}
                    dateFormatter={dateFormatter}
                />

                {/* Service Fees */}
                <FeeGroup
                    title="Service & Bank Fees"
                    fees={otherFees}
                    icon="🏦"
                    emptyText="No service fees this period."
                    currency={currency}
                    dateFormatter={dateFormatter}
                />
            </div>
        </GlassCard>
    );
}

function FeeGroup({ title, fees, icon, emptyText, currency, dateFormatter }: any) {
    return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
            <div className="mb-3 flex items-center gap-2">
                <span className="text-xl">{icon}</span>
                <h3 className="font-medium text-zinc-200">{title}</h3>
                <span className="ml-auto text-xs text-zinc-500">{fees.length} txns</span>
            </div>

            {fees.length === 0 ? (
                <div className="py-4 text-center text-xs text-zinc-500">{emptyText}</div>
            ) : (
                <div className="space-y-3">
                    {fees.map((fee: any) => (
                        <div key={fee.id} className="flex items-center justify-between">
                            <div className="flex flex-col overflow-hidden">
                                <span className="truncate text-xs font-medium text-zinc-300" title={fee.description}>
                                    {fee.description}
                                </span>
                                <span className="truncate text-[10px] text-zinc-500">
                                    {fee.merchantName} • {dateFormatter.format(new Date(fee.date))}
                                </span>
                            </div>
                            <span className="font-mono text-sm font-medium text-zinc-200">
                                {currency.format(Math.abs(fee.amount))}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
