"use client";

import React, { useState, useMemo, useCallback } from "react";
import { useDateStore } from "../../lib/store/useDateStore";
import { useDataStore } from "../../lib/store/useDataStore";
import { useUIStore } from "../../lib/store/useUIStore";
import { GlassCard } from "../ui/GlassCard";
import {
    Bug,
    RefreshCw,
    Calendar,
    ChevronDown,
    ChevronUp,
    Zap,
    Clock,
    Database,
    Activity,
    Terminal,
    Trash2
} from "lucide-react";
import { cn } from "../../lib/utils";

// API Rate Limit Status (stubbed for now)
interface APIStatus {
    name: string;
    callsUsed: number;
    callsLimit: number;
    status: 'ok' | 'warning' | 'limited';
}

const STUB_API_STATUS: APIStatus[] = [
    { name: 'CoinGecko', callsUsed: 12, callsLimit: 30, status: 'ok' },
    { name: 'NewsAPI', callsUsed: 45, callsLimit: 100, status: 'warning' },
    { name: 'Yahoo Finance', callsUsed: 120, callsLimit: 2000, status: 'ok' },
];

export function DebugPanel() {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    // Date Store
    const {
        datasetStart,
        datasetEnd,
        viewStart,
        viewEnd,
        profileId,
        lastGeneratedAt,
        regenerateStatements,
        extendDatasetRange,
        setViewRange
    } = useDateStore();

    // Data Store
    const { generateData, transactions, isLoading, currentProfile, accounts, clearData } = useDataStore();

    // UI Store (for complete state logging)
    const { activeTab, isSidebarOpen } = useUIStore();

    // Generate month/year options based on dataset range
    const dateOptions = useMemo(() => {
        const months: { month: number; year: number; label: string }[] = [];
        const start = new Date(datasetStart);
        const end = new Date(datasetEnd);

        const current = new Date(start.getFullYear(), start.getMonth(), 1);
        while (current <= end) {
            months.push({
                month: current.getMonth(),
                year: current.getFullYear(),
                label: current.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
            });
            current.setMonth(current.getMonth() + 1);
        }
        return months;
    }, [datasetStart, datasetEnd]);

    // Current view range as month/year values
    const currentFromMonth = new Date(viewStart).getMonth();
    const currentFromYear = new Date(viewStart).getFullYear();
    const currentToMonth = new Date(viewEnd).getMonth();
    const currentToYear = new Date(viewEnd).getFullYear();

    // Handler for From dropdown change
    const handleFromChange = useCallback((value: string) => {
        const [month, year] = value.split('-').map(Number);
        const newStart = new Date(year, month, 1);
        setViewRange(newStart, new Date(viewEnd));
    }, [viewEnd, setViewRange]);

    // Handler for To dropdown change
    const handleToChange = useCallback((value: string) => {
        const [month, year] = value.split('-').map(Number);
        // End of month
        const newEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);
        setViewRange(new Date(viewStart), newEnd);
    }, [viewStart, setViewRange]);

    // Date formatters
    const formatShortDate = (date: Date | string) => {
        const d = date instanceof Date ? date : new Date(date);
        return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    };

    // Actions
    const handleNewStatements = async () => {
        setIsGenerating(true);
        regenerateStatements(); // New profileId
        setTimeout(() => {
            generateData('full');
            setIsGenerating(false);
        }, 100);
    };

    const handleExtendRange = () => {
        // Extend by 1 month from current end
        const newEnd = new Date(datasetEnd instanceof Date ? datasetEnd : new Date(datasetEnd));
        newEnd.setMonth(newEnd.getMonth() + 1);
        extendDatasetRange(newEnd);
        setTimeout(() => {
            generateData('extend');
        }, 100);
    };

    const handleExtend3Months = () => {
        // Extend by 3 months (from old debug panel)
        const newEnd = new Date(datasetEnd instanceof Date ? datasetEnd : new Date(datasetEnd));
        newEnd.setMonth(newEnd.getMonth() + 3);
        extendDatasetRange(newEnd);
        setTimeout(() => {
            generateData('extend');
        }, 100);
    };

    const handleLogState = () => {
        console.group("MoneyMap Debug State");
        console.log("Data Store:", { transactions, accounts, isLoading, currentProfile });
        console.log("UI Store:", { activeTab, isSidebarOpen });
        console.log("Date Store:", { datasetStart, datasetEnd, viewStart, viewEnd, profileId, lastGeneratedAt });
        console.groupEnd();
    };

    const handleClearData = () => {
        if (confirm("This will clear all data. Continue?")) {
            clearData();
        }
    };

    const getStatusColor = (status: APIStatus['status']) => {
        switch (status) {
            case 'ok': return 'text-emerald-400';
            case 'warning': return 'text-amber-400';
            case 'limited': return 'text-red-400';
        }
    };

    const getStatusBg = (status: APIStatus['status']) => {
        switch (status) {
            case 'ok': return 'bg-emerald-500/20';
            case 'warning': return 'bg-amber-500/20';
            case 'limited': return 'bg-red-500/20';
        }
    };

    return (
        <div className="fixed bottom-4 right-4 z-50">
            <GlassCard
                intensity="heavy"
                tint="purple"
                className={cn(
                    "transition-all duration-300 overflow-hidden",
                    isExpanded ? "w-80" : "w-auto"
                )}
            >
                {/* Header / Toggle Button */}
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center gap-2 px-4 py-3 w-full text-left hover:bg-white/5 transition-colors"
                >
                    <Bug className="h-4 w-4 text-purple-400" />
                    <span className="text-sm font-medium text-white">Debug Panel</span>
                    <span className="ml-auto">
                        {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-zinc-400" />
                        ) : (
                            <ChevronUp className="h-4 w-4 text-zinc-400" />
                        )}
                    </span>
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                    <div className="px-4 pb-4 space-y-4">
                        {/* Dataset Range */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-xs text-zinc-400">
                                <Database className="h-3 w-3" />
                                <span>Dataset Range</span>
                            </div>
                            <div className="flex items-center justify-between bg-zinc-900/50 rounded-lg px-3 py-2">
                                <span className="text-sm text-white">
                                    {formatShortDate(datasetStart)} – {formatShortDate(datasetEnd)}
                                </span>
                                <span className="text-xs text-zinc-500">
                                    {transactions.length} txns
                                </span>
                            </div>
                        </div>

                        {/* View Range with DROPDOWNS */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-xs text-zinc-400">
                                <Calendar className="h-3 w-3" />
                                <span>View Range</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {/* From Dropdown */}
                                <select
                                    value={`${currentFromMonth}-${currentFromYear}`}
                                    onChange={(e) => handleFromChange(e.target.value)}
                                    className="flex-1 appearance-none bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500/50"
                                >
                                    {dateOptions.map(opt => (
                                        <option key={`from-${opt.month}-${opt.year}`} value={`${opt.month}-${opt.year}`}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>

                                <span className="text-zinc-500 text-xs">to</span>

                                {/* To Dropdown */}
                                <select
                                    value={`${currentToMonth}-${currentToYear}`}
                                    onChange={(e) => handleToChange(e.target.value)}
                                    className="flex-1 appearance-none bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500/50"
                                >
                                    {dateOptions.map(opt => (
                                        <option key={`to-${opt.month}-${opt.year}`} value={`${opt.month}-${opt.year}`}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Profile ID */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-xs text-zinc-400">
                                <Zap className="h-3 w-3" />
                                <span>Profile ID</span>
                            </div>
                            <div className="bg-zinc-900/50 rounded-lg px-3 py-2">
                                <code className="text-xs text-purple-300 font-mono">
                                    {profileId?.slice(0, 8)}...
                                </code>
                            </div>
                        </div>

                        {/* Last Generated */}
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                            <Clock className="h-3 w-3" />
                            <span>
                                Generated: {lastGeneratedAt ? new Date(lastGeneratedAt).toLocaleTimeString() : 'Never'}
                            </span>
                        </div>

                        {/* Action Buttons - Primary */}
                        <div className="flex gap-2 pt-2">
                            <button
                                onClick={handleNewStatements}
                                disabled={isGenerating || isLoading}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                                    "bg-purple-600 hover:bg-purple-500 text-white",
                                    "disabled:opacity-50 disabled:cursor-not-allowed"
                                )}
                            >
                                <RefreshCw className={cn("h-4 w-4", (isGenerating || isLoading) && "animate-spin")} />
                                New Statements
                            </button>
                            <button
                                onClick={handleExtendRange}
                                disabled={isLoading}
                                className={cn(
                                    "px-3 py-2 rounded-lg text-sm font-medium transition-all",
                                    "bg-zinc-700 hover:bg-zinc-600 text-white",
                                    "disabled:opacity-50 disabled:cursor-not-allowed"
                                )}
                            >
                                +1 Mo
                            </button>
                        </div>

                        {/* Secondary Actions */}
                        <div className="flex gap-2">
                            <button
                                onClick={handleExtend3Months}
                                disabled={isLoading}
                                className={cn(
                                    "flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                                    "bg-emerald-900/30 hover:bg-emerald-900/50 text-emerald-400",
                                    "disabled:opacity-50 disabled:cursor-not-allowed"
                                )}
                            >
                                +3 Mo
                            </button>
                            <button
                                onClick={handleLogState}
                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-all"
                            >
                                <Terminal className="h-3 w-3" />
                                Log State
                            </button>
                            <button
                                onClick={handleClearData}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-900/30 hover:bg-red-900/50 text-red-400 transition-all"
                            >
                                <Trash2 className="h-3 w-3" />
                            </button>
                        </div>

                        {/* API Status Section */}
                        <div className="pt-2 border-t border-white/10">
                            <div className="flex items-center gap-2 text-xs text-zinc-400 mb-2">
                                <Activity className="h-3 w-3" />
                                <span>API Rate Limits</span>
                            </div>
                            <div className="space-y-1">
                                {STUB_API_STATUS.map((api) => (
                                    <div
                                        key={api.name}
                                        className="flex items-center justify-between text-xs"
                                    >
                                        <span className="text-zinc-400">{api.name}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-zinc-500">
                                                {api.callsUsed}/{api.callsLimit}
                                            </span>
                                            <span className={cn(
                                                "px-1.5 py-0.5 rounded text-[10px] font-medium uppercase",
                                                getStatusBg(api.status),
                                                getStatusColor(api.status)
                                            )}>
                                                {api.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </GlassCard>
        </div>
    );
}
