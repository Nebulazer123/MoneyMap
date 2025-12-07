# Phase 3 Stocks Baseline Specification

**Created:** 2025-12-07  
**Objective:** Baseline fixes for Stocks tab per Phase2_QA_Checklist.md section G

---

## Implemented Features

### G1: Currency Converter Position ✅
- **Moved** `FiatCurrencyConverter` from top of page (line ~690) to **bottom** (before closing GlassCard)
- Converter now appears after all stock content, matching Crypto tab layout

### G3: Search Suggestions Before Typing ✅
- **Added** `POPULAR_SUGGESTIONS` constant with 8 popular tickers (AAPL, MSFT, NVDA, etc.)
- **Implemented** `searchFocused` state to track when search input has focus
- **Shows** modal with popular stock suggestions when:
  - Search input is focused AND
  - Search query is empty
- Clicking a suggestion populates the search query

### G4: Relevance-Sorted Search Results ✅
- **Updated** `searchStocks` function with comprehensive sorting logic:
  1. Exact symbol matches first
  2. Symbols starting with query
  3. Names starting with query
  4. Alphabetical by symbol
- Results now appear in sensible order (e.g., searching "NVDA" shows NVDA first)

### G12: Watchlist Visibility ✅
- **Confirmed** Watchlist section already exists (line ~1317)
- Displays all watched stocks with:
  - Star icon header
  - Price, change, and percentage
  - Click to expand for details
  - Remove from watchlist button
- Watchlist updates reactively when stocks are added/removed via star button

### G14: Auto-Refresh Interval ✅
- **Changed** refresh interval from `60000ms` (60s) to `300000ms` (5 minutes)
- **Updated** display text from "Auto-refresh every 60s" to "Auto-refresh every 5min"
- Manual refresh button still available for immediate updates

---

## Configuration Constants

### Popular Suggestions (G3)
```typescript
const POPULAR_SUGGESTIONS: SearchResult[] = [
    { symbol: 'AAPL', name: 'Apple Inc.' },
    { symbol: 'MSFT', name: 'Microsoft Corporation' },
    { symbol: 'NVDA', name: 'NVIDIA Corporation' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.' },
    { symbol: 'TSLA', name: 'Tesla Inc.' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.' },
    { symbol: 'META', name: 'Meta Platforms Inc.' },
    { symbol: 'SPY', name: 'SPDR S&P 500 ETF Trust' },
];
```

### Refresh Interval (G14)
- **Auto-refresh**: `300000ms` (5 minutes)
- **Market status update**: `60000ms` (1 minute) - unchanged

---

## Future Enhancements (Deferred)

The following items from section G were marked as **future slices**:
- G5-G11: Rich stock detail, Motley Fool links, compare tool, overnight tab
- These require more extensive API integration and UI work

---

## Files Modified

| File | Change |
|------|--------|
| `src/components/dashboard/Stocks.tsx` | All baseline fixes |

**Lines Modified:**
- ~205: Added POPULAR_SUGGESTIONS constant
- ~288: Added searchFocused state
- ~353-394: Updated searchStocks with relevance sorting
- ~481: Changed interval to 300000ms
- ~800: Updated display text to "5min"
- ~864-865: Added onFocus/onBlur handlers
- ~874-903: Added popular suggestions modal
- ~1830-1835: Moved FiatCurrencyConverter to bottom

---

## Testing Checklist

- [ ] Converter appears at bottom of page and still works
- [ ] Focusing empty search shows popular suggestions modal
- [ ] Clicking a suggestion searches for that stock
- [ ] Searching "NVDA" shows NVDA at top of results
- [ ] Watchlist section is visible and functional
- [ ] Adding/removing stocks updates watchlist immediately
- [ ] Pricesrefresh every 5 minutes (or via manual refresh)
