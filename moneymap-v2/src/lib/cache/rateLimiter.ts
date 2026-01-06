/**
 * Rate Limiter Utility for Next.js API Routes
 * 
 * Per-IP rate limiting with configurable limits
 * Supports per-minute, per-hour, and per-day limits
 * Returns 429 status with Retry-After header
 */

interface RateLimitRecord {
    count: number;
    resetTime: number;
}

interface RateLimitConfig {
    maxRequests: number;
    windowMs: number; // Time window in milliseconds
}

// In-memory rate limit tracking (clears on serverless restart)
const rateLimitMap = new Map<string, RateLimitRecord>();

// Predefined rate limit configurations
export const RATE_LIMITS = {
    // Per-minute limits
    PER_MINUTE_10: { maxRequests: 10, windowMs: 60 * 1000 },
    PER_MINUTE_30: { maxRequests: 30, windowMs: 60 * 1000 },
    PER_MINUTE_50: { maxRequests: 50, windowMs: 60 * 1000 },
    
    // Per-hour limits
    PER_HOUR_5: { maxRequests: 5, windowMs: 60 * 60 * 1000 }, // For email verification (100/month quota)
    PER_HOUR_50: { maxRequests: 50, windowMs: 60 * 60 * 1000 },
    PER_HOUR_100: { maxRequests: 100, windowMs: 60 * 60 * 1000 },
    
    // Per-day limits
    PER_DAY_100: { maxRequests: 100, windowMs: 24 * 60 * 60 * 1000 },
} as const;

class RateLimiter {
    private static instance: RateLimiter;

    private constructor() {
        // Cleanup expired entries every minute
        setInterval(() => this.cleanup(), 60 * 1000);
    }

    static getInstance(): RateLimiter {
        if (!RateLimiter.instance) {
            RateLimiter.instance = new RateLimiter();
        }
        return RateLimiter.instance;
    }

    /**
     * Check if request is within rate limit
     * @param identifier - Unique identifier (usually IP address)
     * @param config - Rate limit configuration
     * @returns Object with allowed status and retryAfter seconds if limited
     */
    check(
        identifier: string,
        config: RateLimitConfig
    ): { allowed: boolean; retryAfter?: number; remaining?: number } {
        const now = Date.now();
        const key = `${identifier}:${config.windowMs}`;
        const record = rateLimitMap.get(key);

        // No record or window expired, create new record
        if (!record || now > record.resetTime) {
            rateLimitMap.set(key, {
                count: 1,
                resetTime: now + config.windowMs,
            });
            return {
                allowed: true,
                remaining: config.maxRequests - 1,
            };
        }

        // Check if limit exceeded
        if (record.count >= config.maxRequests) {
            const retryAfter = Math.ceil((record.resetTime - now) / 1000);
            return {
                allowed: false,
                retryAfter,
                remaining: 0,
            };
        }

        // Increment count
        record.count++;
        return {
            allowed: true,
            remaining: config.maxRequests - record.count,
        };
    }

    /**
     * Cleanup expired rate limit records
     */
    cleanup(): void {
        const now = Date.now();
        for (const [key, record] of rateLimitMap.entries()) {
            if (now > record.resetTime) {
                rateLimitMap.delete(key);
            }
        }
    }

    /**
     * Get rate limit statistics for an identifier
     */
    getStats(identifier: string): Record<string, RateLimitRecord> {
        const stats: Record<string, RateLimitRecord> = {};
        for (const [key, record] of rateLimitMap.entries()) {
            if (key.startsWith(identifier)) {
                stats[key] = record;
            }
        }
        return stats;
    }

    /**
     * Reset rate limit for an identifier
     */
    reset(identifier: string): void {
        for (const key of rateLimitMap.keys()) {
            if (key.startsWith(identifier)) {
                rateLimitMap.delete(key);
            }
        }
    }
}

// Export singleton instance
export const rateLimiter = RateLimiter.getInstance();

/**
 * Helper function to get client IP from Next.js request
 */
export function getClientIP(request: Request): string {
    // Try various headers (in order of preference)
    const forwardedFor = request.headers.get('x-forwarded-for');
    if (forwardedFor) {
        // x-forwarded-for can contain multiple IPs, take the first one
        return forwardedFor.split(',')[0].trim();
    }

    const realIP = request.headers.get('x-real-ip');
    if (realIP) {
        return realIP;
    }

    // Fallback to 'unknown' if no IP found
    return 'unknown';
}

/**
 * Middleware helper to check rate limit and return appropriate response
 */
export function checkRateLimit(
    request: Request,
    config: RateLimitConfig
): { allowed: boolean; response?: Response } {
    const ip = getClientIP(request);
    const result = rateLimiter.check(ip, config);

    if (!result.allowed) {
        return {
            allowed: false,
            response: new Response(
                JSON.stringify({
                    error: 'Rate limit exceeded',
                    message: `Too many requests. Please try again in ${result.retryAfter} seconds.`,
                    retryAfter: result.retryAfter,
                }),
                {
                    status: 429,
                    headers: {
                        'Content-Type': 'application/json',
                        'Retry-After': String(result.retryAfter),
                        'X-RateLimit-Limit': String(config.maxRequests),
                        'X-RateLimit-Remaining': '0',
                        'X-RateLimit-Reset': String(Date.now() + (result.retryAfter || 0) * 1000),
                    },
                }
            ),
        };
    }

    return {
        allowed: true,
    };
}



