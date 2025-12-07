import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Transaction, Account, Category, OwnershipMode, LifestyleProfile } from '../types';
import { generateTransactions } from '../generators/transactionEngine';
import { generateLifestyleProfile } from '../generators/lifestyleProfile';
import { useDateStore } from './useDateStore';

interface DataState {
    transactions: Transaction[];
    accounts: Account[];
    categories: Category[];
    ownershipModes: Record<string, OwnershipMode>;
    accountOverrides: Record<string, Partial<Account>>;
    hiddenAccountIds: string[];
    duplicateDecisions: Record<string, "confirmed" | "dismissed">;
    isLoading: boolean;
    currentProfile: LifestyleProfile | null;

    // Actions
    generateData: (mode?: 'full' | 'extend') => void;
    loadDemoData: () => void;
    clearData: () => void;

    // CRUD
    setTransactions: (transactions: Transaction[]) => void;
    setAccounts: (accounts: Account[]) => void;
    setCategories: (categories: Category[]) => void;
    updateTransaction: (id: string, updates: Partial<Transaction>) => void;

    // Account Management
    addAccount: (account: Account) => void;
    updateAccount: (id: string, updates: Partial<Account>) => void;
    deleteAccount: (id: string) => void;
    setOwnershipMode: (accountId: string, mode: OwnershipMode) => void;
    toggleAccountVisibility: (accountId: string) => void;
    toggleAccountIncluded: (accountId: string) => void;
    setDuplicateDecision: (id: string, decision: "confirmed" | "dismissed") => void;

    // Helpers
    getAccountById: (id: string) => Account | undefined;
}

// Default demo accounts with realistic balances for My Money page
const DEFAULT_DEMO_ACCOUNTS: Account[] = [
    { id: 'demo-1', name: 'Primary Checking', type: 'checking', balance: 4521.33, institution: 'Chase', last4: '4521', includeInNetWorth: true },
    { id: 'demo-2', name: 'Emergency Fund', type: 'savings', balance: 12500.00, institution: 'Ally Bank', last4: '8832', includeInNetWorth: true },
    { id: 'demo-3', name: 'Travel Rewards Card', type: 'credit', balance: -2341.50, institution: 'Capital One', last4: '7291', includeInNetWorth: true },
    { id: 'demo-4', name: 'Roth IRA', type: 'investment', balance: 28750.00, institution: 'Fidelity', last4: '3341', includeInNetWorth: true },
    { id: 'demo-5', name: 'Brokerage', type: 'investment', balance: 15200.00, institution: 'Schwab', last4: '9912', includeInNetWorth: true },
    { id: 'demo-6', name: 'Bitcoin Wallet', type: 'wallet', balance: 8500.00, institution: 'Coinbase', last4: 'BTC1', includeInNetWorth: true },
    { id: 'demo-7', name: 'Ethereum Wallet', type: 'wallet', balance: 3200.00, institution: 'Coinbase', last4: 'ETH1', includeInNetWorth: true },
    { id: 'demo-8', name: 'Auto Loan', type: 'loan', balance: -18500.00, institution: 'Capital One Auto', last4: '5544', includeInNetWorth: true },
];

// Helper to generate accounts from profile (extended with demo accounts if empty)
const generateAccountsFromProfile = (profile: LifestyleProfile): Account[] => {
    // Return demo accounts for consistent display
    return DEFAULT_DEMO_ACCOUNTS;
};

