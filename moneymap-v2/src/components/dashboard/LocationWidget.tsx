"use client";

import React, { useState, useEffect } from "react";
import { GlassCard } from "../ui/GlassCard";
import { MapPin, Globe, Clock, DollarSign, Loader2, RefreshCw } from "lucide-react";
import { cn } from "../../lib/utils";

interface LocationData {
    ip: string;
    location: {
        country: string;
        countryCode: string;
        state: string;
        city: string;
        latitude: number;
        longitude: number;
        flag: string;
    };
    timezone: {
        name: string;
        offset: number;
        currentTime: string;
        isDST: boolean;
    };
    currency: {
        code: string;
        name: string;
        symbol: string;
    };
}

interface LocationWidgetProps {
    onCurrencyDetected?: (currencyCode: string) => void;
}

export function LocationWidget({ onCurrencyDetected }: LocationWidgetProps) {
    const [location, setLocation] = useState<LocationData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState<string>('');

    const fetchLocation = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/location');
            const data = await response.json();
            
            if (data.error && data.fallback) {
                setLocation({
                    ip: 'Unknown',
                    location: data.fallback.location,
                    timezone: data.fallback.timezone,
                    currency: data.fallback.currency,
                } as LocationData);
            } else {
                setLocation(data);
                if (onCurrencyDetected && data.currency?.code) {
                    onCurrencyDetected(data.currency.code);
                }
            }
        } catch (error) {
            console.error('Failed to fetch location:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLocation();
    }, []);

    // Update local time every second
    useEffect(() => {
        if (!location?.timezone) return;

        const updateTime = () => {
            const now = new Date();
            const formatter = new Intl.DateTimeFormat('en-US', {
                timeZone: location.timezone.name,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true,
            });
            setCurrentTime(formatter.format(now));
        };

        updateTime();
        const interval = setInterval(updateTime, 1000);
        return () => clearInterval(interval);
    }, [location]);

    if (isLoading) {
        return (
            <GlassCard className="p-6">
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 text-blue-400 animate-spin" />
                    <span className="ml-2 text-zinc-400">Detecting location...</span>
                </div>
            </GlassCard>
        );
    }

    if (!location) return null;

    return (
        <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-blue-400" />
                    <h3 className="text-lg font-semibold text-white">Your Location</h3>
                </div>
                <button
                    onClick={fetchLocation}
                    disabled={isLoading}
                    className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                >
                    <RefreshCw className={cn("h-4 w-4 text-zinc-400", isLoading && "animate-spin")} />
                </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* Location Card */}
                <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/60">
                    <div className="flex items-center gap-2 mb-2">
                        <Globe className="h-4 w-4 text-blue-400" />
                        <span className="text-xs text-zinc-500">Location</span>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                        {location.location.flag && (
                            <img 
                                src={location.location.flag} 
                                alt={location.location.country}
                                className="w-6 h-4 rounded"
                            />
                        )}
                        <p className="text-base font-semibold text-white">
                            {location.location.city || 'Unknown'}
                        </p>
                    </div>
                    <p className="text-sm text-zinc-400">
                        {location.location.state}, {location.location.countryCode}
                    </p>
                </div>

                {/* Timezone Card */}
                <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/60">
                    <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4 text-cyan-400" />
                        <span className="text-xs text-zinc-500">Local Time</span>
                    </div>
                    <p className="text-xl font-bold text-white mb-1">
                        {currentTime}
                    </p>
                    <p className="text-xs text-zinc-400">
                        {location.timezone.name}
                        {location.timezone.isDST && <span className="ml-1 text-amber-400">(DST)</span>}
                    </p>
                </div>

                {/* Currency Card */}
                <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/60">
                    <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="h-4 w-4 text-emerald-400" />
                        <span className="text-xs text-zinc-500">Currency</span>
                    </div>
                    <p className="text-xl font-bold text-white mb-1">
                        {location.currency.code}
                    </p>
                    <p className="text-xs text-zinc-400">
                        {location.currency.symbol} {location.currency.name}
                    </p>
                </div>

                {/* IP Address Card */}
                <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/60">
                    <div className="flex items-center gap-2 mb-2">
                        <Globe className="h-4 w-4 text-purple-400" />
                        <span className="text-xs text-zinc-500">IP Address</span>
                    </div>
                    <p className="text-base font-mono font-semibold text-white mb-1">
                        {location.ip}
                    </p>
                    <p className="text-xs text-zinc-400">
                        {location.location.latitude.toFixed(2)}°, {location.location.longitude.toFixed(2)}°
                    </p>
                </div>
            </div>

            <div className="mt-4 pt-4 border-t border-zinc-800/60">
                <p className="text-xs text-zinc-500 text-center">
                    Location data provided by IP Geolocation API
                </p>
            </div>
        </GlassCard>
    );
}
