"use client";

import React, { useState, useEffect } from "react";
import { GlassCard } from "../ui/GlassCard";
import { DollarSign, RefreshCw, Loader2, ArrowRightLeft } from "lucide-react";
import { cn } from "../../lib/utils";

interface ExchangeRates {
    base: string;
    date: string;
    rates: Record<string, number>;
    popular: Record<string, number>;
}

const POPULAR_CURRENCIES = [
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
    { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
    { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
    { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
];

interface CurrencyConverterProps {
    detectedCurrency?: string;
}

export function CurrencyConverter({ detectedCurrency }: CurrencyConverterProps) {
    const [rates, setRates] = useState<ExchangeRates | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [amount, setAmount] = useState<string>('100');
    const [fromCurrency, setFromCurrency] = useState('USD');
    const [toCurrency, setToCurrency] = useState('EUR');
    const [hasAutoSet, setHasAutoSet] = useState(false);

    // Auto-set currency based on detected location
    useEffect(() => {
        if (detectedCurrency && !hasAutoSet) {
            setFromCurrency(detectedCurrency);
            setHasAutoSet(true);
        }
    }, [detectedCurrency, hasAutoSet]);

    const fetchRates = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/exchange?base=${fromCurrency}`);
            const data = await response.json();
            setRates(data);
        } catch (error) {
            console.error('Failed to fetch exchange rates:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRates();
    }, [fromCurrency]);

    const convertedAmount = rates && amount
        ? (parseFloat(amount) * (rates.rates[toCurrency] || 1)).toFixed(2)
        : '0.00';

    const swapCurrencies = () => {
        setFromCurrency(toCurrency);
        setToCurrency(fromCurrency);
    };

    return (
        <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-emerald-400" />
                    <h3 className="text-lg font-semibold text-white">Currency Converter</h3>
                </div>
                <button
                    onClick={fetchRates}
                    disabled={isLoading}
                    className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                >
                    <RefreshCw className={cn("h-4 w-4 text-zinc-400", isLoading && "animate-spin")} />
                </button>
            </div>

            {isLoading && !rates ? (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 text-emerald-400 animate-spin" />
                    <span className="ml-2 text-zinc-400">Loading rates...</span>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* From Currency */}
                    <div>
                        <label className="text-xs text-zinc-500 mb-2 block">Amount</label>
                        <div className="flex gap-2">
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="flex-1 px-4 py-3 bg-zinc-900/60 border border-zinc-800/60 rounded-xl text-white text-lg font-semibold focus:outline-none focus:border-emerald-500/50 transition-colors"
                                placeholder="100"
                            />
                            <select
                                value={fromCurrency}
                                onChange={(e) => setFromCurrency(e.target.value)}
                                className="px-4 py-3 bg-zinc-900/60 border border-zinc-800/60 rounded-xl text-white font-medium focus:outline-none focus:border-emerald-500/50 transition-colors cursor-pointer"
                            >
                                {POPULAR_CURRENCIES.map(curr => (
                                    <option key={curr.code} value={curr.code}>
                                        {curr.code} {curr.symbol}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Swap Button */}
                    <div className="flex justify-center">
                        <button
                            onClick={swapCurrencies}
                            className="p-3 bg-emerald-500/20 hover:bg-emerald-500/30 rounded-xl transition-colors border border-emerald-500/30"
                        >
                            <ArrowRightLeft className="h-5 w-5 text-emerald-400" />
                        </button>
                    </div>

                    {/* To Currency */}
                    <div>
                        <label className="text-xs text-zinc-500 mb-2 block">Converted Amount</label>
                        <div className="flex gap-2">
                            <div className="flex-1 px-4 py-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                                <p className="text-2xl font-bold text-emerald-400">
                                    {convertedAmount}
                                </p>
                            </div>
                            <select
                                value={toCurrency}
                                onChange={(e) => setToCurrency(e.target.value)}
                                className="px-4 py-3 bg-zinc-900/60 border border-zinc-800/60 rounded-xl text-white font-medium focus:outline-none focus:border-emerald-500/50 transition-colors cursor-pointer"
                            >
                                {POPULAR_CURRENCIES.map(curr => (
                                    <option key={curr.code} value={curr.code}>
                                        {curr.code} {curr.symbol}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Exchange Rate Info */}
                    {rates && (
                        <div className="pt-4 border-t border-zinc-800/60">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-zinc-500">Exchange Rate</span>
                                <span className="text-white font-medium">
                                    1 {fromCurrency} = {rates.rates[toCurrency]?.toFixed(4)} {toCurrency}
                                </span>
                            </div>
                            <p className="text-xs text-zinc-600 mt-2 text-center">
                                Last updated: {rates.date}
                            </p>
                        </div>
                    )}
                </div>
            )}

            <div className="mt-4 pt-4 border-t border-zinc-800/60">
                <p className="text-xs text-zinc-500 text-center">
                    Real-time exchange rates • Free API (no key required)
                </p>
            </div>
        </GlassCard>
    );
}
