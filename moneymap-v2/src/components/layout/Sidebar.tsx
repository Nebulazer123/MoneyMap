"use client";

import { useState } from 'react';
import { useUIStore, DashboardTab } from '@/lib/store/useUIStore';
import { useDataStore } from '@/lib/store/useDataStore';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Receipt, RefreshCw, Wallet, ShieldCheck, Menu, Activity, CreditCard, ChevronsLeft, Building2, TrendingUp, LucideIcon, RotateCcw } from 'lucide-react';
import { Button } from '../ui/Button';
import { MinigameModal } from '@/components/dashboard/MinigameModal';

const tabRoutes: Record<DashboardTab, string> = {
    dashboard: '/dashboard',
    overview: '/dashboard',
    recurring: '/dashboard',
    fees: '/dashboard',
    cashflow: '/dashboard',
    review: '/dashboard',
    statement: '/dashboard',
    subscriptions: '/dashboard',
    budget: '/dashboard',
    accounts: '/dashboard',
    stocks: '/dashboard/stocks',
    crypto: '/dashboard/crypto',
};

const activeNavChrome = "bg-white/10 text-white border border-white/20 ring-1 ring-inset shadow-[inset_0_1px_0_rgba(255,255,255,0.10),0_2px_8px_rgba(0,0,0,0.35)]";

const activeNavRingClasses: Record<DashboardTab, string> = {
    dashboard: "ring-white/20",
    overview: "ring-blue-500/25",
    statement: "ring-slate-500/25",
    subscriptions: "ring-purple-500/25",
    recurring: "ring-amber-500/25",
    fees: "ring-pink-500/25",
    cashflow: "ring-teal-500/25",
    budget: "ring-emerald-500/25",
    accounts: "ring-amber-500/25",
    stocks: "ring-lime-500/25",
    crypto: "ring-orange-500/25",
    review: "ring-zinc-500/25",
};

