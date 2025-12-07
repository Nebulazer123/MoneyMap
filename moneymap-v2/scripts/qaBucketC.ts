/**
 * Phase 2 Bucket C QA Helper
 * --------------------------
 * Generates a test dataset and checks:
 * - C.1: Subscription amount stability (same merchant = same amount each month)
 * - E.1: Fee type variety (3-6 distinct fee types)
 * - Prefix consistency (VISA-star and ACH patterns)
 *
 * Usage: npm run qa:bucketC
 */

import { generateLifestyleProfile } from '../src/lib/generators/lifestyleProfile';
import { generateTransactions } from '../src/lib/generators/transactionEngine';
import { Transaction } from '../src/lib/types';


// --- Helper Functions ---

const formatCurrency = (amount: number): string =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Math.abs(amount));

const printSeparator = () => console.log('\n' + '─'.repeat(70) + '\n');

// --- 1. Subscription Stability Check ---

interface SubscriptionCheck {
    merchant: string;
    amounts: Set<number>;
    occurrences: number;
    isStable: boolean;
}

const checkSubscriptionStability = (transactions: Transaction[]): SubscriptionCheck[] => {
    const subscriptions = transactions.filter(t => t.kind === 'subscription' || t.isSubscription);
    const merchantMap = new Map<string, { amounts: Set<number>; count: number }>();

    subscriptions.forEach(tx => {
        const merchant = tx.merchantName || tx.description;
        if (!merchantMap.has(merchant)) {
            merchantMap.set(merchant, { amounts: new Set(), count: 0 });
        }
        const entry = merchantMap.get(merchant)!;
        entry.amounts.add(Math.abs(tx.amount));
        entry.count++;
    });

    const results: SubscriptionCheck[] = [];
    merchantMap.forEach((data, merchant) => {
        results.push({
            merchant,
            amounts: data.amounts,
            occurrences: data.count,
            isStable: data.amounts.size === 1,
        });
    });

    return results.sort((a, b) => a.merchant.localeCompare(b.merchant));
};

// --- 2. Fee Variety Check ---

interface FeeCheck {
    description: string;
    count: number;
    totalAmount: number;
}

const checkFeeVariety = (transactions: Transaction[]): {
    fees: FeeCheck[];
    totalFeeCount: number;
    uniqueFeeTypes: number;
} => {
    const feeTxns = transactions.filter(t => t.kind === 'fee');
    const feeMap = new Map<string, { count: number; total: number }>();

    feeTxns.forEach(tx => {
        const desc = tx.description;
        if (!feeMap.has(desc)) {
            feeMap.set(desc, { count: 0, total: 0 });
        }
        const entry = feeMap.get(desc)!;
        entry.count++;
        entry.total += Math.abs(tx.amount);
    });

    const fees: FeeCheck[] = [];
    feeMap.forEach((data, description) => {
        fees.push({
            description,
            count: data.count,
            totalAmount: data.total,
        });
    });

    return {
        fees: fees.sort((a, b) => b.count - a.count),
        totalFeeCount: feeTxns.length,
        uniqueFeeTypes: feeMap.size,
    };
};

// --- 3. VISA*/ACH Prefix Check ---

interface PrefixCheck {
    visaCount: number;
    achCount: number;
    visaSamples: string[];
    achSamples: string[];
    otherSamples: string[];
}

const checkPrefixConsistency = (transactions: Transaction[]): PrefixCheck => {
    const visaTxns = transactions.filter(t => t.description.startsWith('VISA*'));
    const achTxns = transactions.filter(t => t.description.includes(' ACH'));

    // Sample up to 5 of each
    const visaSamples = visaTxns.slice(0, 5).map(t => t.description);
    const achSamples = achTxns.slice(0, 5).map(t => t.description);

    // Find transaction with neither pattern for comparison (online/subscription)
    const otherTxns = transactions.filter(t =>
        !t.description.startsWith('VISA*') &&
        !t.description.includes(' ACH') &&
        t.kind !== 'income' &&
        t.kind !== 'fee' &&
        t.kind !== 'transferInternal'
    );
    const otherSamples = otherTxns.slice(0, 5).map(t => `${t.description} (${t.kind})`);

    return {
        visaCount: visaTxns.length,
        achCount: achTxns.length,
        visaSamples,
        achSamples,
        otherSamples,
    };
};

// --- Main QA Runner ---