export const useDataStore = create<DataState>()(
    persist(
        (set, get) => ({
            transactions: [],
            accounts: [],
            categories: [],
            ownershipModes: {},
            accountOverrides: {},
            hiddenAccountIds: [],
            duplicateDecisions: {},
            isLoading: false,
            currentProfile: null,

            generateData: (mode = 'full') => {
                set({ isLoading: true });

                const { datasetStart, datasetEnd, profileId } = useDateStore.getState();
                const profile = generateLifestyleProfile(profileId);
                const existing = mode === 'extend' ? get().transactions : [];

                setTimeout(() => {
                    const newTransactions = generateTransactions(
                        profile,
                        datasetStart,
                        datasetEnd,
                        mode,
                        existing
                    );

                    set({
                        transactions: newTransactions,
                        accounts: generateAccountsFromProfile(profile),
                        currentProfile: profile,
                        isLoading: false
                    });
                }, 100);
            },

            // Alias for backward compatibility
            loadDemoData: () => {
                set({ isLoading: true });

                const { datasetStart, datasetEnd, profileId } = useDateStore.getState();
                const profile = generateLifestyleProfile(profileId);

                setTimeout(() => {
                    const newTransactions = generateTransactions(
                        profile,
                        datasetStart,
                        datasetEnd,
                        'full',
                        []
                    );

                    set({
                        transactions: newTransactions,
                        accounts: generateAccountsFromProfile(profile),
                        currentProfile: profile,
                        isLoading: false
                    });
                }, 100);
            },

            clearData: () => {
                set({
                    transactions: [],
                    accounts: [],
                    categories: [],
                    ownershipModes: {},
                    accountOverrides: {},
                    hiddenAccountIds: [],
                    duplicateDecisions: {},
                    currentProfile: null
                });
            },

            setTransactions: (transactions) => set({ transactions }),
            setAccounts: (accounts) => set({ accounts }),
            setCategories: (categories) => set({ categories }),

            updateTransaction: (id, updates) =>
                set((state) => ({
                    transactions: state.transactions.map((t) =>
                        t.id === id ? { ...t, ...updates } : t
                    ),
                })),

            addAccount: (account) =>
                set((state) => ({ accounts: [...state.accounts, account] })),

            updateAccount: (id, updates) =>
                set((state) => ({
                    accounts: state.accounts.map((a) =>
                        a.id === id ? { ...a, ...updates } : a
                    ),
                })),

            deleteAccount: (id) =>
                set((state) => ({
                    accounts: state.accounts.filter((a) => a.id !== id),
                    ownershipModes: Object.fromEntries(
                        Object.entries(state.ownershipModes).filter(([key]) => key !== id)
                    ),
                    accountOverrides: Object.fromEntries(
                        Object.entries(state.accountOverrides).filter(([key]) => key !== id)
                    ),
                })),

            setOwnershipMode: (accountId, mode) =>
                set((state) => ({
                    ownershipModes: { ...state.ownershipModes, [accountId]: mode },
                    accounts: state.accounts.map(a =>
                        a.id === accountId ? { ...a, ownershipMode: mode } : a
                    )
                })),

            toggleAccountVisibility: (accountId) =>
                set((state) => {
                    const isHidden = state.hiddenAccountIds.includes(accountId);
                    return {
                        hiddenAccountIds: isHidden
                            ? state.hiddenAccountIds.filter(id => id !== accountId)
                            : [...state.hiddenAccountIds, accountId]
                    };
                }),

            toggleAccountIncluded: (accountId) =>
                set((state) => ({
                    accounts: state.accounts.map(a =>
                        a.id === accountId
                            ? { ...a, includeInNetWorth: !(a.includeInNetWorth ?? true) }
                            : a
                    )
                })),

            setDuplicateDecision: (id, decision) =>
                set((state) => ({
                    duplicateDecisions: { ...state.duplicateDecisions, [id]: decision }
                })),

            getAccountById: (id) => get().accounts.find((a) => a.id === id),
        }),
        {
            name: 'moneymap-data-storage',
            partialize: (state) => ({
                accounts: state.accounts,
                ownershipModes: state.ownershipModes,
                accountOverrides: state.accountOverrides,
                hiddenAccountIds: state.hiddenAccountIds,
                duplicateDecisions: state.duplicateDecisions,
                transactions: state.transactions,
                currentProfile: state.currentProfile
            }),
        }
    )
);
