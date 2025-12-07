import { Transaction, LifestyleProfile, TransactionKind } from '../types';
import { generateTransactionId, generateMonthSeed, GenerationPhase } from './idGenerator';
import { injectSuspiciousCharges, runDetectionPass } from './suspiciousDetection';

/**
 * Transaction Generation Engine
 * Implements the 12-stage pipeline to generate realistic transaction data.
 * Per PLAN.md §5.3-5.5
 */

// --- Helper: Seeded Random for Engine ---
class EngineRNG {
    private seed: number;
    constructor(seed: number) { this.seed = seed; }
    next(): number {
        this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
        return this.seed / 4294967296;
    }
    range(min: number, max: number): number {
        return Math.floor(this.next() * (max - min + 1)) + min;
    }
    float(min: number, max: number): number {
        return this.next() * (max - min) + min;
    }
    pick<T>(array: T[]): T {
        return array[Math.floor(this.next() * array.length)];
    }
    pickN<T>(array: T[], n: number): T[] {
        const shuffled = [...array].sort(() => this.next() - 0.5);
        return shuffled.slice(0, Math.min(n, array.length));
    }
}

// --- Helper: Date Iterator ---
const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();

// --- Description Formatters (PLAN.md §5.4.4, §5.4.5) ---

type ChargeType = 'visa' | 'ach' | 'online' | 'subscription';

const formatDescription = (
    merchant: string,
    chargeType: ChargeType,
    descriptor?: string
): string => {
    switch (chargeType) {
        case 'visa':
            // Card POS: VISA*MERCHANT or VISA*MERCHANT CITY ST
            return `VISA*${merchant.toUpperCase()}`;
        case 'ach':
            // ACH: NAME ACH or NAME ACH PYMT
            return `${merchant.toUpperCase()} ACH`;
        case 'online':
            // Online: DOMAIN or VISA*MERCHANT
            if (merchant.includes('.')) return merchant.toUpperCase();
            return `${merchant.toUpperCase()}.COM`;
        case 'subscription':
            // Subscriptions: APPLE.COM/BILL, NETFLIX.COM
            if (merchant.toLowerCase().includes('apple')) return 'APPLE.COM/BILL';
            if (merchant.toLowerCase().includes('netflix')) return 'NETFLIX.COM';
            if (merchant.toLowerCase().includes('spotify')) return 'SPOTIFY USA';
            if (merchant.toLowerCase().includes('amazon')) return 'AMAZON PRIME';
            if (merchant.toLowerCase().includes('hulu')) return 'HULU.COM';
            if (merchant.toLowerCase().includes('disney')) return 'DISNEY PLUS';
            if (merchant.toLowerCase().includes('hbo')) return 'HBO MAX';
            if (merchant.toLowerCase().includes('youtube')) return 'GOOGLE *YouTube';
            return `${merchant.toUpperCase()}.COM`;
        default:
            return merchant.toUpperCase();
    }
};

// --- Fee Types Pool (PLAN.md §5.5) ---
const FEE_TYPES = [
    { name: 'ATM Fee', amount: 3.50, merchant: 'ATM Withdrawal Fee' },
    { name: 'Foreign Transaction Fee', amount: 2.99, merchant: 'Foreign Transaction' },
    { name: 'Monthly Service Fee', amount: 12.00, merchant: 'Monthly Account Fee' },
    { name: 'Overdraft Fee', amount: 35.00, merchant: 'Overdraft Protection' },
    { name: 'Wire Transfer Fee', amount: 25.00, merchant: 'Wire Transfer Fee' },
    { name: 'Paper Statement Fee', amount: 2.00, merchant: 'Paper Statement' },
    { name: 'Late Payment Fee', amount: 29.00, merchant: 'Late Payment Fee' },
    { name: 'Returned Item Fee', amount: 15.00, merchant: 'Returned Item' },
    { name: 'Card Replacement Fee', amount: 5.00, merchant: 'Card Replacement' },
    { name: 'Express Delivery Fee', amount: 25.00, merchant: 'Express Delivery' },
    { name: 'Out-of-Network ATM', amount: 2.50, merchant: 'Non-Network ATM' },
    { name: 'Stop Payment Fee', amount: 30.00, merchant: 'Stop Payment' },
];

// --- Main Generator ---

