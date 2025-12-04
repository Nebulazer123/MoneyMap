import { NextRequest, NextResponse } from 'next/server';

// Using ipapi.co - FREE, no API key required!
// Rate limit: 1,000 requests/day
// Docs: https://ipapi.co/api/

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    
    // Get IP from query or use client IP (empty = auto-detect)
    const ip = searchParams.get('ip') || '';
    const endpoint = ip ? `https://ipapi.co/${ip}/json/` : 'https://ipapi.co/json/';
    
    try {
        const response = await fetch(endpoint, {
            headers: {
                'User-Agent': 'MoneyMap/1.0',
            },
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch geolocation data');
        }
        
        const data = await response.json();
        
        // Check for error response
        if (data.error) {
            throw new Error(data.reason || 'IP lookup failed');
        }
        
        return NextResponse.json({
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
        });
    } catch (error) {
        console.error('ipapi.co error:', error);
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