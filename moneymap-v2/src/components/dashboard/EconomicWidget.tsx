"use client";

import React, { useState, useEffect } from "react";
import { GlassCard } from "../ui/GlassCard";
import {
    RefreshCw,
    Loader2,
    TrendingUp,
    BarChart3,
    Briefcase,
    LineChart,
    AlertCircle,
    CheckCircle,
    MinusCircle
} from "lucide-react";
import { cn } from "../../lib/utils";

// ============================================================================
// Types
// ============================================================================

interface EconomicIndicator {
    id: string;
    name: string;
    value: number;
    date: string;
    unit: string;
}

type BadgeTone = "elevated" | "normal" | "low" | "neutral";

interface IndicatorConfig {
    label: string;
    shortLabel: string;
    icon: React.ElementType;
    accentColor: string; // Tailwind color class base (e.g., "cyan", "amber")
    bgGradient: string; // Tailwind gradient classes
    borderColor: string;
    iconBg: string;
    getBadge: (value: number) => { label: string; tone: BadgeTone } | null;
}

// ============================================================================
// Macro Pulse Tiles Theme Configuration
// ============================================================================

const INDICATOR_CONFIG: Record<string, IndicatorConfig> = {
    FEDFUNDS: {
        label: "Fed Funds Rate",
        shortLabel: "Fed Rate",
        icon: TrendingUp,
        accentColor: "cyan",
        bgGradient: "from-cyan-950/40 via-cyan-900/20 to-zinc-900/40",
        borderColor: "border-cyan-500/30",
        iconBg: "bg-cyan-500/20",
        getBadge: (value) => {
            if (value >= 5) return { label: "Elevated", tone: "elevated" };
            if (value >= 3) return { label: "Normal", tone: "normal" };
            return { label: "Low", tone: "low" };
        }
    },
    CPIAUCSL: {
        label: "Inflation (CPI)",
        shortLabel: "CPI Index",
        icon: BarChart3,
        accentColor: "amber",
        bgGradient: "from-amber-950/40 via-amber-900/20 to-zinc-900/40",
        borderColor: "border-amber-500/30",
        iconBg: "bg-amber-500/20",
        getBadge: (value) => {
            // CPI is an index, so we don't show badges for it
            return null;
        }
    },
    UNRATE: {
        label: "Unemployment",
        shortLabel: "Jobless",
        icon: Briefcase,
        accentColor: "violet",
        bgGradient: "from-violet-950/40 via-violet-900/20 to-zinc-900/40",
        borderColor: "border-violet-500/30",
        iconBg: "bg-violet-500/20",
        getBadge: (value) => {
            if (value >= 6) return { label: "Elevated", tone: "elevated" };
            if (value >= 4) return { label: "Normal", tone: "normal" };
            return { label: "Low", tone: "low" };
        }
    },
    DGS10: {
        label: "10-Year Treasury",
        shortLabel: "10Y Yield",
        icon: LineChart,
        accentColor: "teal",
        bgGradient: "from-teal-950/40 via-teal-900/20 to-zinc-900/40",
        borderColor: "border-teal-500/30",
        iconBg: "bg-teal-500/20",
        getBadge: (value) => {
            if (value >= 4.5) return { label: "High", tone: "elevated" };
            if (value >= 3) return { label: "Normal", tone: "normal" };
            return { label: "Low", tone: "low" };
        }
    }
};

// Badge styling based on tone
const BADGE_STYLES: Record<BadgeTone, string> = {
    elevated: "bg-rose-500/20 text-rose-300 border-rose-500/30",
    normal: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    low: "bg-sky-500/20 text-sky-300 border-sky-500/30",
    neutral: "bg-zinc-500/20 text-zinc-300 border-zinc-500/30"
};

// Accent color text mapping
const ACCENT_TEXT_COLORS: Record<string, string> = {
    cyan: "text-cyan-400",
    amber: "text-amber-400",
    violet: "text-violet-400",
    teal: "text-teal-400"
};

