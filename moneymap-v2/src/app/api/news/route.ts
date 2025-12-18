import { NextRequest, NextResponse } from 'next/server';
import { serverCache, getServerCacheKey } from '@/lib/cache/serverCache';
import { checkRateLimit, RATE_LIMITS } from '@/lib/cache/rateLimiter';
import { CACHE_TTL } from '@/lib/cache/CacheManager';
import { retryWithBackoff } from '@/lib/utils/retry';

type NewsApiArticle = {
    title: string;
    description: string;
    url: string;
    urlToImage?: string;
    source: { name: string };
    publishedAt: string;
    author?: string | null;
};

type NewsApiResponse = {
    status: string;
    articles: NewsApiArticle[];
    message?: string;
};

// News API
const NEWS_API_KEY = 'b04754f709c4439ea8e1a4a280c737cc';
const NEWS_BASE = 'https://newsapi.org/v2';

export async function GET(request: NextRequest) {
    // Rate limiting: 10 requests per minute per IP (critical - only 100 calls/day)
    const rateLimitCheck = checkRateLimit(request, RATE_LIMITS.PER_MINUTE_10);
    if (!rateLimitCheck.allowed) {
        return rateLimitCheck.response!;
    }

    const { searchParams } = new URL(request.url);
    
    // Search news by query
    const query = searchParams.get('q');
    if (query) {
        const cacheKey = getServerCacheKey('news', 'search', query.toLowerCase());
        
        // Check cache first
        const cached = serverCache.get<{ articles: unknown[] }>(cacheKey);
        if (cached) {
            return NextResponse.json({
                ...cached,
                cached: true,
            });
        }

        try {
            // Retry with exponential backoff (max 2 retries: 1s, 2s) for network/5xx errors only
            const response = await retryWithBackoff(
                async () => {
                    const res = await fetch(
                        `${NEWS_BASE}/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&language=en&apiKey=${NEWS_API_KEY}&pageSize=20`
                    );
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

            // Check response status (4xx errors won't be retried, handled here)
            if (!response.ok) {
                if (response.status === 429) {
                    throw { status: 429, message: 'Rate limit exceeded' };
                }
                throw { status: response.status, message: `HTTP ${response.status}` };
            }

            const data: NewsApiResponse = await response.json();
            
            if (data.status === 'ok') {
                const result = {
                    articles: data.articles.map((article) => ({
                        title: article.title,
                        description: article.description,
                        url: article.url,
                        image: article.urlToImage,
                        source: article.source.name,
                        publishedAt: article.publishedAt,
                        author: article.author
                    }))
                };
                
                // Cache search results for 30 minutes
                serverCache.set(cacheKey, result, CACHE_TTL.NEWS);
                
                return NextResponse.json({
                    ...result,
                    cached: false,
                });
            }
            
            return NextResponse.json({ error: data.message || 'Failed to fetch news' }, { status: 400 });
        } catch (error) {
            console.error('News search error:', error);
            // Try to return cached data on error (preserve stale cache behavior)
            const staleCache = serverCache.get<{ articles: unknown[] }>(cacheKey);
            if (staleCache) {
                return NextResponse.json({
                    ...staleCache,
                    cached: true,
                    stale: true,
                });
            }
            return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 });
        }
    }

    // Get top business headlines (default)
    const category = searchParams.get('category') || 'business';
    const country = searchParams.get('country') || 'us';
    const cacheKey = getServerCacheKey('news', 'headlines', category, country);
    
    // Check cache first
    const cached = serverCache.get<{ articles: unknown[] }>(cacheKey);
    if (cached) {
        return NextResponse.json({
            ...cached,
            cached: true,
        });
    }

    try {
        // Retry with exponential backoff (max 2 retries: 1s, 2s) for network/5xx errors only
        const response = await retryWithBackoff(
            async () => {
                const res = await fetch(
                    `${NEWS_BASE}/top-headlines?category=${category}&country=${country}&apiKey=${NEWS_API_KEY}&pageSize=20`
                );
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

        // Check response status (4xx errors won't be retried, handled here)
        if (!response.ok) {
            if (response.status === 429) {
                throw { status: 429, message: 'Rate limit exceeded' };
            }
            throw { status: response.status, message: `HTTP ${response.status}` };
        }

        const data: NewsApiResponse = await response.json();
        
        if (data.status === 'ok') {
            const result = {
                articles: data.articles.map((article) => ({
                    title: article.title,
                    description: article.description,
                    url: article.url,
                    image: article.urlToImage,
                    source: article.source.name,
                    publishedAt: article.publishedAt,
                    author: article.author
                }))
            };
            
            // Cache headlines for 2 hours (they change less frequently)
            serverCache.set(cacheKey, result, CACHE_TTL.NEWS_HEADLINES);
            
            return NextResponse.json({
                ...result,
                cached: false,
            });
        }
        
        return NextResponse.json({ error: data.message || 'Failed to fetch news' }, { status: 400 });
    } catch (error) {
        console.error('News headlines error:', error);
        // Try to return cached data on error (preserve stale cache behavior)
        const staleCache = serverCache.get<{ articles: unknown[] }>(cacheKey);
        if (staleCache) {
            return NextResponse.json({
                ...staleCache,
                cached: true,
                stale: true,
            });
        }
        return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 });
    }
}
