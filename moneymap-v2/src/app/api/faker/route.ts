import { NextRequest, NextResponse } from 'next/server';
import { serverCache, getServerCacheKey } from '@/lib/cache/serverCache';
import { checkRateLimit, RATE_LIMITS } from '@/lib/cache/rateLimiter';
import { CACHE_TTL } from '@/lib/cache/CacheManager';

/**
 * Faker API - Generate realistic demo data
 * FREE, no auth required!
 * 
 * Docs: https://fakerapi.it/en
 * Rate limit: Unlimited (be reasonable)
 * Cache: 24 hours for consistency
 * 
 * Use cases:
 * - Generate realistic company names for transactions
 * - Create demo user profiles
 * - Generate addresses for merchants
 * - Create fake but realistic financial data
 * 
 * Note: Currently exported but not actively used in components. Protected with rate limiting and caching.
 */

const FAKER_BASE = 'https://fakerapi.it/api/v1';

export async function GET(request: NextRequest) {
    // Rate limiting: 50 requests per hour per IP (prevent abuse)
    const rateLimitCheck = checkRateLimit(request, RATE_LIMITS.PER_HOUR_50);
    if (!rateLimitCheck.allowed) {
        return rateLimitCheck.response!;
    }

    const { searchParams } = new URL(request.url);
    
    const type = searchParams.get('type') || 'companies';
    const quantity = Math.min(parseInt(searchParams.get('quantity') || '10'), 100);
    const locale = searchParams.get('locale') || 'en_US';
    
    const cacheKey = getServerCacheKey('faker', type, String(quantity), locale);
    
    // Check cache first (24-hour TTL)
    const cached = serverCache.get<unknown>(cacheKey);
    if (cached) {
        return NextResponse.json({
            ...cached,
            cached: true,
        });
    }
    
    try {
        let endpoint = `${FAKER_BASE}/${type}?_quantity=${quantity}&_locale=${locale}`;
        
        // Add type-specific parameters
        switch (type) {
            case 'texts':
                const chars = searchParams.get('characters') || '100';
                endpoint += `&_characters=${chars}`;
                break;
            case 'images':
                const width = searchParams.get('width') || '200';
                const height = searchParams.get('height') || '200';
                endpoint += `&_width=${width}&_height=${height}`;
                break;
        }
        
        const response = await fetch(endpoint);
        
        if (!response.ok) {
            throw new Error(`Faker API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        const result = {
            status: data.status,
            code: data.code,
            total: data.total,
            data: data.data,
            type,
            locale,
        };
        
        // Cache for 24 hours (demo data consistency)
        serverCache.set(cacheKey, result, CACHE_TTL.FAKE_DATA);
        
        return NextResponse.json({
            ...result,
            cached: false,
        });
    } catch (error) {
        console.error('Faker API error:', error);
        return NextResponse.json({ 
            error: 'Failed to generate fake data' 
        }, { status: 500 });
    }
}

/**
 * Generate complete fake transactions for demo
 */
export async function POST(request: NextRequest) {
    // Rate limiting: 50 requests per hour per IP (prevent abuse)
    const rateLimitCheck = checkRateLimit(request, RATE_LIMITS.PER_HOUR_50);
    if (!rateLimitCheck.allowed) {
        return rateLimitCheck.response!;
    }

    try {
        const { 
            count = 50, 
            startDate, 
            endDate,
            includeRecurring = true,
        } = await request.json();
        
        // Limit count
        const safeCount = Math.min(count, 200);
        
        // Fetch company names for merchants
        const companiesRes = await fetch(`${FAKER_BASE}/companies?_quantity=${Math.min(safeCount, 50)}`);
        const companiesData = await companiesRes.json();
        const companies = companiesData.data || [];
        
        // Generate transactions
        const transactions = generateTransactions(
            safeCount, 
            companies, 
            startDate ? new Date(startDate) : null,
            endDate ? new Date(endDate) : null,
            includeRecurring
        );
        
        return NextResponse.json({
            transactions,
            count: transactions.length,
            dateRange: {
                start: transactions[transactions.length - 1]?.date,
                end: transactions[0]?.date,
            },
            merchants: companies.length,
        });
    } catch {
        return NextResponse.json({ 
            error: 'Failed to generate transactions' 
        }, { status: 500 });
    }
}

interface Company {
    name: string;
    email: string;
    vat: string;
    phone: string;
    country: string;
    website: string;
}

interface GeneratedTransaction {
    id: string;
    date: string;
    description: string;
    amount: number;
    category: string;
    type: 'debit' | 'credit';
    merchant: string;
    isRecurring: boolean;
    logo?: string;
}

function generateTransactions(
    count: number,
    companies: Company[],
    startDate: Date | null,
    endDate: Date | null,
    includeRecurring: boolean
): GeneratedTransaction[] {
    const transactions: GeneratedTransaction[] = [];
    
    const end = endDate || new Date();
    const start = startDate || new Date(end.getTime() - 90 * 24 * 60 * 60 * 1000); // 90 days ago
    
    // Common recurring services
    const recurringServices = [
        { name: 'Netflix', amount: 15.99, category: 'Entertainment' },
        { name: 'Spotify', amount: 9.99, category: 'Entertainment' },
        { name: 'Amazon Prime', amount: 14.99, category: 'Shopping' },
        { name: 'Gym Membership', amount: 49.99, category: 'Health' },
        { name: 'Cloud Storage', amount: 2.99, category: 'Technology' },
        { name: 'Phone Bill', amount: 85.00, category: 'Utilities' },
        { name: 'Internet', amount: 79.99, category: 'Utilities' },
        { name: 'Insurance', amount: 150.00, category: 'Insurance' },
    ];
    
    // Category distribution and amount ranges
    const categories = [
        { name: 'Food & Dining', weight: 25, minAmount: 5, maxAmount: 150 },
        { name: 'Shopping', weight: 20, minAmount: 10, maxAmount: 500 },
        { name: 'Transportation', weight: 15, minAmount: 5, maxAmount: 100 },
        { name: 'Entertainment', weight: 10, minAmount: 10, maxAmount: 200 },
        { name: 'Utilities', weight: 8, minAmount: 50, maxAmount: 300 },
        { name: 'Healthcare', weight: 5, minAmount: 20, maxAmount: 500 },
        { name: 'Travel', weight: 5, minAmount: 50, maxAmount: 1000 },
        { name: 'Education', weight: 3, minAmount: 20, maxAmount: 200 },
        { name: 'Personal Care', weight: 5, minAmount: 10, maxAmount: 100 },
        { name: 'Other', weight: 4, minAmount: 5, maxAmount: 200 },
    ];
    
    // Add recurring transactions first
    if (includeRecurring) {
        const months = Math.ceil((end.getTime() - start.getTime()) / (30 * 24 * 60 * 60 * 1000));
        
        for (const service of recurringServices) {
            for (let m = 0; m < months; m++) {
                const date = new Date(start);
                date.setMonth(date.getMonth() + m);
                date.setDate(Math.floor(Math.random() * 5) + 1); // First 5 days of month
                
                if (date <= end) {
                    transactions.push({
                        id: crypto.randomUUID(),
                        date: date.toISOString().split('T')[0],
                        description: service.name,
                        amount: -service.amount,
                        category: service.category,
                        type: 'debit',
                        merchant: service.name,
                        isRecurring: true,
                        logo: `https://logo.clearbit.com/${service.name.toLowerCase().replace(/\s+/g, '')}.com`,
                    });
                }
            }
        }
    }
    
    // Add income (paychecks)
    const paycheckDates = [1, 15]; // 1st and 15th of each month
    const months = Math.ceil((end.getTime() - start.getTime()) / (30 * 24 * 60 * 60 * 1000));
    const salary = 2500 + Math.random() * 2000; // Random salary between 2500-4500
    
    for (let m = 0; m < months; m++) {
        for (const day of paycheckDates) {
            const date = new Date(start);
            date.setMonth(date.getMonth() + m);
            date.setDate(day);
            
            if (date >= start && date <= end) {
                transactions.push({
                    id: crypto.randomUUID(),
                    date: date.toISOString().split('T')[0],
                    description: 'Direct Deposit - Payroll',
                    amount: Math.round(salary * 100) / 100,
                    category: 'Income',
                    type: 'credit',
                    merchant: 'Employer',
                    isRecurring: true,
                });
            }
        }
    }
    
    // Fill remaining with random transactions
    const remaining = count - transactions.length;
    
    for (let i = 0; i < remaining; i++) {
        // Random date in range
        const randomTime = start.getTime() + Math.random() * (end.getTime() - start.getTime());
        const date = new Date(randomTime);
        
        // Random category based on weights
        const totalWeight = categories.reduce((sum, c) => sum + c.weight, 0);
        let random = Math.random() * totalWeight;
        let category = categories[0];
        
        for (const cat of categories) {
            random -= cat.weight;
            if (random <= 0) {
                category = cat;
                break;
            }
        }
        
        // Random amount in category range
        const amount = category.minAmount + Math.random() * (category.maxAmount - category.minAmount);
        
        // Random merchant
        const merchant = companies[Math.floor(Math.random() * companies.length)]?.name || 
            `${category.name} Store`;
        
        transactions.push({
            id: crypto.randomUUID(),
            date: date.toISOString().split('T')[0],
            description: `${merchant} - ${category.name}`,
            amount: -Math.round(amount * 100) / 100,
            category: category.name,
            type: 'debit',
            merchant,
            isRecurring: false,
        });
    }
    
    // Sort by date descending
    transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    return transactions;
}
