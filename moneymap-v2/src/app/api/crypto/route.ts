import { NextRequest, NextResponse } from 'next/server';

/**
 * Crypto API - CoinGecko (Primary) + CoinMarketCap (Fallback)
 * 
 * CoinGecko: 30 calls/min with API key
 * CoinMarketCap: 333 calls/day (fallback only)
 * 
 * Cache Strategy:
 * - Live prices: 1 min
 * - Market stats: 5 min
 * - Charts: 5-60 min based on timeframe
 * - Trending: 15 min
 */

// API Keys
const COINGECKO_API_KEY = 'CG-6BZouhuMK3pj4Q2HxH4jZgab';
const COINMARKETCAP_API_KEY = 'e1f0879635dc4b7da3bfda68cebf2858';

// Base URLs
const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';
const CMC_BASE = 'https://pro-api.coinmarketcap.com/v1';

// Types
type SearchCoin = {
    id: string;
    symbol: string;
    name: string;
    thumb: string;
    market_cap_rank: number | null;
};

type EnhancedMarketCoin = {
    id: string;
    symbol: string;
    name: string;
    image: string;
    current_price: number;
    price_change_24h: number;
    price_change_percentage_24h: number;
    price_change_percentage_7d_in_currency?: number;
    price_change_percentage_30d_in_currency?: number;
    price_change_percentage_1y_in_currency?: number;
    market_cap: number;
    market_cap_rank: number;
    market_cap_change_percentage_24h: number;
    total_volume: number;
    high_24h: number;
    low_24h: number;
    ath: number;
    ath_date: string;
    ath_change_percentage: number;
    atl: number;
    atl_date: string;
    atl_change_percentage: number;
    circulating_supply: number;
    total_supply: number;
    max_supply: number | null;
    fully_diluted_valuation: number | null;
};

type EnhancedQuote = {
    id: string;
    symbol: string;
    name: string;
    image: string;
    price: number;
    change: number;
    changePercent: number;
    changePercent7d?: number;
    changePercent30d?: number;
    changePercent1y?: number;
    marketCap: number;
    marketCapRank: number;
    marketCapChange24h: number;
    volume: number;
    high24h: number;
    low24h: number;
    ath: number;
    athDate: string;
    athChangePercent: number;
    atl: number;
    atlDate: string;
    atlChangePercent: number;
    circulatingSupply: number;
    totalSupply: number;
    maxSupply: number | null;
    fullyDilutedValuation: number | null;
    source: 'coingecko' | 'coinmarketcap';
};

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    
    // Get trending cryptos
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

    // Get multiple crypto prices with enhanced data
    const ids = searchParams.get('ids');
    if (ids) {
        return await fetchPrices(ids);
    }

    // Get global market data
    const global = searchParams.get('global');
    if (global === 'true') {
        return await fetchGlobalData();
    }

    return NextResponse.json({ 
        error: 'Invalid request',
        endpoints: {
            trending: '/api/crypto?trending=true',
            search: '/api/crypto?search=bitcoin',
            detail: '/api/crypto?detail=bitcoin',
            prices: '/api/crypto?ids=bitcoin,ethereum',
            global: '/api/crypto?global=true',
        }
    }, { status: 400 });
}

/**
 * Fetch trending cryptos with fallback
 */
async function fetchTrending() {
    try {
        const response = await fetch(
            `${COINGECKO_BASE}/search/trending`,
            { headers: { 'x-cg-demo-api-key': COINGECKO_API_KEY } }
        );
        
        if (!response.ok) throw new Error('CoinGecko trending failed');
        
        const data = await response.json();
        return NextResponse.json({ 
            trending: data.coins || [],
            source: 'coingecko',
        });
    } catch (error) {
        console.warn('CoinGecko trending failed, trying CMC:', error);
        
        try {
            // Fallback to CoinMarketCap
            const response = await fetch(
                `${CMC_BASE}/cryptocurrency/trending/latest`,
                { headers: { 'X-CMC_PRO_API_KEY': COINMARKETCAP_API_KEY } }
            );
            
            if (!response.ok) throw new Error('CMC trending failed');
            
            const data = await response.json();
            return NextResponse.json({ 
                trending: data.data || [],
                source: 'coinmarketcap',
            });
        } catch {
            return NextResponse.json({ 
                error: 'Failed to fetch trending cryptos',
                trending: [],
            }, { status: 500 });
        }
    }
}

/**
 * Search cryptocurrencies
 */
async function searchCryptos(query: string) {
    try {
        const response = await fetch(
            `${COINGECKO_BASE}/search?query=${encodeURIComponent(query)}`,
            { headers: { 'x-cg-demo-api-key': COINGECKO_API_KEY } }
        );
        
        if (!response.ok) throw new Error('Search failed');
        
        const data = await response.json();
        return NextResponse.json({ 
            results: data.coins?.slice(0, 10).map((coin: SearchCoin) => ({
                id: coin.id,
                symbol: coin.symbol.toUpperCase(),
                name: coin.name,
                thumb: coin.thumb,
                marketCapRank: coin.market_cap_rank,
            })) || [],
            source: 'coingecko',
        });
    } catch {
        return NextResponse.json({ error: 'Failed to search cryptos' }, { status: 500 });
    }
}

