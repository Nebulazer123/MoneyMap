import { NextRequest, NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';
import { serverCache, getServerCacheKey } from '@/lib/cache/serverCache';
import { checkRateLimit, RATE_LIMITS } from '@/lib/cache/rateLimiter';
import { CACHE_TTL } from '@/lib/cache/CacheManager';

// Create instance for v3
const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

// Helper to get date string for Yahoo Finance
function getDateDaysAgo(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
}

// Map range string to days and interval
function getRangeConfig(range: string): { days: number; interval: '1m' | '5m' | '15m' | '30m' | '1h' | '1d' | '1wk' | '1mo' } {
    switch (range) {
        case '1d': return { days: 1, interval: '5m' };
        case '5d': return { days: 5, interval: '30m' };
        case '1mo': return { days: 30, interval: '1d' };
        case '3mo': return { days: 90, interval: '1d' };
        case '6mo': return { days: 180, interval: '1d' };
        case '1y': return { days: 365, interval: '1wk' };
        case '5y': return { days: 1825, interval: '1mo' };
        case 'max': return { days: 7300, interval: '1mo' };
        default: return { days: 30, interval: '1d' };
    }
}

export async function GET(request: NextRequest) {
    // Rate limiting: 30 requests per minute per IP
    const rateLimitCheck = checkRateLimit(request, RATE_LIMITS.PER_MINUTE_30);
    if (!rateLimitCheck.allowed) {
        return rateLimitCheck.response!;
    }

    const searchParams = request.nextUrl.searchParams;
    const symbols = searchParams.get('symbols');
    const symbol = searchParams.get('symbol');
    const search = searchParams.get('search');
    const action = searchParams.get('action');
    const detail = searchParams.get('detail'); // For detailed single stock view
    const trending = searchParams.get('trending'); // Get trending stocks

    try {
        // ============================================
        // ACTION: CHART - Get chart data for a symbol
        // ============================================
        if (action === 'chart' && symbol) {
            const range = searchParams.get('range') || '1mo';
            const { days, interval } = getRangeConfig(range);
            
            // Determine TTL based on range
            const getChartTTL = () => {
                switch (range) {
                    case '1d': return CACHE_TTL.CHART_1D;
                    case '5d': return CACHE_TTL.CHART_1W;
                    case '1mo': return CACHE_TTL.CHART_1M;
                    case '3mo':
                    case '6mo':
                    case '1y':
                    case '5y':
                    case 'max': return CACHE_TTL.CHART_1Y;
                    default: return CACHE_TTL.CHART_1M;
                }
            };
            
            const cacheKey = getServerCacheKey('stocks', 'chart', symbol.toUpperCase(), range);

            // Check cache first
            const cached = serverCache.get<{
                symbol: string;
                timestamps: number[];
                opens: number[];
                highs: number[];
                lows: number[];
                closes: number[];
                volumes: number[];
                currency: string;
            }>(cacheKey);
            if (cached) {
                return NextResponse.json({
                    ...cached,
                    cached: true,
                });
            }

            try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const chartData: any = await yf.chart(symbol, {
                    period1: getDateDaysAgo(days),
                    interval,
                });

                if (!chartData?.quotes) {
                    return NextResponse.json({ error: 'No chart data available' }, { status: 404 });
                }

                const result = {
                    symbol: symbol.toUpperCase(),
                    timestamps: chartData.quotes
                        .filter((q: { date: Date | null }) => q.date !== null)
                        .map((q: { date: Date }) => new Date(q.date).getTime()),
                    opens: chartData.quotes.map((q: { open: number }) => q.open || 0),
                    highs: chartData.quotes.map((q: { high: number }) => q.high || 0),
                    lows: chartData.quotes.map((q: { low: number }) => q.low || 0),
                    closes: chartData.quotes.map((q: { close: number }) => q.close || 0),
                    volumes: chartData.quotes.map((q: { volume: number }) => q.volume || 0),
                    currency: chartData.meta?.currency || 'USD',
                };

                // Cache based on range
                serverCache.set(cacheKey, result, getChartTTL());

                return NextResponse.json({
                    ...result,
                    cached: false,
                });
            } catch (err) {
                console.error('Chart error:', err);
                // Try to return cached data on error
                const staleCache = serverCache.get<{
                    symbol: string;
                    timestamps: number[];
                    opens: number[];
                    highs: number[];
                    lows: number[];
                    closes: number[];
                    volumes: number[];
                    currency: string;
                }>(cacheKey);
                if (staleCache) {
                    return NextResponse.json({
                        ...staleCache,
                        cached: true,
                        stale: true,
                    });
                }
                return NextResponse.json({ error: 'Failed to fetch chart data' }, { status: 500 });
            }
        }

        // ============================================
        // ACTION: ANALYST - Get analyst recommendations and price targets
        // ============================================
        if (action === 'analyst' && symbol) {
            try {
                // Get quoteSummary with analyst modules
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const summary: any = await yf.quoteSummary(symbol, {
                    modules: [
                        'financialData',
                        'recommendationTrend',
                        'upgradeDowngradeHistory',
                        'institutionOwnership',
                        'insiderHolders',
                        'defaultKeyStatistics',
                    ],
                });

                const financialData = summary.financialData || {};
                const keyStats = summary.defaultKeyStatistics || {};
                const recommendations = summary.recommendationTrend?.trend?.[0] || {};
                
                const result = {
                    symbol: symbol.toUpperCase(),
                    targetMeanPrice: financialData.targetMeanPrice,
                    targetHighPrice: financialData.targetHighPrice,
                    targetLowPrice: financialData.targetLowPrice,
                    targetMedianPrice: financialData.targetMedianPrice,
                    numberOfAnalystOpinions: financialData.numberOfAnalystOpinions,
                    recommendationKey: financialData.recommendationKey,
                    recommendationMean: financialData.recommendationMean,
                    currentPrice: financialData.currentPrice,
                    // Recommendation counts
                    strongBuy: recommendations.strongBuy || 0,
                    buy: recommendations.buy || 0,
                    hold: recommendations.hold || 0,
                    sell: recommendations.sell || 0,
                    strongSell: recommendations.strongSell || 0,
                    // Key stats
                    beta: keyStats.beta,
                    shortPercentOfFloat: keyStats.shortPercentOfFloat,
                    sharesShort: keyStats.sharesShort,
                    shortRatio: keyStats.shortRatio,
                    earningsQuarterlyGrowth: keyStats.earningsQuarterlyGrowth,
                    pegRatio: keyStats.pegRatio,
                    forwardPE: keyStats.forwardPE,
                    priceToBook: keyStats.priceToBook,
                    // Ownership
                    institutionalOwnership: summary.institutionOwnership?.ownershipList?.length || 0,
                    insiderOwnership: summary.insiderHolders?.holders?.length || 0,
                    // Upgrade/downgrade history (last 5)
                    upgradeDowngradeHistory: (summary.upgradeDowngradeHistory?.history || [])
                        .slice(0, 5)
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        .map((h: any) => ({
                            date: h.epochGradeDate ? new Date(h.epochGradeDate * 1000).toISOString() : null,
                            firm: h.firm,
                            toGrade: h.toGrade,
                            fromGrade: h.fromGrade,
                            action: h.action,
                        })),
                };

                return NextResponse.json(result);
            } catch (err) {
                console.error('Analyst error:', err);
                return NextResponse.json({ error: 'Failed to fetch analyst data' }, { status: 500 });
            }
        }

        // ============================================
        // ACTION: EARNINGS - Get earnings data
        // ============================================
        if (action === 'earnings' && symbol) {
            try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const summary: any = await yf.quoteSummary(symbol, {
                    modules: ['calendarEvents', 'earnings', 'earningsHistory', 'earningsTrend'],
                });

                const calendar = summary.calendarEvents || {};
                const earnings = summary.earnings || {};
                const history = summary.earningsHistory?.history || [];

                // Get next earnings date
                const earningsDate = calendar.earnings?.earningsDate?.[0] || null;

                // Get last 4 quarters of earnings
                const quarterlyEarnings = history.slice(0, 4).map((h: {
                    epsActual: number;
                    epsEstimate: number;
                    epsDifference: number;
                    surprisePercent: number;
                    quarter: string;
                }) => ({
                    quarter: h.quarter,
                    epsActual: h.epsActual,
                    epsEstimate: h.epsEstimate,
                    epsDifference: h.epsDifference,
                    surprisePercent: h.surprisePercent,
                }));

                const result = {
                    symbol: symbol.toUpperCase(),
                    earningsDate: earningsDate ? new Date(earningsDate).toISOString() : null,
                    earningsTimestamp: earningsDate ? new Date(earningsDate).getTime() : null,
                    earningsCallTime: calendar.earnings?.earningsCallTime || null,
                    exDividendDate: calendar.exDividendDate ? new Date(calendar.exDividendDate).toISOString() : null,
                    dividendDate: calendar.dividendDate ? new Date(calendar.dividendDate).toISOString() : null,
                    // Yearly financials
                    financialsChart: {
                        yearly: earnings.financialsChart?.yearly || [],
                        quarterly: earnings.financialsChart?.quarterly || [],
                    },
                    // Historical earnings
                    earningsHistory: quarterlyEarnings,
                    // Earnings trend (future estimates)
                    earningsTrend: (summary.earningsTrend?.trend || []).slice(0, 4).map((t: {
                        period: string;
                        growth: number;
                        earningsEstimate: { avg: number; low: number; high: number };
                        revenueEstimate: { avg: number; low: number; high: number };
                    }) => ({
                        period: t.period,
                        growth: t.growth,
                        earningsEstimate: t.earningsEstimate?.avg,
                        earningsLow: t.earningsEstimate?.low,
                        earningsHigh: t.earningsEstimate?.high,
                        revenueEstimate: t.revenueEstimate?.avg,
                    })),
                };

                return NextResponse.json(result);
            } catch (err) {
                console.error('Earnings error:', err);
                return NextResponse.json({ error: 'Failed to fetch earnings data' }, { status: 500 });
            }
        }

        // ============================================
        // ACTION: MOVERS - Get market movers (gainers/losers/active)
        // ============================================
        if (action === 'movers') {
            const type = searchParams.get('type') || 'gainers';
            const count = parseInt(searchParams.get('count') || '10');

            try {
                // Use trending symbols to approximate daily movers
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const trendingData: any = await yf.trendingSymbols('US', { count: count * 2 });
                const trendingSymbols = trendingData.quotes?.map((q: { symbol: string }) => q.symbol) || [];

                // Fetch quotes for trending symbols
                const quotesData = await Promise.all(
                    trendingSymbols.slice(0, count).map(async (sym: string) => {
                        try {
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            const quote: any = await yf.quote(sym);
                            return {
                                symbol: quote.symbol || sym,
                                shortName: quote.shortName || quote.longName || sym,
                                longName: quote.longName,
                                currency: quote.currency || 'USD',
                                exchange: quote.fullExchangeName || quote.exchange,
                                exchangeTimezoneName: quote.exchangeTimezoneName,
                                regularMarketPrice: quote.regularMarketPrice || 0,
                                regularMarketChange: quote.regularMarketChange || 0,
                                regularMarketChangePercent: quote.regularMarketChangePercent || 0,
                                regularMarketPreviousClose: quote.regularMarketPreviousClose || 0,
                                regularMarketOpen: quote.regularMarketOpen || 0,
                                regularMarketDayHigh: quote.regularMarketDayHigh || 0,
                                regularMarketDayLow: quote.regularMarketDayLow || 0,
                                regularMarketVolume: quote.regularMarketVolume || 0,
                                averageVolume: quote.averageDailyVolume3Month,
                                fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh || 0,
                                fiftyTwoWeekLow: quote.fiftyTwoWeekLow || 0,
                                marketCap: quote.marketCap,
                                marketState: quote.marketState,
                                lastUpdated: new Date().toISOString(),
                            };
                        } catch {
                            return null;
                        }
                    })
                );

                // Filter and sort based on type
                let validQuotes = quotesData.filter(q => q !== null);
                
                if (type === 'gainers') {
                    validQuotes = validQuotes.sort((a, b) => 
                        (b?.regularMarketChangePercent || 0) - (a?.regularMarketChangePercent || 0)
                    );
                } else if (type === 'losers') {
                    validQuotes = validQuotes.sort((a, b) => 
                        (a?.regularMarketChangePercent || 0) - (b?.regularMarketChangePercent || 0)
                    );
                } else {
                    validQuotes = validQuotes.sort((a, b) => 
                        (b?.regularMarketVolume || 0) - (a?.regularMarketVolume || 0)
                    );
                }

                return NextResponse.json({ quotes: validQuotes.slice(0, count) });
            } catch (err) {
                console.error('Movers error:', err);
                return NextResponse.json({ quotes: [] });
            }
        }

        // Get trending/popular stocks
        if (trending === 'true') {
            const cacheKey = getServerCacheKey('stocks', 'trending');
            
            // Check cache first (15-minute TTL for trending)
            const cached = serverCache.get<{ trending: unknown[] }>(cacheKey);
            if (cached) {
                return NextResponse.json({
                    ...cached,
                    cached: true,
                });
            }
            
            try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const trendingData: any = await yf.trendingSymbols('US', { count: 25 });
                const trendingSymbols = trendingData.quotes?.map((q: { symbol: string }) => q.symbol) || [];
                
                // Fetch quotes for trending symbols
                const quotesData = await Promise.all(
                    trendingSymbols.slice(0, 20).map(async (symbol: string) => {
                        try {
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            const quote: any = await yf.quote(symbol);
                            return {
                                symbol: quote.symbol || symbol,
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
                    trending: quotesData.filter(q => q !== null) 
                };
                
                // Cache for 15 minutes
                serverCache.set(cacheKey, result, CACHE_TTL.TRENDING);
                
                return NextResponse.json({
                    ...result,
                    cached: false,
                });
            } catch (err) {
                console.error('Trending error:', err);
                // Try to return cached data on error
                const staleCache = serverCache.get<{ trending: unknown[] }>(cacheKey);
                if (staleCache) {
                    return NextResponse.json({
                        ...staleCache,
                        cached: true,
                        stale: true,
                    });
                }
                return NextResponse.json({ trending: [] });
            }
        }

        // Get detailed info for a single stock (includes chart, news, etc.)
        if (detail) {
            const cacheKey = getServerCacheKey('stocks', 'detail', detail.toUpperCase());
            
            // Check cache first (1-minute TTL for detail)
            const cached = serverCache.get<{
                symbol: string;
                quote: unknown;
                charts: unknown;
                news: unknown[];
                insights: unknown;
            }>(cacheKey);
            if (cached) {
                return NextResponse.json({
                    ...cached,
                    cached: true,
                });
            }
            
            try {
                // Fetch multiple data points in parallel
                const [quote, chart1d, chart1w, chart1m, chart3m, chart1y, newsData, insights] = await Promise.all([
                    // Basic quote
                    yf.quote(detail).catch(() => null),
                    // 1 day chart (5min intervals)
                    yf.chart(detail, { period1: getDateDaysAgo(1), interval: '5m' }).catch(() => null),
                    // 1 week chart (30min intervals)  
                    yf.chart(detail, { period1: getDateDaysAgo(7), interval: '30m' }).catch(() => null),
                    // 1 month chart (1 day intervals)
                    yf.chart(detail, { period1: getDateDaysAgo(30), interval: '1d' }).catch(() => null),
                    // 3 month chart
                    yf.chart(detail, { period1: getDateDaysAgo(90), interval: '1d' }).catch(() => null),
                    // 1 year chart
                    yf.chart(detail, { period1: getDateDaysAgo(365), interval: '1wk' }).catch(() => null),
                    // News
                    yf.search(detail, { quotesCount: 0, newsCount: 10 }).catch(() => ({ news: [] })),
                    // Insights (analyst recommendations, etc.)
                    yf.insights(detail).catch(() => null),
                ]);

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const q: any = quote;
                
                // Process chart data for each timeframe
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

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const news: any = newsData;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const insightsResult: any = insights;

                const result = {
                    symbol: detail,
                    quote: q ? {
                        symbol: q.symbol,
                        name: q.shortName || q.longName,
                        price: q.regularMarketPrice,
                        change: q.regularMarketChange,
                        changePercent: q.regularMarketChangePercent,
                        high: q.regularMarketDayHigh,
                        low: q.regularMarketDayLow,
                        open: q.regularMarketOpen,
                        previousClose: q.regularMarketPreviousClose,
                        volume: q.regularMarketVolume,
                        avgVolume: q.averageDailyVolume3Month,
                        marketCap: q.marketCap,
                        fiftyTwoWeekHigh: q.fiftyTwoWeekHigh,
                        fiftyTwoWeekLow: q.fiftyTwoWeekLow,
                        pe: q.trailingPE,
                        eps: q.epsTrailingTwelveMonths,
                        dividend: q.trailingAnnualDividendYield,
                        beta: q.beta,
                        exchange: q.fullExchangeName,
                        currency: q.currency,
                    } : null,
                    charts: {
                        '1D': processChart(chart1d),
                        '1W': processChart(chart1w),
                        '1M': processChart(chart1m),
                        '3M': processChart(chart3m),
                        '1Y': processChart(chart1y),
                    },
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    news: (news?.news || []).slice(0, 8).map((n: any) => ({
                        title: n.title,
                        publisher: n.publisher,
                        link: n.link,
                        publishedAt: n.providerPublishTime,
                        thumbnail: n.thumbnail?.resolutions?.[0]?.url || null,
                    })),
                    insights: insightsResult ? {
                        recommendation: insightsResult.recommendation?.rating,
                        targetPrice: insightsResult.recommendation?.targetPrice,
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        reports: (insightsResult.reports || []).slice(0, 3).map((r: any) => ({
                            title: r.reportTitle,
                            provider: r.provider,
                            summary: r.summary,
                        })),
                        technicalEvents: insightsResult.technicalEvents,
                        companySnapshot: insightsResult.companySnapshot,
                    } : null,
                };
                
                // Cache for 1 minute
                serverCache.set(cacheKey, result, CACHE_TTL.LIVE_PRICES);
                
                return NextResponse.json({
                    ...result,
                    cached: false,
                });
            } catch (err) {
                console.error(`Error fetching details for ${detail}:`, err);
                // Try to return cached data on error
                const staleCache = serverCache.get<{
                    symbol: string;
                    quote: unknown;
                    charts: unknown;
                    news: unknown[];
                    insights: unknown;
                }>(cacheKey);
                if (staleCache) {
                    return NextResponse.json({
                        ...staleCache,
                        cached: true,
                        stale: true,
                    });
                }
                return NextResponse.json({ error: 'Failed to fetch stock details' }, { status: 500 });
            }
        }

        // Search for stocks by query
        if (search) {
            const cacheKey = getServerCacheKey('stocks', 'search', search.toLowerCase());
            
            // Check cache first (10-minute TTL for search results)
            const cached = serverCache.get<{ quotes: unknown[] }>(cacheKey);
            if (cached) {
                return NextResponse.json({
                    ...cached,
                    cached: true,
                });
            }
            
            try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const results: any = await yf.search(search, {
                    quotesCount: 15,
                    newsCount: 0,
                });
                
                const quotes = (results.quotes || [])
                    .filter((q: { quoteType: string }) => q.quoteType === 'EQUITY' || q.quoteType === 'ETF')
                    .map((q: { symbol: string; shortname?: string; longname?: string; exchange?: string; quoteType?: string }) => ({
                        symbol: q.symbol,
                        name: q.shortname || q.longname || q.symbol,
                        exchange: q.exchange,
                        type: q.quoteType,
                    }));
                
                const result = { quotes };
                
                // Cache for 10 minutes
                serverCache.set(cacheKey, result, CACHE_TTL.SEARCH_RESULTS);
                
                return NextResponse.json({
                    ...result,
                    cached: false,
                });
            } catch (err) {
                console.error('Search error:', err);
                // Try to return cached data on error
                const staleCache = serverCache.get<{ quotes: unknown[] }>(cacheKey);
                if (staleCache) {
                    return NextResponse.json({
                        ...staleCache,
                        cached: true,
                        stale: true,
                    });
                }
                return NextResponse.json({ quotes: [] });
            }
        }

        // Get quotes for specific symbols
        if (symbols) {
            const symbolList = symbols.split(',').map(s => s.trim().toUpperCase());
            const includeSparkline = searchParams.get('sparkline') === 'true';
            const cacheKey = getServerCacheKey('stocks', 'quotes', symbolList.join(','), includeSparkline ? 'sparkline' : 'no-sparkline');
            
            // Check cache first (1-minute TTL for quotes)
            const cached = serverCache.get<{ quotes: unknown[] }>(cacheKey);
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
                            
                            // Optionally fetch 7-day chart for sparkline
                            let sparkline7d: number[] | undefined;
                            if (includeSparkline) {
                                try {
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    const chartData: any = await yf.chart(symbol, {
                                        period1: getDateDaysAgo(7),
                                        interval: '1d',
                                    });
                                    if (chartData?.quotes) {
                                        sparkline7d = chartData.quotes
                                            .map((q: { close: number }) => q.close)
                                            .filter((v: number | null) => v !== null && !isNaN(v));
                                    }
                                } catch {
                                    // Sparkline fetch failed, continue without it
                                }
                            }
                            
                            return {
                                symbol: quote.symbol || symbol,
                                name: quote.shortName || quote.longName || symbol,
                                price: quote.regularMarketPrice || 0,
                                change: quote.regularMarketChange || 0,
                                changePercent: quote.regularMarketChangePercent || 0,
                                high: quote.regularMarketDayHigh || 0,
                                low: quote.regularMarketDayLow || 0,
                                open: quote.regularMarketOpen || 0,
                                previousClose: quote.regularMarketPreviousClose || 0,
                                volume: quote.regularMarketVolume || 0,
                                marketCap: quote.marketCap || 0,
                                fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh || 0,
                                fiftyTwoWeekLow: quote.fiftyTwoWeekLow || 0,
                                pe: quote.trailingPE || null,
                                eps: quote.epsTrailingTwelveMonths || null,
                                dividendYield: quote.dividendYield || null,
                                beta: quote.beta || null,
                                exchange: quote.fullExchangeName || quote.exchange || null,
                                sparkline7d,
                            };
                        } catch (err) {
                            console.error(`Error fetching ${symbol}:`, err);
                            return null;
                        }
                    })
                );

                const validQuotes = quotesData.filter(q => q !== null);
                const result = { quotes: validQuotes };
                
                // Cache for 1 minute
                serverCache.set(cacheKey, result, CACHE_TTL.LIVE_PRICES);
                
                return NextResponse.json({
                    ...result,
                    cached: false,
                });
            } catch (err) {
                console.error('Quotes error:', err);
                // Try to return cached data on error
                const staleCache = serverCache.get<{ quotes: unknown[] }>(cacheKey);
                if (staleCache) {
                    return NextResponse.json({
                        ...staleCache,
                        cached: true,
                        stale: true,
                    });
                }
                return NextResponse.json({ quotes: [] });
            }
        }

        return NextResponse.json({ error: 'Missing symbols or search parameter' }, { status: 400 });
    } catch (err) {
        console.error('Yahoo Finance API error:', err);
        return NextResponse.json({ error: 'Failed to fetch stock data' }, { status: 500 });
    }
}
