"use client";

import { useRef, useState, useCallback, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useDataStore } from '@/lib/store/useDataStore';
import { useDateStore } from '@/lib/store/useDateStore';
import { getTransactionsInDateRange } from '@/lib/selectors/transactionSelectors';
import { GlassCard } from '../ui/GlassCard';
import { Badge } from '../ui/Badge';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Search, X, Calendar, ChevronDown } from 'lucide-react';
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
        // Normalize to lowercase for Clearbit API compatibility
        return domainMatch[1].toLowerCase();
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
    // Stores
    const { transactions } = useDataStore();
    const {
        viewStart,
        viewEnd,
        datasetStart,
        datasetEnd,
        setViewRange
    } = useDateStore();

    // Local State
    const parentRef = useRef<HTMLDivElement>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [showFullDataset, setShowFullDataset] = useState(false);

    // Generate month/year options based on dataset range
    const dateOptions = useMemo(() => {
        const months: { month: number; year: number; label: string }[] = [];
        const start = new Date(datasetStart);
        const end = new Date(datasetEnd);

        const current = new Date(start.getFullYear(), start.getMonth(), 1);
        while (current <= end) {
            months.push({
                month: current.getMonth(),
                year: current.getFullYear(),
                label: current.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
            });
            current.setMonth(current.getMonth() + 1);
        }
        return months;
    }, [datasetStart, datasetEnd]);

    // Current view range as month/year values
    const currentFromMonth = new Date(viewStart).getMonth();
    const currentFromYear = new Date(viewStart).getFullYear();
    const currentToMonth = new Date(viewEnd).getMonth();
    const currentToYear = new Date(viewEnd).getFullYear();

    // Phase 2.1 view-range: Helper to compute full calendar month range
    const getMonthRange = useCallback((year: number, month: number) => {
        const start = new Date(year, month, 1); // First day at 00:00:00
        const end = new Date(year, month + 1, 0, 23, 59, 59, 999); // Last day at 23:59:59.999
        return { start, end };
    }, []);

    // Phase 2.1 view-range: Handler for From dropdown change
    const handleFromChange = useCallback((value: string) => {
        const [newFromMonth, newFromYear] = value.split('-').map(Number);

        // Get current To month/year from viewEnd
        const currentEndDate = new Date(viewEnd);
        const currentToMonth = currentEndDate.getMonth();
        const currentToYear = currentEndDate.getFullYear();

        // Case 1: Same month selected (Dec-Dec, Nov-Nov, etc.)
        if (newFromMonth === currentToMonth && newFromYear === currentToYear) {
            const { start, end } = getMonthRange(newFromYear, newFromMonth);
            setViewRange(start, end);
            return;
        }

        // Case 2: New From is AFTER current To (invalid range)
        // Solution: Snap To to match From (same-month range)
        if (newFromYear > currentToYear || (newFromYear === currentToYear && newFromMonth > currentToMonth)) {
            const { start, end } = getMonthRange(newFromYear, newFromMonth);
            setViewRange(start, end);
            return;
        }

        // Case 3: Valid cross-month range (From <= To)
        // Set From to first day of new From month, keep To at last day of current To month
        const fromRange = getMonthRange(newFromYear, newFromMonth);
        const toRange = getMonthRange(currentToYear, currentToMonth);
        setViewRange(fromRange.start, toRange.end);
    }, [viewEnd, setViewRange, getMonthRange]);

    // Phase 2.1 view-range: Handler for To dropdown change
    const handleToChange = useCallback((value: string) => {
        const [newToMonth, newToYear] = value.split('-').map(Number);

        // Get current From month/year from viewStart
        const currentStartDate = new Date(viewStart);
        const currentFromMonth = currentStartDate.getMonth();
        const currentFromYear = currentStartDate.getFullYear();

        // Case 1: Same month selected (Dec-Dec, Nov-Nov, etc.)
        if (newToMonth === currentFromMonth && newToYear === currentFromYear) {
            const { start, end } = getMonthRange(newToYear, newToMonth);
            setViewRange(start, end);
            return;
        }

        // Case 2: New To is BEFORE current From (invalid range)
        // Solution: Snap From to match To (same-month range)
        if (newToYear < currentFromYear || (newToYear === currentFromYear && newToMonth < currentFromMonth)) {
            const { start, end } = getMonthRange(newToYear, newToMonth);
            setViewRange(start, end);
            return;
        }

        // Case 3: Valid cross-month range (From <= To)
        // Keep From at first day of current From month, set To to last day of new To month
        const fromRange = getMonthRange(currentFromYear, currentFromMonth);
        const toRange = getMonthRange(newToYear, newToMonth);
        setViewRange(fromRange.start, toRange.end);
    }, [viewStart, setViewRange, getMonthRange]);

    // Filter transactions by date range (view range or full dataset)
    const dateFilteredTransactions = useMemo(() => {
        if (showFullDataset) {
            return transactions;
        }
        return getTransactionsInDateRange(transactions, viewStart, viewEnd);
    }, [transactions, viewStart, viewEnd, showFullDataset]);

    // Phase 2.1 view-range: Compute month-based display range for UI label
    // View ranges are month-based; we display full month windows regardless of actual transaction dates
    const displayRange = useMemo(() => {
        if (showFullDataset) {
            return 'full dataset';
        }

        // Compute display start: 1st day of From month
        const displayStart = new Date(viewStart.getFullYear(), viewStart.getMonth(), 1);

        // Compute display end: last day of To month
        const displayEnd = new Date(viewEnd.getFullYear(), viewEnd.getMonth() + 1, 0);

        const formatDate = (d: Date) => d.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });

        return `${formatDate(displayStart)} – ${formatDate(displayEnd)}`;
    }, [viewStart, viewEnd, showFullDataset]);

    // Search filtering (on top of date filtering)
    const filteredTransactions = useMemo(() => {
        if (!searchQuery) return dateFilteredTransactions;
        const query = searchQuery.toLowerCase();
        return dateFilteredTransactions.filter(tx =>
            tx.description.toLowerCase().includes(query) ||
            tx.category.toLowerCase().includes(query) ||
            tx.amount.toString().includes(query)
        );
    }, [dateFilteredTransactions, searchQuery]);

    // Sort by date descending
    const sortedTransactions = useMemo(() => {
        return [...filteredTransactions].sort((a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );
    }, [filteredTransactions]);

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
            <header className="flex flex-col gap-4">
                {/* Title and count */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Statement</h1>
                        <p className="text-zinc-400">
                            {sortedTransactions.length} transactions
                            {showFullDataset ? ' (full dataset)' : ` (${displayRange})`}
                        </p>
                    </div>

                    {/* Search Bar */}
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
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/5 rounded transition-colors"
                            >
                                <X className="h-3.5 w-3.5 text-zinc-500" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Date Range Controls */}
                <div className="flex flex-wrap items-center gap-3 p-4 bg-zinc-900/50 rounded-xl border border-white/5">
                    <div className="flex items-center gap-2 text-sm text-zinc-400">
                        <Calendar className="h-4 w-4" />
                        <span>Date Range:</span>
                    </div>

                    {/* From Dropdown */}
                    <div className="relative">
                        <select
                            value={`${currentFromMonth}-${currentFromYear}`}
                            onChange={(e) => handleFromChange(e.target.value)}
                            disabled={showFullDataset}
                            className={cn(
                                "appearance-none bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 pr-8 text-sm text-white focus:outline-none focus:border-blue-500/50",
                                showFullDataset && "opacity-50 cursor-not-allowed"
                            )}
                        >
                            {dateOptions.map(opt => (
                                <option key={`from-${opt.month}-${opt.year}`} value={`${opt.month}-${opt.year}`}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
                    </div>

                    <span className="text-zinc-500">to</span>

                    {/* To Dropdown */}
                    <div className="relative">
                        <select
                            value={`${currentToMonth}-${currentToYear}`}
                            onChange={(e) => handleToChange(e.target.value)}
                            disabled={showFullDataset}
                            className={cn(
                                "appearance-none bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 pr-8 text-sm text-white focus:outline-none focus:border-blue-500/50",
                                showFullDataset && "opacity-50 cursor-not-allowed"
                            )}
                        >
                            {dateOptions.map(opt => (
                                <option key={`to-${opt.month}-${opt.year}`} value={`${opt.month}-${opt.year}`}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
                    </div>

                    {/* View Mode Toggle */}
                    <div className="ml-auto flex items-center gap-2">
                        <button
                            onClick={() => setShowFullDataset(false)}
                            className={cn(
                                "px-3 py-1.5 text-xs rounded-lg transition-colors",
                                !showFullDataset
                                    ? "bg-blue-600 text-white"
                                    : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                            )}
                        >
                            View Range
                        </button>
                        <button
                            onClick={() => setShowFullDataset(true)}
                            className={cn(
                                "px-3 py-1.5 text-xs rounded-lg transition-colors",
                                showFullDataset
                                    ? "bg-blue-600 text-white"
                                    : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                            )}
                        >
                            Full Dataset
                        </button>
                    </div>
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
