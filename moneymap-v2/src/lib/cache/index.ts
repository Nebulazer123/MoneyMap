// Core cache infrastructure
export { cacheManager, CACHE_TTL, getCacheKey, type CacheOptions, type StorageType } from './CacheManager';
export { useCache, useCachedFetch, prefetchCache, usePrefetch } from './useCache';

// Crypto hooks
export {
  useCryptoQuote,
  useCryptoQuotes,
  useCryptoChart,
  useCryptoGlobal,
  useCryptoTrending,
  useCryptoPortfolio,
  usePrefetchCrypto,
  type CryptoQuote,
  type CryptoGlobalData,
  type CryptoChartData,
} from './useCrypto';

// Stock hooks
export {
  useStockQuote,
  useStockQuotes,
  useStockChart,
  useStockAnalyst,
  useStockEarnings,
  useMarketMovers,
  useStockPortfolio,
  usePrefetchStocks,
  type StockQuote,
  type StockAnalystData,
  type StockChartData,
  type StockEarnings,
} from './useStocks';

// Utility hooks
export {
  // Exchange rates
  useExchangeRates,
  useCurrencyConvert,
  type ExchangeRates,
  type CurrencyConversion,
  // Location & Time
  useLocation,
  useTimezone,
  type LocationData,
  type TimezoneData,
  // News
  useNews,
  useFinanceNews,
  type NewsArticle,
  // Logos
  useMerchantLogo,
  getMerchantLogoUrl,
  // Countries
  useCountry,
  useCountries,
  type CountryData,
  // Email verification
  useEmailVerification,
  type EmailVerification,
  // Demo data
  useFakeTransactions,
  useRandomUsers,
  type FakeTransaction,
  type RandomUser,
  // Chart export
  getChartImageUrl,
  // UUID
  generateUUID,
  generateMultipleUUIDs,
} from './useUtilities';
