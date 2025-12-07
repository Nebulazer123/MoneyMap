import { LifestyleProfile, BankMerchant, SubscriptionPlan, UtilityMerchant, P2PMerchant, CreditCardMerchant } from '../types';
import { MERCHANT_POOLS } from '../data/merchantPools';

/**
 * Lifestyle Profile Generator
 * Creates a deterministic user profile based on a seed (profileId).
 * This profile dictates which merchants, banks, and subscriptions the user has.
 * 
 * Target counts per PLAN.md §5.4.2
 */

// Simple seeded PRNG (Linear Congruential Generator)
class SeededRNG {
    private seed: number;

    constructor(seedStr: string) {
        let h = 0x811c9dc5;
        for (let i = 0; i < seedStr.length; i++) {
            h ^= seedStr.charCodeAt(i);
            h = Math.imul(h, 0x01000193);
        }
        this.seed = h >>> 0;
    }

    next(): number {
        this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
        return this.seed / 4294967296;
    }

    pick<T>(array: T[]): T {
        return array[Math.floor(this.next() * array.length)];
    }

    // Returns N random unique elements from array
    pickMultiple<T>(array: T[], n: number): T[] {
        const shuffled = [...array].sort(() => this.next() - 0.5);
        return shuffled.slice(0, Math.min(n, array.length));
    }

    // Returns random count between min and max (inclusive), then picks that many
    pickDistinct<T>(array: T[], min: number, max: number): T[] {
        const count = this.range(min, max);
        return this.pickMultiple(array, count);
    }

    range(min: number, max: number): number {
        return Math.floor(this.next() * (max - min + 1)) + min;
    }
}

