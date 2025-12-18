"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { GlassCard } from "../ui/GlassCard";
import { InfoTooltip } from "../ui/InfoTooltip";
import { cn } from "../../lib/utils";
import {
    Search, Plus, Trash2, TrendingUp, TrendingDown, RefreshCw,
    Star, StarOff, BarChart3, Loader2, Wifi, WifiOff,
    DollarSign, Percent, Activity, Clock, AlertCircle,
    ChevronDown, ChevronUp, ExternalLink, Newspaper,
    LineChart, Building2, X, ArrowUpRight, ArrowDownRight,
    Bell, BellOff, Sun, Moon
} from "lucide-react";
import { CryptoCurrencyConverter } from "./CurrencyConverter";
import { DEFAULT_CRYPTOS, INITIAL_HOLDINGS, INITIAL_WATCHLIST, getCryptoInfo, REFRESH_INTERVAL_MS } from "../../lib/cryptoHelpers";

// Market hours helper
function getMarketStatus() {
    return {
        isOpen: true,
        statusMessage: 'Trading 24/7',
        nyTime: new Date().toLocaleTimeString(),
    };
}

// Map common tickers to nicer glyphs for the avatar badge
function getCryptoGlyph(symbol: string) {
    switch (symbol.toUpperCase()) {
        case "BTC":
            return "₿";
        case "ETH":
            return "Ξ";
        case "SOL":
            return "◎";
        default:
            return symbol.slice(0, 3).toUpperCase();
    }
}

// Give each major coin a distinct, bright badge style
function getCryptoBadgeClasses(symbol: string, isPositive: boolean) {
    const base = "rounded-2xl flex items-center justify-center font-black tracking-tight transition-all shadow-lg";
    const upper = symbol.toUpperCase();

    if (upper.startsWith("BTC")) {
        return `${base} bg-gradient-to-br from-amber-400 via-orange-500 to-amber-700 text-black border border-amber-300/80`;
    }
    if (upper.startsWith("ETH")) {
        return `${base} bg-gradient-to-br from-sky-500 via-indigo-500 to-violet-700 text-white border border-sky-300/70`;
    }
    if (upper.startsWith("SOL")) {
        return `${base} bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 text-black border border-emerald-300/80`;
    }

    // Fallback: tie color slightly to gain/loss so it still feels alive
    if (isPositive) {
        return `${base} bg-emerald-500/20 text-emerald-300 border border-emerald-400/60`;
    }
    return `${base} bg-rose-500/15 text-rose-300 border border-rose-400/60`;
}

// Types
interface CryptoQuote {
    id: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
    high: number;
    low: number;
    open: number;
    previousClose: number;
    volume: number;
    marketCap?: number;
    lastUpdated: Date;
}

interface CryptoHolding {
    id: string;
    cryptoId: string;
    name: string;
    shares: number;
    avgCost: number; // Average cost per share
    currentPrice: number;
    addedAt: Date;
}

interface WatchlistItem {
    id: string;
    cryptoId: string;
    name: string;
    addedAt: Date;
}

interface SearchResult {
    id: string;
    name: string;
    exchange?: string;
    type?: string;
}