/**
 * Fetch detailed crypto data with enhanced fields
 */
async function fetchDetail(id: string) {
    try {
        const [coinData, chartData] = await Promise.all([
            fetch(
                `${COINGECKO_BASE}/coins/${id}?localization=false&tickers=false&community_data=true&developer_data=true`,
                { headers: { 'x-cg-demo-api-key': COINGECKO_API_KEY } }
            ),
            fetch(
                `${COINGECKO_BASE}/coins/${id}/market_chart?vs_currency=usd&days=365`,
                { headers: { 'x-cg-demo-api-key': COINGECKO_API_KEY } }
            ),
        ]);
        
        if (!coinData.ok) throw new Error('Detail fetch failed');
        
        const coin = await coinData.json();
        const chart = await chartData.json();
        
        return NextResponse.json({
            quote: {
                id: coin.id,
                symbol: coin.symbol?.toUpperCase(),
                name: coin.name,
                image: coin.image?.large,
                price: coin.market_data?.current_price?.usd,
                change: coin.market_data?.price_change_24h,
                changePercent: coin.market_data?.price_change_percentage_24h,
                changePercent7d: coin.market_data?.price_change_percentage_7d,
                changePercent30d: coin.market_data?.price_change_percentage_30d,
                changePercent1y: coin.market_data?.price_change_percentage_1y,
                marketCap: coin.market_data?.market_cap?.usd,
                marketCapRank: coin.market_cap_rank,
                volume: coin.market_data?.total_volume?.usd,
                high24h: coin.market_data?.high_24h?.usd,
                low24h: coin.market_data?.low_24h?.usd,
                // ATH/ATL data
                ath: coin.market_data?.ath?.usd,
                athDate: coin.market_data?.ath_date?.usd,
                athChangePercent: coin.market_data?.ath_change_percentage?.usd,
                atl: coin.market_data?.atl?.usd,
                atlDate: coin.market_data?.atl_date?.usd,
                atlChangePercent: coin.market_data?.atl_change_percentage?.usd,
                // Supply data
                circulatingSupply: coin.market_data?.circulating_supply,
                totalSupply: coin.market_data?.total_supply,
                maxSupply: coin.market_data?.max_supply,
                fullyDilutedValuation: coin.market_data?.fully_diluted_valuation?.usd,
            },
            // Social & developer metrics
            metrics: {
                communityScore: coin.community_score,
                developerScore: coin.developer_score,
                liquidityScore: coin.liquidity_score,
                publicInterestScore: coin.public_interest_score,
                sentimentUp: coin.sentiment_votes_up_percentage,
                sentimentDown: coin.sentiment_votes_down_percentage,
            },
            // Links
            links: {
                homepage: coin.links?.homepage?.[0],
                blockchain: coin.links?.blockchain_site?.[0],
                twitter: coin.links?.twitter_screen_name ? `https://twitter.com/${coin.links.twitter_screen_name}` : null,
                reddit: coin.links?.subreddit_url,
                github: coin.links?.repos_url?.github?.[0],
            },
            charts: {
                '1D': chart.prices?.slice(-24).map(([timestamp, price]: [number, number]) => ({ timestamp, price })) || [],
                '1W': chart.prices?.slice(-168).map(([timestamp, price]: [number, number]) => ({ timestamp, price })) || [],
                '1M': chart.prices?.slice(-720).map(([timestamp, price]: [number, number]) => ({ timestamp, price })) || [],
                '3M': chart.prices?.slice(-2160).map(([timestamp, price]: [number, number]) => ({ timestamp, price })) || [],
                '1Y': chart.prices?.map(([timestamp, price]: [number, number]) => ({ timestamp, price })) || [],
            },
            description: coin.description?.en?.split('. ').slice(0, 2).join('. ') + '.' || 'No description available',
            source: 'coingecko',
        });
    } catch {
        return NextResponse.json({ error: 'Failed to fetch crypto details' }, { status: 500 });
    }
}

/**
 * Fetch prices for multiple cryptos with enhanced data
 */
