import { NextRequest, NextResponse } from 'next/server';

/**
 * Clearbit Logo API - FREE, no auth required!
 * Returns company logos as PNG images
 * Docs: https://clearbit.com/logo
 * 
 * Usage: https://logo.clearbit.com/{domain}
 * Cache: 7 days (logos rarely change)
 */

// Common merchant name to domain mappings
const MERCHANT_DOMAINS: Record<string, string> = {
    // Streaming & Entertainment
    'netflix': 'netflix.com',
    'spotify': 'spotify.com',
    'hulu': 'hulu.com',
    'disney': 'disney.com',
    'disney+': 'disneyplus.com',
    'apple music': 'apple.com',
    'apple tv': 'apple.com',
    'youtube': 'youtube.com',
    'youtube premium': 'youtube.com',
    'hbo': 'hbo.com',
    'hbo max': 'hbomax.com',
    'amazon prime': 'amazon.com',
    'prime video': 'amazon.com',
    'peacock': 'peacocktv.com',
    'paramount': 'paramount.com',
    'crunchyroll': 'crunchyroll.com',
    'audible': 'audible.com',
    'max': 'max.com',

    // Shopping & Retail
    'amazon': 'amazon.com',
    'walmart': 'walmart.com',
    'target': 'target.com',
    'costco': 'costco.com',
    'home depot': 'homedepot.com',
    'lowes': 'lowes.com',
    'best buy': 'bestbuy.com',
    'ikea': 'ikea.com',
    'wayfair': 'wayfair.com',
    'etsy': 'etsy.com',
    'ebay': 'ebay.com',
    'aliexpress': 'aliexpress.com',
    'shein': 'shein.com',
    'newegg': 'newegg.com',
    'nordstrom': 'nordstrom.com',
    'macys': 'macys.com',
    'kohls': 'kohls.com',
    'tj maxx': 'tjmaxx.com',
    'marshalls': 'marshalls.com',
    'ross': 'rossstores.com',
    'cvs': 'cvs.com',
    'walgreens': 'walgreens.com',
    'rite aid': 'riteaid.com',
    'sephora': 'sephora.com',
    'ulta': 'ulta.com',

    // Food & Delivery
    'uber eats': 'ubereats.com',
    'uber': 'uber.com',
    'doordash': 'doordash.com',
    'grubhub': 'grubhub.com',
    'postmates': 'postmates.com',
    'instacart': 'instacart.com',
    'gopuff': 'gopuff.com',
    'chipotle': 'chipotle.com',
    'mcdonalds': 'mcdonalds.com',
    'starbucks': 'starbucks.com',
    'dunkin': 'dunkindonuts.com',
    'chick-fil-a': 'chick-fil-a.com',
    'wendys': 'wendys.com',
    'burger king': 'bk.com',
    'taco bell': 'tacobell.com',
    'dominos': 'dominos.com',
    'pizza hut': 'pizzahut.com',
    'papa johns': 'papajohns.com',
    'panera': 'panerabread.com',
    'subway': 'subway.com',
    'five guys': 'fiveguys.com',
    'shake shack': 'shakeshack.com',
    'sweetgreen': 'sweetgreen.com',
    'whole foods': 'wholefoodsmarket.com',
    'trader joes': 'traderjoes.com',
    'aldi': 'aldi.us',
    'kroger': 'kroger.com',
    'publix': 'publix.com',
    'safeway': 'safeway.com',
    'albertsons': 'albertsons.com',

    // Transportation
    'lyft': 'lyft.com',
    'lime': 'li.me',
    'bird': 'bird.co',
    'amtrak': 'amtrak.com',
    'delta': 'delta.com',
    'united': 'united.com',
    'american airlines': 'aa.com',
    'southwest': 'southwest.com',
    'jetblue': 'jetblue.com',
    'spirit': 'spirit.com',
    'frontier': 'flyfrontier.com',
    'hertz': 'hertz.com',
    'enterprise': 'enterprise.com',
    'avis': 'avis.com',
    'budget': 'budget.com',

    // Tech & Software
    'apple': 'apple.com',
    'google': 'google.com',
    'microsoft': 'microsoft.com',
    'adobe': 'adobe.com',
    'dropbox': 'dropbox.com',
    'slack': 'slack.com',
    'zoom': 'zoom.us',
    'notion': 'notion.so',
    'figma': 'figma.com',
    'canva': 'canva.com',
    'github': 'github.com',
    'atlassian': 'atlassian.com',
    'salesforce': 'salesforce.com',
    'shopify': 'shopify.com',
    'squarespace': 'squarespace.com',
    'wix': 'wix.com',
    'godaddy': 'godaddy.com',
    'cloudflare': 'cloudflare.com',
    'aws': 'aws.amazon.com',
    'digitalocean': 'digitalocean.com',
    'vercel': 'vercel.com',

    // Gaming
    'steam': 'store.steampowered.com',
    'playstation': 'playstation.com',
    'xbox': 'xbox.com',
    'nintendo': 'nintendo.com',
    'epic games': 'epicgames.com',
    'riot games': 'riotgames.com',
    'blizzard': 'blizzard.com',
    'ea': 'ea.com',
    'ubisoft': 'ubisoft.com',
    'roblox': 'roblox.com',
    'twitch': 'twitch.tv',
    'discord': 'discord.com',

    // Finance & Banking
    'paypal': 'paypal.com',
    'venmo': 'venmo.com',
    'cash app': 'cash.app',
    'zelle': 'zellepay.com',
    'chase': 'chase.com',
    'bank of america': 'bankofamerica.com',
    'wells fargo': 'wellsfargo.com',
    'capital one': 'capitalone.com',
    'citi': 'citi.com',
    'american express': 'americanexpress.com',
    'amex': 'americanexpress.com',
    'discover': 'discover.com',
    'robinhood': 'robinhood.com',
    'coinbase': 'coinbase.com',
    'binance': 'binance.com',
    'kraken': 'kraken.com',
    'fidelity': 'fidelity.com',
    'vanguard': 'vanguard.com',
    'schwab': 'schwab.com',
    'etrade': 'etrade.com',
    'stripe': 'stripe.com',
    'square': 'squareup.com',

    // Utilities & Services
    'att': 'att.com',
    'verizon': 'verizon.com',
    't-mobile': 't-mobile.com',
    'comcast': 'xfinity.com',
    'xfinity': 'xfinity.com',
    'spectrum': 'spectrum.com',
    'cox': 'cox.com',
    'geico': 'geico.com',
    'progressive': 'progressive.com',
    'state farm': 'statefarm.com',
    'allstate': 'allstate.com',
    'usaa': 'usaa.com',

    // Social Media
    'facebook': 'facebook.com',
    'meta': 'meta.com',
    'instagram': 'instagram.com',
    'twitter': 'twitter.com',
    'x': 'x.com',
    'linkedin': 'linkedin.com',
    'tiktok': 'tiktok.com',
    'snapchat': 'snapchat.com',
    'pinterest': 'pinterest.com',
    'reddit': 'reddit.com',

    // Health & Fitness
    'peloton': 'onepeloton.com',
    'planet fitness': 'planetfitness.com',
    '24 hour fitness': '24hourfitness.com',
    'la fitness': 'lafitness.com',
    'orangetheory': 'orangetheory.com',
    'equinox': 'equinox.com',
    'myfitnesspal': 'myfitnesspal.com',
    'headspace': 'headspace.com',
    'calm': 'calm.com',
    'noom': 'noom.com',

    // Education
    'coursera': 'coursera.org',
    'udemy': 'udemy.com',
    'skillshare': 'skillshare.com',
    'masterclass': 'masterclass.com',
    'linkedin learning': 'linkedin.com',
    'duolingo': 'duolingo.com',
    'chegg': 'chegg.com',
};

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const merchant = searchParams.get('merchant');
    const domain = searchParams.get('domain');

    if (!merchant && !domain) {
        return NextResponse.json({
            error: 'Missing merchant or domain parameter'
        }, { status: 400 });
    }

    // Normalize domain to lowercase - Clearbit requires lowercase domains
    let targetDomain = domain ? domain.toLowerCase() : null;

    if (merchant && !domain) {
        // Try to find domain from merchant name
        targetDomain = extractDomain(merchant);
    }

    if (!targetDomain) {
        return NextResponse.json({
            error: 'Could not determine domain',
            merchant,
            suggestion: 'Try providing the domain directly'
        }, { status: 404 });
    }

    const logoUrl = `https://logo.clearbit.com/${targetDomain}`;

    try {
        // Verify the logo exists
        const response = await fetch(logoUrl, { method: 'HEAD' });

        if (!response.ok) {
            return NextResponse.json({
                error: 'Logo not found',
                domain: targetDomain,
                fallback: true
            }, { status: 404 });
        }

        return NextResponse.json({
            merchant,
            domain: targetDomain,
            logoUrl,
            size: {
                default: logoUrl,
                small: `${logoUrl}?size=64`,
                medium: `${logoUrl}?size=128`,
                large: `${logoUrl}?size=256`,
            }
        });
    } catch {
        return NextResponse.json({
            error: 'Failed to fetch logo',
            domain: targetDomain
        }, { status: 500 });
    }
}

