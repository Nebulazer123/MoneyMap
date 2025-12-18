/**
 * useStocks - Specialized hooks for stock market data
 * 
 * Uses Yahoo Finance API for real-time quotes, charts, and analyst data
 * Implements smart caching with different TTLs for different data types
 */

'use client';

import { useCache, usePrefetch } from './useCache';
import { CACHE_TTL } from './CacheManager';

// Types for stock data
export interface StockQuote {
  symbol: string;
  shortName: string;
  longName?: string;
  currency: string;
  currencySymbol?: string;
  exchange: string;
  exchangeTimezoneName: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  regularMarketPreviousClose: number;
  regularMarketOpen: number;
  regularMarketDayHigh: number;
  regularMarketDayLow: number;
  regularMarketVolume: number;
  averageVolume?: number;
  averageVolume10Day?: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  fiftyTwoWeekHighChange?: number;
  fiftyTwoWeekHighChangePercent?: number;
  fiftyTwoWeekLowChange?: number;
  fiftyTwoWeekLowChangePercent?: number;
  marketCap?: number;
  trailingPE?: number;
  forwardPE?: number;
  priceToBook?: number;
  dividendYield?: number;
  earningsDate?: string;
  marketState: 'PRE' | 'REGULAR' | 'POST' | 'CLOSED';
  preMarketPrice?: number;
  preMarketChange?: number;
  preMarketChangePercent?: number;
  postMarketPrice?: number;
  postMarketChange?: number;
  postMarketChangePercent?: number;
  lastUpdated: string;
}

export interface StockAnalystData {
  symbol: string;
  targetMeanPrice?: number;
  targetHighPrice?: number;
  targetLowPrice?: number;
  targetMedianPrice?: number;
  numberOfAnalystOpinions?: number;
  recommendationKey?: 'strongBuy' | 'buy' | 'hold' | 'sell' | 'strongSell';
  recommendationMean?: number;
  earningsQuarterlyGrowth?: number;
  revenueQuarterlyGrowth?: number;
  institutionalOwnership?: number;
  insiderOwnership?: number;
  shortPercentOfFloat?: number;
  beta?: number;
}

export interface StockChartData {
  symbol: string;
  timestamps: number[];
  opens: number[];
  highs: number[];
  lows: number[];
  closes: number[];
  volumes: number[];
  currency: string;
}

export interface StockEarnings {
  symbol: string;
  earningsDate?: string;
  earningsTimestamp?: number;
  earningsCallTime?: 'before' | 'after' | 'during';
  epsEstimate?: number;
  epsActual?: number;
  epsSurprise?: number;
  revenueEstimate?: number;
  revenueActual?: number;
}

// Fetch stock quote data
export function useStockQuote(
  symbol: string,
  options: { enabled?: boolean } = {}
) {
  const { enabled = true } = options;

  return useCache<StockQuote | null>(
    `stock:quote:${symbol.toUpperCase()}`,
    async () => {
      const response = await fetch(`/api/stocks?symbols=${symbol}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch stock: ${response.statusText}`);
      }
      const data = await response.json();
      return data.quotes?.[0] || null;
    },
    {
      ttl: CACHE_TTL.LIVE_PRICES,
      storage: 'session',
      enabled: enabled && !!symbol,
      staleWhileRevalidate: true,
    }
  );
}

// Fetch multiple stock quotes
export function useStockQuotes(
  symbols: string[],
  options: { enabled?: boolean } = {}
) {
  const { enabled = true } = options;
  const symbolsStr = symbols.map(s => s.toUpperCase()).join(',');

  return useCache<StockQuote[]>(
    `stock:quotes:${symbolsStr}`,
    async () => {
      if (!symbolsStr) return [];
      const response = await fetch(`/api/stocks?symbols=${symbolsStr}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch stocks: ${response.statusText}`);
      }
      const data = await response.json();
      return data.quotes || [];
    },
    {
      ttl: CACHE_TTL.LIVE_PRICES,
      storage: 'session',
      enabled: enabled && symbols.length > 0,
      staleWhileRevalidate: true,
      fallbackData: [],
    }
  );
}

// Fetch stock chart data
export function useStockChart(
  symbol: string,
  range: '1d' | '5d' | '1mo' | '3mo' | '6mo' | '1y' | '5y' | 'max' = '1mo',
  options: { enabled?: boolean } = {}
) {
  const { enabled = true } = options;

  // Different TTLs based on timeframe
  const getTTL = () => {
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

  return useCache<StockChartData | null>(
    `stock:chart:${symbol.toUpperCase()}:${range}`,
    async () => {
      const response = await fetch(`/api/stocks?symbol=${symbol}&action=chart&range=${range}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch chart: ${response.statusText}`);
      }
      return response.json();
    },
    {
      ttl: getTTL(),
      storage: 'session',
      enabled: enabled && !!symbol,
      staleWhileRevalidate: true,
    }
  );
}