export const generateTransactions = (
    profile: LifestyleProfile,
    datasetStart: Date,
    datasetEnd: Date,
    mode: 'full' | 'extend' = 'full',
    existingTransactions: Transaction[] = []
): Transaction[] => {
    let transactions: Transaction[] = mode === 'extend' ? [...existingTransactions] : [];

    const startYear = datasetStart.getFullYear();
    const startMonth = datasetStart.getMonth();
    const endYear = datasetEnd.getFullYear();
    const endMonth = datasetEnd.getMonth();

    let currentYear = startYear;
    let currentMonth = startMonth;

    // Track stable subscription amounts across months (PLAN.md §5.3)
    const subscriptionAmounts = new Map<string, number>();

    // Pre-determine fee types for this profile (3-6 types)
    const profileRng = new EngineRNG(generateMonthSeed(profile.id, startYear, 0));
    const numFeeTypes = profileRng.range(3, 6);
    const profileFeeTypes = profileRng.pickN(FEE_TYPES, numFeeTypes);

    while (currentYear < endYear || (currentYear === endYear && currentMonth <= endMonth)) {
        const monthSeed = generateMonthSeed(profile.id, currentYear, currentMonth);
        const rng = new EngineRNG(monthSeed);
        const daysInMonth = getDaysInMonth(currentYear, currentMonth);

        const monthTransactions: Transaction[] = [];
        let sequence = 0;

        const createTx = (
            day: number,
            amount: number,
            desc: string,
            category: string,
            kind: TransactionKind,
            phase: GenerationPhase,
            merchant?: string,
            meta?: Partial<Transaction>
        ) => {
            const safeDay = Math.max(1, Math.min(day, daysInMonth));
            const date = new Date(currentYear, currentMonth, safeDay);
            const id = generateTransactionId(profile.id, date, phase, sequence++);

            // Format as YYYY-MM-DD using local components (NOT toISOString which converts to UTC!)
            // This prevents timezone drift like Dec 1 local → Nov 30 UTC
            const yyyy = date.getFullYear();
            const mm = String(date.getMonth() + 1).padStart(2, '0');
            const dd = String(date.getDate()).padStart(2, '0');
            const localDateStr = `${yyyy}-${mm}-${dd}`;

            monthTransactions.push({
                id,
                date: localDateStr,
                amount: Number(amount.toFixed(2)),
                description: desc,
                merchantName: merchant || desc,
                category,
                kind,
                accountId: 'checking',
                source: 'Checking',
                ...meta
            });
        };

        // --- Stage 3: Fixed Recurring (Rent, Utilities, Insurance, Phone, Loans) ---

        // Rent/Mortgage (1st of month) - ACH
        const housingAmount = profile.housingType === 'rent' ? -rng.range(1200, 2500) : -rng.range(1500, 3000);
        createTx(
            1,
            housingAmount,
            formatDescription(profile.housingProvider, 'ach'),
            profile.housingType === 'rent' ? 'Rent' : 'Mortgage',
            'expense',
            'R',
            profile.housingProvider,
            { isRecurring: true }
        );

        // Utilities (Random days) - ACH
        profile.utilities.forEach(util => {
            const day = rng.range(5, 25);
            const amount = -rng.float(40, 150);
            createTx(
                day,
                amount,
                formatDescription(util.name, 'ach'),
                'Utilities',
                'expense',
                'R',
                util.name,
                { isRecurring: true }
            );
        });

        // Phone Bill (1x per month) - ACH
        createTx(
            rng.range(10, 20),
            -rng.float(60, 120),
            formatDescription(profile.phoneCarrier, 'ach'),
            'Phone',
            'expense',
            'R',
            profile.phoneCarrier,
            { isRecurring: true }
        );

        // Auto Insurance (1x per month) - ACH
        createTx(
            rng.range(10, 20),
            -rng.float(80, 150),
            formatDescription(profile.autoInsurance, 'ach'),
            'Insurance',
            'expense',
            'R',
            profile.autoInsurance,
            { isRecurring: true }
        );

        // Health Insurance (1x per month) - ACH
        createTx(
            rng.range(1, 5),
            -rng.float(200, 600),
            formatDescription(profile.healthInsurance, 'ach'),
            'Insurance',
            'expense',
            'R',
            profile.healthInsurance,
            { isRecurring: true }
        );

        // Home/Renters Insurance (1x per month) - ACH
        createTx(
            rng.range(15, 25),
            -rng.float(80, 200),
            formatDescription(profile.homeOrRentersInsurance, 'ach'),
            'Insurance',
            'expense',
            'R',
            profile.homeOrRentersInsurance,
            { isRecurring: true }
        );

        // Life Insurance (0-1x per month, only if profile has it) - ACH
        if (profile.lifeInsurance) {
            createTx(
                rng.range(1, 10),
                -rng.float(30, 80),
                formatDescription(profile.lifeInsurance, 'ach'),
                'Insurance',
                'expense',
                'R',
                profile.lifeInsurance,
                { isRecurring: true }
            );
        }

        // Car Loan Payment (1x per month, only if profile has it) - ACH
        if (profile.carLender) {
            createTx(
                rng.range(1, 10),
                -rng.float(300, 600),
                formatDescription(profile.carLender, 'ach'),
                'Loans',
                'expense',
                'R',
                profile.carLender,
                { isRecurring: true }
            );
        }

        // Student Loan Payment (1x per month, only if profile has it) - ACH
        if (profile.studentLoanServicer) {
            createTx(
                rng.range(15, 25),
                -rng.float(200, 500),
                formatDescription(profile.studentLoanServicer, 'ach'),
                'Loans',
                'expense',
                'R',
                profile.studentLoanServicer,
                { isRecurring: true }
            );
        }

        // Other Loans (1x per month each, only if profile has them) - ACH
        profile.otherLoans.forEach(lender => {
            createTx(
                rng.range(5, 20),
                -rng.float(100, 400),
                formatDescription(lender, 'ach'),
                'Loans',
                'expense',
                'R',
                lender,
                { isRecurring: true }
            );
        });

        // --- Stage 4: Subscriptions (Stable amounts) ---

        // Streaming Services
        profile.streamingServices.forEach(sub => {
            const key = `streaming-${sub.merchant}`;
            if (!subscriptionAmounts.has(key)) {
                subscriptionAmounts.set(key, sub.amount);
            }
            const stableAmount = subscriptionAmounts.get(key)!;

            createTx(
                sub.billingDay,
                -stableAmount,
                formatDescription(sub.merchant, 'subscription'),
                'Subscriptions',
                'subscription',
                'S',
                sub.merchant,
                { isSubscription: true, isRecurring: true }
            );
        });

        // Music Service
        const musicKey = `music-${profile.musicService.merchant}`;
        if (!subscriptionAmounts.has(musicKey)) {
            subscriptionAmounts.set(musicKey, profile.musicService.amount);
        }
        createTx(
            profile.musicService.billingDay,
            -subscriptionAmounts.get(musicKey)!,
            formatDescription(profile.musicService.merchant, 'subscription'),
            'Subscriptions',
            'subscription',
            'S',
            profile.musicService.merchant,
            { isSubscription: true, isRecurring: true }
        );

        // Gym
        if (profile.gym) {
            const gymKey = `gym-${profile.gym.merchant}`;
            if (!subscriptionAmounts.has(gymKey)) {
                subscriptionAmounts.set(gymKey, profile.gym.amount);
            }
            createTx(
                profile.gym.billingDay,
                -subscriptionAmounts.get(gymKey)!,
                formatDescription(profile.gym.merchant, 'subscription'),
                'Subscriptions',
                'subscription',
                'S',
                profile.gym.merchant,
                { isSubscription: true, isRecurring: true }
            );
        }

        // Cloud Storage
        profile.cloudStorage.forEach(sub => {
            const cloudKey = `cloud-${sub.merchant}-${sub.amount.toFixed(2)}`;
            if (!subscriptionAmounts.has(cloudKey)) {
                subscriptionAmounts.set(cloudKey, sub.amount);
            }
            createTx(
                sub.billingDay,
                -subscriptionAmounts.get(cloudKey)!,
                formatDescription(sub.merchant, 'subscription'),
                'Subscriptions',
                'subscription',
                'S',
                sub.merchant,
                { isSubscription: true, isRecurring: true }
            );
        });

        // Software Subscriptions (2-6 per profile, each bills monthly)
        profile.softwareSubscriptions.forEach(sub => {
            const softKey = `software-${sub.merchant}`;
            if (!subscriptionAmounts.has(softKey)) {
                subscriptionAmounts.set(softKey, sub.amount);
            }
            createTx(
                sub.billingDay,
                -subscriptionAmounts.get(softKey)!,
                formatDescription(sub.merchant, 'subscription'),
                'Subscriptions',
                'subscription',
                'S',
                sub.merchant,
                { isSubscription: true, isRecurring: true }
            );
        });

        // --- Stage 5: Income ---
        const salary = rng.range(2500, 4000);
        createTx(1, salary, `${profile.primaryBank.name} DIRECT DEP`, 'Income', 'income', 'I', 'Employer', { isRecurring: true });
        createTx(15, salary, `${profile.primaryBank.name} DIRECT DEP`, 'Income', 'income', 'I', 'Employer', { isRecurring: true });

        // --- Stage 6: Variable Spending ---

        // Groceries (Weekly, 4-5x per month) - VISA
        for (let d = 1; d <= daysInMonth; d += 7) {
            const day = Math.min(d + rng.range(0, 2), daysInMonth);
            const store = rng.pick(profile.groceryStores);
            const amount = -rng.float(80, 200);
            createTx(day, amount, formatDescription(store, 'visa'), 'Groceries', 'expense', 'V', store);
        }

        // Fast Food / Coffee (8-12x per month) - VISA
        const fastFoodCount = rng.range(8, 12);
        for (let i = 0; i < fastFoodCount; i++) {
            const day = rng.range(1, daysInMonth);
            const isCoffee = rng.next() > 0.6;
            const spot = isCoffee ? rng.pick(profile.coffeeShops) : rng.pick(profile.fastFoodSpots);
            const amount = isCoffee ? -rng.float(4, 8) : -rng.float(10, 25);
            createTx(day, amount, formatDescription(spot, 'visa'), 'Dining', 'expense', 'V', spot);
        }

        // Casual Dining / Sit-Down Restaurants (3-5x per month) - VISA
        const casualDiningCount = rng.range(3, 5);
        for (let i = 0; i < casualDiningCount; i++) {
            const day = rng.range(1, daysInMonth);
            const restaurant = rng.pick(profile.casualDining);
            const amount = -rng.float(25, 80);
            createTx(day, amount, formatDescription(restaurant, 'visa'), 'Dining', 'expense', 'V', restaurant);
        }

        // Gas Stations (Weekly, 4-5x per month) - VISA
        for (let d = 1; d <= daysInMonth; d += 7) {
            const day = Math.min(d + rng.range(0, 3), daysInMonth);
            const station = rng.pick(profile.gasStations);
            const amount = -rng.float(30, 60);
            createTx(day, amount, `${formatDescription(station, 'visa')} GAS`, 'Transport', 'expense', 'V', station);
        }

        // Rideshare (2-6x per month) - VISA
        const rideshareCount = rng.range(2, 6);
        for (let i = 0; i < rideshareCount; i++) {
            const day = rng.range(1, daysInMonth);
            const app = rng.pick(profile.rideshareApps);
            const amount = -rng.float(10, 45);
            createTx(day, amount, formatDescription(app, 'visa'), 'Transport', 'expense', 'V', app);
        }

        // Food Delivery (3-6x per month) - VISA/Online
        const deliveryCount = rng.range(3, 6);
        for (let i = 0; i < deliveryCount; i++) {
            const day = rng.range(1, daysInMonth);
            const app = rng.pick(profile.foodDeliveryApps);
            const amount = -rng.float(15, 50);
            createTx(day, amount, formatDescription(app, 'online'), 'Dining', 'expense', 'V', app);
        }

        // Retail Shopping (2-4x per month) - VISA
        const retailCount = rng.range(2, 4);
        for (let i = 0; i < retailCount; i++) {
            const day = rng.range(1, daysInMonth);
            const shop = rng.pick(profile.retailStores);
            const amount = -rng.float(20, 100);
            createTx(day, amount, formatDescription(shop, 'visa'), 'Shopping', 'expense', 'V', shop);
        }

        // Online Shopping (3-6x per month) - Online
        const onlineCount = rng.range(3, 6);
        for (let i = 0; i < onlineCount; i++) {
            const day = rng.range(1, daysInMonth);
            const shop = rng.pick(profile.onlineShops);
            const amount = -rng.float(15, 150);
            createTx(day, amount, formatDescription(shop, 'online'), 'Shopping', 'expense', 'V', shop);
        }

        // Unknown / Random Merchants (1-3x per month) - VISA
        const unknownCount = rng.range(1, 3);
        for (let i = 0; i < unknownCount; i++) {
            const day = rng.range(1, daysInMonth);
            const merchant = rng.pick(profile.unknownMerchants);
            const amount = -rng.float(5, 50);
            createTx(day, amount, formatDescription(merchant, 'visa'), 'Other', 'expense', 'V', merchant);
        }

        // --- Stage 7: Internal Transfers ---

        // Transfer to Savings (30% chance per month)
        if (rng.next() > 0.7) {
            const day = rng.range(1, daysInMonth);
            const amount = -rng.range(100, 500);
            createTx(day, amount, 'Transfer to Savings', 'Transfer', 'transferInternal', 'T', 'Savings');
        }

        // --- Stage 8: Fees (2-8 per month) ---
        const numFeesThisMonth = rng.range(2, 8);
        for (let i = 0; i < numFeesThisMonth; i++) {
            const feeType = rng.pick(profileFeeTypes);
            const day = rng.range(1, daysInMonth);
            const variance = 0.8 + rng.next() * 0.4;
            const amount = -(feeType.amount * variance);
            createTx(day, amount, feeType.name, 'Fees', 'fee', 'F', feeType.merchant);
        }

        // Add to main list (without suspicious injection per-month)
        transactions.push(...monthTransactions);

        // Increment Month
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
    }

    // --- Stage 9: Suspicious Injection (once for entire dataset) ---
    // Inject 2-6 suspicious merchants across the entire dataset
    transactions = injectSuspiciousCharges(transactions, profile, { targetMin: 2, targetMax: 6 });

    // --- Stage 10: Detection Pass ---
    // Run detection to catch any naturally suspicious patterns
    transactions = runDetectionPass(transactions);

    // --- Stage 12: Final Sort ---
    return transactions.sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.id.localeCompare(b.id);
    });
};
