"use client";

import React, { useState, useMemo } from "react";
import { useDataStore } from "../../lib/store/useDataStore";
import { useUIStore } from "../../lib/store/useUIStore";
import { GlassCard } from "../ui/GlassCard";
import { InfoTooltip } from "../ui/InfoTooltip";
import { cn, isDateInRange } from "../../lib/utils";
import { Plus, Trash2, Building2, CreditCard, PiggyBank, TrendingUp, Wallet, ChevronRight, ArrowUpRight, ArrowDownRight } from "lucide-react";

// Account types with icons
const ACCOUNT_TYPES = [
    { id: 'checking', label: 'Checking', icon: Wallet, color: 'blue' },
    { id: 'savings', label: 'Savings', icon: PiggyBank, color: 'emerald' },
    { id: 'credit', label: 'Credit Card', icon: CreditCard, color: 'purple' },
    { id: 'investment', label: 'Investment', icon: TrendingUp, color: 'lime' },
    { id: 'other', label: 'Other', icon: Building2, color: 'zinc' },
] as const;

type AccountType = typeof ACCOUNT_TYPES[number]['id'];

interface ManualAccount {
    id: string;
    name: string;
    type: AccountType;
    balance: number;
    lastUpdated: Date;
    institution?: string;
    accountNumber?: string; // Last 4 digits only
}

// Demo accounts for placeholder
const DEMO_ACCOUNTS: ManualAccount[] = [
    { id: '1', name: 'Primary Checking', type: 'checking', balance: 4521.33, lastUpdated: new Date(), institution: 'Chase', accountNumber: '4521' },
    { id: '2', name: 'Emergency Fund', type: 'savings', balance: 12500.00, lastUpdated: new Date(), institution: 'Ally Bank', accountNumber: '8832' },
    { id: '3', name: 'Travel Rewards Card', type: 'credit', balance: -2341.50, lastUpdated: new Date(), institution: 'Capital One', accountNumber: '7291' },
    { id: '4', name: 'Roth IRA', type: 'investment', balance: 28750.00, lastUpdated: new Date(), institution: 'Fidelity', accountNumber: '3341' },
];

