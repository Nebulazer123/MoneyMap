"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useDataStore } from "../../lib/store/useDataStore";
import { GlassCard } from "../ui/GlassCard";
import { InfoTooltip } from "../ui/InfoTooltip";
import { cn } from "../../lib/utils";
import {
    Plus, Trash2, Building2, CreditCard, PiggyBank, TrendingUp, Wallet,
    ArrowUpRight, ArrowDownRight, Eye, EyeOff, Edit2, X, Check,
    Bitcoin, Link2, Target, Sparkles
} from "lucide-react";
import { Account } from "../../lib/types";

// Account Types Configuration
const ACCOUNT_TYPES = [
    { id: 'checking', label: 'Checking', icon: Wallet, color: 'blue', group: 'cash' },
    { id: 'savings', label: 'Savings', icon: PiggyBank, color: 'emerald', group: 'cash' },
    { id: 'credit', label: 'Credit Card', icon: CreditCard, color: 'purple', group: 'debt' },
    { id: 'investment', label: 'Investment', icon: TrendingUp, color: 'lime', group: 'investments' },
    { id: 'loan', label: 'Loan', icon: Building2, color: 'rose', group: 'debt' },
    { id: 'wallet', label: 'Crypto Wallet', icon: Bitcoin, color: 'orange', group: 'crypto' },
    { id: 'other', label: 'Other', icon: Building2, color: 'zinc', group: 'other' },
] as const;

type AccountType = typeof ACCOUNT_TYPES[number]['id'];

interface ManualAccount {
    id: string;
    name: string;
    type: AccountType;
    balance: number;
    lastUpdated: Date;
    institution?: string;
    accountNumber?: string;
    includeInNetWorth: boolean;
}

// Note: Accounts are now stored in useDataStore for shared state with Review tab

// Detected Accounts (mocked from transaction data)
const DETECTED_ACCOUNTS = [
    { name: 'Netflix', type: 'subscription', count: 6 },
    { name: 'Spotify', type: 'subscription', count: 6 },
    { name: 'Shell Gas', type: 'merchant', count: 12 },
    { name: 'Whole Foods', type: 'merchant', count: 8 },
];

// Savings Goal Interface
interface SavingsGoal {
    label: string;
    targetAmount: number;
    currentAmount: number;
    timeHorizon: string;
}