export const generateLifestyleProfile = (profileId: string): LifestyleProfile => {
    const rng = new SeededRNG(profileId);
    const now = Date.now();

    // -------------------------------------------------------------------------
    // 1. Financial Accounts (PLAN.md §5.4.2)
    // -------------------------------------------------------------------------

    // Banks: 3-5 total (1 primary + 2-4 secondary)
    const primaryBankName = rng.pick(MERCHANT_POOLS.bank);
    const primaryBank: BankMerchant = { name: primaryBankName, type: 'checking' };

    const secondaryBanks = rng.pickDistinct(
        MERCHANT_POOLS.bank.filter(b => b !== primaryBankName),
        2,
        4
    ).map(name => ({ name, type: 'savings' } as BankMerchant));

    // P2P Wallets: 1-3
    const p2pWallets = rng.pickDistinct(MERCHANT_POOLS.p2p, 1, 3)
        .map(name => ({ name, app: name } as P2PMerchant));

    // Credit Cards: 1-4
    const creditCards = rng.pickDistinct(MERCHANT_POOLS.creditCard, 1, 4)
        .map(name => ({ name, issuer: name.split(' ')[0] } as CreditCardMerchant));

    // Investment Brokerages: 1-2
    const investmentBrokerages = rng.pickDistinct(MERCHANT_POOLS.investment, 1, 2);

    // Crypto Exchanges: 1-3
    const cryptoExchanges = rng.pickDistinct(MERCHANT_POOLS.crypto, 1, 3);

    // -------------------------------------------------------------------------
    // 2. Housing (mutually exclusive: rent XOR mortgage)
    // -------------------------------------------------------------------------
    const housingType = rng.next() > 0.3 ? 'rent' : 'mortgage';
    const housingProvider = rng.pick(MERCHANT_POOLS.housing);

    // -------------------------------------------------------------------------
    // 3. Utilities & Bills
    // -------------------------------------------------------------------------

    // Utilities: 2-5
    const utilityNames = rng.pickDistinct(MERCHANT_POOLS.utility, 2, 5);
    const utilityTypes: ('electric' | 'gas' | 'water' | 'combined')[] = ['electric', 'gas', 'water', 'combined', 'electric'];
    const utilities: UtilityMerchant[] = utilityNames.map((name, i) => ({
        name,
        type: utilityTypes[i % utilityTypes.length]
    }));

    // Phone: 1 (prioritized)
    const phoneCarrier = rng.pick(MERCHANT_POOLS.mobile);

    // Internet: 1
    const internetProvider = rng.pick(MERCHANT_POOLS.mobile);

    // -------------------------------------------------------------------------
    // 4. Insurance
    // -------------------------------------------------------------------------

    // Auto: 1-2 (prioritize 1)
    const autoInsurance = rng.pick(MERCHANT_POOLS.autoInsurance);

    // Health: 1
    const healthInsurance = rng.pick(MERCHANT_POOLS.healthInsurance);

    // Home/Renters: 1
    const homeOrRentersInsurance = rng.pick(MERCHANT_POOLS.homeInsurance);

    // Life: 0-1
    const lifeInsurance = rng.next() > 0.6 ? rng.pick(MERCHANT_POOLS.lifeInsurance) : null;

    // -------------------------------------------------------------------------
    // 5. Loans
    // -------------------------------------------------------------------------

    // Car Loan: 0-1
    const carLender = rng.next() > 0.5 ? rng.pick(MERCHANT_POOLS.loans.slice(0, 9)) : null;

    // Student Loan: 0-1
    const studentLoanServicer = rng.next() > 0.6 ? rng.pick(MERCHANT_POOLS.loans.slice(9, 12)) : null;

    // Other loans: 0-2
    const otherLoans = rng.next() > 0.7 ? rng.pickDistinct(MERCHANT_POOLS.loans.slice(12), 0, 2) : [];

    // -------------------------------------------------------------------------
    // 6. Subscriptions (PLAN.md §5.4.2)
    // -------------------------------------------------------------------------

    // Streaming: 2-5
    const streamingServices = rng.pickDistinct(MERCHANT_POOLS.streaming, 2, 5)
        .map(name => ({
            merchant: name,
            displayName: name,
            amount: getStreamingPrice(name, rng),
            billingDay: rng.range(1, 28),
            frequency: 'monthly'
        } as SubscriptionPlan));

    // Music: 1
    const musicService: SubscriptionPlan = {
        merchant: rng.pick(MERCHANT_POOLS.music),
        displayName: 'Music Subscription',
        amount: 10.99,
        billingDay: rng.range(1, 28),
        frequency: 'monthly'
    };

    // Cloud Storage: 1-3
    const cloudStorage = rng.pickDistinct(MERCHANT_POOLS.cloudStorage, 1, 3)
        .map(name => ({
            merchant: name,
            displayName: name,
            amount: getCloudPrice(name, rng),
            billingDay: rng.range(1, 28),
            frequency: 'monthly'
        } as SubscriptionPlan));

    // Gym: 0-1 (prefer 1)
    const gym = rng.next() > 0.3 ? {
        merchant: rng.pick(MERCHANT_POOLS.gym),
        displayName: 'Gym Membership',
        amount: rng.next() > 0.5 ? 24.99 : 49.99,
        billingDay: 1,
        frequency: 'monthly'
    } as SubscriptionPlan : null;

    // Software: 2-6
    const softwareSubscriptions = rng.pickDistinct(MERCHANT_POOLS.software, 2, 6)
        .map(name => ({
            merchant: name,
            displayName: name,
            amount: getSoftwarePrice(name, rng),
            billingDay: rng.range(1, 28),
            frequency: 'monthly'
        } as SubscriptionPlan));

    // -------------------------------------------------------------------------
    // 7. Daily Spending Merchants (PLAN.md §5.4.2)
    // -------------------------------------------------------------------------

    // Grocery: 2-6
    const groceryStores = rng.pickDistinct(MERCHANT_POOLS.grocery, 2, 6);

    // Fast Food: 5-10
    const fastFoodSpots = rng.pickDistinct(MERCHANT_POOLS.fastFood, 5, 10);

    // Coffee: 2-4
    const coffeeShops = rng.pickDistinct(MERCHANT_POOLS.coffee, 2, 4);

    // Casual Dining: 4-5
    const casualDining = rng.pickDistinct(MERCHANT_POOLS.restaurant, 4, 5);

    // Gas: 2-5
    const gasStations = rng.pickDistinct(MERCHANT_POOLS.gas, 2, 5);

    // Rideshare: 1-3
    const rideshareApps = rng.pickDistinct(MERCHANT_POOLS.rideshare, 1, 3);

    // Food Delivery: 1-3
    const foodDeliveryApps = rng.pickDistinct(MERCHANT_POOLS.foodDelivery, 1, 3);

    // -------------------------------------------------------------------------
    // 8. Shopping (PLAN.md §5.4.2)
    // -------------------------------------------------------------------------

    // Retail (in-person): 3-6
    const retailStores = rng.pickDistinct(MERCHANT_POOLS.retail, 3, 6);

    // Online Shopping: 3-5
    const onlineShops = rng.pickDistinct(MERCHANT_POOLS.onlineShopping, 3, 5);

    // Unknown/Random: 4-5
    const unknownMerchants = rng.pickDistinct(MERCHANT_POOLS.unknown, 4, 5);

    // -------------------------------------------------------------------------
    // Return Complete Profile
    // -------------------------------------------------------------------------

    return {
        id: profileId,
        createdAt: now,
        primaryBank,
        secondaryBanks,
        p2pWallets,
        creditCards,
        investmentBrokerages,
        cryptoExchanges,
        housingType,
        housingProvider,
        utilities,
        phoneCarrier,
        internetProvider,
        autoInsurance,
        healthInsurance,
        homeOrRentersInsurance,
        lifeInsurance,
        carLender,
        studentLoanServicer,
        otherLoans,
        streamingServices,
        musicService,
        cloudStorage,
        gym,
        softwareSubscriptions,
        groceryStores,
        fastFoodSpots,
        coffeeShops,
        casualDining,
        gasStations,
        rideshareApps,
        foodDeliveryApps,
        retailStores,
        onlineShops,
        unknownMerchants,
    };
};

