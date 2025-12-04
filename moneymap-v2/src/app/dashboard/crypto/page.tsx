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
    Globe,
    Flame,
    Star,
    Plus,
    X,
    BarChart3,
    DollarSign,
    Activity,
    Clock,
    AlertCircle,
    ChevronRight,
} from "lucide-react";

// ============================================
// TYPES
// ============================================

interface GlobalData {
    totalMarketCap: number;
    totalVolume: number;
    btcDominance: number;
    ethDominance: number;
    marketCapChange24h: number;
    activeCryptocurrencies: number;
}

interface TrendingCoin {
    item: {
        id: string;
        coin_id: number;
        name: string;
        symbol: string;
        market_cap_rank: number;
        thumb: string;
        small: string;
        large: string;
        price_btc: number;
        data?: {
            price: number;
            price_change_percentage_24h: Record<string, number>;
        };
    };
}

interface SearchResult {
    id: string;
    symbol: string;
    name: string;
    thumb: string;
    marketCapRank: number | null;
}

// Default popular cryptos
const DEFAULT_CRYPTOS = [
    "bitcoin",
    "ethereum",
    "solana",
    "ripple",
    "cardano",
    "dogecoin",
    "polkadot",
    "avalanche-2",
];

// ============================================
// GLOBAL STATS COMPONENT
// ============================================

function GlobalStats({ data, isLoading }: { data: GlobalData | null; isLoading: boolean }) {
    if (isLoading) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="bg-slate-800/50 rounded-xl p-4 animate-pulse">
                        <div className="h-3 w-16 bg-slate-700 rounded mb-2" />
                        <div className="h-6 w-24 bg-slate-700 rounded" />
                    </div>
                ))}
            </div>
        );
    }

    if (!data) return null;

    const stats = [
        {
            label: "Total Market Cap",
            value: `$${(data.totalMarketCap / 1e12).toFixed(2)}T`,
            change: data.marketCapChange24h,
            icon: Globe,
        },
        {
            label: "24h Volume",
            value: `$${(data.totalVolume / 1e9).toFixed(1)}B`,
            icon: BarChart3,
        },
        {
            label: "BTC Dominance",
            value: `${data.btcDominance.toFixed(1)}%`,
            icon: DollarSign,
            color: "text-orange-400",
        },
        {
            label: "ETH Dominance",
            value: `${data.ethDominance.toFixed(1)}%`,
            icon: Activity,
            color: "text-blue-400",
        },
        {
            label: "Active Cryptos",
            value: data.activeCryptocurrencies.toLocaleString(),
            icon: Flame,
        },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
            {stats.map((stat) => (
                <GlassCard
                    key={stat.label}
                    intensity="light"
                    tint="slate"
                    className="p-4"
                >
                    <div className="flex items-center gap-2 text-xs text-zinc-400 mb-1">
                        <stat.icon className={cn("w-3.5 h-3.5", stat.color)} />
                        {stat.label}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={cn("text-lg font-bold", stat.color || "text-white")}>
                            {stat.value}
                        </span>
                        {stat.change !== undefined && (
                            <span
                                className={cn(
                                    "text-xs font-mono",
                                    stat.change >= 0 ? "text-emerald-400" : "text-red-400"
                                )}
                            >
                                {stat.change >= 0 ? "+" : ""}
                                {stat.change.toFixed(2)}%
                            </span>
                        )}
                    </div>
                </GlassCard>
            ))}
        </div>
    );
}

// ============================================
// TRENDING SECTION
// ============================================

