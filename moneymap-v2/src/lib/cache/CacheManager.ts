/**
 * CacheManager - Three-tier caching system for MoneyMap
 * 
 * Tier 1: Memory Cache (fastest, expires on page refresh)
 * Tier 2: SessionStorage (survives navigation, expires on tab close)
 * Tier 3: LocalStorage (survives browser restart, for user preferences)
 * 
 * TTL Strategy:
 * - Live prices: 1 minute
 * - Market stats: 5 minutes
 * - Charts 1D: 5 minutes
 * - Charts 1W/1M: 15 minutes
 * - Charts 3M/1Y: 1 hour
 * - Trending: 15 minutes
 * - News: 30 minutes
 * - Exchange rates: 6 hours
 * - Logos: 7 days
 * - Timezone/Location: 24 hours
 * - Country data: 7 days
 */

export type StorageType = 'memory' | 'session' | 'local';

export interface CacheOptions {
    ttl?: number; // Time to live in milliseconds (default: LIVE_PRICES)
    storage?: StorageType;
    allowStale?: boolean; // Return stale data while refreshing
}

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number;
}

// TTL Constants (in milliseconds)
export const CACHE_TTL = {
    // Live data (refresh frequently)
    LIVE_PRICES: 60 * 1000,           // 1 minute
    PORTFOLIO_SUMMARY: 60 * 1000,     // 1 minute
    
    // Market stats (medium refresh)
    MARKET_STATS: 5 * 60 * 1000,      // 5 minutes
    TRENDING: 15 * 60 * 1000,         // 15 minutes
    
    // Charts (refresh based on timeframe)
    CHART_1D: 5 * 60 * 1000,          // 5 minutes
    CHART_1W: 15 * 60 * 1000,         // 15 minutes
    CHART_1M: 15 * 60 * 1000,         // 15 minutes
    CHART_3M: 60 * 60 * 1000,         // 1 hour
    CHART_1Y: 60 * 60 * 1000,         // 1 hour
    
    // News and content
    NEWS: 30 * 60 * 1000,             // 30 minutes (for search results)
    NEWS_HEADLINES: 2 * 60 * 60 * 1000, // 2 hours (for headlines - they change less frequently)
    SEARCH_RESULTS: 10 * 60 * 1000,   // 10 minutes
    
    // Exchange/Currency (stable data)
    EXCHANGE_RATES: 6 * 60 * 60 * 1000, // 6 hours
    
    // Static-ish data (rarely changes)
    LOGOS: 7 * 24 * 60 * 60 * 1000,   // 7 days
    TIMEZONE: 24 * 60 * 60 * 1000,    // 24 hours
    LOCATION: 48 * 60 * 60 * 1000,    // 48 hours (location rarely changes for a user)
    COUNTRIES: 7 * 24 * 60 * 60 * 1000, // 7 days
    COMPANY_INFO: 24 * 60 * 60 * 1000, // 24 hours
    
    // Email verification (long-lived)
    EMAIL_VERIFICATION: 30 * 24 * 60 * 60 * 1000, // 30 days
    
    // Fake data (very long-lived for consistency)
    FAKE_DATA: 24 * 60 * 60 * 1000,   // 24 hours
    UUIDS: 7 * 24 * 60 * 60 * 1000,   // 7 days
} as const;

// Memory cache (global singleton)
const memoryCache = new Map<string, CacheEntry<unknown>>();

// Cache prefix to avoid conflicts
const CACHE_PREFIX = 'mm_cache_';

class CacheManager {
    private static instance: CacheManager;

    private constructor() {}

    static getInstance(): CacheManager {
        if (!CacheManager.instance) {
            CacheManager.instance = new CacheManager();
        }
        return CacheManager.instance;
    }

    /**
     * Get cached data if valid
     */
    get<T>(key: string, options: { allowStale?: boolean } = {}): T | null {
        const fullKey = CACHE_PREFIX + key;

        // Try memory cache first (fastest)
        const memEntry = memoryCache.get(fullKey) as CacheEntry<T> | undefined;
        if (memEntry) {
            if (this.isValid(memEntry) || options.allowStale) {
                return memEntry.data;
            }
            memoryCache.delete(fullKey);
        }

        // Try sessionStorage
        if (typeof window !== 'undefined') {
            try {
                const sessionData = sessionStorage.getItem(fullKey);
                if (sessionData) {
                    const entry: CacheEntry<T> = JSON.parse(sessionData);
                    if (this.isValid(entry) || options.allowStale) {
                        // Promote to memory cache for faster access
                        memoryCache.set(fullKey, entry);
                        return entry.data;
                    }
                    sessionStorage.removeItem(fullKey);
                }
            } catch {
                // Ignore parsing errors
            }

            // Try localStorage (for long-lived data)
            try {
                const localData = localStorage.getItem(fullKey);
                if (localData) {
                    const entry: CacheEntry<T> = JSON.parse(localData);
                    if (this.isValid(entry) || options.allowStale) {
                        // Promote to memory cache
                        memoryCache.set(fullKey, entry);
                        return entry.data;
                    }
                    localStorage.removeItem(fullKey);
                }
            } catch {
                // Ignore parsing errors
            }
        }

        return null;
    }

