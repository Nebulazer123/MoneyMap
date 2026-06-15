import { NextRequest, NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';
import { serverCache, getServerCacheKey } from '@/lib/cache/serverCache';
import { checkRateLimit, RATE_LIMITS } from '@/lib/cache/rateLimiter';
import { CACHE_TTL } from '@/lib/cache/CacheManager';

/**
 * Crypto API - Yahoo Finance
 * 
 * Uses Yahoo Finance for crypto data (same as Stocks API)
 * Crypto symbols use format: BTC-USD, ETH-USD, SOL-USD
 * 
 * Endpoints:
 * - ?symbols=BTC-USD,ETH-USD → fetch quotes
 * - ?ids=bitcoin,ethereum → fetch quotes by common crypto ids
 * - ?global=true → fetch market-wide crypto stats
 * - ?search=bitcoin → search for cryptos  
 * - ?detail=BTC-USD → detailed view with charts
 * - ?trending=true → popular cryptos
 */

// Create Yahoo Finance instance
const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

// Popular crypto symbols for browse/trending
const POPULAR_CRYPTOS = [
    'BTC-USD', 'ETH-USD', 'SOL-USD', 'XRP-USD', 'ADA-USD',
    'DOGE-USD', 'DOT-USD', 'AVAX-USD', 'LINK-USD', 'MATIC-USD',
    'LTC-USD', 'UNI-USD', 'ATOM-USD', 'XLM-USD', 'ALGO-USD'
];
const MAX_CRYPTO_SYMBOLS = 25;
const COINGECKO_GLOBAL_URL = 'https://api.coingecko.com/api/v3/global';
const COINGECKO_TO_YAHOO: Record<string, string> = {
    bitcoin: 'BTC-USD',
    ethereum: 'ETH-USD',
    solana: 'SOL-USD',
    cardano: 'ADA-USD',
    ripple: 'XRP-USD',
    polkadot: 'DOT-USD',
    dogecoin: 'DOGE-USD',
    'avalanche-2': 'AVAX-USD',
    chainlink: 'LINK-USD',
    'matic-network': 'MATIC-USD',
    binancecoin: 'BNB-USD',
    uniswap: 'UNI-USD',
    litecoin: 'LTC-USD',
    stellar: 'XLM-USD',
    cosmos: 'ATOM-USD',
};

// Helper to get date string
function getDateDaysAgo(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
}

function toYahooSymbols(value: string): string[] {
    const symbols = value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
        .map((item) => {
            const normalized = item.toLowerCase();
            const yahooSymbol = COINGECKO_TO_YAHOO[normalized];

            if (yahooSymbol) {
                return yahooSymbol;
            }

            const upper = item.toUpperCase();
            return upper.includes('-') ? upper : `${upper}-USD`;
        });

    return Array.from(new Set(symbols)).slice(0, MAX_CRYPTO_SYMBOLS);
}

export async function GET(request: NextRequest) {
    // Rate limiting: 30 requests per minute per IP
    const rateLimitCheck = checkRateLimit(request, RATE_LIMITS.PER_MINUTE_30);
    if (!rateLimitCheck.allowed) {
        return rateLimitCheck.response!;
    }

    const { searchParams } = new URL(request.url);

    try {
        const action = searchParams.get('action');

        // Get global crypto market stats
        const global = searchParams.get('global');
        if (global === 'true' || action === 'global') {
            return await fetchGlobal();
        }

        // Get trending/popular cryptos
        const trending = searchParams.get('trending');
        if (trending === 'true' || action === 'trending') {
            return await fetchTrending();
        }

        // Search for cryptocurrencies
        const search = searchParams.get('search');
        if (search) {
            return await searchCryptos(search);
        }

        // Get detailed crypto data
        const detail = searchParams.get('detail');
        if (detail) {
            return await fetchDetail(detail);
        }

        // Get multiple crypto prices
        const symbols = searchParams.get('symbols');
        if (symbols) {
            return await fetchPrices(toYahooSymbols(symbols));
        }

        // Legacy support: 'ids' param (convert to Yahoo format)
        const ids = searchParams.get('ids');
        if (ids) {
            return await fetchPrices(toYahooSymbols(ids));
        }

        // Alias used by some clients and tests
        const coins = searchParams.get('coins');
        if (coins) {
            return await fetchPrices(toYahooSymbols(coins));
        }

        return NextResponse.json({
            error: 'Invalid request',
            endpoints: {
                trending: '/api/crypto?trending=true',
                global: '/api/crypto?global=true',
                search: '/api/crypto?search=bitcoin',
                detail: '/api/crypto?detail=BTC-USD',
                prices: '/api/crypto?symbols=BTC-USD,ETH-USD',
            }
        }, { status: 400 });
    } catch (error) {
        console.error('Crypto API error:', error);
        return NextResponse.json({ error: 'Failed to fetch crypto data' }, { status: 500 });
    }
}

/**
 * Fetch global crypto market stats
 */
async function fetchGlobal() {
    const cacheKey = getServerCacheKey('crypto', 'global');

    const cached = serverCache.get<{
        totalMarketCap: number;
        totalVolume: number;
        btcDominance: number;
        ethDominance: number;
        marketCapChange24h: number;
        activeCryptocurrencies: number;
        markets: number;
        source: string;
    }>(cacheKey);
    if (cached) {
        return NextResponse.json({
            ...cached,
            cached: true,
        });
    }

    try {
        const response = await fetch(COINGECKO_GLOBAL_URL, {
            headers: {
                accept: 'application/json',
            },
            next: { revalidate: 300 },
        });

        if (!response.ok) {
            throw new Error(`CoinGecko global request failed: ${response.status}`);
        }

        const payload = await response.json() as {
            data?: {
                total_market_cap?: { usd?: number };
                total_volume?: { usd?: number };
                market_cap_percentage?: { btc?: number; eth?: number };
                market_cap_change_percentage_24h_usd?: number;
                active_cryptocurrencies?: number;
                markets?: number;
            };
        };
        const data = payload.data;

        const result = {
            totalMarketCap: data?.total_market_cap?.usd || 0,
            totalVolume: data?.total_volume?.usd || 0,
            btcDominance: data?.market_cap_percentage?.btc || 0,
            ethDominance: data?.market_cap_percentage?.eth || 0,
            marketCapChange24h: data?.market_cap_change_percentage_24h_usd || 0,
            activeCryptocurrencies: data?.active_cryptocurrencies || 0,
            markets: data?.markets || 0,
            source: 'coingecko',
        };

        serverCache.set(cacheKey, result, CACHE_TTL.MARKET_STATS);

        return NextResponse.json({
            ...result,
            cached: false,
        });
    } catch (error) {
        console.error('Global crypto fetch error:', error);
        const staleCache = serverCache.get<{
            totalMarketCap: number;
            totalVolume: number;
            btcDominance: number;
            ethDominance: number;
            marketCapChange24h: number;
            activeCryptocurrencies: number;
            markets: number;
            source: string;
        }>(cacheKey);
        if (staleCache) {
            return NextResponse.json({
                ...staleCache,
                cached: true,
                stale: true,
            });
        }

        return NextResponse.json({
            totalMarketCap: 0,
            totalVolume: 0,
            btcDominance: 0,
            ethDominance: 0,
            marketCapChange24h: 0,
            activeCryptocurrencies: 0,
            markets: 0,
            source: 'coingecko',
            error: 'Failed to fetch global crypto data',
        }, { status: 502 });
    }
}

/**
 * Fetch trending/popular cryptos
 */
async function fetchTrending() {
    const cacheKey = getServerCacheKey('crypto', 'trending');
    
    // Check cache first (15-minute TTL for trending)
    const cached = serverCache.get<{ trending: unknown[]; source: string }>(cacheKey);
    if (cached) {
        return NextResponse.json({
            ...cached,
            cached: true,
        });
    }
    
    try {
        const quotesData = await Promise.all(
            POPULAR_CRYPTOS.slice(0, 10).map(async (symbol) => {
                try {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const quote: any = await yf.quote(symbol);
                    return {
                        id: symbol,
                        symbol: symbol.replace('-USD', ''),
                        name: quote.shortName || quote.longName || symbol,
                        price: quote.regularMarketPrice || 0,
                        change: quote.regularMarketChange || 0,
                        changePercent: quote.regularMarketChangePercent || 0,
                    };
                } catch {
                    return null;
                }
            })
        );

        const result = {
            trending: quotesData.filter(q => q !== null),
            source: 'yahoo',
        };
        
        // Cache for 15 minutes
        serverCache.set(cacheKey, result, CACHE_TTL.TRENDING);
        
        return NextResponse.json({
            ...result,
            cached: false,
        });
    } catch (error) {
        console.error('Trending fetch error:', error);
        // Try to return cached data on error
        const staleCache = serverCache.get<{ trending: unknown[]; source: string }>(cacheKey);
        if (staleCache) {
            return NextResponse.json({
                ...staleCache,
                cached: true,
                stale: true,
            });
        }
        return NextResponse.json({ trending: [], source: 'yahoo' });
    }
}

/**
 * Search cryptocurrencies
 */
async function searchCryptos(query: string) {
    const cacheKey = getServerCacheKey('crypto', 'search', query.toLowerCase());
    
    // Check cache first (10-minute TTL for search results)
    const cached = serverCache.get<{ results: unknown[]; source: string }>(cacheKey);
    if (cached) {
        return NextResponse.json({
            ...cached,
            cached: true,
        });
    }
    
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const results: any = await yf.search(query, {
            quotesCount: 20,
            newsCount: 0,
        });

        // Filter for crypto assets (CRYPTOCURRENCY type)
        const cryptoResults = (results.quotes || [])
            .filter((q: { quoteType?: string; symbol?: string }) =>
                q.quoteType === 'CRYPTOCURRENCY' ||
                (q.symbol && q.symbol.endsWith('-USD') && !q.symbol.includes('.'))
            )
            .slice(0, 10)
            .map((q: { symbol: string; shortname?: string; longname?: string; exchange?: string }) => ({
                id: q.symbol,
                symbol: q.symbol.replace('-USD', ''),
                name: q.shortname || q.longname || q.symbol,
                thumb: null,
                marketCapRank: null,
                exchange: q.exchange,
            }));

        const result = {
            results: cryptoResults,
            source: 'yahoo',
        };
        
        // Cache for 10 minutes
        serverCache.set(cacheKey, result, CACHE_TTL.SEARCH_RESULTS);
        
        return NextResponse.json({
            ...result,
            cached: false,
        });
    } catch (error) {
        console.error('Search error:', error);
        // Try to return cached data on error
        const staleCache = serverCache.get<{ results: unknown[]; source: string }>(cacheKey);
        if (staleCache) {
            return NextResponse.json({
                ...staleCache,
                cached: true,
                stale: true,
            });
        }
        return NextResponse.json({ results: [], source: 'yahoo' });
    }
}

