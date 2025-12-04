import { Category } from '../types';

export const DEFAULT_CATEGORIES: Category[] = [
    { id: 'income', name: 'Income', type: 'income', color: '#10b981' }, // Emerald
    { id: 'rent', name: 'Rent & Housing', type: 'expense', color: '#f59e0b' }, // Amber
    { id: 'groceries', name: 'Groceries', type: 'expense', color: '#3b82f6' }, // Blue
    { id: 'dining', name: 'Dining Out', type: 'expense', color: '#ef4444' }, // Red
    { id: 'transport', name: 'Transport', type: 'expense', color: '#8b5cf6' }, // Violet
    { id: 'utilities', name: 'Utilities', type: 'expense', color: '#06b6d4' }, // Cyan
    { id: 'subscriptions', name: 'Subscriptions', type: 'expense', color: '#d946ef' }, // Fuchsia
    { id: 'shopping', name: 'Shopping', type: 'expense', color: '#ec4899' }, // Pink
    { id: 'entertainment', name: 'Entertainment', type: 'expense', color: '#f97316' }, // Orange
    { id: 'health', name: 'Health & Fitness', type: 'expense', color: '#14b8a6' }, // Teal
    { id: 'fees', name: 'Fees', type: 'expense', color: '#64748b' }, // Slate
    { id: 'transfers', name: 'Transfers', type: 'expense', color: '#a1a1aa' }, // Zinc
];
