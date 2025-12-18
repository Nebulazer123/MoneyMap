"use client";

import React, { useState, useCallback } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
    TrendingUp,
    TrendingDown,
    Star,
    StarOff,
    ChevronDown,
    ChevronUp,
    Clock,
} from "lucide-react";

// ============================================
// TYPES
// ============================================

export interface TickerData {
    id: string;
    symbol: string;
    name: string;
    image?: string;
    price: number;
    change: number;
    changePercent: number;
    changePercent7d?: number;
    changePercent30d?: number;
    changePercent1y?: number;
    high24h?: number;
    low24h?: number;
    volume?: number;
    marketCap?: number;
    marketCapRank?: number;
    // ATH/ATL
    ath?: number;
    athDate?: string;
    athChangePercent?: number;
    atl?: number;
    atlDate?: string;
    atlChangePercent?: number;
    // Supply
    circulatingSupply?: number;
    totalSupply?: number;
    maxSupply?: number | null;
    // Sparkline
    sparkline7d?: number[];
    // Last update
    lastUpdated?: Date;
}

export interface TickerProps {
    data: TickerData;
    type?: "crypto" | "stock";
    variant?: "compact" | "default" | "expanded";
    isFavorite?: boolean;
    onToggleFavorite?: (id: string) => void;
    onClick?: (id: string) => void;
    showSparkline?: boolean;
    className?: string;
}

// ============================================
// MINI SPARKLINE CHART
// ============================================

