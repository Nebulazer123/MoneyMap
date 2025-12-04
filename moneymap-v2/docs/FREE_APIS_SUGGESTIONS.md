# Free APIs for MoneyMap Enhancement

## 🎯 Finance & Market Data

### 1. **Alpha Vantage** (Already have Yahoo Finance, but this is a backup)
- **What it offers**: Stock data, forex, crypto, technical indicators
- **Free tier**: 25 API calls/day
- **Best for**: Technical analysis indicators, forex rates
- **Setup**: Get API key at alphavantage.co
```javascript
// Example: Get forex rates for currency conversion
fetch('https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=USD&to_currency=EUR&apikey=YOUR_KEY')
```

### 2. **CoinGecko** ⭐ HIGHLY RECOMMENDED
- **What it offers**: Cryptocurrency prices, market data, trending coins
- **Free tier**: 10-50 calls/minute (no API key needed!)
- **Best for**: Adding a crypto portfolio tab alongside stocks
- **Setup**: None needed! Just call the API
```javascript
// Get top 100 cryptos with market data
fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100')
```

### 3. **Finnhub** ⭐ RECOMMENDED
- **What it offers**: Stock data, news, earnings calendar, economic calendar
- **Free tier**: 60 calls/minute
- **Best for**: Financial news, earnings dates, company news
- **Setup**: Free API key at finnhub.io
```javascript
// Get company news
fetch('https://finnhub.io/api/v1/company-news?symbol=AAPL&from=2024-01-01&to=2024-12-31&token=YOUR_KEY')
```

---

## 💰 Banking & Payments

### 4. **Plaid** (Limited free)
- **What it offers**: Bank account linking, transaction data
- **Free tier**: Development sandbox only (100 items)
- **Best for**: Real bank account integration (requires user bank login)
- **Note**: Production requires payment, but sandbox is great for demos

---

## 📊 Economic Data

### 5. **FRED API** (Federal Reserve Economic Data) ⭐ HIGHLY RECOMMENDED
- **What it offers**: Interest rates, inflation, unemployment, GDP, economic indicators
- **Free tier**: Unlimited (requires free API key)
- **Best for**: Dashboard widgets showing economic trends
- **Setup**: Get key at fred.stlouisfed.org/docs/api
```javascript
// Get current federal funds rate
fetch('https://api.stlouisfed.org/fred/series/observations?series_id=FEDFUNDS&api_key=YOUR_KEY&file_type=json')
```

### 6. **Exchange Rates API** ⭐ RECOMMENDED
- **What it offers**: Currency exchange rates, historical rates
- **Free tier**: 1,500 requests/month (no API key!)
- **Best for**: Multi-currency support in your app
- **Setup**: None needed!
```javascript
// Get current exchange rates
fetch('https://api.exchangerate-api.com/v4/latest/USD')
```

---

## 📈 Data Visualization

### 7. **News API**
- **What it offers**: Business news, headlines from major sources
- **Free tier**: 100 requests/day
- **Best for**: Financial news feed on dashboard
- **Setup**: Get key at newsapi.org
```javascript
// Get business news
fetch('https://newsapi.org/v2/top-headlines?category=business&apiKey=YOUR_KEY')
```

---

## 🌐 General Utilities

### 8. **IP Geolocation API**
- **What it offers**: User location, timezone, currency detection
- **Free tier**: 1,000 requests/day
- **Best for**: Auto-detecting user's currency preference
- **Setup**: Get key at ipgeolocation.io

### 9. **OpenWeatherMap**
- **What it offers**: Weather data
- **Free tier**: 1,000 calls/day
- **Best for**: Could show weather on dashboard (fun feature!)
- **Setup**: Get key at openweathermap.org

---

## 🎨 My Top 3 Recommendations for MoneyMap

### 1️⃣ **CoinGecko** - Add Crypto Portfolio Tab
- No API key needed
- Perfect companion to your stocks page
- Shows Bitcoin, Ethereum, trending cryptos
- **Implementation**: Create `src/app/dashboard/crypto/page.tsx` similar to stocks

### 2️⃣ **FRED API** - Economic Dashboard Widget
- Show key economic indicators (interest rates, inflation, unemployment)
- Free unlimited access
- Great for a "Market Overview" section
- **Implementation**: Small widget on overview page showing Fed rate, inflation, etc.

### 3️⃣ **Exchange Rates API** - Multi-Currency Support
- No API key needed
- Let users view portfolio in EUR, GBP, JPY, etc.
- 1,500 free requests/month is plenty
- **Implementation**: Currency selector dropdown in settings

---

## 🚀 Quick Win Implementation Order

1. **CoinGecko Crypto** (30 min) - Copy stocks page, swap API
2. **Exchange Rates** (15 min) - Add currency converter to settings
3. **FRED Economic Widget** (20 min) - Small card on overview showing Fed rate
4. **News API** (25 min) - Financial news feed sidebar

---

## 📝 Notes

- All these APIs work with simple `fetch()` calls (no special libraries needed)
- Most don't require API keys for basic usage
- Rate limits are generous for personal projects
- Can be implemented incrementally without breaking existing features

Would you like me to implement any of these? I recommend starting with CoinGecko crypto since you already have the stocks page structure built!
