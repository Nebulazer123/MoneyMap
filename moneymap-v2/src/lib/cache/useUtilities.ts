/**
 * useUtilities - Hooks for utility APIs
 * 
 * Includes: Exchange rates, Location, Weather, News, Logos, etc.
 */

'use client';

import { useCache, usePrefetch } from './useCache';
import { CACHE_TTL } from './CacheManager';

// ============================================
// EXCHANGE RATES
// ============================================

export interface ExchangeRates {
  base: string;
  date: string;
  rates: Record<string, number>;
}

export interface CurrencyConversion {
  from: string;
  to: string;
  amount: number;
  result: number;
  rate: number;
}

export function useExchangeRates(
  baseCurrency: string = 'USD',
  options: { enabled?: boolean } = {}
) {
  const { enabled = true } = options;

  return useCache<ExchangeRates | null>(
    `exchange:rates:${baseCurrency.toUpperCase()}`,
    async () => {
      const response = await fetch(`/api/exchange?base=${baseCurrency}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch rates: ${response.statusText}`);
      }
      return response.json();
    },
    {
      ttl: CACHE_TTL.EXCHANGE_RATES,
      storage: 'local',
      enabled,
      staleWhileRevalidate: true,
    }
  );
}

export function useCurrencyConvert(
  from: string,
  to: string,
  amount: number,
  options: { enabled?: boolean } = {}
) {
  const { enabled = true } = options;

  return useCache<CurrencyConversion | null>(
    `exchange:convert:${from}:${to}:${amount}`,
    async () => {
      const response = await fetch(`/api/exchange?from=${from}&to=${to}&amount=${amount}`);
      if (!response.ok) {
        throw new Error(`Failed to convert: ${response.statusText}`);
      }
      return response.json();
    },
    {
      ttl: CACHE_TTL.EXCHANGE_RATES,
      storage: 'session',
      enabled: enabled && !!from && !!to && amount > 0,
      staleWhileRevalidate: true,
    }
  );
}

// ============================================
// LOCATION & TIMEZONE
// ============================================

export interface LocationData {
  ip: string;
  city: string;
  region: string;
  country: string;
  countryCode: string;
  timezone: string;
  latitude: number;
  longitude: number;
  currency: string;
  currencyName: string;
  languages: string;
  isp?: string;
  org?: string;
}

export interface TimezoneData {
  timezone: string;
  datetime: string;
  utcOffset: string;
  abbreviation: string;
  dayOfWeek: number;
  dayOfYear: number;
  weekNumber: number;
  unixtime: number;
}

export function useLocation(options: { enabled?: boolean } = {}) {
  const { enabled = true } = options;

  return useCache<LocationData | null>(
    'location:current',
    async () => {
      const response = await fetch('/api/location');
      if (!response.ok) {
        throw new Error(`Failed to fetch location: ${response.statusText}`);
      }
      return response.json();
    },
    {
      ttl: CACHE_TTL.TIMEZONE, // 24 hours
      storage: 'local',
      enabled,
      staleWhileRevalidate: true,
    }
  );
}

