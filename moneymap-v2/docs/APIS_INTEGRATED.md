# MoneyMap API Integration Guide

> Last Updated: December 4, 2025

This document contains all integrated APIs, their rate limits, API keys, and usage patterns for the MoneyMap v2 dashboard.

---

## 📊 API Summary Table

| API | Purpose | Rate Limit | Key Required | Status |
|-----|---------|------------|--------------|--------|
| CoinGecko | Crypto prices/data | 30 calls/min | Yes (optional) | ✅ Active |
| CoinMarketCap | Crypto backup | 333 calls/day | Yes | ✅ Active |
| Yahoo Finance | Stock data | ~2000/hour | No | ✅ Active |
| Frankfurter | Currency exchange (primary) | Unlimited | No | ✅ Active |
| ExchangeRate-API | Currency exchange (backup) | 1,500/month | No | ✅ Active |
| ipapi.co | Location detection | 1,000/day | No | ✅ Active |
| Clearbit Logo | Merchant logos | Unlimited | No | ✅ Active |
| FRED | Economic data | Unlimited | Demo key | ✅ Active |
| News API | Financial news | 100/day | Yes | ✅ Active |
| WorldTimeAPI | Timezone data | Unlimited | No | ✅ Active |
| QuickChart | Chart images | Unlimited | No | ✅ Active |
| UUIDTools | UUID generation | Unlimited | No | ✅ Active |
| Faker API | Demo data | Unlimited | No | ✅ Active |
| Random User | Profile photos | Unlimited | No | ✅ Active |
| REST Countries | Country/currency data | Unlimited | No | ✅ Active |
| Abstract Email | Email verification | 100/month | Yes | ✅ Active |
| OCR.space | Receipt scanning | 500/month | Optional | 🔜 Future |

---

## 🔑 API Keys

### Keys We Have (Store Securely!)

```env
# CoinGecko (Primary Crypto) - 30 calls/min with key
COINGECKO_API_KEY=CG-6BZouhuMK3pj4Q2HxH4jZgab

# CoinMarketCap (Crypto Backup) - 333 calls/day
COINMARKETCAP_API_KEY=e1f0879635dc4b7da3bfda68cebf2858

# News API - 100 calls/day
NEWS_API_KEY=b04754f709c4439ea8e1a4a280c737cc

# IP Geolocation (OLD - replaced with ipapi.co)
# IPGEOLOCATION_API_KEY=e47a12846018445a8b6e4eb6c6b3c84c

# Abstract Email Verification - 100/month
ABSTRACT_EMAIL_API_KEY=c06de9698fc14b549cc7ceea8ad2e6d1
```

---

## 🏦 Finance & Market APIs

### 1. CoinGecko (Primary Crypto)
**Endpoint:** `https://api.coingecko.com/api/v3`

**Rate Limits:**
- Without key: 10-50 calls/min
- With key: 30 calls/min (demo tier)

**Caching Strategy:** 
- Live prices: 1 minute TTL
- Chart data: 5-60 minutes based on timeframe
- Trending: 15 minutes TTL

**Endpoints Used:**
```javascript
// Search cryptos
GET /search?query={query}

// Get prices for multiple coins
GET /coins/markets?vs_currency=usd&ids={ids}&price_change_percentage=7d,30d,1y

// Get detailed coin data
GET /coins/{id}?localization=false&tickers=false

// Get chart data
GET /coins/{id}/market_chart?vs_currency=usd&days={days}

// Get trending
GET /search/trending

// With API key (append to URL)
&x_cg_demo_api_key=CG-6BZouhuMK3pj4Q2HxH4jZgab
```

---

### 2. CoinMarketCap (Crypto Backup)
**Endpoint:** `https://pro-api.coinmarketcap.com/v1`

**Rate Limits:** 333 calls/day (Basic tier)

**Caching Strategy:** 
- Only use when CoinGecko fails or rate limited
- Cache for 5 minutes minimum

**Endpoints Used:**
```javascript
// Headers required
Headers: { 'X-CMC_PRO_API_KEY': 'e1f0879635dc4b7da3bfda68cebf2858' }

// Get quotes
GET /cryptocurrency/quotes/latest?symbol={symbols}

// Get trending
GET /cryptocurrency/trending/latest

// Get new listings
GET /cryptocurrency/listings/latest?sort=date_added&limit=20
```

---

### 3. Yahoo Finance (Stocks)
**Library:** `yahoo-finance2` v3

**Rate Limits:** ~2000 calls/hour (unofficial, be polite)

**Caching Strategy:**
- Quotes: 1 minute TTL
- Charts: 5-60 minutes based on timeframe
- News: 30 minutes TTL
- Company info: 24 hours TTL

**Methods Used:**
```javascript
import YahooFinance from 'yahoo-finance2';
const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

// Get quote
await yf.quote('AAPL');

// Search stocks
await yf.search('Apple', { quotesCount: 15 });

// Get chart data
await yf.chart('AAPL', { period1: '2024-01-01', interval: '1d' });

// Get insights (analyst recommendations)
await yf.insights('AAPL');

// Get trending
await yf.trendingSymbols('US', { count: 25 });
```