    /**
     * Set cache data
     */
    set<T>(key: string, data: T, options: CacheOptions = {}): void {
        const fullKey = CACHE_PREFIX + key;
        const ttl = options.ttl ?? CACHE_TTL.LIVE_PRICES; // Default to 1 minute
        const entry: CacheEntry<T> = {
            data,
            timestamp: Date.now(),
            ttl,
        };

        // Always store in memory
        memoryCache.set(fullKey, entry);

        if (typeof window === 'undefined') return;

        const storage = options.storage || 'session';

        try {
            const serialized = JSON.stringify(entry);

            if (storage === 'session' || storage === 'memory') {
                sessionStorage.setItem(fullKey, serialized);
            } else if (storage === 'local') {
                localStorage.setItem(fullKey, serialized);
            }
        } catch (e) {
            // Storage might be full, try to clean up
            console.warn('Cache storage failed, attempting cleanup:', e);
            this.cleanup();
        }
    }

    /**
     * Check if cache entry is still valid
     */
    isValid<T>(entry: CacheEntry<T>): boolean {
        return Date.now() - entry.timestamp < entry.ttl;
    }

    /**
     * Get age of cached data in milliseconds
     */
    getAge(key: string): number | null {
        const fullKey = CACHE_PREFIX + key;
        const entry = memoryCache.get(fullKey);
        if (entry) {
            return Date.now() - entry.timestamp;
        }
        return null;
    }

    /**
     * Get human-readable cache age
     */
    getAgeString(key: string): string {
        const age = this.getAge(key);
        if (age === null) return 'Not cached';
        
        const seconds = Math.floor(age / 1000);
        if (seconds < 60) return 'Just now';
        
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    }

    /**
     * Check if data needs refresh (expired or close to expiring)
     */
    needsRefresh(key: string, thresholdPercent: number = 0.8): boolean {
        const fullKey = CACHE_PREFIX + key;
        const entry = memoryCache.get(fullKey);
        if (!entry) return true;
        
        const age = Date.now() - entry.timestamp;
        return age >= entry.ttl * thresholdPercent;
    }

    /**
     * Invalidate specific cache key
     */
    invalidate(key: string): void {
        const fullKey = CACHE_PREFIX + key;
        memoryCache.delete(fullKey);
        
        if (typeof window !== 'undefined') {
            sessionStorage.removeItem(fullKey);
            localStorage.removeItem(fullKey);
        }
    }

    /**
     * Invalidate all cache entries matching a pattern
     */
    invalidatePattern(pattern: string): number {
        let count = 0;

        // Clear memory cache
        for (const key of memoryCache.keys()) {
            if (key.includes(pattern)) {
                memoryCache.delete(key);
                count++;
            }
        }

        if (typeof window === 'undefined') return count;

        // Clear sessionStorage
        for (let i = sessionStorage.length - 1; i >= 0; i--) {
            const key = sessionStorage.key(i);
            if (key?.includes(pattern)) {
                sessionStorage.removeItem(key);
                count++;
            }
        }

        // Clear localStorage
        for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i);
            if (key?.includes(pattern)) {
                localStorage.removeItem(key);
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

        if (typeof window === 'undefined') return;

        // Clear only our cache entries
        for (let i = sessionStorage.length - 1; i >= 0; i--) {
            const key = sessionStorage.key(i);
            if (key?.startsWith(CACHE_PREFIX)) {
                sessionStorage.removeItem(key);
            }
        }

        for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i);
            if (key?.startsWith(CACHE_PREFIX)) {
                localStorage.removeItem(key);
            }
        }
    }

    /**
     * Cleanup expired entries to free space
     */
    cleanup(): void {
        const now = Date.now();

        // Cleanup memory cache
        for (const [key, entry] of memoryCache.entries()) {
            if (now - entry.timestamp >= entry.ttl) {
                memoryCache.delete(key);
            }
        }

        if (typeof window === 'undefined') return;

        // Cleanup sessionStorage
        for (let i = sessionStorage.length - 1; i >= 0; i--) {
            const key = sessionStorage.key(i);
            if (key?.startsWith(CACHE_PREFIX)) {
                try {
                    const entry: CacheEntry<unknown> = JSON.parse(sessionStorage.getItem(key) || '{}');
                    if (now - entry.timestamp >= entry.ttl) {
                        sessionStorage.removeItem(key);
                    }
                } catch {
                    sessionStorage.removeItem(key);
                }
            }
        }

        // Cleanup localStorage
        for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i);
            if (key?.startsWith(CACHE_PREFIX)) {
                try {
                    const entry: CacheEntry<unknown> = JSON.parse(localStorage.getItem(key) || '{}');
                    if (now - entry.timestamp >= entry.ttl) {
                        localStorage.removeItem(key);
                    }
                } catch {
                    localStorage.removeItem(key);
                }
            }
        }
    }

    /**
     * Get cache statistics
     */
    getStats(): {
        memoryEntries: number;
        sessionEntries: number;
        localEntries: number;
        totalSize: string;
    } {
        let sessionEntries = 0;
        let localEntries = 0;
        let totalSize = 0;

        if (typeof window !== 'undefined') {
            for (let i = 0; i < sessionStorage.length; i++) {
                const key = sessionStorage.key(i);
                if (key?.startsWith(CACHE_PREFIX)) {
                    sessionEntries++;
                    totalSize += (sessionStorage.getItem(key) || '').length;
                }
            }

            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key?.startsWith(CACHE_PREFIX)) {
                    localEntries++;
                    totalSize += (localStorage.getItem(key) || '').length;
                }
            }
        }

        // Format size
        const formatSize = (bytes: number) => {
            if (bytes < 1024) return `${bytes} B`;
            if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
            return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
        };

        return {
            memoryEntries: memoryCache.size,
            sessionEntries,
            localEntries,
            totalSize: formatSize(totalSize * 2), // *2 for UTF-16
        };
    }
}

// Export singleton instance
export const cacheManager = CacheManager.getInstance();

// Helper function for generating cache keys
export function getCacheKey(...parts: (string | number)[]): string {
    return parts.join(':');
}