/**
 * Fetch detailed crypto data with charts
 */
async function fetchDetail(symbol: string) {
    // Ensure symbol has -USD suffix
    const yahooSymbol = symbol.includes('-') ? symbol : `${symbol}-USD`;
    const cacheKey = getServerCacheKey('crypto', 'detail', yahooSymbol);
    
    // Check cache first (1-minute TTL for detail)
    const cached = serverCache.get<{
        quote: unknown;
        charts: unknown;
        source: string;
    }>(cacheKey);
    if (cached) {
        return NextResponse.json({
            ...cached,
            cached: true,
        });
    }
    
    try {
        const [quote, chart1d, chart1w, chart1m, chart3m, chart1y] = await Promise.all([
            yf.quote(yahooSymbol).catch(() => null),
            yf.chart(yahooSymbol, { period1: getDateDaysAgo(1), interval: '5m' }).catch(() => null),
            yf.chart(yahooSymbol, { period1: getDateDaysAgo(7), interval: '30m' }).catch(() => null),
            yf.chart(yahooSymbol, { period1: getDateDaysAgo(30), interval: '1d' }).catch(() => null),
            yf.chart(yahooSymbol, { period1: getDateDaysAgo(90), interval: '1d' }).catch(() => null),
            yf.chart(yahooSymbol, { period1: getDateDaysAgo(365), interval: '1wk' }).catch(() => null),
        ]);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const q: any = quote;

        // Process chart data
        const processChart = (chartData: unknown) => {
            if (!chartData) return [];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const c: any = chartData;
            if (!c.quotes) return [];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return c.quotes.map((point: any) => ({
                date: point.date,
                open: point.open,
                high: point.high,
                low: point.low,
                close: point.close,
                volume: point.volume,
            })).filter((p: { close: number | null }) => p.close !== null);
        };

        if (!q) {
            return NextResponse.json({
                quote: null,
                charts: { '1D': [], '1W': [], '1M': [], '3M': [], '1Y': [] },
                source: 'yahoo',
                error: 'Symbol not found',
            }, { status: 404 });
        }

        const result = {
            quote: {
                id: yahooSymbol,
                symbol: yahooSymbol.replace('-USD', ''),
                name: q.shortName || q.longName || yahooSymbol,
                price: q.regularMarketPrice || 0,
                change: q.regularMarketChange || 0,
                changePercent: q.regularMarketChangePercent || 0,
                high: q.regularMarketDayHigh || 0,
                low: q.regularMarketDayLow || 0,
                open: q.regularMarketOpen || 0,
                previousClose: q.regularMarketPreviousClose || 0,
                volume: q.regularMarketVolume || 0,
                marketCap: q.marketCap || 0,
                fiftyTwoWeekHigh: q.fiftyTwoWeekHigh || 0,
                fiftyTwoWeekLow: q.fiftyTwoWeekLow || 0,
                avgVolume: q.averageDailyVolume3Month || 0,
                pe: null, // Crypto doesn't have P/E
                eps: null,
            },
            charts: {
                '1D': processChart(chart1d),
                '1W': processChart(chart1w),
                '1M': processChart(chart1m),
                '3M': processChart(chart3m),
                '1Y': processChart(chart1y),
            },
            source: 'yahoo',
        };
        
        // Cache for 1 minute
        serverCache.set(cacheKey, result, CACHE_TTL.LIVE_PRICES);
        
        return NextResponse.json({
            ...result,
            cached: false,
        });
    } catch (error) {
        console.error('Detail fetch error:', error);
        // Try to return cached data on error
        const staleCache = serverCache.get<{
            quote: unknown;
            charts: unknown;
            source: string;
        }>(cacheKey);
        if (staleCache) {
            return NextResponse.json({
                ...staleCache,
                cached: true,
                stale: true,
            });
        }
        return NextResponse.json({
            quote: null,
            charts: { '1D': [], '1W': [], '1M': [], '3M': [], '1Y': [] },
            source: 'yahoo',
            error: 'Failed to fetch crypto details',
        }, { status: 500 });
    }
}

