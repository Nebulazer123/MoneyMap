"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Ticker, TickerSkeleton, TickerData } from "@/components/ui/Ticker";
import { cn } from "@/lib/utils";
import {
    Search,
    TrendingUp,
    TrendingDown,
    RefreshCw,
    Loader2,
    Wifi,
    WifiOff,
    Clock,
    Star,
    Plus,
    X,
    BarChart3,
    DollarSign,
    Activity,
    AlertCircle,
    ChevronRight,
    Building2,
    Flame,
    Target,
    Calendar,
    ArrowUpCircle,
    ArrowDownCircle,
    Zap,
} from "lucide-react";

// ============================================
// TYPES
// ============================================

interface MarketStatus {
    isOpen: boolean;
    status: string;
    nextChange: string;
    timezone: string;
}

interface StockQuote {
    symbol: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
    high?: number;
    low?: number;
    open?: number;
    previousClose?: number;
    volume?: number;
    marketCap?: number;
    fiftyTwoWeekHigh?: number;
    fiftyTwoWeekLow?: number;
}

interface TrendingStock {
    symbol: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
}

interface SearchResult {
    symbol: string;
    name: string;
    exchange?: string;
    type?: string;
}

// Popular tech/growth stocks
const DEFAULT_STOCKS = [
    "AAPL",
    "MSFT",
    "GOOGL",
    "AMZN",
    "NVDA",
    "META",
    "TSLA",
    "AMD",
];

// Sector ETFs for quick reference
const SECTOR_ETFS = [
    { symbol: "SPY", name: "S&P 500" },
    { symbol: "QQQ", name: "NASDAQ 100" },
    { symbol: "DIA", name: "Dow Jones" },
    { symbol: "IWM", name: "Russell 2000" },
    { symbol: "VTI", name: "Total Stock" },
];

// ============================================
// MARKET STATUS HELPER
// ============================================

function getMarketStatus(): MarketStatus {
    const now = new Date();
    const nyTime = new Date(
        now.toLocaleString("en-US", { timeZone: "America/New_York" })
    );
    const day = nyTime.getDay();
    const hours = nyTime.getHours();
    const minutes = nyTime.getMinutes();
    const timeNum = hours * 100 + minutes;

    // Weekend check
    if (day === 0 || day === 6) {
        const daysUntilMonday = day === 0 ? 1 : 2;
        return {
            isOpen: false,
            status: "Weekend",
            nextChange: `Opens Mon ${9}:30 AM ET`,
            timezone: "America/New_York",
        };
    }

    // Market hours: 9:30 AM - 4:00 PM ET
    if (timeNum >= 930 && timeNum < 1600) {
        const closeHour = 16 - hours;
        const closeMin = 60 - minutes;
        return {
            isOpen: true,
            status: "Market Open",
            nextChange: `Closes in ${closeHour}h ${closeMin}m`,
            timezone: "America/New_York",
        };
    }

    // Pre-market: 4:00 AM - 9:30 AM ET
    if (timeNum >= 400 && timeNum < 930) {
        return {
            isOpen: false,
            status: "Pre-Market",
            nextChange: `Opens at 9:30 AM ET`,
            timezone: "America/New_York",
        };
    }

    // After-hours: 4:00 PM - 8:00 PM ET
    if (timeNum >= 1600 && timeNum < 2000) {
        return {
            isOpen: false,
            status: "After-Hours",
            nextChange: `Extended trading until 8:00 PM ET`,
            timezone: "America/New_York",
        };
    }

    // Closed
    return {
        isOpen: false,
        status: "Market Closed",
        nextChange: timeNum < 400 ? "Pre-market at 4:00 AM ET" : "Opens 9:30 AM ET",
        timezone: "America/New_York",
    };
}

// ============================================
// MARKET STATUS COMPONENT
// ============================================

function MarketStatusBar({ status }: { status: MarketStatus }) {
    return (
        <div className="flex items-center gap-4 mb-6 p-4 bg-slate-800/40 rounded-xl border border-slate-700/30">
            <div className="flex items-center gap-2">
                <div
                    className={cn(
                        "w-3 h-3 rounded-full animate-pulse",
                        status.isOpen ? "bg-emerald-500" : "bg-amber-500"
                    )}
                />
                <span className="font-semibold text-white">{status.status}</span>
            </div>
            <div className="text-sm text-zinc-400">
                <Clock className="w-3.5 h-3.5 inline mr-1" />
                {status.nextChange}
            </div>
            <div className="ml-auto flex items-center gap-2 text-xs text-zinc-500">
                <Building2 className="w-3.5 h-3.5" />
                NYSE • NASDAQ
            </div>
        </div>
    );
}

