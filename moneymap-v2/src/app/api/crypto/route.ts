import { NextRequest, NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

/**
 * Crypto API - Yahoo Finance
 * 
 * Uses Yahoo Finance for crypto data (same as Stocks API)
 * Crypto symbols use format: BTC-USD, ETH-USD, SOL-USD
 * 
 * Endpoints:
 * - ?symbols=BTC-USD,ETH-USD → fetch quotes
 * - ?search=bitcoin → search for cryptos  
 * - ?detail=BTC-USD → detailed view with charts
 * - ?trending=true → popular cryptos
 */

// Rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 30; // requests per minute
const RATE_WINDOW = 60000; // 1 minute

function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const record = rateLimitMap.get(ip);

    if (!record || now > record.resetTime) {
        rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
        return true;
    }

    if (record.count >= RATE_LIMIT) {
        return false;
    }

    record.count++;
    return true;
}

// Create Yahoo Finance instance
const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

// Popular crypto symbols for browse/trending
const POPULAR_CRYPTOS = [
    'BTC-USD', 'ETH-USD', 'SOL-USD', 'XRP-USD', 'ADA-USD',
    'DOGE-USD', 'DOT-USD', 'AVAX-USD', 'LINK-USD', 'MATIC-USD',
    'LTC-USD', 'UNI-USD', 'ATOM-USD', 'XLM-USD', 'ALGO-USD'
];

// Helper to get date string
function getDateDaysAgo(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);

    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(ip)) {
        return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    try {
        // Get trending/popular cryptos
        const trending = searchParams.get('trending');
        if (trending === 'true') {
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
            return await fetchPrices(symbols);
        }

        // Legacy support: 'ids' param (convert to Yahoo format)
        const ids = searchParams.get('ids');
        if (ids) {
            const yahooSymbols = ids.split(',').map(id => {
                // Convert CoinGecko IDs to Yahoo symbols
                const map: Record<string, string> = {
                    'bitcoin': 'BTC-USD',
                    'ethereum': 'ETH-USD',
                    'solana': 'SOL-USD',
                    'cardano': 'ADA-USD',
                    'ripple': 'XRP-USD',
                    'polkadot': 'DOT-USD',
                    'dogecoin': 'DOGE-USD',
                    'avalanche-2': 'AVAX-USD',
                    'chainlink': 'LINK-USD',
                    'matic-network': 'MATIC-USD',
                    'binancecoin': 'BNB-USD',
                    'uniswap': 'UNI-USD',
                    'litecoin': 'LTC-USD',
                    'stellar': 'XLM-USD',
                    'cosmos': 'ATOM-USD',
                };
                return map[id.toLowerCase()] || `${id.toUpperCase()}-USD`;
            }).join(',');
            return await fetchPrices(yahooSymbols);
        }

        return NextResponse.json({
            error: 'Invalid request',
            endpoints: {
                trending: '/api/crypto?trending=true',
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
 * Fetch trending/popular cryptos
 */
async function fetchTrending() {
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

        return NextResponse.json({
            trending: quotesData.filter(q => q !== null),
            source: 'yahoo',
        });
    } catch (error) {
        console.error('Trending fetch error:', error);
        return NextResponse.json({ trending: [], source: 'yahoo' });
    }
}

/**
 * Search cryptocurrencies
 */
async function searchCryptos(query: string) {
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
                exchange: q.exchange,
            }));

        return NextResponse.json({
            results: cryptoResults,
            source: 'yahoo',
        });
    } catch (error) {
        console.error('Search error:', error);
        return NextResponse.json({ results: [], source: 'yahoo' });
    }
}

/**
 * Fetch detailed crypto data with charts
 */
async function fetchDetail(symbol: string) {
    try {
        // Ensure symbol has -USD suffix
        const yahooSymbol = symbol.includes('-') ? symbol : `${symbol}-USD`;

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

        return NextResponse.json({
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
        });
    } catch (error) {
        console.error('Detail fetch error:', error);
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
async function fetchPrices(symbols: string) {
    try {
        const symbolList = symbols.split(',').map(s => {
            const trimmed = s.trim().toUpperCase();
            return trimmed.includes('-') ? trimmed : `${trimmed}-USD`;
        });

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

        return NextResponse.json({
            quotes: validQuotes,
            count: validQuotes.length,
            source: 'yahoo',
        });
    } catch (error) {
        console.error('Prices fetch error:', error);
        return NextResponse.json({
            quotes: [],
            count: 0,
            source: 'yahoo',
            error: 'Failed to fetch prices',
        });
    }
}