export function Accounts() {
    const { accounts, updateAccount, deleteAccount, addAccount, toggleAccountIncluded } = useDataStore();
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
    const [showPlaidStub, setShowPlaidStub] = useState(false);
    const [newAccount, setNewAccount] = useState<Partial<ManualAccount>>({
        type: 'checking',
        balance: 0,
        includeInNetWorth: true,
    });

    // Savings Goal State
    const [savingsGoal, setSavingsGoal] = useState<SavingsGoal>({
        label: 'Emergency Fund',
        targetAmount: 20000,
        currentAmount: 0,
        timeHorizon: '12 months',
    });

    const currency = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    });

    // Calculate Totals (respecting includeInNetWorth toggle) - from store accounts
    const totals = useMemo(() => {
        const includedAccounts = accounts.filter(a => a.includeInNetWorth !== false);

        const cashAccounts = includedAccounts.filter(a => a.type === 'checking' || a.type === 'savings');
        const totalCash = cashAccounts.reduce((sum, a) => sum + a.balance, 0);

        const debtAccounts = includedAccounts.filter(a => a.type === 'credit' || a.type === 'loan');
        const totalDebt = debtAccounts.reduce((sum, a) => sum + Math.abs(a.balance), 0);

        const investmentAccounts = includedAccounts.filter(a => a.type === 'investment');
        const totalInvestments = investmentAccounts.reduce((sum, a) => sum + a.balance, 0);

        const cryptoAccounts = includedAccounts.filter(a => a.type === 'wallet');
        const totalCrypto = cryptoAccounts.reduce((sum, a) => sum + a.balance, 0);

        const assets = includedAccounts.filter(a => a.balance > 0).reduce((sum, a) => sum + a.balance, 0);
        const liabilities = includedAccounts.filter(a => a.balance < 0).reduce((sum, a) => sum + Math.abs(a.balance), 0);
        const netWorth = assets - liabilities;

        // Savings accounts total for savings goal
        const savingsTotal = includedAccounts.filter(a => a.type === 'savings').reduce((sum, a) => sum + a.balance, 0);

        return { totalCash, totalDebt, totalInvestments, totalCrypto, netWorth, savingsTotal, assets, liabilities };
    }, [accounts]);

    // Update savings goal current amount when savings total changes
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSavingsGoal(prev => ({ ...prev, currentAmount: totals.savingsTotal }));
    }, [totals.savingsTotal]);

    // Net Worth History (simple mock data for sparkline)
    const netWorthHistory = useMemo(() => {
        const base = totals.netWorth;
        return [0.92, 0.94, 0.95, 0.93, 0.97, 0.96, 0.98, 1.0].map(m => base * m);
    }, [totals.netWorth]);

    // Group accounts by type
    const groupedAccounts = useMemo(() => {
        const groups: Record<string, Account[]> = {
            'Checking & Savings': [],
            'Credit Cards & Loans': [],
            'Investments': [],
            'Crypto': [],
            'Other': [],
        };

        accounts.forEach(acc => {
            if (acc.type === 'checking' || acc.type === 'savings') {
                groups['Checking & Savings'].push(acc);
            } else if (acc.type === 'credit' || acc.type === 'loan') {
                groups['Credit Cards & Loans'].push(acc);
            } else if (acc.type === 'investment') {
                groups['Investments'].push(acc);
            } else if (acc.type === 'wallet') {
                groups['Crypto'].push(acc);
            } else {
                groups['Other'].push(acc);
            }
        });

        return groups;
    }, [accounts]);

    // Group totals
    const groupTotals = useMemo(() => {
        const result: Record<string, number> = {};
        Object.entries(groupedAccounts).forEach(([group, accs]) => {
            result[group] = accs
                .filter(a => a.includeInNetWorth !== false)
                .reduce((sum, a) => sum + a.balance, 0);
        });
        return result;
    }, [groupedAccounts]);

    // Handlers - now use store actions
    const handleAddAccount = () => {
        if (!newAccount.name) return;
        const account: Account = {
            id: Date.now().toString(),
            name: newAccount.name || '',
            type: newAccount.type || 'checking',
            balance: newAccount.balance || 0,
            institution: newAccount.institution,
            last4: newAccount.accountNumber,
            includeInNetWorth: newAccount.includeInNetWorth ?? true,
        };
        addAccount(account);
        setNewAccount({ type: 'checking', balance: 0, includeInNetWorth: true });
        setShowAddModal(false);
    };

    const handleDeleteAccount = (id: string) => {
        deleteAccount(id);
    };

    const handleToggleNetWorth = (id: string) => {
        toggleAccountIncluded(id);
    };

    const handleUpdateAccount = (id: string, updates: Partial<Account>) => {
        updateAccount(id, updates);
    };

    const getAccountTypeInfo = (type: AccountType) => {
        return ACCOUNT_TYPES.find(t => t.id === type) || ACCOUNT_TYPES[6];
    };

    const savingsGoalProgress = savingsGoal.targetAmount > 0
        ? Math.min(100, Math.round((savingsGoal.currentAmount / savingsGoal.targetAmount) * 100))
        : 0;

    return (
        <GlassCard intensity="medium" tint="amber" className="p-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="text-center mb-8">
                <h2 className="text-2xl font-semibold text-white">My Money</h2>
                <p className="text-zinc-300">Track all your accounts and net worth in one place</p>
            </div>

            {/* Summary Cards Row */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-5 mb-8">
                {/* Net Worth */}
                <GlassCard className="p-5 col-span-2 lg:col-span-1">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-white" />
                        <span className="text-sm text-zinc-300">Net Worth</span>
                        <InfoTooltip text="Assets minus liabilities from included accounts." />
                    </div>
                    <p className={cn(
                        "text-2xl font-bold",
                        totals.netWorth >= 0 ? "text-white" : "text-rose-400"
                    )}>
                        {currency.format(totals.netWorth)}
                    </p>
                    {/* Mini Sparkline */}
                    <div className="mt-2 flex items-end gap-0.5 h-6">
                        {netWorthHistory.map((val, i) => (
                            <div
                                key={i}
                                className="flex-1 bg-gradient-to-t from-emerald-500/60 to-emerald-400/80 rounded-sm"
                                style={{ height: `${(val / Math.max(...netWorthHistory)) * 100}%` }}
                            />
                        ))}
                    </div>
                </GlassCard>

                {/* Total Cash */}
                <GlassCard className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                        <ArrowUpRight className="h-4 w-4 text-emerald-400" />
                        <span className="text-sm text-zinc-300">Cash</span>
                    </div>
                    <p className="text-xl font-bold text-emerald-400">{currency.format(totals.totalCash)}</p>
                    <p className="text-xs text-zinc-400 mt-1">Checking + Savings</p>
                </GlassCard>

                {/* Total Debt */}
                <GlassCard className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                        <ArrowDownRight className="h-4 w-4 text-rose-400" />
                        <span className="text-sm text-zinc-300">Debt</span>
                    </div>
                    <p className="text-xl font-bold text-rose-400">{currency.format(totals.totalDebt)}</p>
                    <p className="text-xs text-zinc-400 mt-1">Cards + Loans</p>
                </GlassCard>

                {/* Stock Investments (F4) */}
                <GlassCard className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-lime-400" />
                        <span className="text-sm text-zinc-300">Stocks</span>
                    </div>
                    <p className="text-xl font-bold text-lime-400">{currency.format(totals.totalInvestments)}</p>
                    <p className="text-xs text-zinc-400 mt-1">Investments</p>
                </GlassCard>

                {/* Crypto (F5) */}
                <GlassCard className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                        <Bitcoin className="h-4 w-4 text-orange-400" />
                        <span className="text-sm text-zinc-300">Crypto</span>
                    </div>
                    <p className="text-xl font-bold text-orange-400">{currency.format(totals.totalCrypto)}</p>
                    <p className="text-xs text-zinc-400 mt-1">Wallets</p>
                </GlassCard>
            </div>

            {/* Grouped Accounts List (F3) */}
            {Object.entries(groupedAccounts).map(([groupName, groupAccounts]) => {
                if (groupAccounts.length === 0) return null;
                const groupTotal = groupTotals[groupName];

                return (
                    <GlassCard key={groupName} className="p-5 mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-base font-semibold text-white">{groupName}</h3>
                                <p className={cn(
                                    "text-sm font-medium",
                                    groupTotal < 0 ? "text-rose-400" : "text-zinc-400"
                                )}>
                                    {currency.format(groupTotal)} total
                                </p>
                            </div>
                            {groupName === 'Checking & Savings' && (
                                <button
                                    onClick={() => setShowAddModal(true)}
                                    className="flex items-center gap-1.5 text-xs bg-amber-500/20 text-amber-300 px-3 py-1.5 rounded-lg hover:bg-amber-500/30 transition-colors border border-amber-500/30"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    Add Account
                                </button>
                            )}
                        </div>

                        <div className="space-y-2">
                            {groupAccounts.map(account => {
                                const typeInfo = getAccountTypeInfo(account.type);
                                const Icon = typeInfo.icon;
                                const isEditing = editingAccountId === account.id;
                                const colorClass = {
                                    blue: 'text-blue-400 bg-blue-500/20',
                                    emerald: 'text-emerald-400 bg-emerald-500/20',
                                    purple: 'text-purple-400 bg-purple-500/20',
                                    lime: 'text-lime-400 bg-lime-500/20',
                                    rose: 'text-rose-400 bg-rose-500/20',
                                    orange: 'text-orange-400 bg-orange-500/20',
                                    zinc: 'text-zinc-400 bg-zinc-500/20',
                                }[typeInfo.color];

                                return (
                                    <div
                                        key={account.id}
                                        className={cn(
                                            "flex justify-between items-center p-4 rounded-xl bg-zinc-900/30 border border-white/5 hover:border-white/10 transition-all group",
                                            !account.includeInNetWorth && "opacity-60"
                                        )}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", colorClass.split(' ')[1])}>
                                                <Icon className={cn("h-5 w-5", colorClass.split(' ')[0])} />
                                            </div>
                                            <div>
                                                {isEditing ? (
                                                    <input
                                                        type="text"
                                                        value={account.name}
                                                        onChange={(e) => handleUpdateAccount(account.id, { name: e.target.value })}
                                                        className="text-sm font-medium text-white bg-transparent border-b border-amber-400 focus:outline-none"
                                                        autoFocus
                                                    />
                                                ) : (
                                                    <p className="text-sm font-medium text-white">{account.name}</p>
                                                )}
                                                <div className="flex items-center gap-2 text-xs text-zinc-400">
                                                    {account.institution && <span>{account.institution}</span>}
                                                    {account.last4 && <span>••••{account.last4}</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                {isEditing ? (
                                                    <input
                                                        type="number"
                                                        value={account.balance}
                                                        onChange={(e) => handleUpdateAccount(account.id, { balance: parseFloat(e.target.value) || 0 })}
                                                        className="text-base font-semibold text-white bg-transparent border-b border-amber-400 focus:outline-none text-right w-24"
                                                    />
                                                ) : (
                                                    <p className={cn(
                                                        "text-base font-semibold",
                                                        account.balance < 0 ? "text-rose-400" : "text-white"
                                                    )}>
                                                        {currency.format(account.balance)}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {/* Include/Exclude Toggle (F7) */}
                                                <button
                                                    onClick={() => handleToggleNetWorth(account.id)}
                                                    className="p-2 hover:bg-white/10 rounded-lg transition-all"
                                                    title={account.includeInNetWorth ? "Exclude from net worth" : "Include in net worth"}
                                                >
                                                    {account.includeInNetWorth ? (
                                                        <Eye className="h-4 w-4 text-emerald-400" />
                                                    ) : (
                                                        <EyeOff className="h-4 w-4 text-zinc-400" />
                                                    )}
                                                </button>

                                                {/* Edit Button (F2) */}
                                                {isEditing ? (
                                                    <button
                                                        onClick={() => setEditingAccountId(null)}
                                                        className="p-2 hover:bg-emerald-500/20 rounded-lg transition-all"
                                                    >
                                                        <Check className="h-4 w-4 text-emerald-400" />
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => setEditingAccountId(account.id)}
                                                        className="p-2 hover:bg-amber-500/20 rounded-lg transition-all"
                                                    >
                                                        <Edit2 className="h-4 w-4 text-amber-400" />
                                                    </button>
                                                )}

                                                {/* Delete */}
                                                <button
                                                    onClick={() => handleDeleteAccount(account.id)}
                                                    className="p-2 hover:bg-rose-500/20 rounded-lg transition-all"
                                                >
                                                    <Trash2 className="h-4 w-4 text-rose-400" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </GlassCard>
                );
            })}

            {/* Savings Goal Widget (F8, F9) */}
            <GlassCard className="p-5 mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-emerald-400" />
                        <h3 className="text-base font-semibold text-white">Savings Goal</h3>
                    </div>
                    <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">
                        {savingsGoalProgress}% complete
                    </span>
                </div>

                <div className="grid gap-4 sm:grid-cols-3 mb-4">
                    <div>
                        <label className="block text-xs text-zinc-400 mb-1">Goal Name</label>
                        <input
                            type="text"
                            value={savingsGoal.label}
                            onChange={(e) => setSavingsGoal({ ...savingsGoal, label: e.target.value })}
                            className="w-full px-3 py-2 bg-zinc-900/50 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500/50"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-zinc-400 mb-1">Target Amount</label>
                        <input
                            type="number"
                            value={savingsGoal.targetAmount}
                            onChange={(e) => setSavingsGoal({ ...savingsGoal, targetAmount: parseFloat(e.target.value) || 0 })}
                            className="w-full px-3 py-2 bg-zinc-900/50 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500/50"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-zinc-400 mb-1">Time Horizon</label>
                        <input
                            type="text"
                            value={savingsGoal.timeHorizon}
                            onChange={(e) => setSavingsGoal({ ...savingsGoal, timeHorizon: e.target.value })}
                            placeholder="e.g., 12 months"
                            className="w-full px-3 py-2 bg-zinc-900/50 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500/50"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-zinc-400">Current: {currency.format(savingsGoal.currentAmount)}</span>
                        <span className="text-emerald-400">Target: {currency.format(savingsGoal.targetAmount)}</span>
                    </div>
                    <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-500"
                            style={{ width: `${savingsGoalProgress}%` }}
                        />
                    </div>
                    <p className="text-xs text-zinc-400 text-center">
                        {savingsGoal.targetAmount - savingsGoal.currentAmount > 0
                            ? `${currency.format(savingsGoal.targetAmount - savingsGoal.currentAmount)} to go`
                            : "🎉 Goal reached!"}
                    </p>
                </div>
            </GlassCard>

            {/* Purple Connect Your Accounts Box (F10, F11) */}
            <GlassCard className="p-5 mb-6 bg-gradient-to-br from-purple-900/40 to-indigo-900/40 border-purple-500/30">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                        <Link2 className="h-5 w-5 text-purple-400" />
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-white">Connect Your Accounts</h3>
                        <p className="text-xs text-purple-300/70">Automatically sync balances from your banks</p>
                    </div>
                </div>
                <p className="text-sm text-zinc-300 mb-4">
                    Link your bank accounts to see real-time balances, track net worth over time, and get personalized insights.
                </p>
                <button
                    disabled
                    className="w-full px-4 py-3 bg-zinc-800/50 text-zinc-500 rounded-lg border border-zinc-700/50 font-medium cursor-not-allowed opacity-60"
                    title="Bank connection via Plaid is planned for a future release"
                >
                    <Sparkles className="inline h-4 w-4 mr-2" />
                    Connect with Plaid
                    <span className="ml-2 text-xs bg-zinc-700/50 px-2 py-0.5 rounded text-zinc-400">Phase 2</span>
                </button>
            </GlassCard>

            {/* Detected Accounts Card (F12) */}
            <GlassCard className="p-5">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-semibold text-white">Detected Accounts</h3>
                    <span className="text-xs text-zinc-400 bg-zinc-500/10 px-2 py-1 rounded-full">
                        {DETECTED_ACCOUNTS.length} found
                    </span>
                </div>
                <p className="text-sm text-zinc-400 mb-4">
                    Based on your transaction history, we detected recurring patterns from these sources.
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                    {DETECTED_ACCOUNTS.map((detected, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/30 border border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                    <span className="text-xs font-bold text-blue-400">{detected.name.charAt(0)}</span>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-white">{detected.name}</p>
                                    <p className="text-xs text-zinc-400">{detected.count} transactions</p>
                                </div>
                            </div>
                            <span className="text-xs text-zinc-500 bg-zinc-800/50 px-2 py-1 rounded">
                                {detected.type}
                            </span>
                        </div>
                    ))}
                </div>
            </GlassCard>

            {/* Add Account Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <GlassCard className="w-full max-w-md p-6 m-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-white">Add New Account</h3>
                            <button onClick={() => setShowAddModal(false)} className="text-zinc-400 hover:text-white">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-zinc-300 mb-1">Account Name *</label>
                                <input
                                    type="text"
                                    value={newAccount.name || ''}
                                    onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                                    placeholder="e.g., Main Checking"
                                    className="w-full px-3 py-2 bg-zinc-900/50 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-zinc-300 mb-1">Account Type</label>
                                <select
                                    value={newAccount.type}
                                    onChange={(e) => setNewAccount({ ...newAccount, type: e.target.value as AccountType })}
                                    className="w-full px-3 py-2 bg-zinc-900/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-amber-500/50"
                                >
                                    {ACCOUNT_TYPES.map(type => (
                                        <option key={type.id} value={type.id}>{type.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm text-zinc-300 mb-1">Current Balance</label>
                                <input
                                    type="number"
                                    value={newAccount.balance || ''}
                                    onChange={(e) => setNewAccount({ ...newAccount, balance: parseFloat(e.target.value) || 0 })}
                                    placeholder="0.00"
                                    className="w-full px-3 py-2 bg-zinc-900/50 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
                                />
                                <p className="text-xs text-zinc-400 mt-1">Use negative for balances owed</p>
                            </div>

                            <div>
                                <label className="block text-sm text-zinc-300 mb-1">Institution (optional)</label>
                                <input
                                    type="text"
                                    value={newAccount.institution || ''}
                                    onChange={(e) => setNewAccount({ ...newAccount, institution: e.target.value })}
                                    placeholder="e.g., Chase, Wells Fargo"
                                    className="w-full px-3 py-2 bg-zinc-900/50 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="includeNetWorth"
                                    checked={newAccount.includeInNetWorth ?? true}
                                    onChange={(e) => setNewAccount({ ...newAccount, includeInNetWorth: e.target.checked })}
                                    className="w-4 h-4 rounded border-white/20 bg-zinc-800"
                                />
                                <label htmlFor="includeNetWorth" className="text-sm text-zinc-300">
                                    Include in net worth calculation
                                </label>
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

            {/* Plaid Stub Modal (F11) */}
            {showPlaidStub && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <GlassCard className="w-full max-w-sm p-6 m-4 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-500/20 flex items-center justify-center">
                            <Link2 className="h-8 w-8 text-purple-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">Plaid Integration</h3>
                        <p className="text-sm text-zinc-400 mb-6">
                            Bank account connections via Plaid are coming in a future version. For now, you can manually add and manage your accounts.
                        </p>
                        <button
                            onClick={() => setShowPlaidStub(false)}
                            className="w-full px-4 py-2 bg-purple-600/30 text-purple-200 rounded-lg hover:bg-purple-600/40 transition-colors border border-purple-500/30"
                        >
                            Got it
                        </button>
                    </GlassCard>
                </div>
            )}
        </GlassCard>
    );
}
