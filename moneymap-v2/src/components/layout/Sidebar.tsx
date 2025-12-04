"use client";

import { useUIStore, DashboardTab } from '@/lib/store/useUIStore';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Receipt, RefreshCw, Wallet, ShieldCheck, Menu, X, Activity, CreditCard, ChevronsLeft, Building2, TrendingUp, LucideIcon } from 'lucide-react';
import { Button } from '../ui/Button';

export function Sidebar() {
    const { activeTab, setActiveTab, isSidebarOpen, toggleSidebar } = useUIStore();

    // Tab color mapping for active underline indicators
    const tabColors: Record<DashboardTab, string> = {
        overview: 'border-b-blue-400',
        statement: 'border-b-slate-400',
        subscriptions: 'border-b-purple-400',
        recurring: 'border-b-amber-400',
        fees: 'border-b-pink-400',
        cashflow: 'border-b-teal-400',
        review: 'border-b-zinc-400',
        budget: 'border-b-emerald-400',
        accounts: 'border-b-amber-400',
        stocks: 'border-b-lime-400',
        crypto: 'border-b-orange-400',
    };

    const navItems: { id: DashboardTab; label: string; icon: LucideIcon }[] = [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'statement', label: 'Statement', icon: Receipt },
        { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
        { id: 'recurring', label: 'Recurring', icon: RefreshCw },
        { id: 'fees', label: 'Fees', icon: Wallet },
        { id: 'cashflow', label: 'Cashflow', icon: Activity },
        { id: 'budget', label: 'Budget', icon: ShieldCheck },
        { id: 'accounts', label: 'Accounts', icon: Building2 },
        { id: 'stocks', label: 'Stocks', icon: TrendingUp },
        { id: 'crypto', label: 'Crypto', icon: TrendingUp },
        { id: 'review', label: 'Review', icon: ShieldCheck },
    ];

    return (
        <>
            {/* Mobile Toggle */}
            {/* Toggle Button (Visible when sidebar is closed) */}
            {!isSidebarOpen && (
                <div className="fixed top-4 left-4 z-50">
                    <Button variant="secondary" size="icon" onClick={toggleSidebar} className="bg-zinc-900/50 border border-white/10 hover:bg-zinc-800">
                        <Menu className="h-5 w-5" />
                    </Button>
                </div>
            )}

            {/* Sidebar Container */}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-300 ease-in-out",
                    "bg-black/20 backdrop-blur-[40px] border-r border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.3)]",
                    isSidebarOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                {/* Faint glass glare */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
                <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-white/10 via-transparent to-transparent pointer-events-none" />
                
                <div className="relative flex h-full flex-col p-6">
                    {/* Logo & Toggle */}
                    <div className="mb-10 flex items-center justify-between px-2">
                        <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-all duration-300 group">
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
                                              stroke="url(#logoGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                                        {/* Pin dot at peak */}
                                        <circle cx="16" cy="7" r="2.5" fill="url(#logoGrad)" />
                                        {/* Dollar accent */}
                                        <path d="M16 5v4M14.5 6h3M14.5 8h3" stroke="white" strokeWidth="0.8" strokeLinecap="round" opacity="0.9"/>
                                    </svg>
                                </div>
                            </div>
                            
                            {/* Logo text with enhanced gradient */}
                            <div className="flex flex-col">
                                <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-purple-300 via-blue-300 to-cyan-300 bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(139,92,246,0.5)]">
                                    MoneyMap
                                </span>
                                <span className="text-[10px] text-purple-300/60 -mt-0.5 tracking-widest uppercase">Navigate Your Finances</span>
                            </div>
                        </Link>
                        <button
                            onClick={toggleSidebar}
                            className="text-zinc-400 hover:text-white transition-colors p-1 hover:bg-white/5 rounded-lg"
                        >
                            <ChevronsLeft className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 space-y-1">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = activeTab === item.id;

                            return (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        setActiveTab(item.id);
                                        if (window.innerWidth < 768) toggleSidebar();
                                    }}
                                    className={cn(
                                        "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-400 relative overflow-hidden",
                                        "backdrop-blur-xl glass-optimized shadow-[0_2px_8px_rgba(0,0,0,0.3)]",
                                        isActive ? (
                                            item.id === 'overview' ? 'bg-white/10 text-white border border-white/20 shadow-[0_4px_20px_rgba(59,130,246,0.2),0_2px_8px_rgba(0,0,0,0.4)] scale-[1.02] ring-1 ring-blue-500/20' :
                                            item.id === 'statement' ? 'bg-white/10 text-white border border-white/20 shadow-[0_4px_20px_rgba(148,163,184,0.2),0_2px_8px_rgba(0,0,0,0.4)] scale-[1.02] ring-1 ring-slate-500/20' :
                                            item.id === 'subscriptions' ? 'bg-white/10 text-white border border-white/20 shadow-[0_4px_20px_rgba(168,85,247,0.2),0_2px_8px_rgba(0,0,0,0.4)] scale-[1.02] ring-1 ring-purple-500/20' :
                                            item.id === 'recurring' ? 'bg-white/10 text-white border border-white/20 shadow-[0_4px_20px_rgba(251,191,36,0.2),0_2px_8px_rgba(0,0,0,0.4)] scale-[1.02] ring-1 ring-amber-500/20' :
                                            item.id === 'fees' ? 'bg-white/10 text-white border border-white/20 shadow-[0_4px_20px_rgba(236,72,153,0.2),0_2px_8px_rgba(0,0,0,0.4)] scale-[1.02] ring-1 ring-pink-500/20' :
                                            item.id === 'cashflow' ? 'bg-white/10 text-white border border-white/20 shadow-[0_4px_20px_rgba(20,184,166,0.2),0_2px_8px_rgba(0,0,0,0.4)] scale-[1.02] ring-1 ring-teal-500/20' :
                                            item.id === 'budget' ? 'bg-white/10 text-white border border-white/20 shadow-[0_4px_20px_rgba(52,211,153,0.2),0_2px_8px_rgba(0,0,0,0.4)] scale-[1.02] ring-1 ring-emerald-500/20' :
                                            item.id === 'accounts' ? 'bg-white/10 text-white border border-white/20 shadow-[0_4px_20px_rgba(251,191,36,0.2),0_2px_8px_rgba(0,0,0,0.4)] scale-[1.02] ring-1 ring-amber-500/20' :
                                            item.id === 'stocks' ? 'bg-white/10 text-white border border-white/20 shadow-[0_4px_20px_rgba(163,230,53,0.2),0_2px_8px_rgba(0,0,0,0.4)] scale-[1.02] ring-1 ring-lime-500/20' :
                                            item.id === 'crypto' ? 'bg-white/10 text-white border border-white/20 shadow-[0_4px_20px_rgba(249,115,22,0.2),0_2px_8px_rgba(0,0,0,0.4)] scale-[1.02] ring-1 ring-orange-500/20' :
                                            'bg-white/10 text-white border border-white/20 shadow-[0_4px_20px_rgba(20,184,166,0.2),0_2px_8px_rgba(0,0,0,0.4)] scale-[1.02] ring-1 ring-zinc-500/20'
                                        ) : "text-zinc-400 hover:bg-white/8 hover:text-white border border-white/5 hover:border-white/10 hover:shadow-[0_2px_12px_rgba(0,0,0,0.4)]"
                                    )}
                                >
                                    {/* Active tab glass effect with color tint */}
                                    {isActive && (
                                        <>
                                            <div className={cn(
                                                "absolute inset-0 opacity-40",
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
                                    <span className="relative z-10">{item.label}</span>
                                </button>
                            );
                        })}
                    </nav>

                    {/* Footer */}
                    <div className="mt-auto pt-6 border-t border-white/10">
                        <div className="rounded-xl bg-zinc-900/60 backdrop-blur-xl border border-white/10 p-4 shadow-lg">
                            <p className="text-xs font-medium text-zinc-300">Demo Mode</p>
                            <p className="text-[10px] text-zinc-500 mt-1">Local data only. No bank connection.</p>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}
