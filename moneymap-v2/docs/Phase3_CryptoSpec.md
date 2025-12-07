# Phase 3 – Crypto Tab Specification

## Overview
The Crypto tab has been migrated from CoinGecko to Yahoo Finance to improve reliability and consistency with the Stocks tab. This document outlines the new data source, symbol formats, and UI behavior.

## Data Source
- **API**: Yahoo Finance (`yahoo-finance2`) via `src/app/api/crypto/route.ts`.
- **Rate Limit**: 30 requests per minute per client IP.
- **Refresh Interval**: 5 minutes (300000ms).

## Symbol Format
- **Format**: `SYMBOL-USD` (e.g., `BTC-USD`, `ETH-USD`).
- **Mapping**: CoinGecko legacy IDs (e.g., `bitcoin`) are **no longer supported** in component state but are handled as a fallback in the API for legacy queries.
- **Metadata**: Display names, symbols, and types are mapped in `src/lib/cryptoHelpers.ts`.
  - Example: `'BTC-USD' -> { displayName: 'Bitcoin', symbol: 'BTC', type: 'Layer 1 Coin' }`

## Component Behavior
- **Data Fetching**:
  - Automatically fetches quotes for default cryptos, user holdings, and watchlist items on mount and every 5 minutes.
- **Holdings Display**:
  - Uses `cryptoHelpers.ts` to resolve friendly names (e.g., "Bitcoin") from Yahoo symbols.
  - Runtime crash for news feed fixed with null/array guards.
- **Converter**:
  - Located at the bottom of the page.
- **Search**:
  - Queries Yahoo Finance for matching symbols.