export function useTimezone(
  timezone?: string,
  options: { enabled?: boolean } = {}
) {
  const { enabled = true } = options;

  return useCache<TimezoneData | null>(
    `time:${timezone || 'auto'}`,
    async () => {
      const url = timezone
        ? `/api/time?timezone=${encodeURIComponent(timezone)}`
        : '/api/time';
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch time: ${response.statusText}`);
      }
      return response.json();
    },
    {
      ttl: 60 * 1000, // 1 minute - time updates frequently
      storage: 'memory',
      enabled,
      staleWhileRevalidate: true,
    }
  );
}

// ============================================
// NEWS
// ============================================

export interface NewsArticle {
  source: { id: string | null; name: string };
  author: string | null;
  title: string;
  description: string;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  content: string;
}

export function useNews(
  query?: string,
  options: { enabled?: boolean; category?: string; country?: string } = {}
) {
  const { enabled = true, category, country = 'us' } = options;

  const cacheKey = query
    ? `news:search:${query}`
    : `news:headlines:${category || 'general'}:${country}`;

  return useCache<NewsArticle[]>(
    cacheKey,
    async () => {
      let url = '/api/news?';
      if (query) {
        url += `q=${encodeURIComponent(query)}`;
      } else {
        url += `category=${category || 'general'}&country=${country}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch news: ${response.statusText}`);
      }
      const data = await response.json();
      return data.articles || [];
    },
    {
      ttl: CACHE_TTL.NEWS,
      storage: 'session',
      enabled,
      staleWhileRevalidate: true,
      fallbackData: [],
    }
  );
}

export function useFinanceNews(options: { enabled?: boolean } = {}) {
  return useNews(undefined, {
    ...options,
    category: 'business'
  });
}

// ============================================
// MERCHANT LOGOS
// ============================================

export function useMerchantLogo(
  domain: string,
  options: { size?: number } = {}
) {
  const { size = 64 } = options;
  // Normalize domain to lowercase for Clearbit API compatibility
  const normalizedDomain = domain ? domain.toLowerCase() : '';

  // No need for useCache here - just generate URL
  const logoUrl = normalizedDomain
    ? `/api/logos?domain=${encodeURIComponent(normalizedDomain)}&size=${size}`
    : null;

  return {
    logoUrl,
    fallbackUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(normalizedDomain)}&size=${size}&background=random`,
  };
}

export function getMerchantLogoUrl(domain: string, size: number = 64): string {
  // Normalize domain to lowercase for Clearbit API compatibility
  const normalizedDomain = domain.toLowerCase();
  return `/api/logos?domain=${encodeURIComponent(normalizedDomain)}&size=${size}`;
}

// ============================================
// COUNTRIES
// ============================================

export interface CountryData {
  name: string;
  officialName: string;
  cca2: string;
  cca3: string;
  capital: string[];
  region: string;
  subregion: string;
  population: number;
  currencies: Record<string, { name: string; symbol: string }>;
  languages: Record<string, string>;
  flag: string;
  flagPng: string;
  flagSvg: string;
  timezones: string[];
  callingCodes: string[];
}

export function useCountry(
  code: string,
  options: { enabled?: boolean } = {}
) {
  const { enabled = true } = options;

  return useCache<CountryData | null>(
    `country:${code.toUpperCase()}`,
    async () => {
      const response = await fetch(`/api/countries?code=${code}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch country: ${response.statusText}`);
      }
      return response.json();
    },
    {
      ttl: CACHE_TTL.COUNTRIES,
      storage: 'local',
      enabled: enabled && !!code,
      staleWhileRevalidate: true,
    }
  );
}