const runQA = () => {
    console.log('═'.repeat(70));
    console.log('   PHASE 2 BUCKET C QA HELPER');
    console.log('═'.repeat(70));
    console.log(`   Run Date: ${new Date().toISOString()}`);
    console.log('═'.repeat(70));

    // Generate 6-month dataset
    const profileId = 'qa-test-profile-' + Date.now();
    const profile = generateLifestyleProfile(profileId);

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 6);
    const endDate = new Date();

    console.log(`\n📊 Generating ${6} months of transactions...`);
    console.log(`   Profile ID: ${profileId}`);
    console.log(`   Date Range: ${startDate.toLocaleDateString()} → ${endDate.toLocaleDateString()}`);

    const transactions = generateTransactions(profile, startDate, endDate);
    console.log(`   Total Transactions: ${transactions.length}`);

    printSeparator();

    // --- C.1: Subscription Stability ---
    console.log('📋 CHECK 1: SUBSCRIPTION AMOUNT STABILITY');
    console.log('   Spec: Same subscription merchant = same amount each month\n');

    const subscriptionResults = checkSubscriptionStability(transactions);
    const unstableSubs = subscriptionResults.filter(s => !s.isStable);

    console.log('   Merchant                          | Occurrences | Amounts              | Status');
    console.log('   ' + '─'.repeat(75));

    subscriptionResults.forEach(sub => {
        const amountStr = Array.from(sub.amounts).map(formatCurrency).join(', ');
        const status = sub.isStable ? '✅ Stable' : '⚠️ UNSTABLE';
        const merchant = sub.merchant.substring(0, 32).padEnd(32);
        console.log(`   ${merchant} | ${String(sub.occurrences).padStart(11)} | ${amountStr.padEnd(20)} | ${status}`);
    });

    console.log('\n   RESULT: ' + (unstableSubs.length === 0
        ? '✅ All subscriptions are stable'
        : `⚠️ ${unstableSubs.length} merchants have unstable amounts`));

    printSeparator();

    // --- E.1: Fee Variety ---
    console.log('📋 CHECK 2: FEE TYPE VARIETY');
    console.log('   Spec: 3-6 distinct fee types across dataset\n');

    const feeResults = checkFeeVariety(transactions);

    console.log(`   Total Fees: ${feeResults.totalFeeCount}`);
    console.log(`   Unique Fee Types: ${feeResults.uniqueFeeTypes}`);
    console.log('');
    console.log('   Fee Type                          | Count | Total Amount');
    console.log('   ' + '─'.repeat(60));

    feeResults.fees.forEach(fee => {
        const desc = fee.description.substring(0, 32).padEnd(32);
        console.log(`   ${desc} | ${String(fee.count).padStart(5)} | ${formatCurrency(fee.totalAmount).padStart(12)}`);
    });

    const feeVarietyOK = feeResults.uniqueFeeTypes >= 3 && feeResults.uniqueFeeTypes <= 6;
    console.log('\n   RESULT: ' + (feeVarietyOK
        ? `✅ Fee variety is in range (${feeResults.uniqueFeeTypes} types, expected 3-6)`
        : `⚠️ Fee variety outside range (${feeResults.uniqueFeeTypes} types, expected 3-6)`));

    printSeparator();

    // --- VISA*/ACH Prefixes ---
    console.log('📋 CHECK 3: VISA*/ACH PREFIX CONSISTENCY');
    console.log('   Spec: In-person = VISA*, ACH-style = "MERCHANT ACH"\n');

    const prefixResults = checkPrefixConsistency(transactions);

    console.log(`   VISA* transactions:  ${prefixResults.visaCount}`);
    console.log(`   ACH transactions:    ${prefixResults.achCount}`);
    console.log('');
    console.log('   Sample VISA* descriptions:');
    prefixResults.visaSamples.forEach(s => console.log(`     • ${s}`));
    console.log('');
    console.log('   Sample ACH descriptions:');
    prefixResults.achSamples.forEach(s => console.log(`     • ${s}`));
    console.log('');
    console.log('   Sample Other formats (subscriptions, online):');
    prefixResults.otherSamples.forEach(s => console.log(`     • ${s}`));

    const prefixOK = prefixResults.visaCount > 0 && prefixResults.achCount > 0;
    console.log('\n   RESULT: ' + (prefixOK
        ? '✅ Both VISA* and ACH formats present'
        : '⚠️ Missing expected prefix patterns'));

    printSeparator();

    // --- Summary ---
    console.log('═'.repeat(70));
    console.log('   SUMMARY');
    console.log('═'.repeat(70));
    console.log(`   Subscription Stability: ${unstableSubs.length === 0 ? '✅ PASS' : '⚠️ ISSUES'}`);
    console.log(`   Fee Variety (3-6):      ${feeVarietyOK ? '✅ PASS' : '⚠️ ISSUES'}`);
    console.log(`   VISA*/ACH Prefixes:     ${prefixOK ? '✅ PASS' : '⚠️ ISSUES'}`);
    console.log('═'.repeat(70));

    const allPass = unstableSubs.length === 0 && feeVarietyOK && prefixOK;
    console.log(`\n   Overall: ${allPass ? '✅ All Bucket C checks passed!' : '⚠️ Some checks need attention'}\n`);

    return allPass ? 0 : 1;
};

// Run if executed directly
runQA();
