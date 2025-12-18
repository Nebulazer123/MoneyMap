import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, RATE_LIMITS } from '@/lib/cache/rateLimiter';

/**
 * QuickChart API - Generate chart images
 * FREE, no auth required!
 * 
 * Docs: https://quickchart.io/documentation/
 * Rate limit: Unlimited (be reasonable)
 * 
 * Note: Currently exported but not actively used in components. Protected with rate limiting.
 * 
 * Perfect for:
 * - Exporting dashboard charts as images
 * - Email reports with charts
 * - PDF generation
 * - Social sharing previews
 */

const QUICKCHART_BASE = 'https://quickchart.io/chart';

type ChartType = 'pie' | 'doughnut' | 'bar' | 'line' | 'horizontalBar' | 'radar' | 'polarArea';

interface ChartConfig {
    type: ChartType;
    data: {
        labels: string[];
        datasets: Array<{
            label?: string;
            data: number[];
            backgroundColor?: string | string[];
            borderColor?: string | string[];
            borderWidth?: number;
            fill?: boolean;
        }>;
    };
    options?: Record<string, unknown>;
}

export async function GET(request: NextRequest) {
    // Rate limiting: 100 requests per hour per IP (prevent abuse)
    const rateLimitCheck = checkRateLimit(request, RATE_LIMITS.PER_HOUR_100);
    if (!rateLimitCheck.allowed) {
        return rateLimitCheck.response!;
    }

    const { searchParams } = new URL(request.url);
    
    const preset = searchParams.get('preset');
    
    if (preset) {
        // Return preset chart configs for MoneyMap
        const presets = getPresetConfigs();
        if (preset === 'all') {
            return NextResponse.json(presets);
        }
        if (presets[preset]) {
            return NextResponse.json(presets[preset]);
        }
        return NextResponse.json({ error: 'Unknown preset' }, { status: 404 });
    }
    
    // Return documentation
    return NextResponse.json({
        usage: 'POST with chart config to generate chart URL',
        presets: Object.keys(getPresetConfigs()),
        example: {
            type: 'pie',
            data: {
                labels: ['Food', 'Transport', 'Entertainment'],
                datasets: [{ data: [300, 150, 100] }]
            }
        }
    });
}

export async function POST(request: NextRequest) {
    // Rate limiting: 100 requests per hour per IP (prevent abuse)
    const rateLimitCheck = checkRateLimit(request, RATE_LIMITS.PER_HOUR_100);
    if (!rateLimitCheck.allowed) {
        return rateLimitCheck.response!;
    }

    try {
        const body = await request.json();
        const { config, width = 600, height = 400, format = 'png', background = 'transparent' } = body;
        
        if (!config) {
            return NextResponse.json({ 
                error: 'Missing chart config' 
            }, { status: 400 });
        }
        
        // Build the chart URL
        const chartConfig = typeof config === 'string' ? config : JSON.stringify(config);
        const encodedConfig = encodeURIComponent(chartConfig);
        
        const chartUrl = `${QUICKCHART_BASE}?c=${encodedConfig}&w=${width}&h=${height}&f=${format}&bkg=${background}`;
        
        // For short charts, return URL directly
        if (chartUrl.length < 2000) {
            return NextResponse.json({
                url: chartUrl,
                shortUrl: await getShortUrl(chartConfig, width, height, format, background),
                width,
                height,
                format,
            });
        }
        
        // For complex charts, use POST to QuickChart
        const shortUrl = await getShortUrl(chartConfig, width, height, format, background);
        
        return NextResponse.json({
            url: shortUrl,
            shortUrl,
            width,
            height,
            format,
            note: 'Using short URL due to config size'
        });
    } catch {
        return NextResponse.json({ 
            error: 'Failed to generate chart' 
        }, { status: 500 });
    }
}

async function getShortUrl(
    config: string, 
    width: number, 
    height: number, 
    format: string,
    background: string
): Promise<string> {
    const response = await fetch('https://quickchart.io/chart/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chart: config,
            width,
            height,
            format,
            backgroundColor: background,
        }),
    });
    
    if (!response.ok) {
        throw new Error('Failed to create short URL');
    }
    
    const data = await response.json();
    return data.url;
}

