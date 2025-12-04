import { NextRequest, NextResponse } from 'next/server';

/**
 * REST Countries API - Country and currency data
 * FREE, no auth required!
 * 
 * Docs: https://restcountries.com/
 * Rate limit: Unlimited
 * Cache: 7 days (countries don't change often)
 * 
 * Use cases:
 * - Map currency codes to country flags
 * - Get currency symbols and names
 * - Display country-specific formatting
 */

const RESTCOUNTRIES_BASE = 'https://restcountries.com/v3.1';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    
    const code = searchParams.get('code'); // Country code (US, GB, etc.)
    const currency = searchParams.get('currency'); // Currency code (USD, EUR, etc.)
    const all = searchParams.get('all'); // Get all countries
    
    try {
        if (code) {
            // Get country by code
            const response = await fetch(
                `${RESTCOUNTRIES_BASE}/alpha/${code}?fields=name,cca2,currencies,flag,flags,capital,region,population`
            );
            
            if (!response.ok) {
                throw new Error(`Country not found: ${code}`);
            }
            
            const data = await response.json();
            const country = Array.isArray(data) ? data[0] : data;
            
            return NextResponse.json(formatCountry(country));
        }
        
        if (currency) {
            // Get countries using this currency
            const response = await fetch(
                `${RESTCOUNTRIES_BASE}/currency/${currency}?fields=name,cca2,currencies,flag,flags`
            );
            
            if (!response.ok) {
                throw new Error(`Currency not found: ${currency}`);
            }
            
            const data = await response.json();
            const countries = Array.isArray(data) ? data : [data];
            
            return NextResponse.json({
                currency,
                countries: countries.map(formatCountry),
                count: countries.length,
            });
        }
        
        if (all === 'true') {
            // Get all countries (useful for dropdowns)
            const response = await fetch(
                `${RESTCOUNTRIES_BASE}/all?fields=name,cca2,currencies,flag`
            );
            
            if (!response.ok) {
                throw new Error('Failed to fetch countries');
            }
            
            const data = await response.json();
            
            // Sort by name
            const countries = data
                .map(formatCountry)
                .sort((a: FormattedCountry, b: FormattedCountry) => 
                    a.name.localeCompare(b.name)
                );
            
            return NextResponse.json({
                countries,
                count: countries.length,
            });
        }
        
        // Return common countries/currencies
        return NextResponse.json({
            common: getCommonCurrencies(),
            usage: {
                byCode: '/api/countries?code=US',
                byCurrency: '/api/countries?currency=USD',
                all: '/api/countries?all=true',
            },
        });
    } catch (error) {
        console.error('REST Countries API error:', error);
        return NextResponse.json({ 
            error: 'Failed to fetch country data',
            fallback: getCommonCurrencies(),
        }, { status: 500 });
    }
}

interface CountryData {
    name: { common: string; official: string };
    cca2: string;
    currencies?: Record<string, { name: string; symbol: string }>;
    flag: string;
    flags?: { svg: string; png: string };
    capital?: string[];
    region?: string;
    population?: number;
}

interface FormattedCountry {
    name: string;
    code: string;
    flag: string;
    flagUrl?: string;
    currencies: Array<{ code: string; name: string; symbol: string }>;
    capital?: string;
    region?: string;
    population?: number;
}

function formatCountry(country: CountryData): FormattedCountry {
    const currencies = country.currencies 
        ? Object.entries(country.currencies).map(([code, data]) => ({
            code,
            name: data.name,
            symbol: data.symbol,
        }))
        : [];
    
    return {
        name: country.name.common,
        code: country.cca2,
        flag: country.flag,
        flagUrl: country.flags?.svg || country.flags?.png,
        currencies,
        capital: country.capital?.[0],
        region: country.region,
        population: country.population,
    };
}

function getCommonCurrencies() {
    return [
        { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸', country: 'United States' },
        { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺', country: 'European Union' },
        { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧', country: 'United Kingdom' },
        { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵', country: 'Japan' },
        { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳', country: 'China' },
        { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦', country: 'Canada' },
        { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺', country: 'Australia' },
        { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr', flag: '🇨🇭', country: 'Switzerland' },
        { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳', country: 'India' },
        { code: 'KRW', name: 'South Korean Won', symbol: '₩', flag: '🇰🇷', country: 'South Korea' },
        { code: 'MXN', name: 'Mexican Peso', symbol: 'MX$', flag: '🇲🇽', country: 'Mexico' },
        { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', flag: '🇧🇷', country: 'Brazil' },
        { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', flag: '🇸🇬', country: 'Singapore' },
        { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', flag: '🇭🇰', country: 'Hong Kong' },
        { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', flag: '🇳🇿', country: 'New Zealand' },
        { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', flag: '🇸🇪', country: 'Sweden' },
        { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', flag: '🇳🇴', country: 'Norway' },
        { code: 'DKK', name: 'Danish Krone', symbol: 'kr', flag: '🇩🇰', country: 'Denmark' },
        { code: 'PLN', name: 'Polish Zloty', symbol: 'zł', flag: '🇵🇱', country: 'Poland' },
        { code: 'THB', name: 'Thai Baht', symbol: '฿', flag: '🇹🇭', country: 'Thailand' },
    ];
}
