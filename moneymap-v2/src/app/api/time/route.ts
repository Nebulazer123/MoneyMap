import { NextRequest, NextResponse } from 'next/server';

/**
 * WorldTimeAPI - Timezone and time information
 * FREE, no auth required!
 * 
 * Docs: https://worldtimeapi.org/
 * Rate limit: Unlimited (be polite, 1 req/sec)
 * Cache: 24 hours for timezone, don't cache current time
 */

const WORLDTIME_BASE = 'https://worldtimeapi.org/api';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    
    const timezone = searchParams.get('timezone');
    const byIp = searchParams.get('ip');
    
    try {
        let endpoint: string;
        
        if (timezone) {
            // Get time for specific timezone
            endpoint = `${WORLDTIME_BASE}/timezone/${timezone}`;
        } else if (byIp === 'true') {
            // Get time based on IP
            endpoint = `${WORLDTIME_BASE}/ip`;
        } else {
            // Default to IP-based
            endpoint = `${WORLDTIME_BASE}/ip`;
        }
        
        const response = await fetch(endpoint);
        
        if (!response.ok) {
            throw new Error(`WorldTimeAPI error: ${response.status}`);
        }
        
        const data = await response.json();
        
        return NextResponse.json({
            timezone: data.timezone,
            datetime: data.datetime,
            utcDatetime: data.utc_datetime,
            utcOffset: data.utc_offset,
            abbreviation: data.abbreviation,
            dayOfWeek: data.day_of_week,
            dayOfYear: data.day_of_year,
            weekNumber: data.week_number,
            isDst: data.dst,
            dstFrom: data.dst_from,
            dstUntil: data.dst_until,
            dstOffset: data.dst_offset,
            // Formatted versions
            formatted: {
                date: new Date(data.datetime).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                }),
                time: new Date(data.datetime).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                }),
                short: new Date(data.datetime).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                }),
            },
        });
    } catch (error) {
        console.error('WorldTimeAPI error:', error);
        
        // Fallback to server time
        const now = new Date();
        return NextResponse.json({
            timezone: 'UTC',
            datetime: now.toISOString(),
            utcOffset: '+00:00',
            fallback: true,
            formatted: {
                date: now.toLocaleDateString('en-US'),
                time: now.toLocaleTimeString('en-US'),
                short: now.toLocaleString('en-US'),
            },
        });
    }
}

/**
 * Get list of available timezones
 */
export async function POST(request: NextRequest) {
    try {
        const { action } = await request.json();
        
        if (action === 'list') {
            const response = await fetch(`${WORLDTIME_BASE}/timezone`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch timezones');
            }
            
            const timezones = await response.json();
            
            // Group by region
            const grouped: Record<string, string[]> = {};
            for (const tz of timezones) {
                const [region] = tz.split('/');
                if (!grouped[region]) {
                    grouped[region] = [];
                }
                grouped[region].push(tz);
            }
            
            return NextResponse.json({
                timezones,
                grouped,
                count: timezones.length,
            });
        }
        
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch {
        return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
    }
}
