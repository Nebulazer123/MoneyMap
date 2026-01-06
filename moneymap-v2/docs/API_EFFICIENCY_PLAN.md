# API Efficiency Audit & Optimization Plan

> **Last Updated:** January 2025  
> **Scope:** Complete audit of all API routes, hooks, caching, rate limiting, retries, and fallbacks

---

## Executive Summary

This document provides a comprehensive audit of all API integrations in MoneyMap v2, identifying efficiency issues, rate limit risks, missing caching/retries, and unused/broken integrations. **Priorities are ranked by impact and risk.**

---

## Critical Issues: APIs That "Run Out Too Fast"

### 🔴 **P0: News API - Only 100 calls/day** 
**Files:** `moneymap-v2/src/app/api/news/route.ts`, `moneymap-v2/src/lib/cache/useUtilities.ts`

**Problem:**
- Extremely low daily limit (100 calls/day = ~4 calls/hour)
- Currently rate-limited to 10/min on server, but daily quota exhaustion risk
- **NO RETRY MECHANISM** - single fetch attempt, fails immediately on error
- Client-side cache (30 min TTL) helps but doesn't prevent exhaustion during active browsing

**Current State:**
- ✅ Server-side caching: 30 minutes
- ✅ Rate limiting: 10 requests/minute per IP
- ❌ No retry logic
- ✅ Fallback: Returns stale cache on error
- ⚠️ Client hooks use `staleWhileRevalidate: true` which can trigger background refreshes

**Risk Assessment:**
- **HIGH** - Daily quota can be exhausted in minutes if users refresh news frequently
- **Impact:** News feed becomes unavailable for remainder of day