export function Sidebar() {
    const { activeTab, setActiveTab, isSidebarOpen, toggleSidebar, setSidebarOpen } = useUIStore();
    const { loadDemoData } = useDataStore();
    const router = useRouter();
    const pathname = usePathname();
    const [isMinigameOpen, setIsMinigameOpen] = useState(false);
    const openSidebar = () => setSidebarOpen(true);

    const navItems: { id: DashboardTab; label: string; icon: LucideIcon }[] = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'overview', label: 'Overview', icon: Activity },
        { id: 'statement', label: 'Statement', icon: Receipt },
        { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
        { id: 'recurring', label: 'Recurring', icon: RefreshCw },
        { id: 'fees', label: 'Fees', icon: Wallet },
        { id: 'cashflow', label: 'Cashflow', icon: Activity },
        { id: 'budget', label: 'Budget', icon: ShieldCheck },
        { id: 'accounts', label: 'My Money', icon: Building2 },
        { id: 'stocks', label: 'Stocks', icon: TrendingUp },
        { id: 'crypto', label: 'Crypto', icon: TrendingUp },
        { id: 'review', label: 'Review', icon: ShieldCheck },
    ];

    return (
        <>
            {/* Mobile Toggle */}
            {/* Toggle Button (Visible when sidebar is closed) */}
            {!isSidebarOpen && (
                <>
                    <div
                        className="fixed inset-y-0 left-0 z-50 hidden w-3 md:block"
                        onMouseEnter={openSidebar}
                        onMouseMove={openSidebar}
                        onPointerEnter={openSidebar}
                        onPointerMove={openSidebar}
                        aria-hidden="true"
                    />
                    <div
                        className="fixed bottom-4 left-4 z-50"
                        onMouseEnter={openSidebar}
                        onMouseMove={openSidebar}
                        onPointerEnter={openSidebar}
                        onPointerMove={openSidebar}
                    >
                        <Button
                            variant="secondary"
                            size="icon"
                            onClick={openSidebar}
                            onFocus={openSidebar}
                            className={cn(
                                "liquid-glass group/menu border-white/15 bg-white/[0.035] text-white/55 shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_8px_28px_rgba(0,0,0,0.16)]",
                                "backdrop-blur-2xl hover:bg-white/12 hover:text-white hover:border-white/30 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_10px_34px_rgba(59,130,246,0.18)]",
                                "focus-visible:bg-white/14 focus-visible:text-white focus-visible:border-white/35"
                            )}
                        >
                            <Menu className="h-5 w-5 opacity-70 transition-opacity group-hover/menu:opacity-100" />
                        </Button>
                    </div>
                </>
            )}

            {/* Sidebar Container */}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-40 w-16 md:w-64 transform transition-transform duration-300 ease-in-out",
                    "bg-black/20 backdrop-blur-[40px] border-r border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.3)]",
                    isSidebarOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                {/* Faint glass glare */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
                <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-white/10 via-transparent to-transparent pointer-events-none" />
                <button
                    type="button"
                    onClick={toggleSidebar}
                    className="liquid-glass absolute bottom-4 right-4 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/[0.055] text-zinc-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_10px_30px_rgba(0,0,0,0.28)] backdrop-blur-2xl transition-all hover:border-white/35 hover:bg-white/12 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                    aria-label="Close sidebar"
                    title="Close sidebar"
                >
                    <ChevronsLeft className="h-4 w-4" />
                </button>

                <div className="relative flex h-full min-h-0 flex-col px-2 pb-16 pt-2 md:px-6 md:pb-16 md:pt-6">
                    {/* Logo */}
                    <div className="mb-6 flex shrink-0 items-center justify-center px-0 md:mb-10 md:justify-start md:px-2">
                        <Link href="/" className="flex items-center justify-center gap-3 hover:opacity-90 transition-all duration-300 group md:justify-start">
                            {/* Custom MoneyMap Logo - Enhanced */}
                            <div className="relative flex h-12 w-12 items-center justify-center">
                                {/* Animated outer glow rings - reduced 50% */}
                                <div className="absolute inset-[-4px] rounded-2xl bg-gradient-to-br from-purple-500/25 via-blue-500/20 to-cyan-500/25 blur-xl opacity-30 group-hover:opacity-50 group-hover:scale-110 transition-all duration-500" />
                                <div className="absolute inset-[-2px] rounded-xl bg-gradient-to-tr from-purple-400/15 to-blue-400/15 blur-md group-hover:blur-lg transition-all" />

                                {/* Logo container */}
                                <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-purple-900/80 via-blue-900/70 to-indigo-900/80 backdrop-blur-xl border border-purple-400/30 shadow-[0_0_30px_rgba(139,92,246,0.4),inset_0_1px_0_rgba(255,255,255,0.1)] group-hover:scale-[1.08] group-hover:shadow-[0_0_40px_rgba(139,92,246,0.6),inset_0_1px_0_rgba(255,255,255,0.15)] transition-all duration-300 overflow-hidden">
                                    {/* Glass shine overlay - reduced 50% */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/8 via-transparent to-transparent" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-white/3" />

                                    {/* Custom MM Logo Mark */}
                                    <svg viewBox="0 0 32 32" className="h-7 w-7 relative z-10" fill="none">
                                        {/* Stylized M with map pin integration */}
                                        <defs>
                                            <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                                <stop offset="0%" stopColor="#c084fc" />
                                                <stop offset="50%" stopColor="#60a5fa" />
                                                <stop offset="100%" stopColor="#22d3ee" />
                                            </linearGradient>
                                        </defs>
                                        {/* M shape forming abstract map/path */}
                                        <path d="M6 24V10l5 8 5-8 5 8 5-8v14"
                                            stroke="url(#logoGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                                        {/* Pin dot at peak */}
                                        <circle cx="16" cy="7" r="2.5" fill="url(#logoGrad)" />
                                        {/* Dollar accent */}
                                        <path d="M16 5v4M14.5 6h3M14.5 8h3" stroke="white" strokeWidth="0.8" strokeLinecap="round" opacity="0.9" />
                                    </svg>
                                </div>
                            </div>

                            {/* Logo text with enhanced gradient */}
                            <div className="hidden flex-col md:flex">
                                <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-purple-300 via-blue-300 to-cyan-300 bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(139,92,246,0.5)]">
                                    MoneyMap
                                </span>
                                <span className="text-[10px] text-purple-300/60 -mt-0.5 tracking-widest uppercase">Finance for power users</span>
                            </div>
                        </Link>
                    </div>

                    {/* Navigation */}
                    <nav className="min-h-0 flex-1 space-y-2 overflow-y-auto overflow-x-hidden pr-0 md:space-y-1 md:pr-1">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const route = tabRoutes[item.id];
                            const isRouteTab = item.id === 'stocks' || item.id === 'crypto';
                            const isActive = isRouteTab ? pathname === route : activeTab === item.id && pathname === route;

                            return (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        setActiveTab(item.id);
                                        if (pathname !== route) {
                                            router.push(route);
                                        }
                                        if (window.innerWidth < 768) toggleSidebar();
                                    }}
                                    className={cn(
                                        "flex w-full items-center justify-center gap-0 rounded-xl px-2 py-3 text-sm font-medium transition-all duration-400 relative overflow-hidden md:justify-start md:gap-3 md:px-4",
                                        "backdrop-blur-xl glass-optimized shadow-[0_2px_8px_rgba(0,0,0,0.3)]",
                                        isActive
                                            ? cn(activeNavChrome, activeNavRingClasses[item.id])
                                            : "text-zinc-400 hover:bg-white/8 hover:text-white border border-white/5 hover:border-white/10 hover:shadow-[0_2px_12px_rgba(0,0,0,0.4)]"
                                    )}
                                >
                                    {/* Active tab glass effect with color tint */}
                                    {isActive && (
                                        <>
                                            <div className={cn(
                                                "absolute inset-0 opacity-40",
                                                item.id === 'dashboard' && 'bg-white/8',
                                                item.id === 'overview' && 'bg-blue-500/8',
                                                item.id === 'statement' && 'bg-slate-500/8',
                                                item.id === 'subscriptions' && 'bg-purple-500/8',
                                                item.id === 'recurring' && 'bg-amber-500/8',
                                                item.id === 'fees' && 'bg-pink-500/8',
                                                item.id === 'cashflow' && 'bg-teal-500/8',
                                                item.id === 'budget' && 'bg-emerald-500/8',
                                                item.id === 'accounts' && 'bg-amber-500/8',
                                                item.id === 'stocks' && 'bg-lime-500/8',
                                                item.id === 'crypto' && 'bg-orange-500/8',
                                                item.id === 'review' && 'bg-zinc-500/8'
                                            )} />
                                            <div className="absolute inset-0 bg-gradient-to-br from-white/4 to-transparent" />
                                        </>
                                    )}
                                    <Icon className={cn(
                                        "h-5 w-5 relative z-10 transition-colors",
                                        isActive ? (
                                            item.id === 'dashboard' ? 'text-white' :
                                                item.id === 'overview' ? 'text-blue-400' :
                                                    item.id === 'statement' ? 'text-slate-300' :
                                                        item.id === 'subscriptions' ? 'text-purple-400' :
                                                            item.id === 'recurring' ? 'text-amber-400' :
                                                                item.id === 'fees' ? 'text-pink-400' :
                                                                    item.id === 'cashflow' ? 'text-teal-400' :
                                                                        item.id === 'budget' ? 'text-emerald-400' :
                                                                            item.id === 'accounts' ? 'text-amber-400' :
                                                                                item.id === 'stocks' ? 'text-lime-400' :
                                                                                    item.id === 'crypto' ? 'text-orange-400' :
                                                                                        'text-zinc-400'
                                        ) : "text-zinc-500"
                                    )} />
                                    <span className="relative z-10 hidden md:inline">{item.label}</span>
                                </button>
                            );
                        })}
                    </nav>

                    {/* Footer */}
                    <div className="mt-auto hidden shrink-0 space-y-3 border-t border-white/10 pt-6 md:block">
                        <button
                            onClick={() => {
                                loadDemoData();
                                router.push('/');
                            }}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all group"
                        >
                            <RotateCcw className="h-3.5 w-3.5 text-zinc-400 group-hover:text-white transition-colors" />
                            <span className="text-xs font-medium text-zinc-400 group-hover:text-white transition-colors">Restart Demo</span>
                        </button>

                        <button
                            onClick={() => setIsMinigameOpen(true)}
                            className="w-full rounded-xl bg-zinc-900/60 backdrop-blur-xl border border-white/10 p-4 shadow-lg hover:bg-zinc-900/80 hover:border-white/20 transition-all cursor-pointer text-left group"
                        >
                            <p className="text-xs font-medium text-zinc-300 group-hover:text-white transition-colors">Demo Mode</p>
                            <p className="text-[10px] text-zinc-500 mt-1 group-hover:text-zinc-400 transition-colors">Local data only. No bank connection.</p>
                        </button>

                    </div>
                </div>
            </aside>

            {/* Minigame Modal */}
            <MinigameModal isOpen={isMinigameOpen} onClose={() => setIsMinigameOpen(false)} />
        </>
    );
}
