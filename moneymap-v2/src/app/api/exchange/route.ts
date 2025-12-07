import { NextRequest, NextResponse } from 'next/server';

/**
 * Currency Exchange API
 * 
 * Primary: Frankfurter API (European Central Bank rates, unlimited, no key)
 * Fallback: ExchangeRate-API (1,500/month, no key)
 * 
 * Cache: 6 hours (rates don't change minute-to-minute)
 */

const FRANKFURTER_BASE = 'https://api.frankfurter.app';
const EXCHANGERATE_BASE = 'https://api.exchangerate-api.com/v4';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    
    const base = searchParams.get('base') || 'USD';
    const to = searchParams.get('to'); // Optional: specific currencies
    const date = searchParams.get('date'); // Optional: historical date (YYYY-MM-DD)
    const amount = searchParams.get('amount'); // Optional: convert specific amount
    
    try {
        // Try Frankfurter first (primary)
        const data = await fetchFromFrankfurter(base, to, date, amount);
        return NextResponse.json({
            ...data,
            source: 'frankfurter',
            cached: false,
        });
    } catch (frankfurterError) {
        console.warn('Frankfurter API failed, trying fallback:', frankfurterError);
        
        try {
            // Fallback to ExchangeRate-API
            const data = await fetchFromExchangeRate(base);
            return NextResponse.json({
                ...data,
                source: 'exchangerate-api',
                cached: false,
            });
        } catch (fallbackError) {
            console.error('All exchange APIs failed:', fallbackError);
            return NextResponse.json({ 
                error: 'Failed to fetch exchange rates',
                details: 'Both primary and fallback APIs failed'
            }, { status: 500 });
        }
    }
}

async function fetchFromFrankfurter(
    base: string, 
    to: string | null, 
    date: string | null,
    amount: string | null
): Promise<ExchangeResponse> {
    const endpoint = date ? `${FRANKFURTER_BASE}/${date}` : `${FRANKFURTER_BASE}/latest`;
    
    const params = new URLSearchParams();
    params.set('from', base);
    if (to) params.set('to', to);
    if (amount) params.set('amount', amount);
    
    const response = await fetch(`${endpoint}?${params.toString()}`);
    
    if (!response.ok) {
        throw new Error(`Frankfurter API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
        base: data.base || base,
        date: data.date,
        rates: data.rates,
        amount: amount ? parseFloat(amount) : 1,
        popular: extractPopular(data.rates),
    };
}

async function fetchFromExchangeRate(base: string): Promise<ExchangeResponse> {
    const response = await fetch(`${EXCHANGERATE_BASE}/latest/${base}`);
    
    if (!response.ok) {
        throw new Error(`ExchangeRate API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
        base: data.base,
        date: data.date,
        rates: data.rates,
        amount: 1,
        popular: extractPopular(data.rates),
    };
}

function extractPopular(rates: Record<string, number>): Record<string, number> {
    const popular = ['EUR', 'GBP', 'JPY', 'CNY', 'CAD', 'AUD', 'CHF', 'INR', 'KRW', 'MXN', 'BRL', 'SGD'];
    const result: Record<string, number> = {};
    
    for (const currency of popular) {
        if (rates[currency]) {
            result[currency] = rates[currency];
        }
    }
    
    return result;
}

interface ExchangeResponse {
    base: string;
    date: string;
    rates: Record<string, number>;
    amount: number;
    popular: Record<string, number>;
}

/**
 * Convert between currencies
 * POST /api/exchange
 * Body: { from: "USD", to: "EUR", amount: 100 }
 */
export async function POST(request: NextRequest) {
    try {
        const { from = 'USD', to = 'EUR', amount = 1 } = await request.json();
        
        // Use Frankfurter's built-in conversion
        const response = await fetch(
            `${FRANKFURTER_BASE}/latest?from=${from}&to=${to}&amount=${amount}`
        );
        
        if (!response.ok) {
            throw new Error('Conversion failed');
        }
        
        const data = await response.json();
        
        return NextResponse.json({
            from,
            to,
            amount,
            result: data.rates[to],
            rate: data.rates[to] / amount,
            date: data.date,
        });
    } catch {
        return NextResponse.json({ 
            error: 'Currency conversion failed' 
        }, { status: 500 });
    }
}