**Recommendations:**
1. Extend server cache TTL to 1-2 hours for headlines (news doesn't change that frequently)
2. Add exponential backoff retry (max 2 retries with 5s delay)
3. Disable `staleWhileRevalidate` for news hooks to prevent background refresh storms
4. Add client-side debouncing (500ms) for news search queries
5. Consider implementing a "news quota remaining" indicator in UI

---

### 🔴 **P0: Abstract Email Verification - Only 100 calls/month**
**Files:** `moneymap-v2/src/app/api/verification/route.ts`, `moneymap-v2/src/lib/cache/useUtilities.ts`

**Problem:**
- **LOWEST** quota of all APIs: 100 calls/month (~3/day average)
- In-memory cache (30 days) is good but **NOT PERSISTENT** - lost on server restart
- **NO RATE LIMITING** on server route
- **NO RETRY MECHANISM**
- Client cache TTL is 30 days but doesn't prevent new verifications from burning quota

**Current State:**
- ✅ In-memory server cache: 30 days
- ❌ No server-side rate limiting
- ❌ No retry logic
- ✅ Client-side cache: 30 days in localStorage
- ⚠️ `staleWhileRevalidate: false` - good, prevents background refreshes

**Risk Assessment:**
- **CRITICAL** - Monthly quota can be exhausted in one day if feature is used frequently
- **Impact:** Email verification unavailable for entire month

**Recommendations:**
1. **MANDATORY:** Add server-side rate limiting (e.g., 5 verifications/hour per IP)
2. Add persistent cache (database or Redis) for email verifications (never expires for valid emails)
3. Add client-side validation (regex) before calling API - already implemented ✅
4. Add quota tracking/logging to monitor usage
5. Consider implementing a fallback email format validator (regex only) when quota exhausted

---

### 🟠 **P1: ExchangeRate-API (Backup) - 1,500 calls/month (~50/day)**
**Files:** `moneymap-v2/src/app/api/exchange/route.ts`

**Problem:**
- Used as fallback for Frankfurter (primary) - good design
- BUT: If Frankfurter frequently fails, this quota will be exhausted quickly
- **NO RETRY MECHANISM** on primary (Frankfurter)

**Current State:**
- ✅ Primary/fallback pattern implemented
- ✅ Server-side caching: 6 hours
- ❌ No retry logic on primary API
- ✅ Stale cache fallback on both API failures

**Risk Assessment:**
- **MEDIUM** - Protected by 6-hour cache, but if primary fails repeatedly, backup quota burns

**Recommendations:**
1. Add retry logic (2 retries, exponential backoff) for Frankfurter before falling back
2. Monitor fallback usage frequency to detect if Frankfurter reliability issues
3. Consider a third fallback API if ExchangeRate-API quota becomes a concern

---

### 🟠 **P1: ipapi.co Location - 1,000 calls/day**
**Files:** `moneymap-v2/src/app/api/location/route.ts`, `moneymap-v2/src/lib/cache/useUtilities.ts`

**Problem:**
- 24-hour server cache is good BUT: Location is often called on every page load/SSR
- **NO RETRY MECHANISM**
- Rate limiting (50/hour per IP) helps but daily quota can still be hit

**Current State:**
- ✅ Server-side caching: 24 hours
- ✅ Rate limiting: 50 requests/hour per IP
- ❌ No retry logic
- ✅ Fallback: Returns US defaults on error

**Risk Assessment:**
- **MEDIUM** - Daily quota protects against abuse, but high-traffic scenarios could exhaust

**Recommendations:**
1. Add retry logic (1-2 retries) before falling back to defaults
2. Consider extending cache TTL to 48 hours (location rarely changes for a user)
3. Implement client-side localStorage caching for user's location (never expires until manually cleared)

---

## Missing Caching & Rate Limiting

### 🟡 **P2: Time API - No Server Cache**
**Files:** `moneymap-v2/src/app/api/time/route.ts`, `moneymap-v2/src/lib/cache/useUtilities.ts`

**Issue:**
- **NO server-side caching** - every request hits WorldTimeAPI
- Client cache is 1 minute (too short for timezone data)
- No rate limiting on server route
- WorldTimeAPI is unlimited but unnecessary calls waste resources

**Current State:**
- ❌ No server-side cache
- ❌ No rate limiting
- ✅ Client-side cache: 1 minute
- ✅ Fallback: Returns server time on error

**Recommendations:**
1. Add server-side cache: 24 hours for timezone metadata, don't cache current time
2. Add rate limiting: 60 requests/hour per IP
3. Consider caching timezone data separately from current time (timezone rarely changes)

---

### 🟡 **P2: Countries API - No Server Cache**
**Files:** `moneymap-v2/src/app/api/countries/route.ts`, `moneymap-v2/src/lib/cache/useUtilities.ts`

**Issue:**
- **NO server-side caching** - every request hits REST Countries
- Client cache (7 days) helps but SSR/API calls bypass client cache
- No rate limiting (unlimited API but wasteful)

**Current State:**
- ❌ No server-side cache
- ❌ No rate limiting
- ✅ Client-side cache: 7 days
- ✅ Fallback: Returns common currencies on error

**Recommendations:**
1. Add server-side cache: 7 days (countries don't change often)
2. Consider adding rate limiting (100 requests/hour per IP) even though API is unlimited

---

### 🟡 **P2: Economy API - No Rate Limiting**
**Files:** `moneymap-v2/src/app/api/economy/route.ts`, `moneymap-v2/src/lib/cache/useUtilities.ts`

**Issue:**
- Uses FRED API with demo key (unlimited but should be polite)
- Server cache (1 hour) is good
- **NO rate limiting** on server route

**Current State:**
- ✅ Server-side cache: 1 hour
- ❌ No rate limiting
- ✅ Client-side cache: 1 hour

**Recommendations:**
1. Add rate limiting: 30 requests/hour per IP (economic data doesn't need frequent updates)

---

### 🟡 **P2: Weather API - UNUSED BUT UNGUARDED**
**Files:** `moneymap-v2/src/app/api/weather/route.ts`

**Issue:**
- **NOT USED ANYWHERE** in codebase (unused route)
- **NO caching, NO rate limiting, NO retry logic**
- If activated later, could exhaust OpenWeatherMap quota quickly

**Current State:**
- ❌ No server-side cache
- ❌ No rate limiting
- ❌ No retry logic
- ⚠️ **UNUSED** - not referenced in any component or hook

**Recommendations:**
1. **OPTION A:** Delete route (cleanup unused code)
2. **OPTION B:** Add full caching, rate limiting, retry logic if planning to use it
3. Add feature flag check if keeping it for future use

---

### 🟡 **P2: Charts API - No Caching (By Design)**
**Files:** `moneymap-v2/src/app/api/charts/route.ts`

**Issue:**
- Uses QuickChart API (unlimited)
- Intentionally not cached (charts are generated on demand)
- No rate limiting (unlimited API)

**Current State:**
- ❌ No caching (intentional)
- ❌ No rate limiting
- ⚠️ Charts are generated on demand - could be expensive if abused

**Recommendations:**
1. Add rate limiting: 100 requests/hour per IP (prevent abuse)
2. Consider caching chart URLs for identical configs (short TTL, 5 minutes)

---

### 🟡 **P2: UUID API - No Caching, No Rate Limiting**
**Files:** `moneymap-v2/src/app/api/uuid/route.ts`, `moneymap-v2/src/lib/cache/useUtilities.ts`

**Issue:**
- Uses UUIDTools API (unlimited)
- No server-side caching
- No rate limiting
- Has browser fallback (crypto.randomUUID) ✅

**Current State:**
- ❌ No server-side cache
- ❌ No rate limiting
- ✅ Fallback: Uses browser crypto.randomUUID() on error

**Recommendations:**
1. Consider using browser crypto.randomUUID() directly (no need for external API)
2. If keeping API, add rate limiting: 200 requests/hour per IP
3. Batch UUID generation on server-side if multiple needed

---

### 🟡 **P2: Faker API - No Server Cache**
**Files:** `moneymap-v2/src/app/api/faker/route.ts`

**Issue:**
- Uses FakerAPI.it (unlimited)
- No server-side caching
- No rate limiting
- Client cache is 24 hours (good for consistency)

**Current State:**
- ❌ No server-side cache
- ❌ No rate limiting
- ✅ Client-side cache: 24 hours

**Recommendations:**
1. Add server-side cache: 24 hours (demo data consistency)
2. Add rate limiting: 50 requests/hour per IP

---

### 🟡 **P2: Users API - No Server Cache**
**Files:** `moneymap-v2/src/app/api/users/route.ts`, `moneymap-v2/src/lib/cache/useUtilities.ts`

**Issue:**
- Uses RandomUser.me (unlimited, be polite)
- No server-side caching
- No rate limiting
- Client cache is 30 minutes

**Current State:**
- ❌ No server-side cache
- ❌ No rate limiting
- ✅ Client-side cache: 30 minutes
- ✅ Fallback: Returns placeholder users on error

**Recommendations:**
1. Add server-side cache: 7 days (user profiles for demo)
2. Add rate limiting: 30 requests/hour per IP

---

### 🟡 **P2: Logos API - No Server Cache (By Design)**
**Files:** `moneymap-v2/src/app/api/logos/route.ts`, `moneymap-v2/src/lib/cache/useUtilities.ts`

**Issue:**
- Uses Clearbit Logo API (unlimited)
- No server-side caching (logos are images, returned as URLs)
- No rate limiting
- Client mentions 7-day cache but route doesn't implement it

**Current State:**
- ❌ No server-side cache (returns URL only)
- ❌ No rate limiting
- ⚠️ Client hook mentions 7-day cache but doesn't actually cache

**Recommendations:**
1. Add rate limiting: 100 requests/hour per IP
2. Client-side should cache logo URLs in localStorage (7 days) - currently not implemented

---

## Missing Retry Logic

### 🟡 **P2: No Retry Logic on Multiple Routes**

The following routes have **NO RETRY MECHANISM** and fail immediately on error:

1. **Crypto API** (`moneymap-v2/src/app/api/crypto/route.ts`)
   - Uses Yahoo Finance (library handles some retries internally)
   - Server cache fallback ✅
   - **Recommendation:** Add 1-2 retries for network errors (not rate limits)

2. **Stocks API** (`moneymap-v2/src/app/api/stocks/route.ts`)
   - Uses Yahoo Finance (library handles some retries internally)
   - Server cache fallback ✅
   - **Recommendation:** Add 1-2 retries for network errors

3. **Economy API** (`moneymap-v2/src/app/api/economy/route.ts`)
   - Uses FRED API
   - Server cache fallback ✅
   - **Recommendation:** Add 1 retry with 2s delay

4. **Countries API** (`moneymap-v2/src/app/api/countries/route.ts`)
   - Uses REST Countries
   - Fallback data ✅
   - **Recommendation:** Add 1 retry with 1s delay

5. **Time API** (`moneymap-v2/src/app/api/time/route.ts`)
   - Uses WorldTimeAPI
   - Fallback: Server time ✅
   - **Recommendation:** Add 1 retry with 1s delay

---

## Unused/Broken Integrations

### 🟢 **P3: Weather API - Completely Unused**
**Files:** `moneymap-v2/src/app/api/weather/route.ts`

**Status:** **UNUSED** - No references in codebase

**Evidence:**
- No grep results for `/api/weather` in source code
- Not imported in any component
- Not used in any hook (`useUtilities.ts` mentions weather but doesn't export hook)

**Recommendation:**
- **DELETE** or mark as future feature with feature flag
- If keeping, add full protection (caching, rate limiting, retries)

---

### 🟢 **P3: CoinGecko/CoinMarketCap - Legacy Code?**
**Files:** `moneymap-v2/src/app/api/crypto/route.ts`

**Status:** **CHECK** - Documentation mentions CoinGecko/CoinMarketCap but code uses Yahoo Finance

**Evidence:**
- `APIS_INTEGRATED.md` lists CoinGecko as primary crypto API
- Actual code in `crypto/route.ts` uses Yahoo Finance via `yahoo-finance2` library
- No CoinGecko or CoinMarketCap API calls in code

**Recommendation:**
- **VERIFY:** Check if this is intentional migration from CoinGecko to Yahoo Finance
- Update documentation to reflect actual implementation
- Remove unused API keys if CoinGecko/CoinMarketCap not used

---

## Server-Side Cache Issues

### 🟡 **P2: Server Cache In-Memory Only**

**Files:** `moneymap-v2/src/lib/cache/serverCache.ts`

**Issue:**
- In-memory cache (Map) clears on serverless function restart
- This is acceptable for most use cases BUT:
  - Email verification cache should be persistent (30-day TTL, quota is monthly)
  - High-traffic scenarios will have lower cache hit rates

**Current State:**
- ✅ In-memory cache with TTL
- ✅ Automatic cleanup (5-minute intervals)
- ❌ Not persistent across serverless restarts

**Recommendations:**
1. For email verification: Consider persistent storage (database/Redis) or longer client-side cache
2. For other APIs: Current approach is acceptable for serverless
3. Monitor cache hit rates in production

---

### 🟡 **P2: Rate Limiter In-Memory Only**

**Files:** `moneymap-v2/src/lib/cache/rateLimiter.ts`

**Issue:**
- In-memory rate limiting clears on serverless restart
- Rate limits reset on each cold start (could allow brief bursts)
- Cleanup interval (1 minute) may not run in short-lived serverless functions

**Current State:**
- ✅ In-memory rate limiting with TTL
- ✅ Automatic cleanup (1-minute intervals)
- ❌ Not persistent across serverless restarts

**Recommendations:**
1. For critical APIs (News, Email): Consider distributed rate limiting (Redis/Vercel KV)
2. For other APIs: Current approach is acceptable
3. Monitor rate limit effectiveness in production

---

## Client-Side Caching Issues

### 🟡 **P2: Stale-While-Revalidate May Cause Refresh Storms**

**Files:** `moneymap-v2/src/lib/cache/useCache.ts`, `moneymap-v2/src/lib/cache/useStocks.ts`, `moneymap-v2/src/lib/cache/useCrypto.ts`

**Issue:**
- Many hooks use `staleWhileRevalidate: true`
- When cache expires, hook returns stale data AND triggers background refresh
- Multiple components using same hook = multiple parallel refresh requests
- For News API (100/day), this can exhaust quota quickly

**Current State:**
- ✅ Request deduplication (in-flight requests tracked)
- ⚠️ Stale-while-revalidate can cause multiple refreshes if many components mount simultaneously

**Recommendations:**
1. For News API hooks: Set `staleWhileRevalidate: false`
2. For Email Verification: Already set to `false` ✅
3. Consider global request deduplication across all hooks (not just per-hook)

---

## Priority Summary

### **P0 - Critical (Fix Immediately)**
1. **News API** - Add extended caching, disable stale-while-revalidate, add retry logic
2. **Abstract Email Verification** - Add rate limiting, persistent cache, quota tracking

### **P1 - High (Fix Soon)**
3. **ExchangeRate-API** - Add retry logic on primary API
4. **ipapi.co Location** - Add retry logic, extend cache

### **P2 - Medium (Fix When Convenient)**
5. **Time API** - Add server-side cache and rate limiting
6. **Countries API** - Add server-side cache and rate limiting
7. **Economy API** - Add rate limiting
8. **Weather API** - Delete or add full protection
9. **Charts API** - Add rate limiting
10. **UUID API** - Consider using browser API directly
11. **Faker API** - Add server-side cache and rate limiting
12. **Users API** - Add server-side cache and rate limiting
13. **Logos API** - Add rate limiting, implement client-side URL caching
14. **All Routes** - Add retry logic (exponential backoff) for network errors

### **P3 - Low (Cleanup)**
15. **Weather API** - Remove unused code
16. **CoinGecko/CoinMarketCap** - Update documentation to match implementation

---

## Implementation Checklist

### Phase 1: Critical Fixes (P0)

- [ ] **News API** (`moneymap-v2/src/app/api/news/route.ts`)
  - [ ] Extend server cache TTL to 2 hours
  - [ ] Add exponential backoff retry (max 2 retries)
  - [ ] Disable `staleWhileRevalidate` in `useNews` hook
  - [ ] Add client-side debouncing (500ms) for news search

- [ ] **Email Verification** (`moneymap-v2/src/app/api/verification/route.ts`)
  - [ ] Add server-side rate limiting (5/hour per IP)
  - [ ] Add quota tracking/logging
  - [ ] Consider persistent storage for email cache (or extend client cache)
  - [ ] Add better error messages when quota exhausted

### Phase 2: High Priority (P1)

- [ ] **Exchange API** (`moneymap-v2/src/app/api/exchange/route.ts`)
  - [ ] Add retry logic (2 retries, exponential backoff) for Frankfurter before fallback

- [ ] **Location API** (`moneymap-v2/src/app/api/location/route.ts`)
  - [ ] Add retry logic (1-2 retries)
  - [ ] Consider extending cache to 48 hours or adding localStorage persistence

### Phase 3: Medium Priority (P2)

- [ ] **Time API** (`moneymap-v2/src/app/api/time/route.ts`)
  - [ ] Add server-side cache (24 hours for timezone data)
  - [ ] Add rate limiting (60/hour per IP)

- [ ] **Countries API** (`moneymap-v2/src/app/api/countries/route.ts`)
  - [ ] Add server-side cache (7 days)
  - [ ] Add rate limiting (100/hour per IP)

- [ ] **Economy API** (`moneymap-v2/src/app/api/economy/route.ts`)
  - [ ] Add rate limiting (30/hour per IP)

- [ ] **Weather API** (`moneymap-v2/src/app/api/weather/route.ts`)
  - [ ] DECISION: Delete or add full protection
  - [ ] If keeping: Add cache, rate limiting, retry logic

- [ ] **Charts API** (`moneymap-v2/src/app/api/charts/route.ts`)
  - [ ] Add rate limiting (100/hour per IP)

- [ ] **UUID API** (`moneymap-v2/src/app/api/uuid/route.ts`)
  - [ ] DECISION: Use browser crypto.randomUUID() directly or add rate limiting

- [ ] **Faker API** (`moneymap-v2/src/app/api/faker/route.ts`)
  - [ ] Add server-side cache (24 hours)
  - [ ] Add rate limiting (50/hour per IP)

- [ ] **Users API** (`moneymap-v2/src/app/api/users/route.ts`)
  - [ ] Add server-side cache (7 days)
  - [ ] Add rate limiting (30/hour per IP)

- [ ] **Logos API** (`moneymap-v2/src/app/api/logos/route.ts`)
  - [ ] Add rate limiting (100/hour per IP)
  - [ ] Implement client-side URL caching in `useUtilities.ts`

- [ ] **All Routes** - Add retry logic helper
  - [ ] Create shared retry utility (`lib/utils/retry.ts`)
  - [ ] Add retry logic to all routes with external API calls

### Phase 4: Cleanup (P3)

- [ ] **Weather API** - Remove if unused
- [ ] **Documentation** - Update `APIS_INTEGRATED.md` to reflect actual implementations

---

## File Reference Index

### API Routes
- `moneymap-v2/src/app/api/crypto/route.ts` - Yahoo Finance crypto data
- `moneymap-v2/src/app/api/stocks/route.ts` - Yahoo Finance stock data
- `moneymap-v2/src/app/api/exchange/route.ts` - Currency exchange (Frankfurter + ExchangeRate-API)
- `moneymap-v2/src/app/api/news/route.ts` - News API (100/day) ⚠️
- `moneymap-v2/src/app/api/location/route.ts` - ipapi.co (1000/day)
- `moneymap-v2/src/app/api/weather/route.ts` - OpenWeatherMap (UNUSED) ⚠️
- `moneymap-v2/src/app/api/time/route.ts` - WorldTimeAPI
- `moneymap-v2/src/app/api/countries/route.ts` - REST Countries
- `moneymap-v2/src/app/api/economy/route.ts` - FRED API
- `moneymap-v2/src/app/api/verification/route.ts` - Abstract Email (100/month) ⚠️
- `moneymap-v2/src/app/api/logos/route.ts` - Clearbit Logo
- `moneymap-v2/src/app/api/charts/route.ts` - QuickChart
- `moneymap-v2/src/app/api/uuid/route.ts` - UUIDTools
- `moneymap-v2/src/app/api/faker/route.ts` - Faker API
- `moneymap-v2/src/app/api/users/route.ts` - RandomUser.me

### Cache & Rate Limiting Utilities
- `moneymap-v2/src/lib/cache/serverCache.ts` - Server-side cache
- `moneymap-v2/src/lib/cache/CacheManager.ts` - Client-side cache manager
- `moneymap-v2/src/lib/cache/rateLimiter.ts` - Rate limiting utility

### Hooks
- `moneymap-v2/src/lib/cache/useCache.ts` - Base cache hook
- `moneymap-v2/src/lib/cache/useCrypto.ts` - Crypto hooks
- `moneymap-v2/src/lib/cache/useStocks.ts` - Stock hooks
- `moneymap-v2/src/lib/cache/useUtilities.ts` - Utility hooks (exchange, location, news, etc.)

### Documentation
- `moneymap-v2/docs/APIS_INTEGRATED.md` - API documentation (may be outdated)
- `docs/MONEYMAP_FULL_INVENTORY.md` - Inventory documentation

---

## Notes

- All rate limits are **per IP address** (using `x-forwarded-for` or `x-real-ip` headers)
- Server-side cache is **in-memory** and clears on serverless function restart
- Client-side cache uses **sessionStorage** (default) or **localStorage** (for long-lived data)
- Retry logic should use **exponential backoff** (e.g., 1s, 2s, 4s delays)
- Never retry on **4xx errors** (client errors), only on **5xx** or **network errors**