interface ChartPoint {
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

interface NewsItem {
    title: string;
    publisher: string;
    link: string;
    publishedAt: number;
    thumbnail: string | null;
}

interface CryptoDetail {
    id: string;
    quote: {
        id: string;
        name: string;
        price: number;
        change: number;
        changePercent: number;
        high: number;
        low: number;
        open: number;
        previousClose: number;
        volume: number;
        avgVolume: number;
        marketCap: number;
        fiftyTwoWeekHigh: number;
        fiftyTwoWeekLow: number;
        pe: number;
        eps: number;
        dividend: number;
        beta: number;
        exchange: string;
        currency: string;
    } | null;
    charts: {
        '1D': ChartPoint[];
        '1W': ChartPoint[];
        '1M': ChartPoint[];
        '3M': ChartPoint[];
        '1Y': ChartPoint[];
    };
    news: NewsItem[];
    insights: {
        recommendation: string;
        targetPrice: number;
        reports: { title: string; provider: string; summary: string }[];
        technicalEvents: unknown;
        companySnapshot: unknown;
    } | null;
}

type ChartTimeframe = '1D' | '1W' | '1M' | '3M' | '1Y';

// Mini Chart Component for expanded view
function MiniChart({ data, isPositive }: { data: ChartPoint[], isPositive: boolean }) {
    if (!data || data.length === 0) return null;

    const prices = data.map(d => d.close).filter(p => p != null);
    if (prices.length === 0) return null;

    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const range = maxPrice - minPrice || 1;

    const width = 100;
    const height = 100;
    const padding = 2;

    const points = prices.map((price, i) => {
        const x = padding + (i / (prices.length - 1)) * (width - padding * 2);
        const y = height - padding - ((price - minPrice) / range) * (height - padding * 2);
        return `${x},${y}`;
    }).join(' ');

    const gradientId = `chartGradient-${isPositive ? 'up' : 'down'}`;
    const color = isPositive ? '#22c55e' : '#ef4444';

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none">
            <defs>
                <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            {/* Fill area under the line */}
            <polygon
                points={`${padding},${height - padding} ${points} ${width - padding},${height - padding}`}
                fill={`url(#${gradientId})`}
            />
            {/* The line */}
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

export function Crypto() {
    const [holdings, setHoldings] = useState<CryptoHolding[]>([]);
    const [watchlist, setWatchlist] = useState<WatchlistItem[]>(INITIAL_WATCHLIST);
    const [quotes, setQuotes] = useState<Record<string, CryptoQuote>>({});
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [showAddHoldingModal, setShowAddHoldingModal] = useState(false);
    const [showAddCustomStockModal, setShowAddCustomStockModal] = useState(false);
    const [selectedid, setSelectedid] = useState<string | null>(null);
    const [newHolding, setNewHolding] = useState({ shares: 0, avgCost: 0 });
    const [customStock, setCustomStock] = useState({ id: '', name: '', price: 0 });
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
    const [isOnline, setIsOnline] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isInitialLoading, setIsInitialLoading] = useState(true);

    // New states for expanded view
    const [expandedid, setExpandedid] = useState<string | null>(null);
    const [CryptoDetail, setCryptoDetail] = useState<CryptoDetail | null>(null);

    // Market status state
    const [marketStatus, setMarketStatus] = useState(getMarketStatus());
    const [isLoadingDetail, setIsLoadingDetail] = useState(false);
    const [chartTimeframe, setChartTimeframe] = useState<ChartTimeframe>('1D');
    const [showBrowseModal, setShowBrowseModal] = useState(false);
    const [trendingStocks, setTrendingStocks] = useState<SearchResult[]>([]);

    const currency = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    });

    const compactCurrency = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        notation: "compact",
        maximumFractionDigits: 1,
    });

    // Fetch quotes from CoinGecko API
    const fetchQuotes = useCallback(async (symbols: string[]) => {
        if (symbols.length === 0) return;

        try {
            const response = await fetch(`/api/crypto?ids=${symbols.join(',')}`);
            if (!response.ok) throw new Error('Failed to fetch quotes');

            const data = await response.json();
            if (data.quotes) {
                const newQuotes: Record<string, CryptoQuote> = {};
                data.quotes.forEach((q: CryptoQuote) => {
                    newQuotes[q.id] = {
                        ...q,
                        lastUpdated: new Date(),
                    };
                });
                setQuotes(prev => ({ ...prev, ...newQuotes }));
                setLastRefresh(new Date());
                setIsOnline(true);
                setError(null);
            }
        } catch (err) {
            console.error('Error fetching quotes:', err);
            setError('Unable to fetch live data. Check your connection.');
            setIsOnline(false);
        }
    }, []);

    // Search cryptos via CoinGecko
    const searchStocks = useCallback(async (query: string) => {
        if (query.length < 1) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const response = await fetch(`/api/crypto?search=${encodeURIComponent(query)}`);
            if (!response.ok) throw new Error('Search failed');

            const data = await response.json();
            setSearchResults(data.quotes || []);
        } catch (err) {
            console.error('Search error:', err);
            // Fallback to local search
            const localResults = Object.keys(quotes)
                .filter(s =>
                    s.toLowerCase().includes(query.toLowerCase()) ||
                    quotes[s]?.name.toLowerCase().includes(query.toLowerCase())
                )
                .map(s => ({ id: s, name: quotes[s]?.name || s }));
            setSearchResults(localResults);
        } finally {
            setIsSearching(false);
        }
    }, [quotes]);

    // Fetch detailed crypto info (chart, news, insights)
    const fetchCryptoDetail = useCallback(async (id: string) => {
        setIsLoadingDetail(true);
        try {
            const response = await fetch(`/api/crypto?detail=${id}`);
            if (!response.ok) throw new Error('Failed to fetch detail');

            const data = await response.json();
            setCryptoDetail(data);
        } catch (err) {
            console.error('Error fetching crypto detail:', err);
            setCryptoDetail(null);
        } finally {
            setIsLoadingDetail(false);
        }
    }, []);

    // Fetch trending cryptos for browse modal
    const fetchTrendingStocks = useCallback(async () => {
        try {
            const response = await fetch('/api/crypto?trending=true');
            if (!response.ok) throw new Error('Failed to fetch trending');

            const data = await response.json();
            setTrendingStocks(data.trending || []);
        } catch (err) {
            console.error('Error fetching trending:', err);
            // Fallback to loaded quotes
            const fallback = Object.entries(quotes).slice(0, 20).map(([id, q]) => ({
                id,
                name: q.name,
            }));
            setTrendingStocks(fallback);
        }
    }, [quotes]);

    // Toggle expanded crypto view
    const toggleExpandedStock = useCallback((id: string) => {
        if (expandedid === id) {
            setExpandedid(null);
            setCryptoDetail(null);
        } else {
            setExpandedid(id);
            fetchCryptoDetail(id);
        }
    }, [expandedid, fetchCryptoDetail]);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery) {
                searchStocks(searchQuery);
            } else {
                setSearchResults([]);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, searchStocks]);

    // Update market status every minute
    useEffect(() => {
        const interval = setInterval(() => {
            setMarketStatus(getMarketStatus());
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    // Initial load - fetch default symbols
    useEffect(() => {
        const loadInitialData = async () => {
            setIsInitialLoading(true);

            // Get all symbols we need (defaults + holdings + watchlist)
            const holdingSymbols = INITIAL_HOLDINGS.map(h => h.cryptoId);
            const watchlistSymbols = INITIAL_WATCHLIST.map(w => w.cryptoId);
            const allSymbols = [...new Set([...DEFAULT_CRYPTOS, ...holdingSymbols, ...watchlistSymbols])];

            await fetchQuotes(allSymbols);

            // Initialize holdings with current prices (will be updated when quotes load)
            setHoldings(INITIAL_HOLDINGS.map(h => ({
                ...h,
                currentPrice: 0,
            })));

            setIsInitialLoading(false);
        };

        loadInitialData();
    }, [fetchQuotes]);

    // Update holdings with current prices when quotes change
    useEffect(() => {
        setHoldings(prev => prev.map(h => ({
            ...h,
            currentPrice: quotes[h.cryptoId]?.price || h.currentPrice,
        })));
    }, [quotes]);

    // Auto-refresh every 60 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            const allSymbols = [
                ...Object.keys(quotes),
                ...holdings.map(h => h.cryptoId),
                ...watchlist.map(w => w.cryptoId),
            ];
            const uniqueSymbols = [...new Set(allSymbols)];
            if (uniqueSymbols.length > 0) {
                fetchQuotes(uniqueSymbols);
            }
        }, REFRESH_INTERVAL_MS); // 5 minutes

        return () => clearInterval(interval);
    }, [fetchQuotes, quotes, holdings, watchlist]);

    // Manual refresh
    const handleRefresh = async () => {
        setIsRefreshing(true);
        const allSymbols = [
            ...Object.keys(quotes),
            ...holdings.map(h => h.cryptoId),
            ...watchlist.map(w => w.cryptoId),
        ];
        const uniqueSymbols = [...new Set(allSymbols)];
        await fetchQuotes(uniqueSymbols);
        setIsRefreshing(false);
    };

    // Calculate portfolio totals
    const portfolioStats = useMemo(() => {
        let totalValue = 0;
        let totalCost = 0;
        let dayChange = 0;

        holdings.forEach(holding => {
            const quote = quotes[holding.cryptoId];
            if (quote) {
                const currentValue = holding.shares * quote.price;
                const costBasis = holding.shares * holding.avgCost;
                totalValue += currentValue;
                totalCost += costBasis;
                dayChange += holding.shares * quote.change;
            }
        });

        const totalGain = totalValue - totalCost;
        const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;
        const dayChangePercent = totalCost > 0 ? (dayChange / totalCost) * 100 : 0;

        return {
            totalValue,
            totalCost,
            totalGain,
            totalGainPercent,
            dayChange,
            dayChangePercent,
        };
    }, [holdings, quotes]);

    // Add to watchlist
    const addToWatchlist = async (cryptoId: string, name?: string) => {
        if (!watchlist.find(w => w.cryptoId === cryptoId)) {
            const quote = quotes[cryptoId];
            setWatchlist([...watchlist, {
                id: Date.now().toString(),
                cryptoId,
                name: name || quote?.name || cryptoId,
                addedAt: new Date()
            }]);

            // Fetch quote if we don't have it
            if (!quotes[cryptoId]) {
                await fetchQuotes([cryptoId]);
            }
        }
    };

    // Remove from watchlist
    const removeFromWatchlist = (cryptoId: string) => {
        setWatchlist(watchlist.filter(w => w.cryptoId !== cryptoId));
    };

    // Add holding
    const handleAddHolding = async () => {
        if (!selectedid || newHolding.shares <= 0) return;

        const quote = quotes[selectedid];
        const holding: CryptoHolding = {
            id: Date.now().toString(),
            cryptoId: selectedid,
            name: quote?.name || selectedid,
            shares: newHolding.shares,
            avgCost: newHolding.avgCost || quote?.price || 0,
            currentPrice: quote?.price || 0,
            addedAt: new Date(),
        };

        setHoldings([...holdings, holding]);
        setNewHolding({ shares: 0, avgCost: 0 });
        setSelectedid(null);
        setShowAddHoldingModal(false);
        setSearchQuery('');
    };

    // Delete holding
    const deleteHolding = (id: string) => {
        setHoldings(holdings.filter(h => h.id !== id));
    };

    // Add custom crypto by id (fetch from CoinGecko)
    const handleAddCustomStock = async () => {
        if (!customStock.id) return;

        const id = customStock.id.toUpperCase();

        // Fetch real data from CoinGecko
        await fetchQuotes([id]);

        setCustomStock({ id: '', name: '', price: 0 });
        setShowAddCustomStockModal(false);
    };

    // Loading state
    if (isInitialLoading) {
        return (
            <GlassCard intensity="medium" tint="orange" className="p-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 text-orange-400 animate-spin mb-4" />
                    <p className="text-zinc-400">Loading crypto data...</p>
                </div>
            </GlassCard>
        );
    }

    return (
        <GlassCard intensity="medium" tint="orange" className="p-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Market Status Box */}
            <div className={cn(
                "mb-6 p-4 rounded-xl border transition-all",
                marketStatus.isOpen
                    ? "bg-emerald-950/40 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
                    : "bg-zinc-900/60 border-zinc-600/30"
            )}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {/* Market Status Icon */}
                        <div className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center",
                            marketStatus.isOpen
                                ? "bg-emerald-500/20"
                                : "bg-zinc-700/40"
                        )}>
                            {marketStatus.isOpen ? (
                                <Bell className="h-6 w-6 text-emerald-400" />
                            ) : (
                                <BellOff className="h-6 w-6 text-zinc-400" />
                            )}
                        </div>

                        <div>
                            <div className="flex items-center gap-2">
                                <span className={cn(
                                    "text-lg font-semibold",
                                    marketStatus.isOpen ? "text-emerald-400" : "text-zinc-300"
                                )}>
                                    {marketStatus.isOpen ? 'Market Open' : 'Market Closed'}
                                </span>
                                <span className={cn(
                                    "px-2 py-0.5 text-xs font-medium rounded-full",
                                    marketStatus.isOpen
                                        ? "bg-emerald-500/20 text-emerald-400 animate-pulse"
                                        : "bg-zinc-700/50 text-zinc-400"
                                )}>
                                    {marketStatus.isOpen ? 'LIVE' : 'CLOSED'}
                                </span>
                            </div>
                            <p className="text-sm text-zinc-400 mt-0.5">
                                NYSE & NASDAQ • {marketStatus.nyTime} ET
                            </p>
                        </div>
                    </div>

                    <div className="text-right">
                        <p className={cn(
                            "text-sm font-medium",
                            marketStatus.isOpen ? "text-emerald-300" : "text-zinc-400"
                        )}>
                            {marketStatus.statusMessage}
                        </p>
                        <div className="flex items-center gap-2 mt-1 justify-end">
                            {marketStatus.isOpen ? (
                                <Sun className="h-3.5 w-3.5 text-amber-400" />
                            ) : (
                                <Moon className="h-3.5 w-3.5 text-indigo-400" />
                            )}
                            <span className="text-xs text-zinc-500">
                                {marketStatus.isOpen ? 'Regular trading hours' : 'After hours'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Power Hours hint */}
                {marketStatus.isOpen && (
                    <div className="mt-3 pt-3 border-t border-white/5">
                        <div className="flex items-center gap-4 text-xs">
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-amber-400" />
                                <span className="text-zinc-400">Power Hour: 3-4pm ET</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-cyan-400" />
                                <span className="text-zinc-400">Opening Bell: 9:30am ET</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Crypto Converter */}
            <div className="mb-8">
                <CryptoCurrencyConverter />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="text-center flex-1">
                    <h2 className="text-2xl font-semibold text-white">Crypto Portfolio</h2>
                    <p className="text-zinc-400">Real-time data from Yahoo Finance</p>
                </div>
                <div className="flex items-center gap-2">
                    {/* Connection Status */}
                    <div className={cn(
                        "flex items-center gap-1.5 text-xs px-2 py-1 rounded-full",
                        isOnline ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
                    )}>
                        {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                        {isOnline ? 'Live' : 'Offline'}
                    </div>
                    <button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className={cn(
                            "flex items-center gap-2 text-xs bg-orange-500/20 text-orange-300 px-3 py-1.5 rounded-lg hover:bg-orange-500/30 transition-colors border border-orange-500/30",
                            isRefreshing && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        <RefreshCw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Error Banner */}
            {error && (
                <div className="flex items-center gap-2 p-3 mb-6 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <AlertCircle className="h-4 w-4 text-amber-400 flex-shrink-0" />
                    <p className="text-sm text-amber-300">{error}</p>
                </div>
            )}

            {/* Portfolio Summary */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                <GlassCard className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="h-4 w-4 text-orange-400" />
                        <span className="text-sm text-zinc-400">Portfolio Value</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{currency.format(portfolioStats.totalValue)}</p>
                    <p className="text-xs text-zinc-500 mt-1">Across {holdings.length} positions</p>
                </GlassCard>

                <GlassCard className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                        <Percent className="h-4 w-4 text-white" />
                        <span className="text-sm text-zinc-400">Total Gain/Loss</span>
                    </div>
                    <p className={cn(
                        "text-2xl font-bold",
                        portfolioStats.totalGain >= 0 ? "text-emerald-400" : "text-rose-400"
                    )}>
                        {portfolioStats.totalGain >= 0 ? '+' : ''}{currency.format(portfolioStats.totalGain)}
                    </p>
                    <p className={cn(
                        "text-xs mt-1",
                        portfolioStats.totalGainPercent >= 0 ? "text-emerald-500" : "text-rose-500"
                    )}>
                        {portfolioStats.totalGainPercent >= 0 ? '+' : ''}{portfolioStats.totalGainPercent.toFixed(2)}% all time
                    </p>
                </GlassCard>

                <GlassCard className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                        <Activity className="h-4 w-4 text-cyan-400" />
                        <span className="text-sm text-zinc-400">Today&apos;s Change</span>
                    </div>
                    <p className={cn(
                        "text-2xl font-bold",
                        portfolioStats.dayChange >= 0 ? "text-emerald-400" : "text-rose-400"
                    )}>
                        {portfolioStats.dayChange >= 0 ? '+' : ''}{currency.format(portfolioStats.dayChange)}
                    </p>
                    <p className={cn(
                        "text-xs mt-1",
                        portfolioStats.dayChangePercent >= 0 ? "text-emerald-500" : "text-rose-500"
                    )}>
                        {portfolioStats.dayChangePercent >= 0 ? '+' : ''}{portfolioStats.dayChangePercent.toFixed(2)}% today
                    </p>
                </GlassCard>

                <GlassCard className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4 text-zinc-400" />
                        <span className="text-sm text-zinc-400">Last Updated</span>
                    </div>
                    <p className="text-lg font-medium text-white">
                        {lastRefresh ? lastRefresh.toLocaleTimeString() : '--:--:--'}
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">Auto-refresh every 5min</p>
                </GlassCard>
            </div>

            {/* Search & Add crypto */}
            <GlassCard className="p-5 mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-white">Search cryptos</h3>
                        <InfoTooltip text="Search any crypto by ticker or name. Powered by Yahoo Finance." />
                        <span className="text-xs text-zinc-500 bg-zinc-800/50 px-2 py-0.5 rounded-full">
                            {Object.keys(quotes).length} loaded
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => {
                                setShowBrowseModal(true);
                                fetchTrendingStocks();
                            }}
                            className="flex items-center gap-1.5 text-xs bg-cyan-500/20 text-cyan-300 px-3 py-1.5 rounded-lg hover:bg-cyan-500/30 transition-colors border border-cyan-500/30"
                        >
                            <BarChart3 className="h-3.5 w-3.5" />
                            Browse All
                        </button>
                        <button
                            onClick={() => setShowAddCustomStockModal(true)}
                            className="flex items-center gap-1.5 text-xs bg-purple-500/20 text-purple-300 px-3 py-1.5 rounded-lg hover:bg-purple-500/30 transition-colors border border-purple-500/30"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            Add by id
                        </button>
                    </div>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
                        placeholder="Search any crypto (bitcoin, TSLA, Bitcoin, etc...)"
                        className="w-full pl-10 pr-4 py-3 bg-zinc-900/50 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500/50"
                    />
                    {isSearching && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-orange-400 animate-spin" />
                    )}
                </div>
            </GlassCard>

            {/* Search Results Modal */}
            {searchResults.length > 0 && (
                <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/40 backdrop-blur-sm" onClick={() => setSearchQuery('')}>
                    <GlassCard className="w-full max-w-2xl m-4 max-h-[60vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="p-4 border-b border-white/10">
                            <div className="flex items-center justify-between">
                                <h3 className="text-base font-semibold text-white">
                                    Search Results for &quot;{searchQuery}&quot;
                                    <span className="text-xs text-zinc-500 ml-2">({searchResults.length} found)</span>
                                </h3>
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="text-zinc-400 hover:text-white transition-colors"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                        <div className="overflow-y-auto max-h-[50vh]">
                            {searchResults.map(result => {
                                const quote = quotes[result.id];
                                const inWatchlist = watchlist.some(w => w.id === result.id);
                                const inHoldings = holdings.some(h => h.id === result.id);

                                return (
                                    <div
                                        key={result.id}
                                        className="flex items-center justify-between p-4 hover:bg-white/5 border-b border-white/5 last:border-b-0"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                                                <span className="text-orange-400 text-xs font-bold">{result.id.slice(0, 2)}</span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-white">{result.id}</p>
                                                <p className="text-xs text-zinc-500">{result.name}</p>
                                                {result.exchange && (
                                                    <p className="text-xs text-zinc-600">{result.exchange}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {quote && (
                                                <div className="text-right mr-3">
                                                    <p className="text-sm font-medium text-white">{currency.format(quote.price)}</p>
                                                    <p className={cn(
                                                        "text-xs",
                                                        quote.change >= 0 ? "text-emerald-400" : "text-rose-400"
                                                    )}>
                                                        {quote.change >= 0 ? '+' : ''}{quote.changePercent.toFixed(2)}%
                                                    </p>
                                                </div>
                                            )}
                                            <button
                                                onClick={() => {
                                                    if (inWatchlist) {
                                                        removeFromWatchlist(result.id);
                                                    } else {
                                                        addToWatchlist(result.id, result.name);
                                                    }
                                                }}
                                                className={cn(
                                                    "p-2 rounded-lg transition-colors",
                                                    inWatchlist ? "bg-yellow-500/20 text-yellow-400" : "bg-white/5 text-zinc-400 hover:text-yellow-400"
                                                )}
                                            >
                                                {inWatchlist ? <Star className="h-4 w-4 fill-current" /> : <StarOff className="h-4 w-4" />}
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    setSelectedid(result.id);
                                                    setShowAddHoldingModal(true);
                                                    setSearchQuery('');
                                                    // Fetch quote for this id if we don't have it
                                                    if (!quotes[result.id]) {
                                                        await fetchQuotes([result.id]);
                                                    }
                                                }}
                                                disabled={inHoldings}
                                                className={cn(
                                                    "p-2 rounded-lg transition-colors",
                                                    inHoldings
                                                        ? "bg-zinc-800/50 text-zinc-600 cursor-not-allowed"
                                                        : "bg-orange-500/20 text-orange-400 hover:bg-orange-500/30"
                                                )}
                                            >
                                                <Plus className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </GlassCard>
                </div>
            )}

            {/* My Holdings */}
            <GlassCard className="p-5 mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-orange-400" />
                        <h3 className="text-base font-semibold text-white">My Holdings</h3>
                        <InfoTooltip text="Click any crypto to view detailed chart, stats, and news" />
                    </div>
                    <span className="text-xs text-zinc-500">{holdings.length} positions</span>
                </div>

                {holdings.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-zinc-500">No holdings yet. Search and add cryptos to your portfolio.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {holdings.map(holding => {
                            const quote = quotes[holding.cryptoId];
                            const currentValue = holding.shares * (quote?.price || holding.currentPrice);
                            const costBasis = holding.shares * holding.avgCost;
                            const gain = currentValue - costBasis;
                            const gainPercent = (gain / costBasis) * 100;
                            const isExpanded = expandedid === holding.cryptoId;
                            const isPositive = gain >= 0;
                            const cryptoInfo = getCryptoInfo(holding.cryptoId);

                            return (
                                <div key={holding.id} className="space-y-0">
                                    <div
                                        className={cn(
                                            "relative overflow-hidden rounded-xl border transition-all duration-300 group cursor-pointer",
                                            isExpanded
                                                ? "border-orange-500/40 bg-gradient-to-br from-orange-950/30 via-zinc-900/40 to-zinc-900/40 shadow-[0_0_30px_rgba(163,230,53,0.15)] rounded-b-none"
                                                : "border-zinc-800/60 bg-zinc-900/40 hover:border-zinc-700/70 hover:bg-zinc-900/60"
                                        )}
                                        onClick={() => toggleExpandedStock(holding.cryptoId)}
                                    >
                                        {/* Subtle gradient overlay */}
                                        <div className={cn(
                                            "absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none",
                                            isPositive ? "from-emerald-500/5 to-transparent" : "from-rose-500/5 to-transparent"
                                        )} />

                                        <div className="relative p-5">
                                            {/* Top Row: id & Price Action */}
                                            <div className="flex items-center justify-between mb-4">
                                                {/* Left: id & Name */}
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className={cn(
                                                            "w-14 h-14 text-2xl",
                                                            getCryptoBadgeClasses(cryptoInfo.symbol, isPositive)
                                                        )}
                                                    >
                                                        {getCryptoGlyph(cryptoInfo.symbol)}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="text-base font-semibold text-white tracking-tight">{cryptoInfo.displayName}</h4>
                                                            <span className="text-xs text-zinc-500">({cryptoInfo.symbol})</span>
                                                            {isExpanded ? (
                                                                <ChevronUp className="h-4 w-4 text-orange-400" />
                                                            ) : (
                                                                <ChevronDown className="h-4 w-4 text-zinc-500 group-hover:text-zinc-400" />
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-zinc-500 mt-0.5">{cryptoInfo.type} • {holding.shares} units</p>
                                                    </div>
                                                </div>

                                                {/* Right: Current Price & Change (leave room for delete button) */}
                                                <div className="text-right pr-8 sm:pr-10">
                                                    <div className="text-xl font-bold text-white mb-1">
                                                        {currency.format(quote?.price || holding.currentPrice)}
                                                    </div>
                                                    <div className={cn(
                                                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                                                        (quote?.change || 0) >= 0
                                                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                                                            : "bg-rose-500/15 text-rose-400 border border-rose-500/20"
                                                    )}>
                                                        {(quote?.change || 0) >= 0 ? (
                                                            <ArrowUpRight className="h-3 w-3" />
                                                        ) : (
                                                            <ArrowDownRight className="h-3 w-3" />
                                                        )}
                                                        {(quote?.change || 0) >= 0 ? '+' : ''}{(quote?.changePercent || 0).toFixed(2)}%
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Bottom Row: Stats Grid */}
                                            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-zinc-800/60">
                                                {/* Avg Cost */}
                                                <div>
                                                    <p className="text-xs text-zinc-500 mb-1">Avg Cost</p>
                                                    <p className="text-sm font-medium text-zinc-300">{currency.format(holding.avgCost)}</p>
                                                </div>

                                                {/* Total Value */}
                                                <div>
                                                    <p className="text-xs text-zinc-500 mb-1">Total Value</p>
                                                    <p className="text-sm font-medium text-white">{currency.format(currentValue)}</p>
                                                </div>

                                                {/* Gain/Loss */}
                                                <div className="text-right">
                                                    <p className="text-xs text-zinc-500 mb-1">Gain/Loss</p>
                                                    <div>
                                                        <p className={cn(
                                                            "text-sm font-bold",
                                                            isPositive ? "text-emerald-400" : "text-rose-400"
                                                        )}>
                                                            {isPositive ? '+' : ''}{currency.format(gain)}
                                                        </p>
                                                        <p className={cn(
                                                            "text-xs font-medium mt-0.5",
                                                            isPositive ? "text-emerald-500" : "text-rose-500"
                                                        )}>
                                                            {isPositive ? '+' : ''}{gainPercent.toFixed(2)}%
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Delete Button - docked in top-right, without covering text */}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); deleteHolding(holding.id); }}
                                                className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1.5 bg-rose-500/15 hover:bg-rose-500/30 rounded-full transition-all border border-rose-500/40 shadow-lg"
                                                aria-label={`Remove ${cryptoInfo.displayName} from holdings`}
                                            >
                                                <Trash2 className="h-3.5 w-3.5 text-rose-300" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Expanded Detail View */}
                                    {isExpanded && (
                                        <div className="bg-zinc-900/50 border border-t-0 border-orange-500/30 rounded-b-xl p-4 animate-in slide-in-from-top-2 duration-200">
                                            {isLoadingDetail ? (
                                                <div className="flex items-center justify-center py-8">
                                                    <Loader2 className="h-6 w-6 text-orange-400 animate-spin" />
                                                    <span className="ml-2 text-zinc-400">Loading details...</span>
                                                </div>
                                            ) : CryptoDetail?.quote ? (
                                                <div className="space-y-4">
                                                    {/* Chart Timeframe Selector */}
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <LineChart className="h-4 w-4 text-orange-400" />
                                                            <span className="text-sm font-medium text-white">Price Chart</span>
                                                        </div>
                                                        <div className="flex gap-1">
                                                            {(['1D', '1W', '1M', '3M', '1Y'] as ChartTimeframe[]).map(tf => (
                                                                <button
                                                                    key={tf}
                                                                    onClick={() => setChartTimeframe(tf)}
                                                                    className={cn(
                                                                        "px-2.5 py-1 text-xs rounded-lg transition-colors",
                                                                        chartTimeframe === tf
                                                                            ? "bg-orange-500/20 text-orange-300 border border-orange-500/30"
                                                                            : "bg-zinc-800/50 text-zinc-400 hover:text-white"
                                                                    )}
                                                                >
                                                                    {tf}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Mini Chart */}
                                                    <div className="h-32 bg-zinc-900/30 rounded-xl border border-white/5 p-3">
                                                        {CryptoDetail.charts[chartTimeframe]?.length > 0 ? (
                                                            <MiniChart data={CryptoDetail.charts[chartTimeframe]} isPositive={(CryptoDetail.quote?.change || 0) >= 0} />
                                                        ) : (
                                                            <div className="flex items-center justify-center h-full text-zinc-500 text-sm">
                                                                No chart data available for {chartTimeframe}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Key Stats Grid */}
                                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                        <div className="bg-zinc-900/30 rounded-lg p-3 border border-white/5">
                                                            <p className="text-xs text-zinc-500">Market Cap</p>
                                                            <p className="text-sm font-medium text-white">
                                                                {CryptoDetail.quote.marketCap ? compactCurrency.format(CryptoDetail.quote.marketCap) : 'N/A'}
                                                            </p>
                                                        </div>
                                                        <div className="bg-zinc-900/30 rounded-lg p-3 border border-white/5">
                                                            <p className="text-xs text-zinc-500">P/E Ratio</p>
                                                            <p className="text-sm font-medium text-white">
                                                                {CryptoDetail.quote.pe?.toFixed(2) || 'N/A'}
                                                            </p>
                                                        </div>
                                                        <div className="bg-zinc-900/30 rounded-lg p-3 border border-white/5">
                                                            <p className="text-xs text-zinc-500">52W High</p>
                                                            <p className="text-sm font-medium text-emerald-400">
                                                                {currency.format(CryptoDetail.quote.fiftyTwoWeekHigh || 0)}
                                                            </p>
                                                        </div>
                                                        <div className="bg-zinc-900/30 rounded-lg p-3 border border-white/5">
                                                            <p className="text-xs text-zinc-500">52W Low</p>
                                                            <p className="text-sm font-medium text-rose-400">
                                                                {currency.format(CryptoDetail.quote.fiftyTwoWeekLow || 0)}
                                                            </p>
                                                        </div>
                                                        <div className="bg-zinc-900/30 rounded-lg p-3 border border-white/5">
                                                            <p className="text-xs text-zinc-500">Open</p>
                                                            <p className="text-sm font-medium text-white">
                                                                {currency.format(CryptoDetail.quote.open || 0)}
                                                            </p>
                                                        </div>
                                                        <div className="bg-zinc-900/30 rounded-lg p-3 border border-white/5">
                                                            <p className="text-xs text-zinc-500">Day Range</p>
                                                            <p className="text-sm font-medium text-white">
                                                                {currency.format(CryptoDetail.quote.low || 0)} - {currency.format(CryptoDetail.quote.high || 0)}
                                                            </p>
                                                        </div>
                                                        <div className="bg-zinc-900/30 rounded-lg p-3 border border-white/5">
                                                            <p className="text-xs text-zinc-500">Volume</p>
                                                            <p className="text-sm font-medium text-white">
                                                                {(CryptoDetail.quote.volume / 1e6).toFixed(2)}M
                                                            </p>
                                                        </div>
                                                        <div className="bg-zinc-900/30 rounded-lg p-3 border border-white/5">
                                                            <p className="text-xs text-zinc-500">Avg Volume</p>
                                                            <p className="text-sm font-medium text-white">
                                                                {CryptoDetail.quote.avgVolume ? (CryptoDetail.quote.avgVolume / 1e6).toFixed(2) + 'M' : 'N/A'}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Analyst Info */}
                                                    {CryptoDetail.insights && (
                                                        <div className="bg-zinc-900/30 rounded-lg p-3 border border-white/5">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <Building2 className="h-4 w-4 text-purple-400" />
                                                                <span className="text-sm font-medium text-white">Analyst Insights</span>
                                                            </div>
                                                            <div className="flex items-center gap-4">
                                                                {CryptoDetail.insights.recommendation && (
                                                                    <div className={cn(
                                                                        "px-3 py-1 rounded-full text-xs font-medium",
                                                                        CryptoDetail.insights.recommendation.toLowerCase().includes('buy') ? "bg-emerald-500/20 text-emerald-400" :
                                                                            CryptoDetail.insights.recommendation.toLowerCase().includes('sell') ? "bg-rose-500/20 text-rose-400" :
                                                                                "bg-amber-500/20 text-amber-400"
                                                                    )}>
                                                                        {CryptoDetail.insights.recommendation}
                                                                    </div>
                                                                )}
                                                                {CryptoDetail.insights.targetPrice && (
                                                                    <div className="text-sm">
                                                                        <span className="text-zinc-500">Target: </span>
                                                                        <span className="text-white font-medium">{currency.format(CryptoDetail.insights.targetPrice)}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* News Section */}
                                                    {CryptoDetail && Array.isArray(CryptoDetail.news) && CryptoDetail.news.length > 0 && (
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-3">
                                                                <Newspaper className="h-4 w-4 text-cyan-400" />
                                                                <span className="text-sm font-medium text-white">Latest News</span>
                                                            </div>
                                                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                                                {CryptoDetail.news.slice(0, 5).map((news, idx) => (
                                                                    <a
                                                                        key={idx}
                                                                        href={news.link}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="flex items-start gap-3 p-2 rounded-lg bg-zinc-800/30 hover:bg-zinc-800/50 transition-colors group"
                                                                    >
                                                                        {news.thumbnail && (
                                                                            <img
                                                                                src={news.thumbnail}
                                                                                alt=""
                                                                                className="w-16 h-12 rounded object-cover flex-shrink-0"
                                                                            />
                                                                        )}
                                                                        <div className="flex-1 min-w-0">
                                                                            <p className="text-xs text-white line-clamp-2 group-hover:text-orange-300 transition-colors">
                                                                                {news.title}
                                                                            </p>
                                                                            <div className="flex items-center gap-2 mt-1">
                                                                                <span className="text-xs text-zinc-500">{news.publisher}</span>
                                                                                <span className="text-xs text-zinc-600">•</span>
                                                                                <span className="text-xs text-zinc-500">
                                                                                    {new Date(news.publishedAt * 1000).toLocaleDateString()}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                        <ExternalLink className="h-3 w-3 text-zinc-600 group-hover:text-orange-400 flex-shrink-0" />
                                                                    </a>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="text-center py-4 text-zinc-500">
                                                    Unable to load crypto details
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </GlassCard>

            {/* Watchlist */}
            <GlassCard className="p-5 mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-400" />
                        <h3 className="text-base font-semibold text-white">Watchlist</h3>
                        <InfoTooltip text="Click any crypto to view detailed chart, stats, and news" />
                    </div>
                    <span className="text-xs text-zinc-500">{watchlist.length} cryptos</span>
                </div>

                {watchlist.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-zinc-500">Your watchlist is empty. Star cryptos to track them here.</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {watchlist.map(item => {
                            const quote = quotes[item.id];
                            const isUp = (quote?.change || 0) >= 0;
                            const isExpanded = expandedid === item.id;

                            return (
                                <div key={item.id} className="space-y-0">
                                    <div
                                        className={cn(
                                            "flex items-center justify-between p-4 rounded-xl bg-zinc-900/30 border transition-all group cursor-pointer",
                                            isExpanded ? "border-yellow-500/30 rounded-b-none" : "border-white/5 hover:border-white/10"
                                        )}
                                        onClick={() => toggleExpandedStock(item.id)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "w-10 h-10 rounded-lg flex items-center justify-center",
                                                isUp ? "bg-emerald-500/20" : "bg-rose-500/20"
                                            )}>
                                                {isUp ? (
                                                    <TrendingUp className="h-5 w-5 text-emerald-400" />
                                                ) : (
                                                    <TrendingDown className="h-5 w-5 text-rose-400" />
                                                )}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-1">
                                                    <p className="text-sm font-medium text-white">{item.id}</p>
                                                    {isExpanded ? (
                                                        <ChevronUp className="h-3.5 w-3.5 text-yellow-400" />
                                                    ) : (
                                                        <ChevronDown className="h-3.5 w-3.5 text-zinc-500" />
                                                    )}
                                                </div>
                                                <p className="text-xs text-zinc-500">{currency.format(quote?.price || 0)}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="text-right">
                                                <p className={cn(
                                                    "text-sm font-medium",
                                                    isUp ? "text-emerald-400" : "text-rose-400"
                                                )}>
                                                    {isUp ? '+' : ''}{(quote?.changePercent || 0).toFixed(2)}%
                                                </p>
                                            </div>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); removeFromWatchlist(item.id); }}
                                                className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-rose-500/20 rounded-lg transition-all"
                                            >
                                                <Trash2 className="h-3.5 w-3.5 text-rose-400" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Expanded Detail View for Watchlist */}
                                    {isExpanded && (
                                        <div className="bg-zinc-900/50 border border-t-0 border-yellow-500/30 rounded-b-xl p-4 animate-in slide-in-from-top-2 duration-200">
                                            {isLoadingDetail ? (
                                                <div className="flex items-center justify-center py-8">
                                                    <Loader2 className="h-6 w-6 text-yellow-400 animate-spin" />
                                                    <span className="ml-2 text-zinc-400">Loading details...</span>
                                                </div>
                                            ) : CryptoDetail?.quote ? (
                                                <div className="space-y-4">
                                                    {/* Chart Timeframe Selector */}
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <LineChart className="h-4 w-4 text-yellow-400" />
                                                            <span className="text-sm font-medium text-white">Price Chart</span>
                                                        </div>
                                                        <div className="flex gap-1">
                                                            {(['1D', '1W', '1M', '3M', '1Y'] as ChartTimeframe[]).map(tf => (
                                                                <button
                                                                    key={tf}
                                                                    onClick={() => setChartTimeframe(tf)}
                                                                    className={cn(
                                                                        "px-2.5 py-1 text-xs rounded-lg transition-colors",
                                                                        chartTimeframe === tf
                                                                            ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
                                                                            : "bg-zinc-800/50 text-zinc-400 hover:text-white"
                                                                    )}
                                                                >
                                                                    {tf}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Mini Chart */}
                                                    <div className="h-32 bg-zinc-900/30 rounded-xl border border-white/5 p-3">
                                                        {CryptoDetail.charts[chartTimeframe]?.length > 0 ? (
                                                            <MiniChart data={CryptoDetail.charts[chartTimeframe]} isPositive={(CryptoDetail.quote?.change || 0) >= 0} />
                                                        ) : (
                                                            <div className="flex items-center justify-center h-full text-zinc-500 text-sm">
                                                                No chart data available for {chartTimeframe}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Key Stats Grid */}
                                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                        <div className="bg-zinc-900/30 rounded-lg p-3 border border-white/5">
                                                            <p className="text-xs text-zinc-500">Market Cap</p>
                                                            <p className="text-sm font-medium text-white">
                                                                {CryptoDetail.quote.marketCap ? compactCurrency.format(CryptoDetail.quote.marketCap) : 'N/A'}
                                                            </p>
                                                        </div>
                                                        <div className="bg-zinc-900/30 rounded-lg p-3 border border-white/5">
                                                            <p className="text-xs text-zinc-500">P/E Ratio</p>
                                                            <p className="text-sm font-medium text-white">
                                                                {CryptoDetail.quote.pe?.toFixed(2) || 'N/A'}
                                                            </p>
                                                        </div>
                                                        <div className="bg-zinc-900/30 rounded-lg p-3 border border-white/5">
                                                            <p className="text-xs text-zinc-500">52W High</p>
                                                            <p className="text-sm font-medium text-emerald-400">
                                                                {currency.format(CryptoDetail.quote.fiftyTwoWeekHigh || 0)}
                                                            </p>
                                                        </div>
                                                        <div className="bg-zinc-900/30 rounded-lg p-3 border border-white/5">
                                                            <p className="text-xs text-zinc-500">52W Low</p>
                                                            <p className="text-sm font-medium text-rose-400">
                                                                {currency.format(CryptoDetail.quote.fiftyTwoWeekLow || 0)}
                                                            </p>
                                                        </div>
                                                        <div className="bg-zinc-900/30 rounded-lg p-3 border border-white/5">
                                                            <p className="text-xs text-zinc-500">Volume</p>
                                                            <p className="text-sm font-medium text-white">
                                                                {((CryptoDetail.quote.volume || 0) / 1e6).toFixed(2)}M
                                                            </p>
                                                        </div>
                                                        <div className="bg-zinc-900/30 rounded-lg p-3 border border-white/5">
                                                            <p className="text-xs text-zinc-500">Prev Close</p>
                                                            <p className="text-sm font-medium text-white">
                                                                {currency.format(CryptoDetail.quote.previousClose || 0)}
                                                            </p>
                                                        </div>
                                                        <div className="bg-zinc-900/30 rounded-lg p-3 border border-white/5">
                                                            <p className="text-xs text-zinc-500">EPS</p>
                                                            <p className="text-sm font-medium text-white">
                                                                {CryptoDetail.quote.eps?.toFixed(2) || 'N/A'}
                                                            </p>
                                                        </div>
                                                        <div className="bg-zinc-900/30 rounded-lg p-3 border border-white/5">
                                                            <p className="text-xs text-zinc-500">Beta</p>
                                                            <p className="text-sm font-medium text-white">
                                                                {CryptoDetail.quote.beta?.toFixed(2) || 'N/A'}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* News Section */}
                                                    {CryptoDetail.news.length > 0 && (
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-3">
                                                                <Newspaper className="h-4 w-4 text-cyan-400" />
                                                                <span className="text-sm font-medium text-white">Latest News</span>
                                                            </div>
                                                            <div className="space-y-2 max-h-40 overflow-y-auto">
                                                                {CryptoDetail.news.slice(0, 4).map((news, idx) => (
                                                                    <a
                                                                        key={idx}
                                                                        href={news.link}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="flex items-start gap-3 p-2 rounded-lg bg-zinc-800/30 hover:bg-zinc-800/50 transition-colors group"
                                                                        onClick={(e) => e.stopPropagation()}
                                                                    >
                                                                        <div className="flex-1 min-w-0">
                                                                            <p className="text-xs text-white line-clamp-2 group-hover:text-yellow-300 transition-colors">
                                                                                {news.title}
                                                                            </p>
                                                                            <div className="flex items-center gap-2 mt-1">
                                                                                <span className="text-xs text-zinc-500">{news.publisher}</span>
                                                                            </div>
                                                                        </div>
                                                                        <ExternalLink className="h-3 w-3 text-zinc-600 group-hover:text-yellow-400 flex-shrink-0 mt-0.5" />
                                                                    </a>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Add to Holdings button */}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedid(item.id);
                                                            setShowAddHoldingModal(true);
                                                        }}
                                                        className="w-full py-2 bg-orange-500/20 text-orange-300 rounded-lg hover:bg-orange-500/30 transition-colors border border-orange-500/30 text-sm font-medium"
                                                    >
                                                        Add to Portfolio
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="text-center py-4 text-zinc-500">
                                                    Unable to load crypto details
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </GlassCard>

            {/* Data Disclaimer */}
            <div className="flex items-start gap-2 p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
                <Wifi className="h-4 w-4 text-orange-400 mt-0.5 flex-shrink-0" />
                <div>
                    <p className="text-sm text-orange-200">Live Market Data from CoinGecko</p>
                    <p className="text-xs text-orange-400/70 mt-1">
                        crypto prices, charts, and news are fetched in real-time from CoinGecko.
                        <span className="text-amber-300"> Portfolio holdings shown are simulated for demonstration purposes.</span>
                    </p>
                </div>
            </div>

            {/* Browse All cryptos Modal */}
            {showBrowseModal && (
                <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 bg-black/60 backdrop-blur-sm" onClick={() => setShowBrowseModal(false)}>
                    <GlassCard className="w-full max-w-3xl m-4 max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="p-4 border-b border-white/10 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-white">Browse cryptos</h3>
                                <p className="text-sm text-zinc-400">Trending and popular cryptos from CoinGecko</p>
                            </div>
                            <button
                                onClick={() => setShowBrowseModal(false)}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <X className="h-5 w-5 text-zinc-400" />
                            </button>
                        </div>

                        <div className="p-4 overflow-y-auto max-h-[calc(80vh-100px)]">
                            {/* Loaded cryptos Section */}
                            <div className="mb-6">
                                <h4 className="text-sm font-medium text-zinc-400 mb-3 flex items-center gap-2">
                                    <BarChart3 className="h-4 w-4 text-orange-400" />
                                    Loaded cryptos ({Object.keys(quotes).length})
                                </h4>
                                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                    {Object.entries(quotes).map(([id, quote]) => {
                                        const isUp = (quote?.change || 0) >= 0;
                                        const inWatchlist = watchlist.some(w => w.id === id);
                                        const inHoldings = holdings.some(h => h.id === id);

                                        return (
                                            <div
                                                key={id}
                                                className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/30 border border-white/5 hover:border-white/10 transition-all group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "w-9 h-9 rounded-lg flex items-center justify-center",
                                                        isUp ? "bg-emerald-500/20" : "bg-rose-500/20"
                                                    )}>
                                                        {isUp ? (
                                                            <ArrowUpRight className="h-4 w-4 text-emerald-400" />
                                                        ) : (
                                                            <ArrowDownRight className="h-4 w-4 text-rose-400" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-white">{id}</p>
                                                        <p className="text-xs text-zinc-500 truncate max-w-[100px]">{quote?.name}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="text-right">
                                                        <p className="text-sm text-white">{currency.format(quote?.price || 0)}</p>
                                                        <p className={cn(
                                                            "text-xs",
                                                            isUp ? "text-emerald-400" : "text-rose-400"
                                                        )}>
                                                            {isUp ? '+' : ''}{(quote?.changePercent || 0).toFixed(2)}%
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            if (inWatchlist) {
                                                                removeFromWatchlist(id);
                                                            } else {
                                                                addToWatchlist(id, quote?.name);
                                                            }
                                                        }}
                                                        className={cn(
                                                            "p-1.5 rounded-lg transition-colors",
                                                            inWatchlist ? "bg-yellow-500/20 text-yellow-400" : "bg-white/5 text-zinc-500 hover:text-yellow-400"
                                                        )}
                                                    >
                                                        {inWatchlist ? <Star className="h-3.5 w-3.5 fill-current" /> : <StarOff className="h-3.5 w-3.5" />}
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedid(id);
                                                            setShowAddHoldingModal(true);
                                                            setShowBrowseModal(false);
                                                        }}
                                                        disabled={inHoldings}
                                                        className={cn(
                                                            "p-1.5 rounded-lg transition-colors",
                                                            inHoldings
                                                                ? "bg-zinc-800/50 text-zinc-600 cursor-not-allowed"
                                                                : "bg-orange-500/20 text-orange-400 hover:bg-orange-500/30"
                                                        )}
                                                    >
                                                        <Plus className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Trending Section */}
                            {trendingStocks.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-medium text-zinc-400 mb-3 flex items-center gap-2">
                                        <TrendingUp className="h-4 w-4 text-cyan-400" />
                                        Trending Now
                                    </h4>
                                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                        {trendingStocks.filter(t => !quotes[t.id]).map((crypto) => (
                                            <div
                                                key={crypto.id}
                                                className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/30 border border-white/5 hover:border-white/10 transition-all"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                                                        <span className="text-cyan-400 text-xs font-bold">{crypto.id.slice(0, 2)}</span>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-white">{crypto.id}</p>
                                                        <p className="text-xs text-zinc-500 truncate max-w-[100px]">{crypto.name}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={async () => {
                                                        await fetchQuotes([crypto.id]);
                                                    }}
                                                    className="px-2 py-1 text-xs bg-cyan-500/20 text-cyan-300 rounded-lg hover:bg-cyan-500/30 transition-colors"
                                                >
                                                    Load
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </GlassCard>
                </div>
            )}

            {/* Add Holding Modal */}
            {showAddHoldingModal && selectedid && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <GlassCard className="w-full max-w-md p-6 m-4">
                        <h3 className="text-lg font-semibold text-white mb-4">
                            Add {selectedid} to Portfolio
                        </h3>

                        <div className="flex items-center gap-4 p-4 bg-zinc-900/50 rounded-xl mb-4">
                            <div className="w-12 h-12 rounded-lg bg-orange-500/20 flex items-center justify-center">
                                <span className="text-orange-400 font-bold">{selectedid.slice(0, 2)}</span>
                            </div>
                            <div>
                                <p className="text-base font-medium text-white">{selectedid}</p>
                                <p className="text-sm text-zinc-400">{quotes[selectedid]?.name}</p>
                                <p className="text-sm text-orange-400">{currency.format(quotes[selectedid]?.price || 0)}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-zinc-400 mb-1">Number of Shares *</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.001"
                                    value={newHolding.shares || ''}
                                    onChange={(e) => setNewHolding({ ...newHolding, shares: parseFloat(e.target.value) || 0 })}
                                    placeholder="10"
                                    className="w-full px-3 py-2 bg-zinc-900/50 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500/50"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-zinc-400 mb-1">Average Cost Per Share</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={newHolding.avgCost || ''}
                                    onChange={(e) => setNewHolding({ ...newHolding, avgCost: parseFloat(e.target.value) || 0 })}
                                    placeholder={quotes[selectedid]?.price.toString() || "0.00"}
                                    className="w-full px-3 py-2 bg-zinc-900/50 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500/50"
                                />
                                <p className="text-xs text-zinc-500 mt-1">Leave empty to use current price</p>
                            </div>

                            {newHolding.shares > 0 && (
                                <div className="p-3 bg-zinc-900/30 rounded-lg">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-zinc-400">Total Investment</span>
                                        <span className="text-white font-medium">
                                            {currency.format(newHolding.shares * (newHolding.avgCost || quotes[selectedid]?.price || 0))}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => {
                                    setShowAddHoldingModal(false);
                                    setSelectedid(null);
                                    setNewHolding({ shares: 0, avgCost: 0 });
                                }}
                                className="flex-1 px-4 py-2 bg-zinc-800/50 text-zinc-300 rounded-lg hover:bg-zinc-700/50 transition-colors border border-white/10"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddHolding}
                                disabled={newHolding.shares <= 0}
                                className="flex-1 px-4 py-2 bg-orange-500/20 text-orange-300 rounded-lg hover:bg-orange-500/30 transition-colors border border-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Add to Portfolio
                            </button>
                        </div>
                    </GlassCard>
                </div>
            )}

            {/* Add Custom crypto Modal */}
            {showAddCustomStockModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <GlassCard className="w-full max-w-md p-6 m-4">
                        <h3 className="text-lg font-semibold text-white mb-2">
                            Add crypto by id
                        </h3>
                        <p className="text-sm text-zinc-400 mb-4">
                            Enter a ticker id to fetch real-time data from CoinGecko.
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-zinc-400 mb-1">Ticker id *</label>
                                <input
                                    type="text"
                                    value={customStock.id}
                                    onChange={(e) => setCustomStock({ ...customStock, id: e.target.value.toUpperCase() })}
                                    placeholder="e.g., SHOP, RBLX, SNAP"
                                    className="w-full px-3 py-2 bg-zinc-900/50 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500/50"
                                />
                            </div>

                            {customStock.id && quotes[customStock.id] && (
                                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                                    <p className="text-sm text-emerald-300">
                                        &quot;{customStock.id}&quot; is already loaded: {currency.format(quotes[customStock.id].price)}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => {
                                    setShowAddCustomStockModal(false);
                                    setCustomStock({ id: '', name: '', price: 0 });
                                }}
                                className="flex-1 px-4 py-2 bg-zinc-800/50 text-zinc-300 rounded-lg hover:bg-zinc-700/50 transition-colors border border-white/10"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddCustomStock}
                                disabled={!customStock.id}
                                className="flex-1 px-4 py-2 bg-purple-500/20 text-purple-300 rounded-lg hover:bg-purple-500/30 transition-colors border border-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Fetch & Add
                            </button>
                        </div>
                    </GlassCard>
                </div>
            )}
        </GlassCard>
    );
}



