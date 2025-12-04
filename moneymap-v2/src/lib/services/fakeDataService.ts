import { Transaction, Account } from '../types';
import { DEFAULT_CATEGORIES } from '../constants/categories';

// Merchant Data
const MERCHANTS = {
    groceries: ['Whole Foods', 'Trader Joe\'s', 'Safeway', 'Costco', 'Target'],
    dining: ['Uber Eats', 'Starbucks', 'Chipotle', 'Local Cafe', 'McDonald\'s', 'DoorDash'],
    transport: ['Uber', 'Lyft', 'Shell', 'Chevron', 'Public Transit'],
    utilities: ['PG&E', 'Comcast', 'City Water', 'Waste Management'],
    subscriptions: ['Netflix', 'Spotify', 'Apple One', 'Amazon Prime', 'ChatGPT Plus'],
    shopping: ['Amazon', 'Nike', 'Apple Store', 'Sephora'],
    entertainment: ['AMC Theaters', 'Steam', 'PlayStation Network'],
    health: ['Planet Fitness', 'CVS Pharmacy', 'Walgreens'],
};

// Data Generation
export const generateFakeData = () => {
    // Base Accounts
    const accounts: Account[] = [
        {
            id: 'acc_checking',
            name: 'Main Checking',
            type: 'checking',
            balance: 4520.50,
            last4: '4242',
            institution: 'Chase',
            color: '#3b82f6',
        },
        {
            id: 'acc_savings',
            name: 'High Yield Savings',
            type: 'savings',
            balance: 12500.00,
            last4: '8899',
            institution: 'Ally',
            color: '#10b981',
        },
        {
            id: 'acc_credit',
            name: 'Sapphire Preferred',
            type: 'credit',
            balance: -1250.30,
            last4: '1234',
            institution: 'Chase',
            color: '#6366f1',
        },
    ];

    // Transaction Generation
    const transactions: Transaction[] = [];
    const today = new Date();

    for (let i = 0; i < 90; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        // Regular Expenses
        if (Math.random() > 0.3) {
            const categoryKeys = Object.keys(MERCHANTS) as Array<keyof typeof MERCHANTS>;
            const categoryKey = categoryKeys[Math.floor(Math.random() * categoryKeys.length)];
            const merchant = MERCHANTS[categoryKey][Math.floor(Math.random() * MERCHANTS[categoryKey].length)];

            transactions.push({
                id: crypto.randomUUID(),
                date: dateStr,
                amount: -(Math.floor(Math.random() * 100) + 5),
                description: merchant,
                merchantName: merchant,
                category: categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1),
                kind: 'expense',
                accountId: Math.random() > 0.5 ? 'acc_checking' : 'acc_credit',
                source: 'Card',
            });
        }

        // Recurring Bills
        if (date.getDate() === 1) {
            transactions.push({
                id: crypto.randomUUID(),
                date: dateStr,
                amount: -2500,
                description: 'Luxury Apartments Rent',
                category: 'Rent',
                kind: 'expense',
                accountId: 'acc_checking',
                isRecurring: true,
                source: 'Bank Transfer',
            });
        }

        // Income
        if (date.getDate() === 15 || date.getDate() === 30) {
            transactions.push({
                id: crypto.randomUUID(),
                date: dateStr,
                amount: 3200,
                description: 'Tech Corp Payroll',
                category: 'Income',
                kind: 'income',
                accountId: 'acc_checking',
                isRecurring: true,
                source: 'Direct Deposit',
            });
        }
    }

    return { accounts, transactions, categories: DEFAULT_CATEGORIES };
};