---

### 4. FRED (Economic Data)
**Endpoint:** `https://api.stlouisfed.org/fred`

**Rate Limits:** Unlimited (with API key)

**Caching Strategy:** 30 minutes TTL (data updates slowly)

**API Key:** `demo` works for basic access

**Endpoints Used:**
```javascript
// Get economic series data
GET /series/observations?series_id={id}&api_key=demo&file_type=json

// Series IDs we use:
// FEDFUNDS - Federal Funds Rate
// CPIAUCSL - Consumer Price Index (Inflation)
// UNRATE - Unemployment Rate
// GDP - Gross Domestic Product
// DGS10 - 10-Year Treasury Rate
```

---

## 💱 Currency & Exchange APIs

### 5. Frankfurter (Primary Exchange)
**Endpoint:** `https://api.frankfurter.app`

**Rate Limits:** Unlimited (be polite)

**Caching Strategy:** 6 hours TTL (rates don't change fast)

**Endpoints Used:**
```javascript
// Get latest rates
GET /latest?from=USD

// Get specific currencies
GET /latest?from=USD&to=EUR,GBP,JPY

// Historical rates
GET /{date}?from=USD&to=EUR

// Convert amount
GET /latest?amount=100&from=USD&to=EUR
```

---

### 6. ExchangeRate-API (Backup Exchange)
**Endpoint:** `https://api.exchangerate-api.com/v4`

**Rate Limits:** 1,500/month (no key)

**Caching Strategy:** 6 hours TTL, only use as fallback

**Endpoints Used:**
```javascript
// Get all rates for base currency
GET /latest/{base}
// Example: /latest/USD
```

---

## 🌍 Location & Geo APIs

### 7. ipapi.co (Location Detection)
**Endpoint:** `https://ipapi.co/json/`

**Rate Limits:** 1,000/day (no key)

**Caching Strategy:** 24 hours TTL (location rarely changes)

**Response Fields Used:**
```javascript
{
  city: "Baltimore",
  region: "Maryland",
  country_name: "United States",
  country_code: "US",
  latitude: 39.2904,
  longitude: -76.6122,
  timezone: "America/New_York",
  currency: "USD",
  ip: "xxx.xxx.xxx.xxx"
}
```

---

### 8. REST Countries
**Endpoint:** `https://restcountries.com/v3.1`

**Rate Limits:** Unlimited

**Caching Strategy:** 7 days TTL (rarely changes)

**Endpoints Used:**
```javascript
// Get all countries with currencies
GET /all?fields=name,cca2,currencies,flag

// Get specific country
GET /alpha/{code}
```

---

### 9. WorldTimeAPI (Timezone)
**Endpoint:** `https://worldtimeapi.org/api`

**Rate Limits:** Unlimited (be polite)

**Caching Strategy:** 24 hours TTL for timezone, don't cache current time

**Endpoints Used:**
```javascript
// Get time by IP
GET /ip

// Get time by timezone
GET /timezone/{area}/{location}
// Example: /timezone/America/New_York
```

---

## 🎨 UI Enhancement APIs

### 10. Clearbit Logo (Merchant Icons)
**Endpoint:** `https://logo.clearbit.com`

**Rate Limits:** Unlimited (no auth)

**Caching Strategy:** 7 days TTL, cache in localStorage

**Usage:**
```javascript
// Get company logo (returns PNG)
https://logo.clearbit.com/{domain}

// Examples:
https://logo.clearbit.com/netflix.com
https://logo.clearbit.com/amazon.com
https://logo.clearbit.com/spotify.com

// Fallback for failed logos: use category icon
```

**Domain Extraction Logic:**
```javascript
// Convert merchant names to domains
"NETFLIX" → "netflix.com"
"AMAZON PRIME" → "amazon.com"
"SPOTIFY USA" → "spotify.com"
"UBER *EATS" → "uber.com"
```

---

### 11. QuickChart (Export Charts)
**Endpoint:** `https://quickchart.io`

**Rate Limits:** Unlimited (no auth)

**Caching Strategy:** Don't cache (generated on demand)

**Usage:**
```javascript
// Generate chart image
GET /chart?c={chartConfig}&w=600&h=400&f=png

// Chart config is URL-encoded JSON
const config = {
  type: 'pie',
  data: {
    labels: ['Food', 'Transport', 'Entertainment'],
    datasets: [{ data: [300, 150, 100] }]
  }
};

const url = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(config))}`;
```

---

## 📰 News & Content APIs

### 12. News API
**Endpoint:** `https://newsapi.org/v2`

**Rate Limits:** 100 requests/day (dev tier)

**Caching Strategy:** 30 minutes TTL (be very conservative!)

**API Key:** `b04754f709c4439ea8e1a4a280c737cc`

**Endpoints Used:**
```javascript
// Get business news
GET /top-headlines?category=business&apiKey={key}

// Search news
GET /everything?q={query}&apiKey={key}&sortBy=publishedAt&pageSize=10
```

**⚠️ Important:** Only 100 calls/day! Cache aggressively.

---

## 🔧 Utility APIs

### 13. UUIDTools (ID Generation)
**Endpoint:** `https://www.uuidtools.com/api`

**Rate Limits:** Unlimited

**Caching Strategy:** Batch generate 100, cache for 7 days

**Usage:**
```javascript
// Generate single UUID v4
GET /generate/v4

// Generate multiple
GET /generate/v4/count/10

// Response: ["uuid1", "uuid2", ...]
```

---

### 14. Faker API (Demo Data)
**Endpoint:** `https://fakerapi.it/api/v1`

**Rate Limits:** Unlimited

**Caching Strategy:** 24 hours TTL for consistency

**Endpoints Used:**
```javascript
// Generate companies
GET /companies?_quantity=20

// Generate persons
GET /persons?_quantity=10

// Generate addresses
GET /addresses?_quantity=10

// Generate texts (for descriptions)
GET /texts?_quantity=5&_characters=100

// Custom (combine data)
GET /custom?_quantity=50&name=company&amount=counter&date=date
```

---

### 15. Random User Generator
**Endpoint:** `https://randomuser.me/api`

**Rate Limits:** Unlimited (be polite, 1 req/sec)

**Caching Strategy:** 7 days TTL (user profiles for demo)

**Usage:**
```javascript
// Generate users
GET /?results=5&inc=name,email,picture,location

// Response includes profile photos!
{
  results: [{
    name: { first: "John", last: "Doe" },
    email: "john@example.com",
    picture: {
      thumbnail: "https://randomuser.me/api/portraits/thumb/men/1.jpg",
      medium: "https://randomuser.me/api/portraits/med/men/1.jpg"
    }
  }]
}
```

---

### 16. Abstract Email Verification
**Endpoint:** `https://emailvalidation.abstractapi.com/v1`

**Rate Limits:** 100/month (free tier)

**Caching Strategy:** 30 days TTL per email

**API Key:** `c06de9698fc14b549cc7ceea8ad2e6d1`

**Usage:**
```javascript
GET /?api_key={key}&email={email}

// Response:
{
  email: "test@example.com",
  deliverability: "DELIVERABLE",
  is_valid_format: true,
  is_disposable_email: false,
  is_mx_found: true
}
```

**⚠️ Important:** Only 100/month! Cache results forever once validated.

---

## 🔜 Future APIs (Not Yet Integrated)

### OCR.space (Receipt Scanning)
**Endpoint:** `https://api.ocr.space/parse/image`

**Rate Limits:** 500/month (free tier)

**Use Case:** Upload receipt → Extract text → Create transaction

---

## 📈 API Call Budget Calculator

### Daily Budget (Conservative)

| API | Calls/Day | Current Usage | Remaining |
|-----|-----------|---------------|-----------|
| CoinGecko | 1800 (30/min) | ~200 | 1600 |
| CoinMarketCap | 333 | ~50 | 283 |
| News API | 100 | ~30 | 70 |
| ipapi.co | 1000 | ~5 | 995 |
| ExchangeRate-API | 50/day avg | ~10 | 40 |

### Monthly Budget

| API | Calls/Month | Status |
|-----|-------------|--------|
| Abstract Email | 100 | Be careful |
| ExchangeRate-API | 1500 | OK |
| OCR.space (future) | 500 | Reserved |

---

## 🛡️ Rate Limit Protection

### Caching Strategy Per API

```typescript
const CACHE_STRATEGY = {
  // Aggressive caching (high rate limit cost)
  news: { ttl: '30min', storage: 'session' },
  email: { ttl: '30days', storage: 'local' },
  
  // Moderate caching
  crypto: { ttl: '1min', storage: 'session' },
  stocks: { ttl: '1min', storage: 'session' },
  
  // Light caching (unlimited APIs)
  logos: { ttl: '7days', storage: 'local' },
  countries: { ttl: '7days', storage: 'local' },
  timezone: { ttl: '24hours', storage: 'session' },
};
```

### Fallback Chain

```
Crypto: CoinGecko → CoinMarketCap → Cached data
Exchange: Frankfurter → ExchangeRate-API → Cached data
Location: ipapi.co → Cached data → Default (USD)
Logos: Clearbit → Category icon → First letter avatar
```

---

## 🚀 Quick Reference

### No Auth Required (Unlimited)
- Frankfurter
- Clearbit Logo
- WorldTimeAPI
- QuickChart
- UUIDTools
- Faker API
- Random User
- REST Countries

### No Auth Required (Limited)
- ipapi.co (1000/day)
- ExchangeRate-API (1500/month)
- CoinGecko (50/min without key)

### Auth Required
- CoinGecko with key (30/min)
- CoinMarketCap (333/day)
- News API (100/day)
- Abstract Email (100/month)
- FRED (unlimited with demo key)

---

## 📝 Notes

1. **Always check cache first** before making API calls
2. **Use fallbacks** for critical features (crypto, exchange)
3. **Be polite** even to unlimited APIs (1 req/sec max)
4. **Log API usage** in dev mode for monitoring
5. **Never expose API keys** in client-side code
6. **Rotate through data sources** when possible to spread load
