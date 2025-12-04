/**
 * useCrypto - Specialized hooks for cryptocurrency data
 * 
 * Uses CoinGecko as primary source with CoinMarketCap fallback
 * Implements smart caching with different TTLs for different data types
 */

'use client';

import { useCache, usePrefetch } from './useCache';
import { CACHE_TTL } from './CacheManager';

// Types for crypto data
export interface CryptoQuote {
  id: string;
  symbol: string;
  name: string;
  image: string;
  currentPrice: number;
  marketCap: number;
  marketCapRank: number;
  fullyDilutedValuation?: number;
  totalVolume: number;
  high24h: number;
  low24h: number;
  priceChange24h: number;
  priceChangePercentage24h: number;
  priceChangePercentage7d?: number;
  priceChangePercentage30d?: number;
  priceChangePercentage1y?: number;
  marketCapChange24h: number;
  marketCapChangePercentage24h: number;
  circulatingSupply: number;
  totalSupply?: number;
  maxSupply?: number;
  ath: number;
  athDate: string;
  athChangePercentage: number;
  atl: number;
  atlDate: string;
  atlChangePercentage: number;
  lastUpdated: string;
  sparkline7d?: number[];
  marketDominance?: number;
}

export interface CryptoGlobalData {
  totalMarketCap: number;
  totalVolume: number;
  btcDominance: number;
  ethDominance: number;
  marketCapChange24h: number;
  activeCryptocurrencies: number;
  markets: number;
  lastUpdated: string;
}

export interface CryptoChartData {
  prices: [number, number][];
  marketCaps: [number, number][];
  totalVolumes: [number, number][];
}

// Fetch cryptocurrency quote data
export function useCryptoQuote(
  coinId: string,
  options: { enabled?: boolean; currency?: string } = {}
) {
  const { enabled = true, currency = 'usd' } = options;

  return useCache<CryptoQuote | null>(
    `crypto:quote:${coinId}:${currency}`,
    async () => {
      const response = await fetch(`/api/crypto?coins=${coinId}&currency=${currency}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch crypto: ${response.statusText}`);
      }
      const data = await response.json();
      return data.coins?.[0] || null;
    },
    {
      ttl: CACHE_TTL.LIVE_PRICES,
      storage: 'session',
      enabled: enabled && !!coinId,
      staleWhileRevalidate: true,
    }
  );
}

// Fetch multiple cryptocurrency quotes
export function useCryptoQuotes(
  coinIds: string[],
  options: { enabled?: boolean; currency?: string } = {}
) {
  const { enabled = true, currency = 'usd' } = options;
  const ids = coinIds.join(',');

  return useCache<CryptoQuote[]>(
    `crypto:quotes:${ids}:${currency}`,
    async () => {
      if (!ids) return [];
      const response = await fetch(`/api/crypto?coins=${ids}&currency=${currency}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch cryptos: ${response.statusText}`);
      }
      const data = await response.json();
      return data.coins || [];
    },
    {
      ttl: CACHE_TTL.LIVE_PRICES,
      storage: 'session',
      enabled: enabled && coinIds.length > 0,
      staleWhileRevalidate: true,
      fallbackData: [],
    }
  );
}

