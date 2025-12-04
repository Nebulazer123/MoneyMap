"use client";

import React from "react";
import { useDataStore } from "../../lib/store/useDataStore";
import { useUIStore } from "../../lib/store/useUIStore";
import { GlassCard } from "../ui/GlassCard";
import { isDateInRange } from "../../lib/utils";

export function Fees() {
    const { transactions } = useDataStore();
    const { dateRange } = useUIStore();

    const currency = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    });

    const dateFormatter = new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
    });

    // Filter for fee transactions in the current date range
    const feeRows = transactions.filter(t => {
        if (!isDateInRange(t.date, dateRange)) return false;
        return t.kind === "fee";
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const totalFees = feeRows.reduce((sum, t) => sum + Math.abs(t.amount), 0);

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

            <div className="mt-4 overflow-x-auto rounded-lg border border-zinc-800">
                <div className="min-w-[480px]">
                    <div className="grid grid-cols-3 bg-zinc-900/80 px-3 py-2 text-left text-xs font-semibold text-zinc-300 sm:px-4 sm:text-sm">
                        <span>Name</span>
                        <span className="text-right">Amount</span>
                        <span className="text-right">Date</span>
                    </div>
                    {feeRows.length === 0 ? (
                        <div className="px-3 py-3 text-xs text-zinc-400 sm:px-4 sm:text-sm">
                            No fees detected for this period.
                        </div>
                    ) : (
                        <div className="divide-y divide-zinc-800">
                            {feeRows.map((row) => (
                                <div key={row.id} className="grid grid-cols-3 items-center px-3 py-3 text-xs text-zinc-200 sm:px-4 sm:text-sm">
                                    <span className="truncate" title={row.description}>
                                        {row.description}
                                    </span>
                                    <span className="text-right font-medium">{currency.format(row.amount)}</span>
                                    <span className="text-right text-zinc-400">{dateFormatter.format(new Date(row.date))}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </GlassCard>
    );
}
