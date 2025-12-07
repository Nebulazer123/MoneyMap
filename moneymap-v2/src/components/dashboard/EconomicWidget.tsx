"use client";

import React, { useState, useEffect } from "react";
import { GlassCard } from "../ui/GlassCard";
import { TrendingUp, TrendingDown, RefreshCw, Loader2, DollarSign, Percent } from "lucide-react";
import { cn } from "../../lib/utils";

interface EconomicIndicator {
    id: string;
    name: string;
    value: number;
    date: string;
    unit: string;
}

export function EconomicWidget() {
    const [indicators, setIndicators] = useState<EconomicIndicator[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
    const [isDemo, setIsDemo] = useState(false);

    // Demo data fallback when FRED API is unavailable
    const DEMO_INDICATORS: EconomicIndicator[] = [
        { id: 'FEDFUNDS', name: 'Fed Funds Rate', value: 5.33, date: '2024-12-01', unit: '%' },
        { id: 'CPIAUCSL', name: 'Inflation (CPI)', value: 314.5, date: '2024-11-01', unit: 'Index' },
        { id: 'UNRATE', name: 'Unemployment', value: 4.2, date: '2024-11-01', unit: '%' },
        { id: 'DGS10', name: '10-Year Treasury', value: 4.25, date: '2024-12-01', unit: '%' },
    ];

    const fetchEconomicData = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/economy');
            const data = await response.json();
            if (data.indicators && data.indicators.length > 0) {
                setIndicators(data.indicators);
                setIsDemo(false);
                setLastRefresh(new Date());
            } else {
                // Fall back to demo data
                setIndicators(DEMO_INDICATORS);
                setIsDemo(true);
                setLastRefresh(new Date());
            }
        } catch (error) {
            console.error('Failed to fetch economic data:', error);
            // Fall back to demo data
            setIndicators(DEMO_INDICATORS);
            setIsDemo(true);
            setLastRefresh(new Date());
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchEconomicData();
        // Refresh every 30 minutes (economic data doesn't change often)
        const interval = setInterval(fetchEconomicData, 30 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const formatValue = (indicator: EconomicIndicator) => {
        if (indicator.unit === '%') {
            return `${indicator.value.toFixed(2)}%`;
        } else if (indicator.unit === 'Billions') {
            return `$${(indicator.value / 1000).toFixed(1)}T`;
        } else {
            return indicator.value.toFixed(1);
        }
    };

    return (
        <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Percent className="h-5 w-5 text-blue-400" />
                    <h3 className="text-lg font-semibold text-white">Economic Indicators</h3>
                </div>
                <button
                    onClick={fetchEconomicData}
                    disabled={isLoading}
                    className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                >
                    <RefreshCw className={cn("h-4 w-4 text-zinc-400", isLoading && "animate-spin")} />
                </button>
            </div>

            {isLoading && indicators.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 text-blue-400 animate-spin" />
                    <span className="ml-2 text-zinc-400">Loading economic data...</span>
                </div>
            ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                    {indicators.map((indicator) => (
                        <div
                            key={indicator.id}
                            className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/60 hover:border-zinc-700/70 transition-all"
                        >
                            <p className="text-xs text-zinc-500 mb-1">{indicator.name}</p>
                            <p className="text-2xl font-bold text-white">{formatValue(indicator)}</p>
                            <p className="text-xs text-zinc-600 mt-1">
                                Updated: {new Date(indicator.date).toLocaleDateString()}
                            </p>
                        </div>
                    ))}
                </div>
            )}

            {lastRefresh && (
                <p className="text-xs text-zinc-600 mt-4 text-center">
                    Last updated: {lastRefresh.toLocaleTimeString()}
                </p>
            )}

            <div className="mt-4 pt-4 border-t border-zinc-800/60">
                <p className="text-xs text-zinc-500 text-center">
                    {isDemo
                        ? "Demo economic indicators (sample only)"
                        : "Data provided by Federal Reserve Economic Data (FRED)"
                    }
                </p>
            </div>
        </GlassCard>
    );
}