// ============================================================================
// Sub-Components
// ============================================================================

interface IndicatorCardProps {
    indicator: EconomicIndicator;
    config: IndicatorConfig;
    formatValue: (indicator: EconomicIndicator) => string;
}

function IndicatorCard({ indicator, config, formatValue }: IndicatorCardProps) {
    const Icon = config.icon;
    const badge = config.getBadge(indicator.value);
    const accentTextColor = ACCENT_TEXT_COLORS[config.accentColor] || "text-white";

    return (
        <div
            className={cn(
                "relative overflow-hidden p-4 rounded-2xl border transition-all duration-300",
                "bg-gradient-to-br",
                config.bgGradient,
                config.borderColor,
                "hover:border-opacity-60 hover:shadow-lg hover:shadow-black/20",
                "group"
            )}
        >
            {/* Subtle inner glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Header: Icon + Badge */}
            <div className="flex items-center justify-between mb-3 relative">
                <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    config.iconBg,
                    "shadow-inner"
                )}>
                    <Icon className={cn("h-5 w-5", accentTextColor)} />
                </div>

                {badge && (
                    <span className={cn(
                        "px-2 py-0.5 text-[10px] font-semibold rounded-full border uppercase tracking-wide",
                        BADGE_STYLES[badge.tone]
                    )}>
                        {badge.label}
                    </span>
                )}
            </div>

            {/* Value */}
            <div className="relative">
                <p className={cn(
                    "text-3xl font-bold tracking-tight",
                    accentTextColor
                )}>
                    {formatValue(indicator)}
                </p>
            </div>

            {/* Label */}
            <p className="text-sm font-medium text-zinc-300 mt-1">
                {config.label}
            </p>

            {/* Updated date */}
            <p className="text-xs text-zinc-500 mt-2 flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-zinc-600" />
                {new Date(indicator.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                })}
            </p>
        </div>
    );
}

// ============================================================================
// Main Component
// ============================================================================

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
        } else if (indicator.unit === 'Index') {
            return indicator.value.toFixed(1);
        } else {
            return indicator.value.toFixed(1);
        }
    };

    return (
        <GlassCard className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                        <BarChart3 className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white">Economic Indicators</h3>
                        <p className="text-xs text-zinc-500">Macro market pulse</p>
                    </div>
                </div>
                <button
                    onClick={fetchEconomicData}
                    disabled={isLoading}
                    className={cn(
                        "p-2.5 rounded-xl transition-all duration-200",
                        "bg-white/5 hover:bg-white/10 border border-white/10",
                        "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                    title="Refresh data"
                >
                    <RefreshCw className={cn("h-4 w-4 text-zinc-400", isLoading && "animate-spin")} />
                </button>
            </div>

            {/* Loading State */}
            {isLoading && indicators.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 text-blue-400 animate-spin" />
                    <span className="ml-3 text-zinc-400">Loading economic data...</span>
                </div>
            ) : (
                /* Indicator Grid - Macro Pulse Tiles */
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {indicators.map((indicator) => {
                        const config = INDICATOR_CONFIG[indicator.id];
                        if (!config) return null;

                        return (
                            <IndicatorCard
                                key={indicator.id}
                                indicator={indicator}
                                config={config}
                                formatValue={formatValue}
                            />
                        );
                    })}
                </div>
            )}

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-zinc-800/60 flex items-center justify-between">
                <p className="text-xs text-zinc-500 flex items-center gap-2">
                    {isDemo ? (
                        <>
                            <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                        </>
                    ) : (
                        <>
                            <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                            <span>Data provided by Federal Reserve Economic Data (FRED)</span>
                        </>
                    )}
                </p>
                {lastRefresh && (
                    <p className="text-xs text-zinc-600">
                        Updated {lastRefresh.toLocaleTimeString()}
                    </p>
                )}
            </div>
        </GlassCard>
    );
}