export function Accounts() {
    const { transactions } = useDataStore();
    const { dateRange } = useUIStore();
    
    const [accounts, setAccounts] = useState<ManualAccount[]>(DEMO_ACCOUNTS);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newAccount, setNewAccount] = useState<Partial<ManualAccount>>({
        type: 'checking',
        balance: 0,
    });

    const currency = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    });

    // Calculate totals
    const totals = useMemo(() => {
        const assets = accounts.filter(a => a.balance > 0).reduce((sum, a) => sum + a.balance, 0);
        const liabilities = accounts.filter(a => a.balance < 0).reduce((sum, a) => sum + Math.abs(a.balance), 0);
        const netWorth = assets - liabilities;
        
        const byType = ACCOUNT_TYPES.reduce((acc, type) => {
            acc[type.id] = accounts.filter(a => a.type === type.id).reduce((sum, a) => sum + a.balance, 0);
            return acc;
        }, {} as Record<string, number>);

        return { assets, liabilities, netWorth, byType };
    }, [accounts]);

    // Add new account
    const handleAddAccount = () => {
        if (!newAccount.name) return;
        
        const account: ManualAccount = {
            id: Date.now().toString(),
            name: newAccount.name || '',
            type: newAccount.type || 'checking',
            balance: newAccount.balance || 0,
            lastUpdated: new Date(),
            institution: newAccount.institution,
            accountNumber: newAccount.accountNumber,
        };
        
        setAccounts([...accounts, account]);
        setNewAccount({ type: 'checking', balance: 0 });
        setShowAddModal(false);
    };

    // Delete account
    const handleDeleteAccount = (id: string) => {
        setAccounts(accounts.filter(a => a.id !== id));
    };

    // Get account type info
    const getAccountTypeInfo = (type: AccountType) => {
        return ACCOUNT_TYPES.find(t => t.id === type) || ACCOUNT_TYPES[4];
    };

    return (
        <GlassCard intensity="medium" tint="amber" className="p-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="text-center mb-8">
                <h2 className="text-2xl font-semibold text-white">Account Balances</h2>
                <p className="text-zinc-300">Track all your accounts in one place</p>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 sm:grid-cols-3 mb-8">
                <GlassCard className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                        <ArrowUpRight className="h-4 w-4 text-emerald-400" />
                        <span className="text-sm text-zinc-300">Total Assets</span>
                    </div>
                    <p className="text-2xl font-bold text-emerald-400">{currency.format(totals.assets)}</p>
                    <p className="text-xs text-zinc-400 mt-1">Cash, savings, investments</p>
                </GlassCard>
                
                <GlassCard className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                        <ArrowDownRight className="h-4 w-4 text-rose-400" />
                        <span className="text-sm text-zinc-300">Total Liabilities</span>
                    </div>
                    <p className="text-2xl font-bold text-rose-400">{currency.format(totals.liabilities)}</p>
                    <p className="text-xs text-zinc-400 mt-1">Credit cards, loans</p>
                </GlassCard>
                
                <GlassCard className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-white" />
                        <span className="text-sm text-zinc-300">Net Worth</span>
                        <InfoTooltip text="Assets minus liabilities. A positive number means you own more than you owe." />
                    </div>
                    <p className={cn(
                        "text-2xl font-bold",
                        totals.netWorth >= 0 ? "text-white" : "text-rose-400"
                    )}>
                        {currency.format(totals.netWorth)}
                    </p>
                    <p className="text-xs text-zinc-400 mt-1">
                        {totals.netWorth >= 0 ? "You're in the positive!" : "Working towards positive"}
                    </p>
                </GlassCard>
            </div>

            {/* Account Type Breakdown */}
            <GlassCard className="p-5 mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-semibold text-white">Balance by Account Type</h3>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {ACCOUNT_TYPES.slice(0, 4).map(type => {
                        const Icon = type.icon;
                        const balance = totals.byType[type.id] || 0;
                        const colorClass = {
                            blue: 'text-blue-400 bg-blue-500/20',
                            emerald: 'text-emerald-400 bg-emerald-500/20',
                            purple: 'text-purple-400 bg-purple-500/20',
                            lime: 'text-lime-400 bg-lime-500/20',
                            zinc: 'text-zinc-400 bg-zinc-500/20',
                        }[type.color];
                        
                        return (
                            <div key={type.id} className="flex items-center gap-3 p-3 rounded-lg bg-zinc-900/30 border border-white/5">
                                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", colorClass.split(' ')[1])}>
                                    <Icon className={cn("h-5 w-5", colorClass.split(' ')[0])} />
                                </div>
                                <div>
                                <p className="text-xs text-zinc-300">{type.label}</p>
                                    <p className={cn("text-sm font-semibold", balance < 0 ? "text-rose-400" : "text-white")}>
                                        {currency.format(balance)}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </GlassCard>

            {/* All Accounts List */}
            <GlassCard className="p-5 mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-semibold text-white">All Accounts</h3>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-1.5 text-xs bg-amber-500/20 text-amber-300 px-3 py-1.5 rounded-lg hover:bg-amber-500/30 transition-colors border border-amber-500/30"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        Add Account
                    </button>
                </div>
                
                <div className="space-y-2">
                    {accounts.map(account => {
                        const typeInfo = getAccountTypeInfo(account.type);
                        const Icon = typeInfo.icon;
                        const colorClass = {
                            blue: 'text-blue-400 bg-blue-500/20',
                            emerald: 'text-emerald-400 bg-emerald-500/20',
                            purple: 'text-purple-400 bg-purple-500/20',
                            lime: 'text-lime-400 bg-lime-500/20',
                            zinc: 'text-zinc-400 bg-zinc-500/20',
                        }[typeInfo.color];
                        
                        return (
                            <div 
                                key={account.id}
                                className="flex justify-between items-center p-4 rounded-xl bg-zinc-900/30 border border-white/5 hover:border-white/10 transition-all group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", colorClass.split(' ')[1])}>
                                        <Icon className={cn("h-5 w-5", colorClass.split(' ')[0])} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-white">{account.name}</p>
                                        <div className="flex items-center gap-2 text-xs text-zinc-400">
                                            {account.institution && <span>{account.institution}</span>}
                                            {account.accountNumber && <span>••••{account.accountNumber}</span>}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <p className={cn(
                                            "text-base font-semibold",
                                            account.balance < 0 ? "text-rose-400" : "text-white"
                                        )}>
                                            {currency.format(account.balance)}
                                        </p>
                                        <p className="text-xs text-zinc-400">
                                            Updated {account.lastUpdated.toLocaleDateString()}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteAccount(account.id)}
                                        className="opacity-0 group-hover:opacity-100 p-2 hover:bg-rose-500/20 rounded-lg transition-all"
                                    >
                                        <Trash2 className="h-4 w-4 text-rose-400" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </GlassCard>

            {/* Coming Soon Features */}
            <GlassCard className="p-5">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-semibold text-white">Coming Soon</h3>
                    <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-1 rounded-full">In Development</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
                        <p className="text-sm font-medium text-white mb-1">🏦 Bank Connections</p>
                        <p className="text-xs text-zinc-300">Automatically sync balances from your banks via Plaid</p>
                    </div>
                    <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                        <p className="text-sm font-medium text-white mb-1">📈 Net Worth History</p>
                        <p className="text-xs text-zinc-300">Track how your net worth changes over time</p>
                    </div>
                    <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
                        <p className="text-sm font-medium text-white mb-1">🎯 Savings Goals</p>
                        <p className="text-xs text-zinc-300">Set and track progress toward savings milestones</p>
                    </div>
                    <div className="p-4 rounded-xl bg-gradient-to-br from-orange-500/10 to-yellow-500/10 border border-orange-500/20">
                        <p className="text-sm font-medium text-white mb-1">💳 Credit Score</p>
                        <p className="text-xs text-zinc-300">Monitor your credit score and get tips to improve</p>
                    </div>
                </div>
            </GlassCard>

            {/* Add Account Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <GlassCard className="w-full max-w-md p-6 m-4">
                        <h3 className="text-lg font-semibold text-white mb-4">Add New Account</h3>
                        
                        <div className="space-y-4">
                            {/* Account Name */}
                            <div>
                                <label className="block text-sm text-zinc-300 mb-1">Account Name *</label>
                                <input
                                    type="text"
                                    value={newAccount.name || ''}
                                    onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                                    placeholder="e.g., Main Checking"
                                    className="w-full px-3 py-2 bg-zinc-900/50 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-teal-500/50"
                                />
                            </div>
                            
                            {/* Account Type */}
                            <div>
                                <label className="block text-sm text-zinc-300 mb-1">Account Type</label>
                                <select
                                    value={newAccount.type}
                                    onChange={(e) => setNewAccount({ ...newAccount, type: e.target.value as AccountType })}
                                    className="w-full px-3 py-2 bg-zinc-900/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-teal-500/50"
                                >
                                    {ACCOUNT_TYPES.map(type => (
                                        <option key={type.id} value={type.id}>{type.label}</option>
                                    ))}
                                </select>
                            </div>
                            
                            {/* Balance */}
                            <div>
                                <label className="block text-sm text-zinc-300 mb-1">Current Balance</label>
                                <input
                                    type="number"
                                    value={newAccount.balance || ''}
                                    onChange={(e) => setNewAccount({ ...newAccount, balance: parseFloat(e.target.value) || 0 })}
                                    placeholder="0.00"
                                    className="w-full px-3 py-2 bg-zinc-900/50 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-teal-500/50"
                                />
                                <p className="text-xs text-zinc-400 mt-1">Use negative for credit card balances owed</p>
                            </div>
                            
                            {/* Institution (optional) */}
                            <div>
                                <label className="block text-sm text-zinc-300 mb-1">Institution (optional)</label>
                                <input
                                    type="text"
                                    value={newAccount.institution || ''}
                                    onChange={(e) => setNewAccount({ ...newAccount, institution: e.target.value })}
                                    placeholder="e.g., Chase, Wells Fargo"
                                    className="w-full px-3 py-2 bg-zinc-900/50 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-teal-500/50"
                                />
                            </div>
                            
                            {/* Last 4 digits (optional) */}
                            <div>
                                <label className="block text-sm text-zinc-300 mb-1">Last 4 Digits (optional)</label>
                                <input
                                    type="text"
                                    maxLength={4}
                                    value={newAccount.accountNumber || ''}
                                    onChange={(e) => setNewAccount({ ...newAccount, accountNumber: e.target.value.replace(/\D/g, '') })}
                                    placeholder="1234"
                                    className="w-full px-3 py-2 bg-zinc-900/50 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-teal-500/50"
                                />
                            </div>
                        </div>
                        
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="flex-1 px-4 py-2 bg-zinc-800/50 text-zinc-300 rounded-lg hover:bg-zinc-700/50 transition-colors border border-white/10"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddAccount}
                                disabled={!newAccount.name}
                                className="flex-1 px-4 py-2 bg-amber-500/20 text-amber-300 rounded-lg hover:bg-amber-500/30 transition-colors border border-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Add Account
                            </button>
                        </div>
                    </GlassCard>
                </div>
            )}
        </GlassCard>
    );
}