// Fetch analyst data (recommendations, price targets)
export function useStockAnalyst(
  symbol: string,
  options: { enabled?: boolean } = {}
) {
  const { enabled = true } = options;

  return useCache<StockAnalystData | null>(
    `stock:analyst:${symbol.toUpperCase()}`,
    async () => {
      const response = await fetch(`/api/stocks?symbol=${symbol}&action=analyst`);
      if (!response.ok) {
        throw new Error(`Failed to fetch analyst data: ${response.statusText}`);
      }
      return response.json();
    },
    {
      ttl: CACHE_TTL.TRENDING, // 15 min - analyst data changes less frequently
      storage: 'session',
      enabled: enabled && !!symbol,
      staleWhileRevalidate: true,
    }
  );
}

// Fetch earnings data
export function useStockEarnings(
  symbol: string,
  options: { enabled?: boolean } = {}
) {
  const { enabled = true } = options;

  return useCache<StockEarnings | null>(
    `stock:earnings:${symbol.toUpperCase()}`,
    async () => {
      const response = await fetch(`/api/stocks?symbol=${symbol}&action=earnings`);
      if (!response.ok) {
        throw new Error(`Failed to fetch earnings: ${response.statusText}`);
      }
      return response.json();
    },
    {
      ttl: CACHE_TTL.NEWS, // 30 min - earnings info changes infrequently
      storage: 'session',
      enabled: enabled && !!symbol,
      staleWhileRevalidate: true,
    }
  );
}

// Fetch market movers (gainers/losers)
export function useMarketMovers(
  type: 'gainers' | 'losers' | 'active' = 'gainers',
  options: { enabled?: boolean; count?: number } = {}
) {
  const { enabled = true, count = 10 } = options;

  return useCache<StockQuote[]>(
    `stock:movers:${type}:${count}`,
    async () => {
      const response = await fetch(`/api/stocks?action=movers&type=${type}&count=${count}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch movers: ${response.statusText}`);
      }
      const data = await response.json();
      return data.quotes || [];
    },
    {
      ttl: CACHE_TTL.MARKET_STATS,
      storage: 'session',
      enabled,
      staleWhileRevalidate: true,
      fallbackData: [],
    }
  );
}

// Prefetch stock data for watchlist
export function usePrefetchStocks() {
  const { prefetch } = usePrefetch();
  const majorIndices = ['SPY', 'QQQ', 'DIA', 'IWM', 'VTI'];
  const popularStocks = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA', 'META'];

  return {
    prefetchIndices: () => {
      const symbols = majorIndices.join(',');
      prefetch(`stock:quotes:${symbols}`, async () => {
        const res = await fetch(`/api/stocks?symbols=${symbols}`);
        const data = await res.json();
        return data.quotes || [];
      });
    },
    prefetchPopular: () => {
      const symbols = popularStocks.join(',');
      prefetch(`stock:quotes:${symbols}`, async () => {
        const res = await fetch(`/api/stocks?symbols=${symbols}`);
        const data = await res.json();
        return data.quotes || [];
      });
    },
  };
}

// Calculate portfolio value and performance
export function useStockPortfolio(
  holdings: { symbol: string; shares: number; costBasis?: number }[],
  options: { enabled?: boolean } = {}
) {
  const { enabled = true } = options;
  const symbols = holdings.map(h => h.symbol);

  const { data: quotes, isLoading, error, refresh } = useStockQuotes(symbols, { enabled });

  const portfolio = quotes ? holdings.map(holding => {
    const quote = quotes.find(q => q.symbol.toUpperCase() === holding.symbol.toUpperCase());
    if (!quote) return null;

    const currentValue = holding.shares * quote.regularMarketPrice;
    const costBasis = holding.costBasis ?? 0;
    const gainLoss = costBasis > 0 ? currentValue - costBasis : 0;
    const gainLossPercent = costBasis > 0 ? ((currentValue - costBasis) / costBasis) * 100 : 0;
    const dayChange = holding.shares * quote.regularMarketChange;
    const dayChangePercent = quote.regularMarketChangePercent;

    return {
      ...holding,
      quote,
      currentValue,
      gainLoss,
      gainLossPercent,
      dayChange,
      dayChangePercent,
    };
  }).filter(Boolean) : [];

  const totalValue = portfolio.reduce((sum, p) => sum + (p?.currentValue || 0), 0);
  const totalCostBasis = holdings.reduce((sum, h) => sum + (h.costBasis || 0), 0);
  const totalGainLoss = totalCostBasis > 0 ? totalValue - totalCostBasis : 0;
  const totalGainLossPercent = totalCostBasis > 0 ? ((totalValue - totalCostBasis) / totalCostBasis) * 100 : 0;
  const totalDayChange = portfolio.reduce((sum, p) => sum + (p?.dayChange || 0), 0);

  return {
    holdings: portfolio,
    totalValue,
    totalCostBasis,
    totalGainLoss,
    totalGainLossPercent,
    totalDayChange,
    isLoading,
    error,
    refresh,
  };
}

// Export all hooks
const stockHooks = {
  useStockQuote,
  useStockQuotes,
  useStockChart,
  useStockAnalyst,
  useStockEarnings,
  useMarketMovers,
  useStockPortfolio,
  usePrefetchStocks,
};

export default stockHooks;