// Fetch cryptocurrency chart data
export function useCryptoChart(
  coinId: string,
  days: '1' | '7' | '30' | '90' | '365' | 'max' = '7',
  options: { enabled?: boolean; currency?: string } = {}
) {
  const { enabled = true, currency = 'usd' } = options;

  // Different TTLs based on timeframe
  const getTTL = () => {
    switch (days) {
      case '1': return CACHE_TTL.CHART_1D;
      case '7': return CACHE_TTL.CHART_1W;
      case '30': return CACHE_TTL.CHART_1M;
      case '90': 
      case '365':
      case 'max': return CACHE_TTL.CHART_1Y;
      default: return CACHE_TTL.CHART_1W;
    }
  };

  return useCache<CryptoChartData | null>(
    `crypto:chart:${coinId}:${days}:${currency}`,
    async () => {
      const response = await fetch(
        `/api/crypto?action=chart&coin=${coinId}&days=${days}&currency=${currency}`
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch chart: ${response.statusText}`);
      }
      return response.json();
    },
    {
      ttl: getTTL(),
      storage: 'session',
      enabled: enabled && !!coinId,
      staleWhileRevalidate: true,
    }
  );
}

// Fetch global market data
export function useCryptoGlobal(options: { enabled?: boolean } = {}) {
  const { enabled = true } = options;

  return useCache<CryptoGlobalData | null>(
    'crypto:global',
    async () => {
      const response = await fetch('/api/crypto?action=global');
      if (!response.ok) {
        throw new Error(`Failed to fetch global data: ${response.statusText}`);
      }
      return response.json();
    },
    {
      ttl: CACHE_TTL.MARKET_STATS,
      storage: 'session',
      enabled,
      staleWhileRevalidate: true,
    }
  );
}

// Fetch trending cryptocurrencies
export function useCryptoTrending(options: { enabled?: boolean } = {}) {
  const { enabled = true } = options;

  return useCache<Array<{ id: string; name: string; symbol: string; marketCapRank: number; thumb: string }>>(
    'crypto:trending',
    async () => {
      const response = await fetch('/api/crypto?action=trending');
      if (!response.ok) {
        throw new Error(`Failed to fetch trending: ${response.statusText}`);
      }
      const data = await response.json();
      return data.coins || [];
    },
    {
      ttl: CACHE_TTL.TRENDING,
      storage: 'session',
      enabled,
      staleWhileRevalidate: true,
      fallbackData: [],
    }
  );
}

// Prefetch crypto data for common coins
export function usePrefetchCrypto() {
  const { prefetch } = usePrefetch();
  const commonCoins = ['bitcoin', 'ethereum', 'solana', 'cardano', 'ripple'];

  return {
    prefetchPopular: () => {
      commonCoins.forEach(coin => {
        prefetch(`crypto:quote:${coin}:usd`, async () => {
          const res = await fetch(`/api/crypto?coins=${coin}&currency=usd`);
          const data = await res.json();
          return data.coins?.[0] || null;
        });
      });
    },
    prefetchGlobal: () => {
      prefetch('crypto:global', async () => {
        const res = await fetch('/api/crypto?action=global');
        return res.json();
      });
    },
  };
}

// Calculate portfolio value and performance
export function useCryptoPortfolio(
  holdings: { coinId: string; amount: number; costBasis?: number }[],
  options: { enabled?: boolean; currency?: string } = {}
) {
  const { enabled = true, currency = 'usd' } = options;
  const coinIds = holdings.map(h => h.coinId);

  const { data: quotes, isLoading, error, refresh } = useCryptoQuotes(coinIds, { enabled, currency });

  const portfolio = quotes ? holdings.map(holding => {
    const quote = quotes.find(q => q.id === holding.coinId);
    if (!quote) return null;

    const currentValue = holding.amount * quote.currentPrice;
    const costBasis = holding.costBasis ?? 0;
    const gainLoss = costBasis > 0 ? currentValue - costBasis : 0;
    const gainLossPercent = costBasis > 0 ? ((currentValue - costBasis) / costBasis) * 100 : 0;

    return {
      ...holding,
      quote,
      currentValue,
      gainLoss,
      gainLossPercent,
    };
  }).filter(Boolean) : [];

  const totalValue = portfolio.reduce((sum, p) => sum + (p?.currentValue || 0), 0);
  const totalCostBasis = holdings.reduce((sum, h) => sum + (h.costBasis || 0), 0);
  const totalGainLoss = totalCostBasis > 0 ? totalValue - totalCostBasis : 0;
  const totalGainLossPercent = totalCostBasis > 0 ? ((totalValue - totalCostBasis) / totalCostBasis) * 100 : 0;

  return {
    holdings: portfolio,
    totalValue,
    totalCostBasis,
    totalGainLoss,
    totalGainLossPercent,
    isLoading,
    error,
    refresh,
  };
}

// Export all hooks
export default {
  useCryptoQuote,
  useCryptoQuotes,
  useCryptoChart,
  useCryptoGlobal,
  useCryptoTrending,
  useCryptoPortfolio,
  usePrefetchCrypto,
};