async function fetchPrices(ids: string) {
    try {
        // Use enhanced endpoint with sparkline and price change data
        const response = await fetch(
            `${COINGECKO_BASE}/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&sparkline=true&price_change_percentage=24h,7d,30d,1y`,
            { headers: { 'x-cg-demo-api-key': COINGECKO_API_KEY } }
        );
        
        if (!response.ok) throw new Error('CoinGecko prices failed');
        
        const data = await response.json();
        
        // Return as array for easier consumption
        const quotes = data.map((coin: EnhancedMarketCoin & { sparkline_in_7d?: { price: number[] } }) => ({
            id: coin.id,
            symbol: coin.symbol.toUpperCase(),
            name: coin.name,
            image: coin.image,
            price: coin.current_price,
            change: coin.price_change_24h,
            changePercent: coin.price_change_percentage_24h,
            changePercent7d: coin.price_change_percentage_7d_in_currency,
            changePercent30d: coin.price_change_percentage_30d_in_currency,
            changePercent1y: coin.price_change_percentage_1y_in_currency,
            marketCap: coin.market_cap,
            marketCapRank: coin.market_cap_rank,
            marketCapChange24h: coin.market_cap_change_percentage_24h,
            volume: coin.total_volume,
            high24h: coin.high_24h,
            low24h: coin.low_24h,
            ath: coin.ath,
            athDate: coin.ath_date,
            athChangePercent: coin.ath_change_percentage,
            atl: coin.atl,
            atlDate: coin.atl_date,
            atlChangePercent: coin.atl_change_percentage,
            circulatingSupply: coin.circulating_supply,
            totalSupply: coin.total_supply,
            maxSupply: coin.max_supply,
            fullyDilutedValuation: coin.fully_diluted_valuation,
            sparkline7d: coin.sparkline_in_7d?.price || [],
            source: 'coingecko',
        }));
        
        return NextResponse.json({ 
            quotes,
            count: quotes.length,
            source: 'coingecko',
        });
    } catch (error) {
        console.warn('CoinGecko prices failed, trying CMC:', error);
        
        // Fallback to CoinMarketCap
        return await fetchPricesFromCMC(ids);
    }
}

/**
 * CoinMarketCap fallback for prices
 */
async function fetchPricesFromCMC(ids: string) {
    try {
        // CMC uses different ID format, try to map
        const symbols = ids.split(',').map(id => {
            // Common mappings
            const map: Record<string, string> = {
                'bitcoin': 'BTC',
                'ethereum': 'ETH',
                'solana': 'SOL',
                'cardano': 'ADA',
                'dogecoin': 'DOGE',
                'polkadot': 'DOT',
                'avalanche-2': 'AVAX',
                'chainlink': 'LINK',
            };
            return map[id] || id.toUpperCase();
        }).join(',');
        
        const response = await fetch(
            `${CMC_BASE}/cryptocurrency/quotes/latest?symbol=${symbols}`,
            { headers: { 'X-CMC_PRO_API_KEY': COINMARKETCAP_API_KEY } }
        );
        
        if (!response.ok) throw new Error('CMC prices failed');
        
        const data = await response.json();
        
        // Transform CMC format to our format
        const quotes: Record<string, Partial<EnhancedQuote>> = {};
        
        if (data.data) {
            Object.values(data.data).forEach((coin: unknown) => {
                const c = coin as { id: number; symbol: string; name: string; quote: { USD: { price: number; percent_change_24h: number; percent_change_7d: number; percent_change_30d: number; market_cap: number; volume_24h: number } } };
                quotes[c.symbol.toLowerCase()] = {
                    id: c.id.toString(),
                    symbol: c.symbol,
                    name: c.name,
                    price: c.quote.USD.price,
                    changePercent: c.quote.USD.percent_change_24h,
                    changePercent7d: c.quote.USD.percent_change_7d,
                    changePercent30d: c.quote.USD.percent_change_30d,
                    marketCap: c.quote.USD.market_cap,
                    volume: c.quote.USD.volume_24h,
                    source: 'coinmarketcap',
                };
            });
        }
        
        return NextResponse.json({ 
            quotes,
            count: Object.keys(quotes).length,
            source: 'coinmarketcap',
        });
    } catch {
        return NextResponse.json({ 
            error: 'Failed to fetch crypto prices from all sources' 
        }, { status: 500 });
    }
}

/**
 * Fetch global market data
 */
async function fetchGlobalData() {
    try {
        const response = await fetch(
            `${COINGECKO_BASE}/global`,
            { headers: { 'x-cg-demo-api-key': COINGECKO_API_KEY } }
        );
        
        if (!response.ok) throw new Error('Global data fetch failed');
        
        const data = await response.json();
        const global = data.data;
        
        return NextResponse.json({
            totalMarketCap: global.total_market_cap?.usd || 0,
            totalVolume: global.total_volume?.usd || 0,
            btcDominance: global.market_cap_percentage?.btc || 0,
            ethDominance: global.market_cap_percentage?.eth || 0,
            activeCryptocurrencies: global.active_cryptocurrencies || 0,
            markets: global.markets || 0,
            marketCapChange24h: global.market_cap_change_percentage_24h_usd || 0,
            updatedAt: global.updated_at,
            source: 'coingecko',
        });
    } catch {
        return NextResponse.json({ 
            error: 'Failed to fetch global market data' 
        }, { status: 500 });
    }
}
