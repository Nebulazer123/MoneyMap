import { useDataStore } from "@/lib/store/useDataStore";
import { useDateStore } from "@/lib/store/useDateStore";
import { useMemo, useState, useEffect } from "react";
import { ArrowUpRight, ArrowDownRight, Wallet, CreditCard, Activity, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { NewsFeed } from "./NewsFeed";
import { EconomicWidget } from "./EconomicWidget";
import { getTransactionsInDateRange } from "@/lib/selectors/transactionSelectors";
import { computeSummaryMetrics } from "@/lib/math/transactionMath";

export function Dashboard() {
    const { transactions } = useDataStore();
    const { viewStart, viewEnd } = useDateStore();
    const [currentTime, setCurrentTime] = useState(new Date());

    // Update time every minute
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000); // Update every minute
        return () => clearInterval(interval);
    }, []);

    const getGreeting = () => {
        const hour = currentTime.getHours();
        if (hour < 12) return "Good Morning";
        if (hour < 18) return "Good Afternoon";
        return "Good Evening";
    };

    const getTimeZoneAbbr = () => {
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const now = new Date();
        const shortFormat = new Intl.DateTimeFormat('en-US', {
            timeZone,
            timeZoneName: 'short'
        }).format(now);
        const match = shortFormat.match(/\b([A-Z]{2,5})\b$/);
        return match ? match[1] : 'UTC';
    };

    const formatTime = () => {
        return currentTime.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    // Phase 2.2 transaction-math: Use centralized summary metrics with view range filtering
    const stats = useMemo(() => {
        const filteredTransactions = getTransactionsInDateRange(transactions, viewStart, viewEnd);
        return computeSummaryMetrics(filteredTransactions);
    }, [transactions, viewStart, viewEnd]);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(val);
    };

    return (
        <div className="p-6 space-y-8 animate-fade-in">
            {/* Clock & Greeting Section */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-white to-zinc-400 bg-clip-text text-transparent">
                        {getGreeting()}
                    </h1>
                    <p className="text-zinc-400">Welcome back to your financial overview.</p>
                </div>
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-zinc-900/40 border border-white/5 backdrop-blur-xl">
                    <Clock className="h-5 w-5 text-blue-400" />
                    <div className="flex flex-col">
                        <span className="text-xl font-bold text-white tabular-nums">
                            {formatTime()}
                        </span>
                        <span className="text-xs text-zinc-500">
                            {getTimeZoneAbbr()}
                        </span>
                    </div>
                </div>
            </div>

            {/* Summary Boxes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Income */}
                <SummaryCard
                    title="Income"
                    value={formatCurrency(stats.income)}
                    icon={ArrowUpRight}
                    iconColor="text-emerald-400"
                    trend="+12% vs last month"
                    trendColor="text-emerald-400"
                />

                {/* Spending */}
                <SummaryCard
                    title="Spending"
                    value={formatCurrency(stats.spending)}
                    icon={ArrowDownRight}
                    iconColor="text-blue-400"
                    trend="-5% vs last month"
                    trendColor="text-emerald-400"
                />

                {/* Net Cashflow */}
                <SummaryCard
                    title="Net Cashflow"
                    value={formatCurrency(stats.netCashFlow)}
                    icon={Activity}
                    iconColor="text-purple-400"
                    trend="Healthy"
                    trendColor="text-purple-400"
                />

                {/* Subscriptions */}
                <SummaryCard
                    title="Subscriptions"
                    value={formatCurrency(stats.subscriptionTotal)}
                    icon={CreditCard}
                    iconColor="text-amber-400"
                    trend="3 active"
                    trendColor="text-zinc-400"
                />

                {/* Fees */}
                <SummaryCard
                    title="Fees"
                    value={formatCurrency(stats.feeTotal)}
                    icon={Wallet}
                    iconColor="text-pink-400"
                    trend="Low"
                    trendColor="text-zinc-400"
                />
            </div>

            {/* Economic Indicators Section */}
            <div className="mb-8">
                <EconomicWidget />
            </div>

            {/* Recent News Section */}
            <div className="mb-8">
                <NewsFeed />
            </div>

            {/* Placeholder for Phase 2 Data Wiring Note */}
            <div className="rounded-lg border border-dashed border-zinc-700 p-4 bg-zinc-900/30 text-zinc-500 text-sm text-center">
                Phase 2: Real data wiring and deep logic will replace these simple summations.
            </div>
        </div>
    );
}

interface SummaryCardProps {
    title: string;
    value: string;
    icon: React.ComponentType<{ className?: string }>;
    iconColor: string;
    trend: string;
    trendColor: string;
}

function SummaryCard({ title, value, icon: Icon, iconColor, trend, trendColor }: SummaryCardProps) {
    return (
        <div className="relative group overflow-hidden rounded-2xl border border-white/5 bg-zinc-900/40 backdrop-blur-xl p-5 transition-all duration-300 hover:bg-zinc-900/60 hover:border-white/10 hover:shadow-lg hover:shadow-purple-500/10 hover:-translate-y-1">
            <div className="flex justify-between items-start mb-4">
                <div className="p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
                    <Icon className={cn("h-5 w-5", iconColor)} />
                </div>
                <span className={cn("text-xs font-medium px-2 py-1 rounded-full bg-white/5", trendColor)}>
                    {trend}
                </span>
            </div>
            <div className="space-y-1">
                <p className="text-sm font-medium text-zinc-400">{title}</p>
                <h3 className="text-2xl font-bold text-white tracking-tight">{value}</h3>
            </div>

            {/* Decorative gradient glow */}
            <div className="absolute -right-10 -bottom-10 h-32 w-32 rounded-full bg-gradient-to-br from-white/5 to-transparent blur-2xl group-hover:from-white/10 transition-all duration-500" />
        </div>
    );
}