// ============================================
// INDICES COMPONENT
// ============================================

function MarketIndices({
    data,
    isLoading,
}: {
    data: StockQuote[] | null;
    isLoading: boolean;
}) {
    if (isLoading) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="bg-slate-800/50 rounded-xl p-4 animate-pulse">
                        <div className="h-3 w-16 bg-slate-700 rounded mb-2" />
                        <div className="h-6 w-24 bg-slate-700 rounded" />
                    </div>
                ))}
            </div>
        );
    }

    if (!data || data.length === 0) return null;

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
            {data.map((index) => {
                const isPositive = index.changePercent >= 0;
                return (
                    <GlassCard
                        key={index.symbol}
                        intensity="light"
                        tint="slate"
                        className="p-4 hover:bg-slate-700/30 transition-colors cursor-pointer"
                    >
                        <div className="flex items-center gap-2 text-xs text-zinc-400 mb-1">
                            <BarChart3 className="w-3.5 h-3.5" />
                            {index.name}
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-lg font-bold text-white">
                                ${index.price.toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                })}
                            </span>
                            <span
                                className={cn(
                                    "flex items-center text-sm font-mono",
                                    isPositive ? "text-emerald-400" : "text-red-400"
                                )}
                            >
                                {isPositive ? (
                                    <TrendingUp className="w-3.5 h-3.5 mr-1" />
                                ) : (
                                    <TrendingDown className="w-3.5 h-3.5 mr-1" />
                                )}
                                {isPositive ? "+" : ""}
                                {index.changePercent.toFixed(2)}%
                            </span>
                        </div>
                    </GlassCard>
                );
            })}
        </div>
    );
}

// ============================================
// MOVERS COMPONENT (Gainers/Losers/Active)
// ============================================

function MarketMovers({
    gainers,
    losers,
    active,
    isLoading,
    onSelectStock,
}: {
    gainers: StockQuote[];
    losers: StockQuote[];
    active: StockQuote[];
    isLoading: boolean;
    onSelectStock: (symbol: string) => void;
}) {
    const [activeTab, setActiveTab] = useState<"gainers" | "losers" | "active">(
        "gainers"
    );

    const tabs = [
        { id: "gainers" as const, label: "Top Gainers", icon: ArrowUpCircle, color: "text-emerald-400" },
        { id: "losers" as const, label: "Top Losers", icon: ArrowDownCircle, color: "text-red-400" },
        { id: "active" as const, label: "Most Active", icon: Zap, color: "text-amber-400" },
    ];

    const currentData = activeTab === "gainers" ? gainers : activeTab === "losers" ? losers : active;

    return (
        <GlassCard intensity="light" tint="slate" className="p-4 mb-6">
            <div className="flex items-center gap-2 mb-4">
                <Flame className="w-5 h-5 text-orange-400" />
                <h3 className="font-semibold text-white">Market Movers</h3>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-4">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                            activeTab === tab.id
                                ? "bg-slate-700/60 text-white"
                                : "text-zinc-400 hover:text-white hover:bg-slate-700/30"
                        )}
                    >
                        <tab.icon className={cn("w-4 h-4", tab.color)} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="bg-slate-700/30 rounded-xl p-3 animate-pulse">
                            <div className="h-4 w-16 bg-slate-600 rounded mb-2" />
                            <div className="h-5 w-20 bg-slate-600 rounded" />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {currentData.slice(0, 10).map((stock) => {
                        const isPositive = stock.changePercent >= 0;
                        return (
                            <button
                                key={stock.symbol}
                                onClick={() => onSelectStock(stock.symbol)}
                                className="bg-slate-700/30 hover:bg-slate-700/50 rounded-xl p-3 text-left transition-all"
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className="font-bold text-white text-sm">
                                        {stock.symbol}
                                    </span>
                                    <span
                                        className={cn(
                                            "text-xs font-mono",
                                            isPositive ? "text-emerald-400" : "text-red-400"
                                        )}
                                    >
                                        {isPositive ? "+" : ""}
                                        {stock.changePercent.toFixed(1)}%
                                    </span>
                                </div>
                                <div className="text-xs text-zinc-400 truncate">
                                    {stock.name}
                                </div>
                                <div className="text-sm font-mono text-white mt-1">
                                    ${stock.price.toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    })}
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
        </GlassCard>
    );
}