// Price lookup helpers for realistic amounts
function getStreamingPrice(name: string, rng: SeededRNG): number {
    const prices: Record<string, number> = {
        'Netflix': 15.99,
        'Hulu': 12.99,
        'Disney+': 10.99,
        'Max': 15.99,
        'Amazon Prime Video': 8.99,
        'Peacock': 5.99,
        'Paramount+': 9.99,
        'Apple TV+': 6.99,
        'YouTube TV': 72.99,
        'YouTube Premium': 13.99,
        'Sling TV': 40.00,
        'Crunchyroll': 7.99,
        'Philo': 25.00,
        'Starz': 9.99,
        'ESPN+': 10.99,
    };
    return prices[name] ?? rng.range(5, 15) + 0.99;
}

function getCloudPrice(name: string, rng: SeededRNG): number {
    const prices: Record<string, number> = {
        'iCloud+': 2.99,
        'Google Drive': 2.99,
        'Dropbox': 11.99,
        'Microsoft OneDrive': 6.99,
        'Box': 10.00,
        'Mega': 4.99,
        'pCloud': 4.99,
        'Amazon Photos': 1.99,
    };
    return prices[name] ?? rng.range(2, 12) + 0.99;
}

function getSoftwarePrice(name: string, rng: SeededRNG): number {
    const prices: Record<string, number> = {
        'Microsoft 365': 9.99,
        'Adobe Creative Cloud': 54.99,
        'Google Workspace': 12.00,
        'Zoom Pro': 14.99,
        'Slack Pro': 7.25,
        'Notion Plus': 8.00,
        'Evernote Premium': 7.99,
        '1Password': 2.99,
        'LastPass Premium': 3.00,
        'Duolingo Super': 12.99,
        'Grammarly Premium': 12.00,
        'Headspace': 12.99,
        'Calm': 14.99,
        'WeightWatchers Digital': 10.99,
        'Noom': 59.00,
        'New York Times Digital': 4.25,
        'Wall Street Journal Digital': 4.99,
        'GitHub Copilot': 19.00,
        'ChatGPT Plus': 20.00,
        'HelloFresh': 79.99,
    };
    return prices[name] ?? rng.range(5, 20) + 0.99;
}