function TrendingSection({
    trending,
    isLoading,
    onSelect,
}: {
    trending: TrendingCoin[];
    isLoading: boolean;
    onSelect: (id: string) => void;
}) {
    if (isLoading) {
        return (
            <GlassCard intensity="light" tint="slate" className="p-4 mb-6">
                <div className="flex items-center gap-2 mb-4">
                    <Flame className="w-5 h-5 text-orange-400" />
                    <h2 className="font-semibold">Trending</h2>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2">
                    {Array.from({ length: 7 }).map((_, i) => (
                        <div
                            key={i}
                            className="shrink-0 w-32 h-20 bg-slate-700/50 rounded-lg animate-pulse"
                        />
                    ))}
                </div>
            </GlassCard>
        );
    }

    if (trending.length === 0) return null;

    return (
        <GlassCard intensity="light" tint="slate" className="p-4 mb-6">
            <div className="flex items-center gap-2 mb-4">
                <Flame className="w-5 h-5 text-orange-400" />
                <h2 className="font-semibold">Trending Now</h2>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700">
                {trending.slice(0, 10).map((coin, index) => {
                    const item = coin.item;
                    const change24h = item.data?.price_change_percentage_24h?.usd;
                    const isPositive = change24h !== undefined && change24h >= 0;

                    return (
                        <button
                            key={item.id}
                            onClick={() => onSelect(item.id)}
                            className="shrink-0 group bg-slate-700/30 hover:bg-slate-700/50 rounded-lg p-3 transition-all hover:scale-105 min-w-[130px]"
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-bold text-zinc-500">#{index + 1}</span>
                                <img
                                    src={item.thumb}
                                    alt={item.name}
                                    className="w-6 h-6 rounded-full"
                                />
                            </div>
                            <div className="text-left">
                                <div className="font-medium text-white text-sm truncate">
                                    {item.symbol.toUpperCase()}
                                </div>
                                <div className="text-xs text-zinc-400 truncate">{item.name}</div>
                                {change24h !== undefined && (
                                    <div
                                        className={cn(
                                            "text-xs font-mono mt-1",
                                            isPositive ? "text-emerald-400" : "text-red-400"
                                        )}
                                    >
                                        {isPositive ? "+" : ""}
                                        {change24h.toFixed(2)}%
                                    </div>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>
        </GlassCard>
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
    onSelect: (id: string, name: string) => void;
}) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const handleSearch = useCallback(async (searchQuery: string) => {
        if (searchQuery.length < 1) {
            setResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const response = await fetch(`/api/crypto?search=${encodeURIComponent(searchQuery)}`);
            const data = await response.json();
            setResults(data.results || []);
        } catch (error) {
            console.error("Search error:", error);
            setResults([]);
        } finally {
            setIsSearching(false);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (query) handleSearch(query);
        }, 300);
        return () => clearTimeout(timer);
    }, [query, handleSearch]);

    useEffect(() => {
        if (!isOpen) {
            setQuery("");
            setResults([]);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center pt-20 px-4">
            <div className="w-full max-w-lg bg-slate-900 rounded-2xl border border-white/10 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Search Input */}
                <div className="relative p-4 border-b border-white/10">
                    <Search className="absolute left-7 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search cryptocurrencies..."
                        className="w-full pl-10 pr-10 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        autoFocus
                    />
                    <button
                        onClick={onClose}
                        className="absolute right-7 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-zinc-400" />
                    </button>
                </div>

                {/* Results */}
                <div className="max-h-[400px] overflow-y-auto">
                    {isSearching && (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                        </div>
                    )}

                    {!isSearching && results.length === 0 && query.length > 0 && (
                        <div className="flex flex-col items-center justify-center py-8 text-zinc-500">
                            <AlertCircle className="w-8 h-8 mb-2" />
                            <p>No results found</p>
                        </div>
                    )}

                    {!isSearching && results.length === 0 && query.length === 0 && (
                        <div className="p-4 text-center text-zinc-500">
                            <p>Type to search for cryptocurrencies</p>
                        </div>
                    )}

                    {results.map((result) => (
                        <button
                            key={result.id}
                            onClick={() => {
                                onSelect(result.id, result.name);
                                onClose();
                            }}
                            className="w-full flex items-center gap-3 p-4 hover:bg-slate-800/50 transition-colors"
                        >
                            <img
                                src={result.thumb}
                                alt={result.name}
                                className="w-8 h-8 rounded-full"
                            />
                            <div className="flex-1 text-left">
                                <div className="font-medium text-white">{result.name}</div>
                                <div className="text-sm text-zinc-500">{result.symbol}</div>
                            </div>
                            {result.marketCapRank && (
                                <span className="text-sm text-zinc-500">#{result.marketCapRank}</span>
                            )}
                            <ChevronRight className="w-4 h-4 text-zinc-500" />
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ============================================
// MAIN CRYPTO PAGE
// ============================================

export default function CryptoPage() {
    // State
    const [watchlist, setWatchlist] = useState<string[]>(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("crypto_watchlist");
            return saved ? JSON.parse(saved) : DEFAULT_CRYPTOS;
        }
        return DEFAULT_CRYPTOS;
    });
    const [favorites, setFavorites] = useState<Set<string>>(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("crypto_favorites");
            return saved ? new Set(JSON.parse(saved)) : new Set();
        }
        return new Set();
    });

    const [cryptoData, setCryptoData] = useState<Record<string, TickerData>>({});
    const [globalData, setGlobalData] = useState<GlobalData | null>(null);
    const [trending, setTrending] = useState<TrendingCoin[]>([]);

    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isGlobalLoading, setIsGlobalLoading] = useState(true);
    const [isTrendingLoading, setIsTrendingLoading] = useState(true);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isOnline, setIsOnline] = useState(true);
    const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Persist to localStorage
    useEffect(() => {
        localStorage.setItem("crypto_watchlist", JSON.stringify(watchlist));
    }, [watchlist]);

    useEffect(() => {
        localStorage.setItem("crypto_favorites", JSON.stringify([...favorites]));
    }, [favorites]);

    // Fetch global data
    const fetchGlobal = useCallback(async () => {
        setIsGlobalLoading(true);
        try {
            const response = await fetch("/api/crypto?global=true");
            if (!response.ok) throw new Error("Failed to fetch global data");
            const data = await response.json();
            setGlobalData(data);
        } catch (err) {
            console.error("Global data error:", err);
        } finally {
            setIsGlobalLoading(false);
        }
    }, []);

    // Fetch trending
    const fetchTrending = useCallback(async () => {
        setIsTrendingLoading(true);
        try {
            const response = await fetch("/api/crypto?trending=true");
            if (!response.ok) throw new Error("Failed to fetch trending");
            const data = await response.json();
            setTrending(data.trending || []);
        } catch (err) {
            console.error("Trending error:", err);
        } finally {
            setIsTrendingLoading(false);
        }
    }, []);

    // Fetch crypto prices
    const fetchPrices = useCallback(async (ids: string[], isRefresh = false) => {
        if (ids.length === 0) return;

        if (isRefresh) {
            setIsRefreshing(true);
        } else {
            setIsLoading(true);
        }

        try {
            const response = await fetch(`/api/crypto?ids=${ids.join(",")}`);
            if (!response.ok) throw new Error("Failed to fetch prices");

            const data = await response.json();
            const newData: Record<string, TickerData> = {};

            (data.quotes || []).forEach((quote: TickerData & { sparkline_in_7d?: { price: number[] } }) => {
                newData[quote.id] = {
                    ...quote,
                    sparkline7d: quote.sparkline7d || quote.sparkline_in_7d?.price,
                    lastUpdated: new Date(),
                };
            });

            setCryptoData((prev) => ({ ...prev, ...newData }));
            setLastRefresh(new Date());
            setIsOnline(true);
            setError(null);
        } catch (err) {
            console.error("Price fetch error:", err);
            setError("Failed to fetch crypto data");
            setIsOnline(false);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    // Initial load
    useEffect(() => {
        fetchGlobal();
        fetchTrending();
        fetchPrices(watchlist);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Auto-refresh every 60 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            fetchPrices(watchlist, true);
        }, 60000);

        return () => clearInterval(interval);
    }, [watchlist, fetchPrices]);

    // Handle refresh
    const handleRefresh = useCallback(() => {
        fetchGlobal();
        fetchTrending();
        fetchPrices(watchlist, true);
    }, [fetchGlobal, fetchTrending, fetchPrices, watchlist]);

    // Handle add crypto
    const handleAddCrypto = useCallback((id: string, name: string) => {
        if (!watchlist.includes(id)) {
            const newWatchlist = [...watchlist, id];
            setWatchlist(newWatchlist);
            fetchPrices([id]);
        }
    }, [watchlist, fetchPrices]);

    // Handle remove crypto
    const handleRemoveCrypto = useCallback((id: string) => {
        setWatchlist((prev) => prev.filter((c) => c !== id));
        setCryptoData((prev) => {
            const newData = { ...prev };
            delete newData[id];
            return newData;
        });
    }, []);

    // Handle toggle favorite
    const handleToggleFavorite = useCallback((id: string) => {
        setFavorites((prev) => {
            const newFavorites = new Set(prev);
            if (newFavorites.has(id)) {
                newFavorites.delete(id);
            } else {
                newFavorites.add(id);
            }
            return newFavorites;
        });
    }, []);

    // Select from trending
    const handleSelectTrending = useCallback((id: string) => {
        if (!watchlist.includes(id)) {
            handleAddCrypto(id, "");
        }
    }, [watchlist, handleAddCrypto]);

    // Sort watchlist: favorites first, then by market cap
    const sortedWatchlist = useMemo(() => {
        return [...watchlist].sort((a, b) => {
            const aFav = favorites.has(a) ? 0 : 1;
            const bFav = favorites.has(b) ? 0 : 1;
            if (aFav !== bFav) return aFav - bFav;

            const aRank = cryptoData[a]?.marketCapRank || 9999;
            const bRank = cryptoData[b]?.marketCapRank || 9999;
            return aRank - bRank;
        });
    }, [watchlist, favorites, cryptoData]);

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        Cryptocurrency
                        {isOnline ? (
                            <Wifi className="w-5 h-5 text-emerald-400" />
                        ) : (
                            <WifiOff className="w-5 h-5 text-red-400" />
                        )}
                    </h1>
                    <p className="text-zinc-400 mt-1">
                        {watchlist.length} cryptocurrencies tracked
                        {lastRefresh && (
                            <span className="text-zinc-500 ml-2">
                                • Updated {lastRefresh.toLocaleTimeString()}
                            </span>
                        )}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {/* Add Button */}
                    <button
                        onClick={() => setIsSearchOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">Add Crypto</span>
                    </button>

                    {/* Refresh Button */}
                    <button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="p-2 bg-slate-800/50 hover:bg-slate-700/50 rounded-xl transition-colors disabled:opacity-50"
                    >
                        <RefreshCw
                            className={cn("w-5 h-5", isRefreshing && "animate-spin")}
                        />
                    </button>
                </div>
            </header>

            {/* Error Banner */}
            {error && (
                <div className="flex items-center gap-3 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{error}</span>
                    <button
                        onClick={handleRefresh}
                        className="ml-auto text-sm underline hover:no-underline"
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* Global Stats */}
            <GlobalStats data={globalData} isLoading={isGlobalLoading} />

            {/* Trending */}
            <TrendingSection
                trending={trending}
                isLoading={isTrendingLoading}
                onSelect={handleSelectTrending}
            />

            {/* Favorites Section */}
            {favorites.size > 0 && (
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                        <h2 className="text-lg font-semibold">Favorites</h2>
                    </div>
                    <div className="space-y-3">
                        {sortedWatchlist
                            .filter((id) => favorites.has(id))
                            .map((id) => {
                                const data = cryptoData[id];
                                if (!data && !isLoading) return null;

                                return data ? (
                                    <Ticker
                                        key={id}
                                        data={data}
                                        type="crypto"
                                        isFavorite={true}
                                        onToggleFavorite={handleToggleFavorite}
                                        showSparkline={true}
                                    />
                                ) : (
                                    <TickerSkeleton key={id} />
                                );
                            })}
                    </div>
                </section>
            )}

            {/* All Cryptocurrencies */}
            <section>
                <div className="flex items-center gap-2 mb-4">
                    <Activity className="w-5 h-5 text-blue-400" />
                    <h2 className="text-lg font-semibold">All Cryptocurrencies</h2>
                    <span className="text-sm text-zinc-500 ml-2">
                        ({watchlist.length})
                    </span>
                </div>

                {isLoading ? (
                    <div className="space-y-3">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <TickerSkeleton key={i} />
                        ))}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {sortedWatchlist
                            .filter((id) => !favorites.has(id))
                            .map((id) => {
                                const data = cryptoData[id];
                                if (!data) return null;

                                return (
                                    <div key={id} className="relative group">
                                        <Ticker
                                            data={data}
                                            type="crypto"
                                            isFavorite={favorites.has(id)}
                                            onToggleFavorite={handleToggleFavorite}
                                            showSparkline={true}
                                        />
                                        {/* Remove button on hover */}
                                        <button
                                            onClick={() => handleRemoveCrypto(id)}
                                            className="absolute -right-2 -top-2 p-1.5 bg-red-500 hover:bg-red-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                            title="Remove from watchlist"
                                        >
                                            <X className="w-3 h-3 text-white" />
                                        </button>
                                    </div>
                                );
                            })}
                    </div>
                )}
            </section>

            {/* Search Modal */}
            <SearchModal
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
                onSelect={handleAddCrypto}
            />
        </div>
    );
}
