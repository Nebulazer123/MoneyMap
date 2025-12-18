/**
 * Server-Side Cache Utility for Next.js API Routes
 * 
 * In-memory cache for serverless environments
 * Supports TTL-based expiration
 * Thread-safe for concurrent requests
 * 
 * Uses same TTL constants as client-side cache
 */

import { CACHE_TTL } from './CacheManager';

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number;
}

// In-memory cache (clears on serverless restart, which is acceptable)
const memoryCache = new Map<string, CacheEntry<unknown>>();

class ServerCache {
    private static instance: ServerCache;

    private constructor() {
        // Cleanup expired entries every 5 minutes
        setInterval(() => this.cleanup(), 5 * 60 * 1000);
    }

    static getInstance(): ServerCache {
        if (!ServerCache.instance) {
            ServerCache.instance = new ServerCache();
        }
        return ServerCache.instance;
    }

    /**
     * Get cached data if valid
     */
    get<T>(key: string): T | null {
        const entry = memoryCache.get(key) as CacheEntry<T> | undefined;
        
        if (!entry) {
            return null;
        }

        // Check if entry is still valid
        if (this.isValid(entry)) {
            return entry.data;
        }

        // Entry expired, remove it
        memoryCache.delete(key);
        return null;
    }

    /**
     * Set cache data
     */
    set<T>(key: string, data: T, ttl: number = CACHE_TTL.LIVE_PRICES): void {
        const entry: CacheEntry<T> = {
            data,
            timestamp: Date.now(),
            ttl,
        };
        memoryCache.set(key, entry);
    }

    /**
     * Check if cache entry is still valid
     */
    isValid<T>(entry: CacheEntry<T>): boolean {
        return Date.now() - entry.timestamp < entry.ttl;
    }

    /**
     * Get or set pattern - useful for caching async operations
     */
    async getOrSet<T>(
        key: string,
        fetcher: () => Promise<T>,
        ttl?: number
    ): Promise<T> {
        // Check cache first
        const cached = this.get<T>(key);
        if (cached !== null) {
            return cached;
        }

        // Cache miss, fetch and cache
        const data = await fetcher();
        this.set(key, data, ttl);
        return data;
    }

    /**
     * Invalidate specific cache key
     */
    invalidate(key: string): void {
        memoryCache.delete(key);
    }

    /**
     * Invalidate all cache entries matching a pattern
     */
    invalidatePattern(pattern: string): number {
        let count = 0;
        for (const key of memoryCache.keys()) {
            if (key.includes(pattern)) {
                memoryCache.delete(key);
                count++;
            }
        }
        return count;
    }

    /**
     * Clear all cache
     */
    clearAll(): void {
        memoryCache.clear();
    }

    /**
     * Cleanup expired entries
     */
    cleanup(): void {
        const now = Date.now();
        for (const [key, entry] of memoryCache.entries()) {
            if (now - entry.timestamp >= entry.ttl) {
                memoryCache.delete(key);
            }
        }
    }

    /**
     * Get cache statistics
     */
    getStats(): {
        entries: number;
        keys: string[];
    } {
        return {
            entries: memoryCache.size,
            keys: Array.from(memoryCache.keys()),
        };
    }
}

// Export singleton instance
export const serverCache = ServerCache.getInstance();

// Helper function for generating cache keys
export function getServerCacheKey(...parts: (string | number)[]): string {
    return `server:${parts.join(':')}`;
}

