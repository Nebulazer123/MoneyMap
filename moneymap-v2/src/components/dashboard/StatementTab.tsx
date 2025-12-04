"use client";

import { useRef, useState, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useDataStore } from '@/lib/store/useDataStore';
import { GlassCard } from '../ui/GlassCard';
import { Badge } from '../ui/Badge';
import { cn } from '@/lib/utils';
import Image from 'next/image';

// Map common merchants to their domains for Clearbit logos
const MERCHANT_DOMAINS: Record<string, string> = {
    'amazon': 'amazon.com',
    'walmart': 'walmart.com',
    'target': 'target.com',
    'costco': 'costco.com',
    'starbucks': 'starbucks.com',
    'mcdonalds': "mcdonalds.com",
    'uber': 'uber.com',
    'lyft': 'lyft.com',
    'netflix': 'netflix.com',
    'spotify': 'spotify.com',
    'apple': 'apple.com',
    'google': 'google.com',
    'microsoft': 'microsoft.com',
    'paypal': 'paypal.com',
    'venmo': 'venmo.com',
    'chase': 'chase.com',
    'wells fargo': 'wellsfargo.com',
    'bank of america': 'bankofamerica.com',
    'capital one': 'capitalone.com',
    'discover': 'discover.com',
    'american express': 'americanexpress.com',
    'amex': 'americanexpress.com',
    'usaa': 'usaa.com',
    'verizon': 'verizon.com',
    'at&t': 'att.com',
    't-mobile': 't-mobile.com',
    'cvs': 'cvs.com',
    'walgreens': 'walgreens.com',
    'kroger': 'kroger.com',
    'home depot': 'homedepot.com',
    'lowes': 'lowes.com',
    'best buy': 'bestbuy.com',
    'doordash': 'doordash.com',
    'grubhub': 'grubhub.com',
    'instacart': 'instacart.com',
    'chipotle': 'chipotle.com',
    'subway': 'subway.com',
    'shell': 'shell.com',
    'exxon': 'exxon.com',
    'chevron': 'chevron.com',
    'airbnb': 'airbnb.com',
    'delta': 'delta.com',
    'united': 'united.com',
    'southwest': 'southwest.com',
    'hilton': 'hilton.com',
    'marriott': 'marriott.com',
    'nike': 'nike.com',
    'adidas': 'adidas.com',
    'nordstrom': 'nordstrom.com',
    'hulu': 'hulu.com',
    'disney': 'disneyplus.com',
    'hbo': 'hbo.com',
    'youtube': 'youtube.com',
    'adobe': 'adobe.com',
    'zoom': 'zoom.us',
    'slack': 'slack.com',
    'github': 'github.com',
    'shopify': 'shopify.com',
    'etsy': 'etsy.com',
    'ebay': 'ebay.com',
    'stripe': 'stripe.com',
    'robinhood': 'robinhood.com',
    'coinbase': 'coinbase.com',
    'fidelity': 'fidelity.com',
    'schwab': 'schwab.com',
    'vanguard': 'vanguard.com',
};

// Extract merchant domain from description
function getMerchantDomain(description: string): string | null {
    const lowerDesc = description.toLowerCase();
    
    for (const [merchant, domain] of Object.entries(MERCHANT_DOMAINS)) {
        if (lowerDesc.includes(merchant)) {
            return domain;
        }
    }
    
    const domainMatch = description.match(/(?:www\.)?([a-zA-Z0-9-]+\.[a-zA-Z]{2,})/);
    if (domainMatch) {
        return domainMatch[1];
    }
    
    return null;
}

// Merchant logo component with fallback
function MerchantLogo({ description }: { description: string }) {
    const [hasError, setHasError] = useState(false);
    const domain = getMerchantDomain(description);
    
    const handleError = useCallback(() => {
        setHasError(true);
    }, []);
    
    if (!domain || hasError) {
        const initial = description.charAt(0).toUpperCase();
        return (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-white text-sm font-medium shrink-0">
                {initial}
            </div>
        );
    }
    
    return (
        <Image
            src={`/api/logos?domain=${encodeURIComponent(domain)}&size=64`}
            alt={description}
            width={32}
            height={32}
            className="rounded-full bg-white object-contain shrink-0"
            onError={handleError}
            unoptimized
        />
    );
}

export function StatementTab() {
    // State
    const { transactions } = useDataStore();
    const parentRef = useRef<HTMLDivElement>(null);

    // Data Processing
    const sortedTransactions = [...transactions].sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Virtualization
    // eslint-disable-next-line react-hooks/incompatible-library
    const rowVirtualizer = useVirtualizer({
        count: sortedTransactions.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 56, // Taller for merchant logos
        overscan: 5,
    });

    // Helper Functions
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
        });
    };

    // Render
    return (
        <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col animate-fade-in">
            <header>
                <h1 className="text-3xl font-bold tracking-tight">Statement</h1>
                <p className="text-zinc-400">
                    {transactions.length} transactions found.
                </p>
            </header>

            <GlassCard intensity="medium" tint="slate" className="flex-1 overflow-hidden p-0 flex flex-col">
                <div className="overflow-x-auto">
                    <div className="grid grid-cols-[110px_1fr_140px_120px] gap-4 border-b border-white/10 bg-slate-800/50 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-200 min-w-[800px]">
                        <div>Date</div>
                        <div>Description</div>
                        <div>Category</div>
                        <div className="text-right">Amount</div>
                    </div>
                </div>

                <div ref={parentRef} className="flex-1 overflow-auto">
                    <div
                        style={{
                            height: `${rowVirtualizer.getTotalSize()}px`,
                            width: '100%',
                            position: 'relative',
                            minWidth: '800px',
                        }}
                    >
                        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                            const tx = sortedTransactions[virtualRow.index];
                            return (
                                <div
                                    key={tx.id}
                                    className={cn(
                                        "absolute top-0 left-0 w-full grid grid-cols-[110px_1fr_140px_120px] gap-4 px-6 items-center border-b border-white/5",
                                        "hover:bg-white/5 transition-colors"
                                    )}
                                    style={{
                                        height: `${virtualRow.size}px`,
                                        transform: `translateY(${virtualRow.start}px)`,
                                    }}
                                >
                                    <div className="text-sm text-zinc-400 font-mono">
                                        {formatDate(tx.date)}
                                    </div>
                                    <div className="flex items-center gap-3 min-w-0">
                                        <MerchantLogo description={tx.description} />
                                        <span className="text-sm font-medium text-white truncate">
                                            {tx.description}
                                        </span>
                                    </div>
                                    <div>
                                        <Badge variant="neutral">{tx.category}</Badge>
                                    </div>
                                    <div className={cn(
                                        "text-sm font-medium text-right font-mono",
                                        tx.amount > 0 ? "text-emerald-400" : "text-white"
                                    )}>
                                        {formatCurrency(tx.amount)}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </GlassCard>
        </div>
    );
}
