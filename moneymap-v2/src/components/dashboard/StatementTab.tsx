"use client";

import { useRef, useState, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useDataStore } from '@/lib/store/useDataStore';
import { GlassCard } from '../ui/GlassCard';
import { Badge } from '../ui/Badge';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Search, X } from 'lucide-react';
import { Transaction } from '@/lib/types';

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

// Transaction Detail Modal
function TransactionModal({ transaction, onClose }: { transaction: Transaction; onClose: () => void }) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white">Transaction Details</h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                    >
                        <X className="h-5 w-5 text-zinc-400" />
                    </button>
                </div>
                <div className="space-y-4">
                    <div className="flex items-center gap-3 pb-4 border-b border-white/10">
                        <MerchantLogo description={transaction.description} />
                        <div className="flex-1 min-w-0">
                            <p className="text-white font-medium break-words">{transaction.description}</p>
                            <p className="text-sm text-zinc-500">{formatDate(transaction.date)}</p>
                        </div>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-zinc-400">Category</span>
                        <Badge variant="neutral">{transaction.category}</Badge>
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t border-white/10">
                        <span className="text-zinc-400 font-medium">Amount</span>
                        <span className={cn(
                            "text-2xl font-bold font-mono",
                            transaction.amount > 0 ? "text-emerald-400" : "text-white"
                        )}>
                            {formatCurrency(transaction.amount)}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function StatementTab() {
    // State
    const { transactions } = useDataStore();
    const parentRef = useRef<HTMLDivElement>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

    // Data Processing
    const filteredTransactions = transactions.filter(tx => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            tx.description.toLowerCase().includes(query) ||
            tx.category.toLowerCase().includes(query) ||
            tx.amount.toString().includes(query)
        );
    });

    const sortedTransactions = [...filteredTransactions].sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Virtualization
    // eslint-disable-next-line react-hooks/incompatible-library
    const rowVirtualizer = useVirtualizer({
        count: sortedTransactions.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 56,
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
            <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Statement</h1>
                    <p className="text-zinc-400">
                        {sortedTransactions.length} transactions found.
                    </p>
                </div>
                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search transactions..."
                        className="w-full pl-10 pr-10 py-2.5 bg-zinc-900/60 border border-zinc-800/60 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/50 transition-colors text-sm min-h-[44px]"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/5 rounded transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                        >
                            <X className="h-3.5 w-3.5 text-zinc-500" />
                        </button>
                    )}
                </div>
            </header>

            <GlassCard intensity="medium" tint="slate" className="flex-1 overflow-hidden p-0 flex flex-col" contentClassName="flex flex-col h-full">
                {/* Desktop Table Header */}
                <div className="overflow-x-auto hidden md:block">
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
                            minWidth: '100%',
                        }}
                    >
                        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                            const tx = sortedTransactions[virtualRow.index];
                            return (
                                <div
                                    key={tx.id}
                                    onClick={() => setSelectedTransaction(tx)}
                                    className={cn(
                                        "absolute top-0 left-0 w-full px-4 md:px-6 items-center border-b border-white/5",
                                        "hover:bg-white/5 transition-colors cursor-pointer",
                                        "grid grid-cols-[1fr_auto] md:grid-cols-[110px_1fr_140px_120px] gap-2 md:gap-4",
                                        "min-h-[56px]"
                                    )}
                                    style={{
                                        height: `${virtualRow.size}px`,
                                        transform: `translateY(${virtualRow.start}px)`,
                                    }}
                                >
                                    {/* Mobile Layout */}
                                    <div className="flex items-center gap-3 min-w-0 md:hidden col-span-1">
                                        <MerchantLogo description={tx.description} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-white truncate">
                                                {tx.description}
                                            </p>
                                            <p className="text-xs text-zinc-500">{formatDate(tx.date)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-end md:hidden">
                                        <span className={cn(
                                            "text-sm font-medium font-mono",
                                            tx.amount > 0 ? "text-emerald-400" : "text-white"
                                        )}>
                                            {formatCurrency(tx.amount)}
                                        </span>
                                    </div>

                                    {/* Desktop Layout */}
                                    <div className="text-sm text-zinc-400 font-mono hidden md:block">
                                        {formatDate(tx.date)}
                                    </div>
                                    <div className="flex items-center gap-3 min-w-0 hidden md:flex">
                                        <MerchantLogo description={tx.description} />
                                        <span className="text-sm font-medium text-white truncate">
                                            {tx.description}
                                        </span>
                                    </div>
                                    <div className="hidden md:block">
                                        <Badge variant="neutral">{tx.category}</Badge>
                                    </div>
                                    <div className={cn(
                                        "text-sm font-medium text-right font-mono hidden md:block",
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

            {/* Transaction Detail Modal */}
            {selectedTransaction && (
                <TransactionModal
                    transaction={selectedTransaction}
                    onClose={() => setSelectedTransaction(null)}
                />
            )}
        </div>
    );
}
