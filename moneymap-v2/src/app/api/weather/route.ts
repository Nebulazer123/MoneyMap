import { NextRequest, NextResponse } from 'next/server';

type ForecastEntry = {
    dt_txt: string;
    main: { temp: number };
    weather: { main: string; icon: string }[];
};

// OpenWeatherMap API (you'll need to get a free API key)
const WEATHER_API_KEY = process.env.OPENWEATHER_API_KEY || 'demo';
const WEATHER_BASE = 'https://api.openweathermap.org/data/2.5';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');
    const city = searchParams.get('city');
    
    if (!lat || !lon) {
        return NextResponse.json({ error: 'Latitude and longitude required' }, { status: 400 });
    }
    
    try {
        // Get current weather and 5-day forecast
        const [currentResponse, forecastResponse] = await Promise.all([
            fetch(`${WEATHER_BASE}/weather?lat=${lat}&lon=${lon}&units=imperial&appid=${WEATHER_API_KEY}`),
            fetch(`${WEATHER_BASE}/forecast?lat=${lat}&lon=${lon}&units=imperial&cnt=8&appid=${WEATHER_API_KEY}`)
        ]);
        
        if (!currentResponse.ok || !forecastResponse.ok) {
            throw new Error('Failed to fetch weather data');
        }
        
        const current = await currentResponse.json();
        const forecast = await forecastResponse.json();
        
        return NextResponse.json({
            current: {
                temp: Math.round(current.main.temp),
                feelsLike: Math.round(current.main.feels_like),
                condition: current.weather[0].main,
                description: current.weather[0].description,
                icon: current.weather[0].icon,
                humidity: current.main.humidity,
                windSpeed: Math.round(current.wind.speed),
                pressure: current.main.pressure,
            },
            forecast: (forecast.list as ForecastEntry[]).slice(0, 8).map((item) => ({
                time: item.dt_txt,
                temp: Math.round(item.main.temp),
                condition: item.weather[0].main,
                icon: item.weather[0].icon,
            })),
            location: city || current.name,
        });
    } catch (error) {
        console.error('Weather API error:', error);
        return NextResponse.json({ 
            error: 'Failed to fetch weather data',
            message: 'Weather data unavailable. Get a free API key at openweathermap.org'
        }, { status: 500 });
    }
}
