import { NextRequest, NextResponse } from 'next/server';

// FRED API - Federal Reserve Economic Data
const FRED_API_KEY = process.env.FRED_API_KEY || 'demo';
const FRED_BASE = 'https://api.stlouisfed.org/fred';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    
    // Get specific series data
    const series = searchParams.get('series');
    if (series) {
        try {
            const response = await fetch(
                `${FRED_BASE}/series/observations?series_id=${series}&api_key=${FRED_API_KEY}&file_type=json&limit=1&sort_order=desc`
            );
            const data = await response.json();
            
            if (data.observations && data.observations.length > 0) {
                const latest = data.observations[0];
                return NextResponse.json({
                    series_id: series,
                    value: parseFloat(latest.value),
                    date: latest.date,
                    units: data.units || 'Percent'
                });
            }
            
            return NextResponse.json({ error: 'No data available' }, { status: 404 });
        } catch {
            return NextResponse.json({ error: 'Failed to fetch FRED data' }, { status: 500 });
        }
    }

    // Get multiple economic indicators
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
        
        return NextResponse.json({ indicators: results });
    } catch {
        return NextResponse.json({ error: 'Failed to fetch economic data' }, { status: 500 });
    }
}