export function useCountries(
  region?: string,
  options: { enabled?: boolean } = {}
) {
  const { enabled = true } = options;

  return useCache<CountryData[]>(
    `countries:${region || 'all'}`,
    async () => {
      const url = region
        ? `/api/countries?region=${encodeURIComponent(region)}`
        : '/api/countries';
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch countries: ${response.statusText}`);
      }
      return response.json();
    },
    {
      ttl: CACHE_TTL.COUNTRIES,
      storage: 'local',
      enabled,
      staleWhileRevalidate: true,
      fallbackData: [],
    }
  );
}

// ============================================
// EMAIL VERIFICATION
// ============================================

export interface EmailVerification {
  email: string;
  autocorrect: string;
  deliverability: 'DELIVERABLE' | 'UNDELIVERABLE' | 'UNKNOWN' | 'RISKY';
  qualityScore: number;
  isValidFormat: boolean;
  isFreeEmail: boolean;
  isDisposableEmail: boolean;
  isRoleEmail: boolean;
  isCatchallEmail: boolean;
  isMxFound: boolean;
  isSmtpValid: boolean;
}

export function useEmailVerification(
  email: string,
  options: { enabled?: boolean } = {}
) {
  const { enabled = true } = options;

  return useCache<EmailVerification | null>(
    `email:verify:${email.toLowerCase()}`,
    async () => {
      const response = await fetch(`/api/verification?email=${encodeURIComponent(email)}`);
      if (!response.ok) {
        throw new Error(`Failed to verify email: ${response.statusText}`);
      }
      return response.json();
    },
    {
      ttl: CACHE_TTL.EMAIL_VERIFICATION,
      storage: 'local',
      enabled: enabled && !!email && email.includes('@'),
      staleWhileRevalidate: false, // Don't stale-refresh verification
    }
  );
}

// ============================================
// DEMO DATA GENERATION
// ============================================

export interface FakeTransaction {
  id: string;
  amount: number;
  currency: string;
  description: string;
  merchant: string;
  category: string;
  date: string;
  type: 'credit' | 'debit';
}

export interface RandomUser {
  name: { first: string; last: string; title: string };
  email: string;
  phone: string;
  picture: { large: string; medium: string; thumbnail: string };
  location: {
    street: { number: number; name: string };
    city: string;
    state: string;
    country: string;
    postcode: string;
  };
  login: { uuid: string; username: string };
}

export function useFakeTransactions(
  count: number = 10,
  options: { enabled?: boolean } = {}
) {
  const { enabled = true } = options;

  return useCache<FakeTransaction[]>(
    `faker:transactions:${count}`,
    async () => {
      const response = await fetch(`/api/faker?type=transactions&count=${count}`);
      if (!response.ok) {
        throw new Error(`Failed to generate transactions: ${response.statusText}`);
      }
      const data = await response.json();
      return data.transactions || [];
    },
    {
      ttl: CACHE_TTL.LIVE_PRICES, // Short cache - demo data
      storage: 'session',
      enabled,
      fallbackData: [],
    }
  );
}

export function useRandomUsers(
  count: number = 5,
  options: { enabled?: boolean } = {}
) {
  const { enabled = true } = options;

  return useCache<RandomUser[]>(
    `users:random:${count}`,
    async () => {
      const response = await fetch(`/api/users?count=${count}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.statusText}`);
      }
      const data = await response.json();
      return data.users || [];
    },
    {
      ttl: CACHE_TTL.NEWS, // 30 min
      storage: 'session',
      enabled,
      fallbackData: [],
    }
  );
}

// ============================================
// CHART EXPORT
// ============================================

export function getChartImageUrl(
  type: 'bar' | 'line' | 'pie' | 'doughnut' | 'radar' | 'scatter',
  data: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      backgroundColor?: string | string[];
      borderColor?: string | string[];
    }>;
  },
  options?: {
    width?: number;
    height?: number;
    backgroundColor?: string;
  }
): string {
  const chartConfig = {
    type,
    data,
    options: {
      responsive: false,
      plugins: {
        legend: { display: true },
      },
    },
  };

  const params = new URLSearchParams({
    chart: JSON.stringify(chartConfig),
    width: String(options?.width || 500),
    height: String(options?.height || 300),
    backgroundColor: options?.backgroundColor || 'transparent',
  });

  return `/api/charts?${params.toString()}`;
}

// ============================================
// UUID GENERATION
// ============================================

export async function generateUUID(): Promise<string> {
  try {
    const response = await fetch('/api/uuid');
    if (!response.ok) {
      throw new Error('Failed to generate UUID');
    }
    const data = await response.json();
    return data.uuid;
  } catch {
    // Fallback to browser crypto
    return crypto.randomUUID();
  }
}

export async function generateMultipleUUIDs(count: number): Promise<string[]> {
  try {
    const response = await fetch(`/api/uuid?count=${count}`);
    if (!response.ok) {
      throw new Error('Failed to generate UUIDs');
    }
    const data = await response.json();
    return data.uuids || [];
  } catch {
    // Fallback to browser crypto
    return Array.from({ length: count }, () => crypto.randomUUID());
  }
}

// Export all hooks
export default {
  // Exchange
  useExchangeRates,
  useCurrencyConvert,
  // Location
  useLocation,
  useTimezone,
  // News
  useNews,
  useFinanceNews,
  // Logos
  useMerchantLogo,
  getMerchantLogoUrl,
  // Countries
  useCountry,
  useCountries,
  // Email
  useEmailVerification,
  // Demo Data
  useFakeTransactions,
  useRandomUsers,
  // Chart Export
  getChartImageUrl,
  // UUID
  generateUUID,
  generateMultipleUUIDs,
};
