import { NextRequest, NextResponse } from 'next/server';
import { serverCache, getServerCacheKey } from '@/lib/cache/serverCache';
import { checkRateLimit, RATE_LIMITS } from '@/lib/cache/rateLimiter';
import { CACHE_TTL } from '@/lib/cache/CacheManager';
import { retryWithBackoff } from '@/lib/utils/retry';

// Using ipapi.co - FREE, no API key required!
// Rate limit: 1,000 requests/day
// Docs: https://ipapi.co/api/

export async function GET(request: NextRequest) {
    // Rate limiting: 50 requests per hour per IP
    const rateLimitCheck = checkRateLimit(request, RATE_LIMITS.PER_HOUR_50);
    if (!rateLimitCheck.allowed) {
        return rateLimitCheck.response!;
    }

    const { searchParams } = new URL(request.url);
    
    // Get IP from query or use client IP (empty = auto-detect)
    const ip = searchParams.get('ip') || '';
    const cacheKey = getServerCacheKey('location', ip || 'auto');
    
    // Check cache first (48-hour TTL)
    const cached = serverCache.get<{
        ip: string;
        location: unknown;
        timezone: unknown;
        currency: unknown;
        network: unknown;
    }>(cacheKey);
    if (cached) {
        return NextResponse.json({
            ...cached,
            cached: true,
        });
    }

    const endpoint = ip ? `https://ipapi.co/${ip}/json/` : 'https://ipapi.co/json/';
    
    try {
        // Retry with exponential backoff (max 2 retries: 1s, 2s) for network/5xx errors
        const response = await retryWithBackoff(
            async () => {
                const res = await fetch(endpoint, {
                    headers: {
                        'User-Agent': 'MoneyMap/1.0',
                    },
                });
                // Throw error for 5xx to trigger retry, but not for 4xx
                if (!res.ok && res.status >= 500 && res.status < 600) {
                    throw { status: res.status, message: `HTTP ${res.status}` };
                }
                return res;
            },
            {
                maxRetries: 2,
                initialDelay: 1000, // 1 second
            }
        );
        
        // Handle 4xx errors (don't retry)
        if (!response.ok) {
            throw new Error(`Failed to fetch geolocation data: HTTP ${response.status}`);
        }
        
        const data = await response.json();
        
        // Check for error response
        if (data.error) {
            throw new Error(data.reason || 'IP lookup failed');
        }
        
        const result = {
            ip: data.ip,
            location: {
                country: data.country_name,
                countryCode: data.country_code,
                state: data.region,
                city: data.city,
                latitude: data.latitude,
                longitude: data.longitude,
                postalCode: data.postal,
                // Generate flag emoji from country code
                flag: data.country_code ? 
                    String.fromCodePoint(...[...data.country_code.toUpperCase()].map(c => c.charCodeAt(0) + 127397)) : 
                    '🌍',
            },
            timezone: {
                name: data.timezone,
                offset: data.utc_offset,
                currentTime: new Date().toLocaleString('en-US', { timeZone: data.timezone }),
            },
            currency: {
                code: data.currency,
                name: data.currency_name,
                // Common currency symbols
                symbol: getCurrencySymbol(data.currency),
            },
            network: {
                asn: data.asn,
                org: data.org,
            },
        };
        
        // Cache for 48 hours (location rarely changes for a user)
        serverCache.set(cacheKey, result, CACHE_TTL.LOCATION);
        
        return NextResponse.json({
            ...result,
            cached: false,
        });
    } catch (error) {
        console.error('ipapi.co error:', error);
        
        // Try to return cached data on error
        const staleCache = serverCache.get<{
            ip: string;
            location: unknown;
            timezone: unknown;
            currency: unknown;
            network: unknown;
        }>(cacheKey);
        if (staleCache) {
            return NextResponse.json({
                ...staleCache,
                cached: true,
                stale: true,
            });
        }
        
        return NextResponse.json({ 
            error: 'Failed to fetch location data',
            // Fallback to US defaults
            fallback: {
                location: { country: 'United States', countryCode: 'US', city: 'Unknown', flag: '🇺🇸' },
                timezone: { name: 'America/New_York', offset: '-05:00' },
                currency: { code: 'USD', name: 'US Dollar', symbol: '$' }
            }
        }, { status: 500 });
    }
}

// Helper function to get currency symbol
function getCurrencySymbol(code: string): string {
    const symbols: Record<string, string> = {
        USD: '$',
        EUR: '€',
        GBP: '£',
        JPY: '¥',
        CNY: '¥',
        INR: '₹',
        CAD: 'C$',
        AUD: 'A$',
        CHF: 'Fr',
        KRW: '₩',
        BRL: 'R$',
        MXN: 'MX$',
        RUB: '₽',
        TRY: '₺',
        ZAR: 'R',
        SEK: 'kr',
        NOK: 'kr',
        DKK: 'kr',
        PLN: 'zł',
        THB: '฿',
        SGD: 'S$',
        HKD: 'HK$',
        NZD: 'NZ$',
    };
    return symbols[code] || code;
}