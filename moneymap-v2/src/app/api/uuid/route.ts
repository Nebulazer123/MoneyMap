import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, RATE_LIMITS } from '@/lib/cache/rateLimiter';

/**
 * UUIDTools API - Generate consistent UUIDs
 * FREE, no auth required!
 * 
 * Docs: https://www.uuidtools.com/api
 * Rate limit: Unlimited (be reasonable)
 * Cache: Generate batch of 100, cache for 7 days
 * 
 * Use case: Consistent transaction IDs for demo data
 * 
 * Note: Currently exported but not actively used in components. Protected with rate limiting.
 * Consider using browser crypto.randomUUID() directly instead.
 */

const UUIDTOOLS_BASE = 'https://www.uuidtools.com/api';

export async function GET(request: NextRequest) {
    // Rate limiting: 200 requests per hour per IP (prevent abuse)
    const rateLimitCheck = checkRateLimit(request, RATE_LIMITS.PER_HOUR_100);
    if (!rateLimitCheck.allowed) {
        return rateLimitCheck.response!;
    }

    const { searchParams } = new URL(request.url);
    
    const version = searchParams.get('version') || 'v4';
    const count = Math.min(parseInt(searchParams.get('count') || '1'), 100);
    
    try {
        let endpoint: string;
        
        if (count === 1) {
            endpoint = `${UUIDTOOLS_BASE}/generate/${version}`;
        } else {
            endpoint = `${UUIDTOOLS_BASE}/generate/${version}/count/${count}`;
        }
        
        const response = await fetch(endpoint);
        
        if (!response.ok) {
            throw new Error(`UUIDTools API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // API returns array for single UUID too, normalize
        const uuids = Array.isArray(data) ? data : [data];
        
        return NextResponse.json({
            uuids,
            count: uuids.length,
            version,
            generated: new Date().toISOString(),
        });
    } catch (error) {
        console.error('UUIDTools error, using fallback:', error);
        
        // Fallback to crypto.randomUUID()
        const uuids = Array.from({ length: count }, () => crypto.randomUUID());
        
        return NextResponse.json({
            uuids,
            count: uuids.length,
            version,
            generated: new Date().toISOString(),
            fallback: true,
        });
    }
}

/**
 * Generate UUIDs for specific purposes
 */
export async function POST(request: NextRequest) {
    // Rate limiting: 200 requests per hour per IP (prevent abuse)
    const rateLimitCheck = checkRateLimit(request, RATE_LIMITS.PER_HOUR_100);
    if (!rateLimitCheck.allowed) {
        return rateLimitCheck.response!;
    }

    try {
        const { type, count = 10 } = await request.json();
        
        // Limit count to prevent abuse
        const safeCount = Math.min(count, 100);
        
        // Generate UUIDs
        const response = await fetch(`${UUIDTOOLS_BASE}/generate/v4/count/${safeCount}`);
        
        let uuids: string[];
        
        if (response.ok) {
            uuids = await response.json();
        } else {
            // Fallback
            uuids = Array.from({ length: safeCount }, () => crypto.randomUUID());
        }
        
        // Format based on type
        switch (type) {
            case 'transactions':
                return NextResponse.json({
                    ids: uuids.map(uuid => ({ 
                        id: uuid, 
                        type: 'transaction',
                        prefix: `TXN-${uuid.slice(0, 8).toUpperCase()}`
                    })),
                    count: uuids.length,
                });
                
            case 'accounts':
                return NextResponse.json({
                    ids: uuids.map(uuid => ({ 
                        id: uuid, 
                        type: 'account',
                        prefix: `ACC-${uuid.slice(0, 8).toUpperCase()}`
                    })),
                    count: uuids.length,
                });
                
            case 'users':
                return NextResponse.json({
                    ids: uuids.map(uuid => ({ 
                        id: uuid, 
                        type: 'user',
                        prefix: `USR-${uuid.slice(0, 8).toUpperCase()}`
                    })),
                    count: uuids.length,
                });
                
            default:
                return NextResponse.json({
                    uuids,
                    count: uuids.length,
                });
        }
    } catch {
        return NextResponse.json({ 
            error: 'Failed to generate UUIDs' 
        }, { status: 500 });
    }
}
