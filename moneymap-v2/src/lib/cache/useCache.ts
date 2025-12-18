/**
 * useCache - React hook for cached data fetching
 * 
 * Features:
 * - Automatic cache management with TTL
 * - Stale-while-revalidate pattern
 * - Manual refresh bypass
 * - Loading and error states
 * - Background refresh when data is stale
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { cacheManager, CacheOptions, CACHE_TTL } from './CacheManager';

interface UseCacheOptions<T> extends Omit<CacheOptions, 'allowStale'> {
    enabled?: boolean;
    staleWhileRevalidate?: boolean;
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
    refetchInterval?: number; // Auto-refetch interval in ms
    fallbackData?: T;
}

interface UseCacheResult<T> {
    data: T | null;
    isLoading: boolean;
    isRefreshing: boolean;
    isStale: boolean;
    error: Error | null;
    refresh: () => Promise<void>;
    cacheAge: string;
    lastUpdated: Date | null;
}

// Track in-flight requests to prevent duplicate API calls
const inFlightRequests = new Map<string, Promise<unknown>>();

export function useCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: UseCacheOptions<T> = {}
): UseCacheResult<T> {
    const {
        ttl = CACHE_TTL.LIVE_PRICES,
        storage = 'session',
        enabled = true,
        staleWhileRevalidate = true,
        onSuccess,
        onError,
        refetchInterval,
        fallbackData,
    } = options;

    const [data, setData] = useState<T | null>(() => {
        // Try to get initial data from cache
        const cached = cacheManager.get<T>(key, { allowStale: true });
        return cached ?? fallbackData ?? null;
    });
    const [isLoading, setIsLoading] = useState(!data);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const fetcherRef = useRef(fetcher);
    fetcherRef.current = fetcher;

    const fetchData = useCallback(async (force = false) => {
        if (!enabled) return;

        // Check cache first (unless forced refresh)
        if (!force) {
            const cached = cacheManager.get<T>(key);
            if (cached) {
                setData(cached);
                setIsLoading(false);
                setLastUpdated(new Date());
                
                // Background refresh if stale
                if (staleWhileRevalidate && cacheManager.needsRefresh(key)) {
                    setIsRefreshing(true);
                    try {
                        // Check if there's already an in-flight request for this key
                        const existingRequest = inFlightRequests.get(key);
                        if (existingRequest) {
                            // Reuse existing promise
                            const freshData = await existingRequest as T;
                            cacheManager.set(key, freshData, { ttl, storage });
                            setData(freshData);
                            setLastUpdated(new Date());
                            onSuccess?.(freshData);
                        } else {
                            // Create new request
                            const requestPromise = fetcherRef.current();
                            inFlightRequests.set(key, requestPromise);
                            try {
                                const freshData = await requestPromise;
                                cacheManager.set(key, freshData, { ttl, storage });
                                setData(freshData);
                                setLastUpdated(new Date());
                                onSuccess?.(freshData);
                            } finally {
                                inFlightRequests.delete(key);
                            }
                        }
                    } catch (err) {
                        // Keep stale data on background refresh failure
                        console.warn('Background refresh failed:', err);
                        inFlightRequests.delete(key);
                    } finally {
                        setIsRefreshing(false);
                    }
                }
                return;
            }
        }

        // Cache miss or forced refresh
        if (force) {
            setIsRefreshing(true);
        } else {
            setIsLoading(true);
        }
        setError(null);

        // Check if there's already an in-flight request for this key
        const existingRequest = inFlightRequests.get(key);
        if (existingRequest && !force) {
            // Reuse existing promise instead of making duplicate request
            try {
                const result = await existingRequest as T;
                cacheManager.set(key, result, { ttl, storage });
                setData(result);
                setLastUpdated(new Date());
                onSuccess?.(result);
            } catch (err) {
                const error = err instanceof Error ? err : new Error('Unknown error');
                setError(error);
                onError?.(error);

                // Try to return stale data on error
                if (staleWhileRevalidate) {
                    const stale = cacheManager.get<T>(key, { allowStale: true });
                    if (stale) {
                        setData(stale);
                    }
                }
            } finally {
                setIsLoading(false);
                setIsRefreshing(false);
            }
            return;
        }

        // Create new request
        try {
            const requestPromise = fetcherRef.current();
            inFlightRequests.set(key, requestPromise);
            
            const result = await requestPromise;
            cacheManager.set(key, result, { ttl, storage });
            setData(result);
            setLastUpdated(new Date());
            onSuccess?.(result);
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Unknown error');
            setError(error);
            onError?.(error);

            // Try to return stale data on error
            if (staleWhileRevalidate) {
                const stale = cacheManager.get<T>(key, { allowStale: true });
                if (stale) {
                    setData(stale);
                }
            }
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
            inFlightRequests.delete(key);
        }
    }, [key, ttl, storage, enabled, staleWhileRevalidate, onSuccess, onError]);

    // Initial fetch
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Auto-refetch interval
    useEffect(() => {
        if (!refetchInterval || !enabled) return;

        const interval = setInterval(() => {
            if (cacheManager.needsRefresh(key)) {
                fetchData(true);
            }
        }, refetchInterval);

        return () => clearInterval(interval);
    }, [key, refetchInterval, enabled, fetchData]);

    const refresh = useCallback(async () => {
        await fetchData(true);
    }, [fetchData]);

    const isStale = data !== null && cacheManager.needsRefresh(key);
    const cacheAge = cacheManager.getAgeString(key);

    return {
        data,
        isLoading,
        isRefreshing,
        isStale,
        error,
        refresh,
        cacheAge,
        lastUpdated,
    };
}

/**
 * useCachedFetch - Simplified hook for basic cached API calls
 */
export function useCachedFetch<T>(
    url: string,
    options: UseCacheOptions<T> & { fetchOptions?: RequestInit } = {}
): UseCacheResult<T> {
    const { fetchOptions, ...cacheOptions } = options;

    const fetcher = useCallback(async () => {
        const response = await fetch(url, fetchOptions);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    }, [url, fetchOptions]);

    return useCache<T>(url, fetcher, cacheOptions);
}

/**
 * usePrefetch - Hook for prefetching data into cache
 * Useful for prefetching on hover or anticipating user actions
 */
export function usePrefetch() {
    const prefetch = useCallback(async <T>(
        key: string,
        fetcher: () => Promise<T>,
        options: CacheOptions = {}
    ): Promise<void> => {
        // Skip if already cached and valid
        if (cacheManager.get<T>(key)) return;

        try {
            const data = await fetcher();
            cacheManager.set(key, data, options);
        } catch {
            // Silently fail prefetch
        }
    }, []);

    const prefetchUrl = useCallback(async (
        url: string,
        options: CacheOptions = {}
    ): Promise<void> => {
        if (cacheManager.get(url)) return;

        try {
            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                cacheManager.set(url, data, options);
            }
        } catch {
            // Silently fail prefetch
        }
    }, []);

    return { prefetch, prefetchUrl };
}

/**
 * Prefetch data into cache (useful for hover prefetching)
 */
export async function prefetchCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions
): Promise<void> {
    // Skip if already cached and valid
    if (cacheManager.get<T>(key)) return;

    try {
        const data = await fetcher();
        cacheManager.set(key, data, options);
    } catch {
        // Silently fail prefetch
    }
}

export { CACHE_TTL } from './CacheManager';