/**
 * Extract domain from merchant name
 */
function extractDomain(merchant: string): string | null {
    const normalized = merchant.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

    // Check known mappings first
    for (const [key, domain] of Object.entries(MERCHANT_DOMAINS)) {
        if (normalized.includes(key)) {
            return domain;
        }
    }

    // Try to guess domain from merchant name
    const words = normalized.split(' ');
    const firstWord = words[0];

    // Skip common prefixes
    const skipWords = ['the', 'a', 'an', 'at', 'to', 'from', 'in', 'on', 'for', 'of', 'sq', 'pos', 'pp', 'tst'];
    const meaningfulWord = skipWords.includes(firstWord) && words.length > 1 ? words[1] : firstWord;

    if (meaningfulWord && meaningfulWord.length >= 3) {
        return `${meaningfulWord}.com`;
    }

    return null;
}

/**
 * Batch lookup multiple merchants
 */
export async function POST(request: NextRequest) {
    try {
        const { merchants } = await request.json();

        if (!Array.isArray(merchants)) {
            return NextResponse.json({
                error: 'merchants must be an array'
            }, { status: 400 });
        }

        const results = await Promise.all(
            merchants.slice(0, 50).map(async (merchant: string) => {
                const domain = extractDomain(merchant);
                if (!domain) {
                    return { merchant, domain: null, logoUrl: null, found: false };
                }

                const logoUrl = `https://logo.clearbit.com/${domain}`;

                try {
                    const response = await fetch(logoUrl, { method: 'HEAD' });
                    return {
                        merchant,
                        domain,
                        logoUrl: response.ok ? logoUrl : null,
                        found: response.ok
                    };
                } catch {
                    return { merchant, domain, logoUrl: null, found: false };
                }
            })
        );

        return NextResponse.json({
            results,
            found: results.filter(r => r.found).length,
            total: results.length
        });
    } catch {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
}