/**
 * Preset chart configurations for MoneyMap
 */
function getPresetConfigs(): Record<string, ChartConfig> {
    return {
        // Spending by category pie chart
        spendingPie: {
            type: 'doughnut',
            data: {
                labels: ['Food', 'Transport', 'Shopping', 'Entertainment', 'Bills', 'Other'],
                datasets: [{
                    data: [450, 200, 350, 150, 800, 250],
                    backgroundColor: [
                        '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'
                    ],
                }]
            },
            options: {
                plugins: {
                    legend: { position: 'right' },
                    title: { display: true, text: 'Spending by Category' }
                }
            }
        },
        
        // Monthly cashflow bar chart
        cashflowBar: {
            type: 'bar',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [
                    {
                        label: 'Income',
                        data: [5000, 5200, 4800, 5100, 5300, 5000],
                        backgroundColor: '#22c55e',
                    },
                    {
                        label: 'Expenses',
                        data: [4200, 4500, 4100, 4800, 4600, 4300],
                        backgroundColor: '#ef4444',
                    }
                ]
            },
            options: {
                plugins: {
                    title: { display: true, text: 'Monthly Cash Flow' }
                }
            }
        },
        
        // Net worth trend line chart
        netWorthLine: {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Net Worth',
                    data: [25000, 26500, 27200, 28100, 29500, 31000],
                    borderColor: '#8b5cf6',
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    fill: true,
                }]
            },
            options: {
                plugins: {
                    title: { display: true, text: 'Net Worth Over Time' }
                }
            }
        },
        
        // Budget progress horizontal bar
        budgetProgress: {
            type: 'horizontalBar',
            data: {
                labels: ['Food', 'Transport', 'Entertainment', 'Shopping', 'Utilities'],
                datasets: [
                    {
                        label: 'Spent',
                        data: [380, 150, 80, 200, 120],
                        backgroundColor: '#3b82f6',
                    },
                    {
                        label: 'Budget',
                        data: [500, 200, 150, 300, 150],
                        backgroundColor: '#e5e7eb',
                    }
                ]
            },
            options: {
                indexAxis: 'y',
                plugins: {
                    title: { display: true, text: 'Budget vs Actual' }
                }
            }
        },
        
        // Subscription breakdown pie
        subscriptionsPie: {
            type: 'pie',
            data: {
                labels: ['Streaming', 'Software', 'Gaming', 'News', 'Fitness', 'Other'],
                datasets: [{
                    data: [45, 30, 15, 10, 25, 20],
                    backgroundColor: [
                        '#e11d48', '#7c3aed', '#2563eb', '#0891b2', '#16a34a', '#ca8a04'
                    ],
                }]
            },
            options: {
                plugins: {
                    title: { display: true, text: 'Subscriptions Breakdown' }
                }
            }
        },
        
        // Crypto portfolio pie
        cryptoPie: {
            type: 'doughnut',
            data: {
                labels: ['Bitcoin', 'Ethereum', 'Solana', 'Other'],
                datasets: [{
                    data: [50, 30, 15, 5],
                    backgroundColor: ['#f7931a', '#627eea', '#00ffa3', '#8b5cf6'],
                }]
            },
            options: {
                plugins: {
                    title: { display: true, text: 'Crypto Portfolio' }
                }
            }
        },
        
        // Stock portfolio pie
        stocksPie: {
            type: 'doughnut',
            data: {
                labels: ['Tech', 'Healthcare', 'Finance', 'Consumer', 'Energy'],
                datasets: [{
                    data: [40, 20, 15, 15, 10],
                    backgroundColor: ['#3b82f6', '#22c55e', '#f97316', '#ec4899', '#eab308'],
                }]
            },
            options: {
                plugins: {
                    title: { display: true, text: 'Stock Portfolio by Sector' }
                }
            }
        },
    };
}
