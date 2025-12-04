import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Transaction, Account, Category, OwnershipMode } from '../types';
import { generateSampleStatement, getBaseAccounts } from '../fakeData';

interface DataState {
    transactions: Transaction[];
    accounts: Account[];
    categories: Category[];
    ownershipModes: Record<string, OwnershipMode>;
    accountOverrides: Record<string, Partial<Account>>;
    hiddenAccountIds: string[];
    duplicateDecisions: Record<string, "confirmed" | "dismissed">;
    isLoading: boolean;

    // Actions
    loadDemoData: () => void;
    loadUploadedData: (transactions: Transaction[]) => void;
    clearData: () => void;
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
    setDuplicateDecision: (id: string, decision: "confirmed" | "dismissed") => void;

    // Helpers
    getAccountById: (id: string) => Account | undefined;
}

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

            loadDemoData: () => {
                set({ isLoading: true });
                // Simulate async load
                setTimeout(() => {
                    const baseAccounts = getBaseAccounts().map(acc => ({
                        id: acc.id,
                        name: acc.label,
                        type: acc.id === 'checking' ? 'checking' : 'savings',
                        balance: 0, // Not used in demo
                        last4: acc.last4,
                        institution: 'Bank',
                        ownershipMode: 'spending' as OwnershipMode
                    } as Account));

                    const transactions = generateSampleStatement();

                    // Reset everything to defaults for a clean demo restart
                    set({
                        transactions,
                        accounts: baseAccounts,
                        categories: [], // Or default categories if you have them
                        ownershipModes: {},
                        accountOverrides: {},
                        hiddenAccountIds: [],
                        duplicateDecisions: {},
                        isLoading: false
                    });
                }, 800);
            },

            loadUploadedData: (transactions) => {
                set({ isLoading: true });
                // Simulate processing
                setTimeout(() => {
                    // Ensure we have base accounts at minimum
                    const baseAccounts = getBaseAccounts().map(acc => ({
                        id: acc.id,
                        name: acc.label,
                        type: acc.id === 'checking' ? 'checking' : 'savings',
                        balance: 0,
                        last4: acc.last4,
                        institution: 'Bank',
                        ownershipMode: 'spending' as OwnershipMode
                    } as Account));

                    const currentAccounts = get().accounts;
                    const customAccounts = currentAccounts.filter(a => !['checking', 'savings'].includes(a.id));

                    set({
                        transactions,
                        accounts: [...baseAccounts, ...customAccounts],
                        isLoading: false
                    });
                }, 500);
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
                    // Also remove from overrides and ownership modes
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
                    // Also update the account object itself for easier access
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

            setDuplicateDecision: (id, decision) =>
                set((state) => ({
                    duplicateDecisions: { ...state.duplicateDecisions, [id]: decision }
                })),

            getAccountById: (id) => get().accounts.find((a) => a.id === id),
        }),
        {
            name: 'moneymap-data-storage',
            partialize: (state) => ({
                // Persist these fields
                accounts: state.accounts,
                ownershipModes: state.ownershipModes,
                accountOverrides: state.accountOverrides,
                hiddenAccountIds: state.hiddenAccountIds,
                duplicateDecisions: state.duplicateDecisions,
                // Do not persist transactions (re-generated on load for demo)
                // or maybe we SHOULD persist them if we allow editing categories?
                // Legacy persisted everything. Let's persist transactions too for now.
                transactions: state.transactions,
            }),
        }
    )
);