/**
 * Fetch prices for multiple cryptos
 */
async function fetchPrices(symbolList: string[]) {
    if (symbolList.length === 0) {
        return NextResponse.json({
            quotes: [],
            count: 0,
            source: 'yahoo',
        });
    }

    const cacheKey = getServerCacheKey('crypto', 'prices', symbolList.join(','));
    
    // Check cache first (1-minute TTL for prices)
    const cached = serverCache.get<{
        quotes: unknown[];
        count: number;
        source: string;
    }>(cacheKey);
    if (cached) {
        return NextResponse.json({
            ...cached,
            cached: true,
        });
    }
    
    try {
        const quotesData = await Promise.all(
            symbolList.map(async (symbol) => {
                try {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const quote: any = await yf.quote(symbol);
                    return {
                        id: symbol,
                        symbol: symbol.replace('-USD', ''),
                        name: quote.shortName || quote.longName || symbol,
                        image: null, // Yahoo doesn't provide images
                        price: quote.regularMarketPrice || 0,
                        change: quote.regularMarketChange || 0,
                        changePercent: quote.regularMarketChangePercent || 0,
                        marketCap: quote.marketCap || 0,
                        volume: quote.regularMarketVolume || 0,
                        high24h: quote.regularMarketDayHigh || 0,
                        low24h: quote.regularMarketDayLow || 0,
                        fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh || 0,
                        fiftyTwoWeekLow: quote.fiftyTwoWeekLow || 0,
                        source: 'yahoo',
                    };
                } catch (err) {
                    console.error(`Error fetching ${symbol}:`, err);
                    return null;
                }
            })
        );

        const validQuotes = quotesData.filter(q => q !== null);
        const result = {
            quotes: validQuotes,
            count: validQuotes.length,
            source: 'yahoo',
        };
        
        // Cache for 1 minute
        serverCache.set(cacheKey, result, CACHE_TTL.LIVE_PRICES);
        
        return NextResponse.json({
            ...result,
            cached: false,
        });
    } catch (error) {
        console.error('Prices fetch error:', error);
        // Try to return cached data on error
        const staleCache = serverCache.get<{
            quotes: unknown[];
            count: number;
            source: string;
        }>(cacheKey);
        if (staleCache) {
            return NextResponse.json({
                ...staleCache,
                cached: true,
                stale: true,
            });
        }
        return NextResponse.json({
            quotes: [],
            count: 0,
            source: 'yahoo',
            error: 'Failed to fetch prices',
        });
    }
}
