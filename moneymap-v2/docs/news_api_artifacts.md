# News API Artifacts

**Date:** December 7, 2025

## Working News Categories

Tested via direct API calls to `/api/news?category=...` using NewsAPI `/top-headlines` endpoint.

| Category | API String | Works? |
|----------|------------|--------|
| Business | `business` | ✅ Yes |
| Technology | `technology` | ✅ Yes |
| General | `general` | ✅ Yes |
| Science | `science` | ✅ Yes |
| Financial | `financial` | ❌ No (invalid) |
| Stock | `stock` | ❌ No (invalid) |
| Cryptocurrency | `cryptocurrency` | ❌ No (invalid) |

**Selected for UI:** `business`, `technology`, `general`, `science`

## Sample Article Titles (from browser testing)

**Category: `business`**
1. "Japan's Higher Rates Puts Bitcoin in the Crosshairs of a Yen Carry Unwind"
2. (Multiple business articles returned)

**Category: `technology`**
1. "From Top To Bottom: Bitcoin's Largest & Smallest Hands Both Now Accumulating"
2. (Multiple technology articles returned)

**Search Query: `bitcoin`**
1. "Japan's Higher Rates Puts Bitcoin in the Crosshairs of a Yen Carry Unwind"
2. "From Top To Bottom: Bitcoin's Largest & Smallest Hands Both Now Accumulating"

## Notes

- NewsAPI `/top-headlines` only supports: `business`, `entertainment`, `general`, `health`, `science`, `sports`, `technology`
- Custom categories like "financial", "stock", "cryptocurrency" are NOT valid and return empty results
- Search via `/everything?q=` endpoint works for keyword queries
