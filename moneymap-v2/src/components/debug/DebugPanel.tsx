"use client";

import React, { useState, useEffect } from "react";
import { useDataStore } from "../../lib/store/useDataStore";
import { useUIStore } from "../../lib/store/useUIStore";
import { useDateStore } from "../../lib/store/useDateStore";
import { cn } from "../../lib/utils";
import { ChevronUp, ChevronDown, RefreshCw, Trash2, Terminal, Calendar, Info, PlayCircle, PlusCircle } from "lucide-react";

const MONTHS = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

export function DebugPanel() {
    const [isOpen, setIsOpen] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    const {
        transactions,
        accounts,
        isLoading,
        generateData,
        clearData,
        currentProfile
    } = useDataStore();

    const {
        activeTab,
        dateRange: viewRange,
        isSidebarOpen,
        setDateRange: setViewRange
    } = useUIStore();

    const {
        datasetStart,
        datasetEnd,
        profileId,
        regenerateStatements,
        extendDatasetRange,
        setViewRange: setDateStoreViewRange
    } = useDateStore();

    // Local state for date pickers
    const fromDate = new Date(viewRange.from);
    const toDate = new Date(viewRange.to);
    const [fromMonth, setFromMonth] = useState(fromDate.getMonth());
    const [fromYear, setFromYear] = useState(fromDate.getFullYear());
    const [toMonth, setToMonth] = useState(toDate.getMonth());
    const [toYear, setToYear] = useState(toDate.getFullYear());

    useEffect(() => {
        const id = requestAnimationFrame(() => setIsMounted(true));
        return () => cancelAnimationFrame(id);
    }, []);

    // Sync local state when viewRange changes externally
    useEffect(() => {
        const id = requestAnimationFrame(() => {
            const from = new Date(viewRange.from);
            const to = new Date(viewRange.to);
            setFromMonth(from.getMonth());
            setFromYear(from.getFullYear());
            setToMonth(to.getMonth());
            setToYear(to.getFullYear());
        });
        return () => cancelAnimationFrame(id);
    }, [viewRange]);

    if (!isMounted) return null;

    const togglePanel = () => setIsOpen(!isOpen);

    const handleLogState = () => {
        console.group("MoneyMap Debug State");
        console.log("Data Store:", { transactions, accounts, isLoading, currentProfile });
        console.log("UI Store:", { activeTab, viewRange, isSidebarOpen });
        console.log("Date Store:", { datasetStart, datasetEnd, profileId });
        console.groupEnd();
    };

    const handleRegenerate = () => {
        if (confirm("This will generate a NEW profile and wipe existing data. Continue?")) {
            regenerateStatements(); // Reset date store profile
            setTimeout(() => generateData('full'), 50); // Trigger generation
        }
    };

    const handleExtend = () => {
        // Extend by 3 months
        const currentEnd = new Date(datasetEnd);
        const newEnd = new Date(currentEnd.getFullYear(), currentEnd.getMonth() + 3, 0);
        extendDatasetRange(newEnd);
        setTimeout(() => generateData('extend'), 50);
    };

    const setPresetViewRange = (monthsBack: number) => {
        const now = new Date();
        const from = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1);
        const to = new Date(now.getFullYear(), now.getMonth() - monthsBack + 1, 0);
        setViewRange({ from, to });
        setDateStoreViewRange(from, to);
    };

    const applyCustomViewRange = () => {
        const from = new Date(fromYear, fromMonth, 1);
        const to = new Date(toYear, toMonth + 1, 0); // Last day of month
        setViewRange({ from, to });
        setDateStoreViewRange(from, to);
    };

    const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

    return (
        <div className={cn(
            "fixed bottom-4 right-4 z-50 flex flex-col items-end transition-all duration-300",
            isOpen ? "w-80" : "w-auto"
        )}>
            {isOpen && (
                <div className="mb-2 w-full rounded-lg border border-zinc-800 bg-zinc-950/90 p-4 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-2">
                    <div className="mb-4 flex items-center justify-between border-b border-zinc-800 pb-2">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            <Terminal className="h-4 w-4 text-purple-400" />
                            Debug Panel (Phase 2)
                        </h3>
                        <span className="text-[10px] text-zinc-500">v2.0-alpha</span>
                    </div>

                    <div className="space-y-4">
                        {/* State Overview */}
                        <div className="space-y-2 text-xs">
                            <div className="flex justify-between">
                                <span className="text-zinc-400">Transactions:</span>
                                <span className="text-zinc-200 font-mono">{transactions.length}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-zinc-400">Profile ID:</span>
                                <span className="text-zinc-200 font-mono text-[10px]">{profileId.substring(0, 8)}...</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-zinc-400">Dataset End:</span>
                                <span className="text-zinc-200 font-mono">{new Date(datasetEnd).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-zinc-400">Loading:</span>
                                <span className={cn("font-mono", isLoading ? "text-amber-400" : "text-emerald-400")}>
                                    {isLoading ? "true" : "false"}
                                </span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={handleRegenerate}
                                className="flex items-center justify-center gap-2 rounded bg-purple-900/20 px-3 py-2 text-xs font-medium text-purple-400 hover:bg-purple-900/40 active:scale-95 transition"
                            >
                                <RefreshCw className="h-3 w-3" />
                                New Profile
                            </button>
                            <button
                                onClick={handleExtend}
                                className="flex items-center justify-center gap-2 rounded bg-emerald-900/20 px-3 py-2 text-xs font-medium text-emerald-400 hover:bg-emerald-900/40 active:scale-95 transition"
                            >
                                <PlusCircle className="h-3 w-3" />
                                Extend +3M
                            </button>
                            <button
                                onClick={clearData}
                                className="col-span-2 flex items-center justify-center gap-2 rounded bg-red-900/20 px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-900/40 active:scale-95 transition"
                            >
                                <Trash2 className="h-3 w-3" />
                                Clear Data
                            </button>
                        </div>

                        {/* View Range Picker */}
                        <div className="space-y-2">
                            <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                View Range
                            </p>

                            {/* From Date */}
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] text-zinc-400 w-10">From:</span>
                                <select
                                    value={fromMonth}
                                    onChange={(e) => setFromMonth(Number(e.target.value))}
                                    className="flex-1 rounded bg-zinc-900 border border-zinc-700 px-2 py-1 text-[10px] text-zinc-200"
                                >
                                    {MONTHS.map((m, i) => (
                                        <option key={i} value={i}>{m}</option>
                                    ))}
                                </select>
                                <select
                                    value={fromYear}
                                    onChange={(e) => setFromYear(Number(e.target.value))}
                                    className="w-16 rounded bg-zinc-900 border border-zinc-700 px-2 py-1 text-[10px] text-zinc-200"
                                >
                                    {years.map((y) => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                            </div>

                            {/* To Date */}
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] text-zinc-400 w-10">To:</span>
                                <select
                                    value={toMonth}
                                    onChange={(e) => setToMonth(Number(e.target.value))}
                                    className="flex-1 rounded bg-zinc-900 border border-zinc-700 px-2 py-1 text-[10px] text-zinc-200"
                                >
                                    {MONTHS.map((m, i) => (
                                        <option key={i} value={i}>{m}</option>
                                    ))}
                                </select>
                                <select
                                    value={toYear}
                                    onChange={(e) => setToYear(Number(e.target.value))}
                                    className="w-16 rounded bg-zinc-900 border border-zinc-700 px-2 py-1 text-[10px] text-zinc-200"
                                >
                                    {years.map((y) => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Apply & Presets */}
                            <div className="flex gap-1">
                                <button
                                    onClick={applyCustomViewRange}
                                    className="flex-1 rounded bg-purple-600 px-2 py-1 text-[10px] font-medium text-white hover:bg-purple-500"
                                >
                                    Apply
                                </button>
                                <button
                                    onClick={() => setPresetViewRange(0)}
                                    className="rounded bg-zinc-800 px-2 py-1 text-[10px] text-zinc-300 hover:bg-zinc-700"
                                >
                                    This Mo
                                </button>
                                <button
                                    onClick={() => setPresetViewRange(1)}
                                    className="rounded bg-zinc-800 px-2 py-1 text-[10px] text-zinc-300 hover:bg-zinc-700"
                                >
                                    Last Mo
                                </button>
                            </div>

                            {/* Current Range Display */}
                            <div className="text-[10px] text-zinc-500 text-center font-mono">
                                {new Date(viewRange.from).toLocaleDateString()} - {new Date(viewRange.to).toLocaleDateString()}
                            </div>
                        </div>

                        {/* Log State with Tooltip */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleLogState}
                                className="flex-1 flex items-center justify-center gap-2 rounded bg-zinc-800 border border-zinc-700 px-2 py-1.5 text-[10px] text-zinc-300 hover:bg-zinc-700"
                            >
                                <Terminal className="h-3 w-3" />
                                Log State
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <button
                onClick={togglePanel}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 border border-zinc-700 text-zinc-400 shadow-lg hover:bg-zinc-800 hover:text-white transition-all hover:scale-110 active:scale-95"
                title="Toggle Debug Panel"
            >
                {isOpen ? <ChevronDown className="h-5 w-5" /> : <Terminal className="h-5 w-5" />}
            </button>
        </div>
    );
}