// ============================================
// TRENDING BAR COMPONENT
// ============================================

function TrendingBar({
    trending,
    isLoading,
    onSelect,
}: {
    trending: TrendingStock[];
    isLoading: boolean;
    onSelect: (symbol: string) => void;
}) {
    if (isLoading) {
        return (
            <div className="flex items-center gap-3 mb-6 overflow-x-auto pb-2">
                <span className="text-xs text-zinc-500 flex items-center gap-1 shrink-0">
                    <Flame className="w-3.5 h-3.5" /> Trending:
                </span>
                {Array.from({ length: 6 }).map((_, i) => (
                    <div
                        key={i}
                        className="h-8 w-24 bg-slate-700/50 rounded-lg animate-pulse shrink-0"
                    />
                ))}
            </div>
        );
    }

    if (!trending || trending.length === 0) return null;

    return (
        <div className="flex items-center gap-3 mb-6 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700">
            <span className="text-xs text-zinc-500 flex items-center gap-1 shrink-0">
                <Flame className="w-3.5 h-3.5" /> Trending:
            </span>
            {trending.slice(0, 12).map((stock) => {
                const isPositive = stock.changePercent >= 0;
                return (
                    <button
                        key={stock.symbol}
                        onClick={() => onSelect(stock.symbol)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/60 hover:bg-slate-700/60 rounded-lg transition-colors shrink-0"
                    >
                        <span className="font-bold text-white text-sm">{stock.symbol}</span>
                        <span
                            className={cn(
                                "text-xs font-mono",
                                isPositive ? "text-emerald-400" : "text-red-400"
                            )}
                        >
                            {isPositive ? "+" : ""}
                            {stock.changePercent.toFixed(1)}%
                        </span>
                    </button>
                );
            })}
        </div>
    );
}

// ============================================
// SEARCH MODAL
// ============================================

function SearchModal({
    isOpen,
    onClose,
    onSelect,
}: {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (symbol: string) => void;
}) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const handleSearch = useCallback(async (searchQuery: string) => {
        if (!searchQuery.trim()) {
            setResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const res = await fetch(
                `/api/stocks?search=${encodeURIComponent(searchQuery)}`
            );
            const data = await res.json();
            setResults(data.quotes || []);
        } catch (err) {
            console.error("Search error:", err);
            setResults([]);
        } finally {
            setIsSearching(false);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            handleSearch(query);
        }, 300);
        return () => clearTimeout(timer);
    }, [query, handleSearch]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
                {/* Search Input */}
                <div className="flex items-center gap-3 p-4 border-b border-slate-700">
                    <Search className="w-5 h-5 text-zinc-400" />
                    <input
                        type="text"
                        placeholder="Search stocks, ETFs..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        autoFocus
                        className="flex-1 bg-transparent text-white placeholder-zinc-500 outline-none text-lg"
                    />
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-zinc-400" />
                    </button>
                </div>

                {/* Results */}
                <div className="max-h-80 overflow-y-auto p-2">
                    {isSearching ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 text-zinc-400 animate-spin" />
                        </div>
                    ) : results.length > 0 ? (
                        results.map((result) => (
                            <button
                                key={result.symbol}
                                onClick={() => {
                                    onSelect(result.symbol);
                                    onClose();
                                }}
                                className="w-full flex items-center gap-3 p-3 hover:bg-slate-800 rounded-xl transition-colors"
                            >
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                    <span className="text-white font-bold text-xs">
                                        {result.symbol.slice(0, 2)}
                                    </span>
                                </div>
                                <div className="flex-1 text-left">
                                    <div className="font-semibold text-white">
                                        {result.symbol}
                                    </div>
                                    <div className="text-sm text-zinc-400 truncate">
                                        {result.name}
                                    </div>
                                </div>
                                <div className="text-xs text-zinc-500">
                                    {result.exchange || result.type}
                                </div>
                                <ChevronRight className="w-4 h-4 text-zinc-500" />
                            </button>
                        ))
                    ) : query ? (
                        <div className="text-center py-8 text-zinc-500">
                            No results found for &ldquo;{query}&rdquo;
                        </div>
                    ) : (
                        <div className="p-4">
                            <div className="text-xs text-zinc-500 mb-3">Popular Stocks</div>
                            <div className="flex flex-wrap gap-2">
                                {DEFAULT_STOCKS.map((symbol) => (
                                    <button
                                        key={symbol}
                                        onClick={() => {
                                            onSelect(symbol);
                                            onClose();
                                        }}
                                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-white transition-colors"
                                    >
                                        {symbol}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ============================================
// MAIN STOCKS PAGE
// ============================================

export default function StocksPage() {
    // State
    const [marketStatus, setMarketStatus] = useState<MarketStatus>(getMarketStatus());
    const [indices, setIndices] = useState<StockQuote[]>([]);
    const [watchlist, setWatchlist] = useState<string[]>(DEFAULT_STOCKS);
    const [stocksData, setStocksData] = useState<TickerData[]>([]);
    const [trending, setTrending] = useState<TrendingStock[]>([]);
    const [gainers, setGainers] = useState<StockQuote[]>([]);
    const [losers, setLosers] = useState<StockQuote[]>([]);
    const [active, setActive] = useState<StockQuote[]>([]);
    const [favorites, setFavorites] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(true);
    const [isMoversLoading, setIsMoversLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [isOnline, setIsOnline] = useState(true);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Update market status every minute
    useEffect(() => {
        const interval = setInterval(() => {
            setMarketStatus(getMarketStatus());
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    // Track online status
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);
        setIsOnline(navigator.onLine);
        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    // Fetch market indices
    const fetchIndices = useCallback(async () => {
        try {
            const symbols = SECTOR_ETFS.map((e) => e.symbol).join(",");
            const res = await fetch(`/api/stocks?symbols=${symbols}`);
            const data = await res.json();

            if (data.quotes) {
                const mapped = data.quotes.map((q: StockQuote, i: number) => ({
                    ...q,
                    name: SECTOR_ETFS[i]?.name || q.symbol,
                }));
                setIndices(mapped);
            }
        } catch (err) {
            console.error("Failed to fetch indices:", err);
        }
    }, []);

    // Fetch trending stocks
    const fetchTrending = useCallback(async () => {
        try {
            const res = await fetch(`/api/stocks?trending=true`);
            const data = await res.json();
            setTrending(data.trending || []);
        } catch (err) {
            console.error("Failed to fetch trending:", err);
        }
    }, []);

    // Fetch market movers
    const fetchMovers = useCallback(async () => {
        setIsMoversLoading(true);
        try {
            const [gainersRes, losersRes, activeRes] = await Promise.all([
                fetch(`/api/stocks?action=movers&type=gainers&count=10`),
                fetch(`/api/stocks?action=movers&type=losers&count=10`),
                fetch(`/api/stocks?action=movers&type=active&count=10`),
            ]);

            const [gainersData, losersData, activeData] = await Promise.all([
                gainersRes.json(),
                losersRes.json(),
                activeRes.json(),
            ]);

            setGainers(
                (gainersData.quotes || []).map((q: {
                    symbol: string;
                    shortName?: string;
                    longName?: string;
                    regularMarketPrice: number;
                    regularMarketChange: number;
                    regularMarketChangePercent: number;
                }) => ({
                    symbol: q.symbol,
                    name: q.shortName || q.longName || q.symbol,
                    price: q.regularMarketPrice,
                    change: q.regularMarketChange,
                    changePercent: q.regularMarketChangePercent,
                }))
            );
            setLosers(
                (losersData.quotes || []).map((q: {
                    symbol: string;
                    shortName?: string;
                    longName?: string;
                    regularMarketPrice: number;
                    regularMarketChange: number;
                    regularMarketChangePercent: number;
                }) => ({
                    symbol: q.symbol,
                    name: q.shortName || q.longName || q.symbol,
                    price: q.regularMarketPrice,
                    change: q.regularMarketChange,
                    changePercent: q.regularMarketChangePercent,
                }))
            );
            setActive(
                (activeData.quotes || []).map((q: {
                    symbol: string;
                    shortName?: string;
                    longName?: string;
                    regularMarketPrice: number;
                    regularMarketChange: number;
                    regularMarketChangePercent: number;
                    regularMarketVolume: number;
                }) => ({
                    symbol: q.symbol,
                    name: q.shortName || q.longName || q.symbol,
                    price: q.regularMarketPrice,
                    change: q.regularMarketChange,
                    changePercent: q.regularMarketChangePercent,
                    volume: q.regularMarketVolume,
                }))
            );
        } catch (err) {
            console.error("Failed to fetch movers:", err);
        } finally {
            setIsMoversLoading(false);
        }
    }, []);

    // Fetch watchlist stocks with detailed data
    const fetchWatchlistStocks = useCallback(async () => {
        if (watchlist.length === 0) {
            setStocksData([]);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Fetch quotes for all watchlist stocks with sparkline
            const symbols = watchlist.join(",");
            const res = await fetch(`/api/stocks?symbols=${symbols}&sparkline=true`);
            const data = await res.json();

            if (!data.quotes || data.quotes.length === 0) {
                setError("No stock data available");
                setStocksData([]);
                return;
            }

            // Map to TickerData format
            const tickerData: TickerData[] = data.quotes.map((q: {
                symbol: string;
                name: string;
                price: number;
                change: number;
                changePercent: number;
                high: number;
                low: number;
                volume: number;
                marketCap: number;
                fiftyTwoWeekHigh: number;
                fiftyTwoWeekLow: number;
                sparkline7d?: number[];
                pe?: number;
                eps?: number;
                dividendYield?: number;
                beta?: number;
                exchange?: string;
            }) => ({
                id: q.symbol,
                symbol: q.symbol,
                name: q.name,
                image: undefined, // Stocks don't have logos in our current setup
                price: q.price,
                change: q.change,
                changePercent: q.changePercent,
                high24h: q.high,
                low24h: q.low,
                volume: q.volume,
                marketCap: q.marketCap,
                ath: q.fiftyTwoWeekHigh,
                atl: q.fiftyTwoWeekLow,
                athChangePercent: q.fiftyTwoWeekHigh
                    ? ((q.price - q.fiftyTwoWeekHigh) / q.fiftyTwoWeekHigh) * 100
                    : undefined,
                atlChangePercent: q.fiftyTwoWeekLow
                    ? ((q.price - q.fiftyTwoWeekLow) / q.fiftyTwoWeekLow) * 100
                    : undefined,
                sparkline7d: q.sparkline7d,
                lastUpdated: new Date(),
            }));

            setStocksData(tickerData);
            setLastUpdated(new Date());
        } catch (err) {
            console.error("Failed to fetch stocks:", err);
            setError("Failed to load stock data");
        } finally {
            setIsLoading(false);
        }
    }, [watchlist]);

    // Initial load
    useEffect(() => {
        fetchIndices();
        fetchTrending();
        fetchMovers();
        fetchWatchlistStocks();
    }, [fetchIndices, fetchTrending, fetchMovers, fetchWatchlistStocks]);

    // Auto-refresh (every 60 seconds for stocks)
    useEffect(() => {
        const interval = setInterval(() => {
            if (isOnline) {
                fetchWatchlistStocks();
                fetchIndices();
            }
        }, 60000);
        return () => clearInterval(interval);
    }, [isOnline, fetchWatchlistStocks, fetchIndices]);

    // Handle adding a stock to watchlist
    const handleAddStock = useCallback((symbol: string) => {
        const upperSymbol = symbol.toUpperCase();
        if (!watchlist.includes(upperSymbol)) {
            setWatchlist((prev) => [...prev, upperSymbol]);
        }
    }, [watchlist]);

    // Handle removing from watchlist
    const handleRemoveStock = useCallback((symbol: string) => {
        setWatchlist((prev) => prev.filter((s) => s !== symbol));
    }, []);

    // Handle toggle favorite
    const handleToggleFavorite = useCallback((id: string) => {
        setFavorites((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }, []);

    // Sort stocks: favorites first, then by market cap
    const sortedStocks = useMemo(() => {
        return [...stocksData].sort((a, b) => {
            const aFav = favorites.has(a.id) ? 1 : 0;
            const bFav = favorites.has(b.id) ? 1 : 0;
            if (aFav !== bFav) return bFav - aFav;
            return (b.marketCap || 0) - (a.marketCap || 0);
        });
    }, [stocksData, favorites]);

    return (
        <div className="min-h-screen p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white">Stocks</h1>
                    <p className="text-sm text-zinc-400">
                        Real-time quotes from NYSE & NASDAQ
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Connection status */}
                    <div
                        className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs",
                            isOnline
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "bg-red-500/10 text-red-400"
                        )}
                    >
                        {isOnline ? (
                            <Wifi className="w-3.5 h-3.5" />
                        ) : (
                            <WifiOff className="w-3.5 h-3.5" />
                        )}
                        {isOnline ? "Live" : "Offline"}
                    </div>

                    {/* Last updated */}
                    {lastUpdated && (
                        <span className="text-xs text-zinc-500">
                            Updated {lastUpdated.toLocaleTimeString()}
                        </span>
                    )}

                    {/* Refresh button */}
                    <button
                        onClick={() => {
                            fetchWatchlistStocks();
                            fetchIndices();
                            fetchMovers();
                        }}
                        disabled={isLoading}
                        className="p-2 hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
                    >
                        <RefreshCw
                            className={cn(
                                "w-4 h-4 text-zinc-400",
                                isLoading && "animate-spin"
                            )}
                        />
                    </button>

                    {/* Search button */}
                    <button
                        onClick={() => setIsSearchOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
                    >
                        <Search className="w-4 h-4 text-zinc-400" />
                        <span className="text-sm text-zinc-300">Search</span>
                        <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-xs bg-slate-700 rounded text-zinc-400">
                            /
                        </kbd>
                    </button>
                </div>
            </div>

            {/* Market Status */}
            <MarketStatusBar status={marketStatus} />

            {/* Market Indices */}
            <MarketIndices data={indices} isLoading={indices.length === 0} />

            {/* Trending Bar */}
            <TrendingBar
                trending={trending}
                isLoading={trending.length === 0 && isLoading}
                onSelect={handleAddStock}
            />

            {/* Market Movers */}
            <MarketMovers
                gainers={gainers}
                losers={losers}
                active={active}
                isLoading={isMoversLoading}
                onSelectStock={handleAddStock}
            />

            {/* Error State */}
            {error && (
                <div className="flex items-center gap-3 p-4 mb-6 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                    <span className="text-red-400">{error}</span>
                </div>
            )}

            {/* Watchlist Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-amber-400" />
                    <h2 className="text-lg font-semibold text-white">Your Watchlist</h2>
                    <span className="text-sm text-zinc-500">
                        ({stocksData.length} stocks)
                    </span>
                </div>
                <button
                    onClick={() => setIsSearchOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-zinc-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add Stock
                </button>
            </div>

            {/* Stock Tickers */}
            <div className="space-y-3">
                {isLoading && stocksData.length === 0 ? (
                    // Loading skeletons
                    Array.from({ length: 6 }).map((_, i) => (
                        <TickerSkeleton key={i} />
                    ))
                ) : sortedStocks.length > 0 ? (
                    sortedStocks.map((stock) => (
                        <div key={stock.id} className="relative group">
                            <Ticker
                                data={stock}
                                type="stock"
                                isFavorite={favorites.has(stock.id)}
                                onToggleFavorite={handleToggleFavorite}
                                showSparkline={!!stock.sparkline7d && stock.sparkline7d.length > 1}
                            />
                            {/* Remove button */}
                            <button
                                onClick={() => handleRemoveStock(stock.symbol)}
                                className="absolute top-2 right-2 p-1.5 bg-slate-800/80 hover:bg-red-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                title="Remove from watchlist"
                            >
                                <X className="w-3.5 h-3.5 text-zinc-400 hover:text-red-400" />
                            </button>
                        </div>
                    ))
                ) : (
                    // Empty state
                    <div className="text-center py-16">
                        <Activity className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-white mb-2">
                            No stocks in watchlist
                        </h3>
                        <p className="text-zinc-400 mb-4">
                            Add stocks to track their prices
                        </p>
                        <button
                            onClick={() => setIsSearchOpen(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors text-white"
                        >
                            <Plus className="w-4 h-4" />
                            Add Your First Stock
                        </button>
                    </div>
                )}
            </div>

            {/* Search Modal */}
            <SearchModal
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
                onSelect={handleAddStock}
            />

            {/* Keyboard shortcut for search */}
            <KeyboardShortcuts onOpenSearch={() => setIsSearchOpen(true)} />
        </div>
    );
}

// ============================================
// KEYBOARD SHORTCUTS
// ============================================

function KeyboardShortcuts({ onOpenSearch }: { onOpenSearch: () => void }) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Open search with "/" key
            if (e.key === "/" && !e.ctrlKey && !e.metaKey) {
                const target = e.target as HTMLElement;
                if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
                    e.preventDefault();
                    onOpenSearch();
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onOpenSearch]);

    return null;
}
