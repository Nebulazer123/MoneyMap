import { NextRequest, NextResponse } from 'next/server';
import { serverCache, getServerCacheKey } from '@/lib/cache/serverCache';

// FRED API - Federal Reserve Economic Data
const FRED_API_KEY = process.env.FRED_API_KEY || 'demo';
const FRED_BASE = 'https://api.stlouisfed.org/fred';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    
    // Get specific series data
    const series = searchParams.get('series');
    if (series) {
        const cacheKey = getServerCacheKey('economy', 'series', series);
        
        // Check cache first (1-hour TTL for economic data)
        const cached = serverCache.get<{
            series_id: string;
            value: number;
            date: string;
            units: string;
        }>(cacheKey);
        if (cached) {
            return NextResponse.json({
                ...cached,
                cached: true,
            });
        }
        
        try {
            const response = await fetch(
                `${FRED_BASE}/series/observations?series_id=${series}&api_key=${FRED_API_KEY}&file_type=json&limit=1&sort_order=desc`
            );
            const data = await response.json();
            
            if (data.observations && data.observations.length > 0) {
                const latest = data.observations[0];
                const result = {
                    series_id: series,
                    value: parseFloat(latest.value),
                    date: latest.date,
                    units: data.units || 'Percent'
                };
                
                // Cache for 1 hour
                serverCache.set(cacheKey, result, 60 * 60 * 1000);
                
                return NextResponse.json({
                    ...result,
                    cached: false,
                });
            }
            
            return NextResponse.json({ error: 'No data available' }, { status: 404 });
        } catch {
            // Try to return cached data on error
            const staleCache = serverCache.get<{
                series_id: string;
                value: number;
                date: string;
                units: string;
            }>(cacheKey);
            if (staleCache) {
                return NextResponse.json({
                    ...staleCache,
                    cached: true,
                    stale: true,
                });
            }
            return NextResponse.json({ error: 'Failed to fetch FRED data' }, { status: 500 });
        }
    }

    // Get multiple economic indicators
    const cacheKey = getServerCacheKey('economy', 'indicators');
    
    // Check cache first (1-hour TTL)
    const cached = serverCache.get<{ indicators: unknown[] }>(cacheKey);
    if (cached) {
        return NextResponse.json({
            ...cached,
            cached: true,
        });
    }
    
    try {
        const indicators = [
            { id: 'FEDFUNDS', name: 'Federal Funds Rate', unit: '%' },
            { id: 'CPIAUCSL', name: 'Inflation (CPI)', unit: 'Index' },
            { id: 'UNRATE', name: 'Unemployment Rate', unit: '%' },
            { id: 'GDP', name: 'GDP', unit: 'Billions' },
            { id: 'DGS10', name: '10-Year Treasury', unit: '%' },
        ];

        const requests = indicators.map(async (indicator) => {
            try {
                const response = await fetch(
                    `${FRED_BASE}/series/observations?series_id=${indicator.id}&api_key=${FRED_API_KEY}&file_type=json&limit=1&sort_order=desc`
                );
                const data = await response.json();
                
                if (data.observations && data.observations.length > 0) {
                    const latest = data.observations[0];
                    return {
                        id: indicator.id,
                        name: indicator.name,
                        value: parseFloat(latest.value),
                        date: latest.date,
                        unit: indicator.unit
                    };
                }
                return null;
            } catch {
                return null;
            }
        });

        const results = (await Promise.all(requests)).filter(Boolean);
        const result = { indicators: results };
        
        // Cache for 1 hour
        serverCache.set(cacheKey, result, 60 * 60 * 1000);
        
        return NextResponse.json({
            ...result,
            cached: false,
        });
    } catch {
        // Try to return cached data on error
        const staleCache = serverCache.get<{ indicators: unknown[] }>(cacheKey);
        if (staleCache) {
            return NextResponse.json({
                ...staleCache,
                cached: true,
                stale: true,
            });
        }
        return NextResponse.json({ error: 'Failed to fetch economic data' }, { status: 500 });
    }
}