function Sparkline({
    data,
    isPositive,
    width = 80,
    height = 32,
}: {
    data: number[];
    isPositive: boolean;
    width?: number;
    height?: number;
}) {
    // useId must be called before any early returns (rules of hooks)
    const baseId = React.useId();
    const gradientId = `spark-${isPositive ? "up" : "down"}-${baseId}`;

    if (!data || data.length < 2) return null;

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const padding = 2;

    const points = data
        .map((value, i) => {
            const x = padding + (i / (data.length - 1)) * (width - padding * 2);
            const y = height - padding - ((value - min) / range) * (height - padding * 2);
            return `${x},${y}`;
        })
        .join(" ");

    const color = isPositive ? "#22c55e" : "#ef4444";

    return (
        <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-full"
            preserveAspectRatio="none"
        >
            <defs>
                <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            <polygon
                points={`${padding},${height - padding} ${points} ${width - padding},${height - padding}`}
                fill={`url(#${gradientId})`}
            />
            <polyline
                points={points}
                fill="none"
                stroke={color}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

// ============================================
// SUPPLY PROGRESS BAR
// ============================================

function SupplyProgress({
    circulating,
    total,
    max,
}: {
    circulating?: number;
    total?: number;
    max?: number | null;
}) {
    if (!circulating) return null;

    const baseSupply = max || total || circulating;
    const percent = (circulating / baseSupply) * 100;

    return (
        <div className="flex items-center gap-2 text-xs text-zinc-400">
            <span className="whitespace-nowrap">Supply:</span>
            <div className="flex-1 h-1.5 bg-zinc-700/50 rounded-full overflow-hidden min-w-[60px]">
                <div
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"
                    style={{ width: `${Math.min(percent, 100)}%` }}
                />
            </div>
            <span className="font-mono">{percent.toFixed(1)}%</span>
        </div>
    );
}

// ============================================
// FORMAT HELPERS
// ============================================

function formatPrice(price: number): string {
    if (price >= 1000) {
        return price.toLocaleString("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    }
    if (price >= 1) {
        return price.toLocaleString("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 2,
            maximumFractionDigits: 4,
        });
    }
    // Small prices - show more decimals
    return price.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 4,
        maximumFractionDigits: 8,
    });
}

function formatCompact(value: number): string {
    return new Intl.NumberFormat("en-US", {
        notation: "compact",
        maximumFractionDigits: 2,
    }).format(value);
}

function formatPercent(value: number | undefined, showSign = true): string {
    if (value === undefined || value === null) return "—";
    const sign = showSign && value > 0 ? "+" : "";
    return `${sign}${value.toFixed(2)}%`;
}

function formatDate(dateStr: string | undefined): string {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

// ============================================
// TICKER COMPONENT
// ============================================

export function Ticker({
    data,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type = "crypto",
    variant = "default",
    isFavorite = false,
    onToggleFavorite,
    onClick,
    showSparkline = true,
    className,
}: TickerProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [imgError, setImgError] = useState(false);

    const isPositive = data.changePercent >= 0;
    const changeColor = isPositive ? "text-emerald-400" : "text-red-400";

    const handleClick = useCallback(() => {
        if (variant === "default") {
            setIsExpanded(!isExpanded);
        }
        onClick?.(data.id);
    }, [variant, isExpanded, onClick, data.id]);

    const handleFavorite = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation();
            onToggleFavorite?.(data.id);
        },
        [onToggleFavorite, data.id]
    );

    // Compact variant - single line
    if (variant === "compact") {
        return (
            <div
                className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-800/40 hover:bg-slate-700/50 transition-colors cursor-pointer",
                    className
                )}
                onClick={handleClick}
            >
                {/* Logo */}
                <div className="relative w-6 h-6 shrink-0">
                    {data.image && !imgError ? (
                        <Image
                            src={data.image}
                            alt={data.name}
                            fill
                            className="rounded-full object-cover"
                            onError={() => setImgError(true)}
                            unoptimized
                        />
                    ) : (
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-white text-xs font-bold">
                            {data.symbol.charAt(0)}
                        </div>
                    )}
                </div>

                {/* Symbol */}
                <span className="font-semibold text-white text-sm w-14">{data.symbol}</span>

                {/* Price */}
                <span className="font-mono text-sm text-white flex-1">{formatPrice(data.price)}</span>

                {/* Change */}
                <span className={cn("font-mono text-sm", changeColor)}>
                    {formatPercent(data.changePercent)}
                </span>
            </div>
        );
    }

    // Default variant - expandable card
    return (
        <div
            className={cn(
                "rounded-xl bg-slate-800/60 backdrop-blur-sm border border-white/5 overflow-hidden transition-all duration-300",
                "hover:border-white/10 hover:bg-slate-800/80",
                isExpanded && "ring-1 ring-blue-500/30",
                className
            )}
        >
            {/* Main Row */}
            <div
                className="flex items-center gap-4 p-4 cursor-pointer"
                onClick={handleClick}
            >
                {/* Rank Badge */}
                {data.marketCapRank && (
                    <div className="w-8 h-8 rounded-lg bg-slate-700/50 flex items-center justify-center text-xs font-bold text-zinc-400">
                        #{data.marketCapRank}
                    </div>
                )}

                {/* Logo */}
                <div className="relative w-10 h-10 shrink-0">
                    {data.image && !imgError ? (
                        <Image
                            src={data.image}
                            alt={data.name}
                            fill
                            className="rounded-full object-cover"
                            onError={() => setImgError(true)}
                            unoptimized
                        />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white text-lg font-bold">
                            {data.symbol.charAt(0)}
                        </div>
                    )}
                </div>

                {/* Name & Symbol */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-white truncate">{data.name}</h3>
                        <span className="text-xs font-medium text-zinc-500 bg-zinc-800/50 px-1.5 py-0.5 rounded">
                            {data.symbol}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                        {data.marketCap && (
                            <span className="text-xs text-zinc-500">
                                MCap ${formatCompact(data.marketCap)}
                            </span>
                        )}
                        {data.volume && (
                            <span className="text-xs text-zinc-500">
                                Vol ${formatCompact(data.volume)}
                            </span>
                        )}
                    </div>
                </div>

                {/* Sparkline */}
                {showSparkline && data.sparkline7d && data.sparkline7d.length > 0 && (
                    <div className="w-20 h-10 shrink-0 hidden sm:block">
                        <Sparkline data={data.sparkline7d} isPositive={isPositive} />
                    </div>
                )}

                {/* Price & Change */}
                <div className="text-right shrink-0">
                    <div className="font-semibold text-white font-mono">
                        {formatPrice(data.price)}
                    </div>
                    <div className={cn("flex items-center justify-end gap-1 text-sm", changeColor)}>
                        {isPositive ? (
                            <TrendingUp className="w-3.5 h-3.5" />
                        ) : (
                            <TrendingDown className="w-3.5 h-3.5" />
                        )}
                        <span className="font-mono">{formatPercent(data.changePercent)}</span>
                    </div>
                </div>

                {/* Favorite Button */}
                {onToggleFavorite && (
                    <button
                        onClick={handleFavorite}
                        className="p-2 rounded-lg hover:bg-white/5 transition-colors shrink-0"
                    >
                        {isFavorite ? (
                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        ) : (
                            <StarOff className="w-4 h-4 text-zinc-500" />
                        )}
                    </button>
                )}

                {/* Expand Toggle */}
                <button className="p-1 text-zinc-500 shrink-0">
                    {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                    ) : (
                        <ChevronDown className="w-4 h-4" />
                    )}
                </button>
            </div>

            {/* Expanded Details */}
            {isExpanded && (
                <div className="px-4 pb-4 pt-0 border-t border-white/5 animate-in slide-in-from-top-2 duration-200">
                    {/* Performance Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                        <div className="bg-slate-700/30 rounded-lg p-3">
                            <div className="text-xs text-zinc-500 mb-1">24h Change</div>
                            <div className={cn("font-mono font-medium", changeColor)}>
                                {formatPercent(data.changePercent)}
                            </div>
                        </div>
                        <div className="bg-slate-700/30 rounded-lg p-3">
                            <div className="text-xs text-zinc-500 mb-1">7d Change</div>
                            <div
                                className={cn(
                                    "font-mono font-medium",
                                    data.changePercent7d && data.changePercent7d >= 0
                                        ? "text-emerald-400"
                                        : "text-red-400"
                                )}
                            >
                                {formatPercent(data.changePercent7d)}
                            </div>
                        </div>
                        <div className="bg-slate-700/30 rounded-lg p-3">
                            <div className="text-xs text-zinc-500 mb-1">30d Change</div>
                            <div
                                className={cn(
                                    "font-mono font-medium",
                                    data.changePercent30d && data.changePercent30d >= 0
                                        ? "text-emerald-400"
                                        : "text-red-400"
                                )}
                            >
                                {formatPercent(data.changePercent30d)}
                            </div>
                        </div>
                        <div className="bg-slate-700/30 rounded-lg p-3">
                            <div className="text-xs text-zinc-500 mb-1">1y Change</div>
                            <div
                                className={cn(
                                    "font-mono font-medium",
                                    data.changePercent1y && data.changePercent1y >= 0
                                        ? "text-emerald-400"
                                        : "text-red-400"
                                )}
                            >
                                {formatPercent(data.changePercent1y)}
                            </div>
                        </div>
                    </div>

                    {/* Price Range & ATH/ATL */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                        {/* 24h Range */}
                        {data.high24h && data.low24h && (
                            <div className="bg-slate-700/30 rounded-lg p-3">
                                <div className="flex justify-between text-xs text-zinc-500 mb-2">
                                    <span>24h Low</span>
                                    <span>24h High</span>
                                </div>
                                <div className="flex justify-between text-sm font-mono mb-2">
                                    <span className="text-red-400">{formatPrice(data.low24h)}</span>
                                    <span className="text-emerald-400">{formatPrice(data.high24h)}</span>
                                </div>
                                <div className="h-1.5 bg-gradient-to-r from-red-500 via-yellow-500 to-emerald-500 rounded-full relative">
                                    <div
                                        className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full border-2 border-slate-800 shadow-lg"
                                        style={{
                                            left: `${((data.price - data.low24h) / (data.high24h - data.low24h)) * 100}%`,
                                        }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* ATH/ATL */}
                        {data.ath && data.atl && (
                            <div className="bg-slate-700/30 rounded-lg p-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="text-xs text-zinc-500 mb-1 flex items-center gap-1">
                                            <TrendingUp className="w-3 h-3" />
                                            ATH
                                        </div>
                                        <div className="text-sm font-mono text-emerald-400">
                                            {formatPrice(data.ath)}
                                        </div>
                                        <div className="text-xs text-zinc-500">
                                            {formatDate(data.athDate)}
                                        </div>
                                        <div className="text-xs text-red-400 font-mono">
                                            {formatPercent(data.athChangePercent)}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs text-zinc-500 mb-1 flex items-center gap-1 justify-end">
                                            <TrendingDown className="w-3 h-3" />
                                            ATL
                                        </div>
                                        <div className="text-sm font-mono text-red-400">
                                            {formatPrice(data.atl)}
                                        </div>
                                        <div className="text-xs text-zinc-500">
                                            {formatDate(data.atlDate)}
                                        </div>
                                        <div className="text-xs text-emerald-400 font-mono">
                                            {formatPercent(data.atlChangePercent)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Supply Info */}
                    {data.circulatingSupply && (
                        <div className="mt-4">
                            <SupplyProgress
                                circulating={data.circulatingSupply}
                                total={data.totalSupply}
                                max={data.maxSupply}
                            />
                            <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                                <div>
                                    <span className="text-zinc-500">Circulating: </span>
                                    <span className="text-white font-mono">
                                        {formatCompact(data.circulatingSupply)}
                                    </span>
                                </div>
                                {data.totalSupply && (
                                    <div>
                                        <span className="text-zinc-500">Total: </span>
                                        <span className="text-white font-mono">
                                            {formatCompact(data.totalSupply)}
                                        </span>
                                    </div>
                                )}
                                {data.maxSupply && (
                                    <div>
                                        <span className="text-zinc-500">Max: </span>
                                        <span className="text-white font-mono">
                                            {formatCompact(data.maxSupply)}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Last Updated */}
                    {data.lastUpdated && (
                        <div className="flex items-center gap-1 text-xs text-zinc-500 mt-4">
                            <Clock className="w-3 h-3" />
                            Updated {data.lastUpdated.toLocaleTimeString()}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ============================================
// TICKER SKELETON
// ============================================

export function TickerSkeleton({ variant = "default" }: { variant?: "compact" | "default" }) {
    if (variant === "compact") {
        return (
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-800/40 animate-pulse">
                <div className="w-6 h-6 rounded-full bg-slate-700" />
                <div className="w-14 h-4 bg-slate-700 rounded" />
                <div className="flex-1 h-4 bg-slate-700 rounded" />
                <div className="w-16 h-4 bg-slate-700 rounded" />
            </div>
        );
    }

    return (
        <div className="rounded-xl bg-slate-800/60 border border-white/5 p-4 animate-pulse">
            <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg bg-slate-700" />
                <div className="w-10 h-10 rounded-full bg-slate-700" />
                <div className="flex-1">
                    <div className="w-32 h-5 bg-slate-700 rounded mb-2" />
                    <div className="w-24 h-3 bg-slate-700 rounded" />
                </div>
                <div className="w-20 h-8 bg-slate-700 rounded hidden sm:block" />
                <div className="text-right">
                    <div className="w-24 h-5 bg-slate-700 rounded mb-1" />
                    <div className="w-16 h-4 bg-slate-700 rounded" />
                </div>
            </div>
        </div>
    );
}

export default Ticker;
