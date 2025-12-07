/**
 * Internal Transfer Logic Verification
 * ------------------------------------
 * This file documents the expected behavior of internal transfer handling
 * and provides verification functions that can be run manually or converted
 * to automated tests.
 *
 * Phase 2 Spec: Internal transfers should be:
 * - EXCLUDED from net income (only kind='income' counts as income)
 * - EXCLUDED from total spending (only expense/subscription/fee/transferExternal)
 * - VISIBLE in Statement and Review tabs
 * - AVAILABLE as their own metric via getInternalTransferTotals()
 */

import { Transaction } from '../types';
import * as Selectors from '../selectors/transactionSelectors';
import * as MathLogic from '../math/transactionMath';

// --- Test Data ---

const createTestTransaction = (
    id: string,
    amount: number,
    kind: Transaction['kind'],
    category: string
): Transaction => ({
    id,
    date: '2025-12-01',
    amount,
    description: `Test ${kind} - ${id}`,
    category,
    kind,
    accountId: 'test',
    source: 'Test',
});

const createTestDataset = (): Transaction[] => [
    // Income
    createTestTransaction('inc-1', 5000, 'income', 'Income'),
    createTestTransaction('inc-2', 2000, 'income', 'Income'),

    // Expenses
    createTestTransaction('exp-1', -500, 'expense', 'Groceries'),
    createTestTransaction('exp-2', -150, 'expense', 'Dining'),
    createTestTransaction('exp-3', -100, 'expense', 'Transport'),

    // Subscriptions
    createTestTransaction('sub-1', -15.99, 'subscription', 'Subscriptions'),
    createTestTransaction('sub-2', -9.99, 'subscription', 'Subscriptions'),

    // Fees
    createTestTransaction('fee-1', -35, 'fee', 'Fees'),

    // Internal Transfer - should NOT count as income or spending
    createTestTransaction('xfer-1', -500, 'transferInternal', 'Transfer'),
    createTestTransaction('xfer-2', -200, 'transferInternal', 'Transfer'),
];

// --- Verification Functions ---

export const verifyInternalTransferExclusionFromIncome = (): {
    passed: boolean;
    expected: number;
    actual: number;
} => {
    const transactions = createTestDataset();
    const actual = Selectors.getNetIncome(transactions);
    const expected = 7000; // 5000 + 2000 (income only)

    return {
        passed: actual === expected,
        expected,
        actual,
    };
};

export const verifyInternalTransferExclusionFromSpending = (): {
    passed: boolean;
    expected: number;
    actual: number;
} => {
    const transactions = createTestDataset();
    const actual = Selectors.getTotalSpending(transactions);
    // Expected: 500 + 150 + 100 + 15.99 + 9.99 + 35 = 810.98
    // Internal transfers (500 + 200) should NOT be included
    const expected = 810.98;

    return {
        passed: Math.abs(actual - expected) < 0.01, // Float tolerance
        expected,
        actual,
    };
};

export const verifyInternalTransferTotalCalculation = (): {
    passed: boolean;
    expected: number;
    actual: number;
} => {
    const transactions = createTestDataset();
    const actual = Selectors.getInternalTransferTotals(transactions);
    const expected = 700; // abs(-500) + abs(-200)

    return {
        passed: actual === expected,
        expected,
        actual,
    };
};

export const verifyInternalTransferClassification = (): {
    passed: boolean;
    message: string;
} => {
    const internalByKind: Transaction = {
        id: 'test-1',
        date: '2025-12-01',
        amount: -500,
        description: 'Transfer to Savings',
        category: 'Transfer',
        kind: 'transferInternal',
        accountId: 'checking',
        source: 'Checking',
    };

    const internalByCategory: Transaction = {
        id: 'test-2',
        date: '2025-12-01',
        amount: -300,
        description: 'Transfer',
        category: 'Transfer',
        kind: 'expense', // Legacy data might not have correct kind
        accountId: 'checking',
        source: 'Checking',
    };

    const externalTransfer: Transaction = {
        id: 'test-3',
        date: '2025-12-01',
        amount: -200,
        description: 'Payment',
        category: 'Transfer',
        kind: 'transferExternal',
        accountId: 'checking',
        source: 'Checking',
    };

    const isInternal1 = MathLogic.isInternalTransfer(internalByKind);
    const isInternal2 = MathLogic.isInternalTransfer(internalByCategory);
    const isInternal3 = MathLogic.isInternalTransfer(externalTransfer);

    const passed = isInternal1 === true && isInternal2 === true && isInternal3 === false;

    return {
        passed,
        message: passed
            ? 'All classification checks passed'
            : `Failed: byKind=${isInternal1}, byCategory=${isInternal2}, external=${isInternal3}`,
    };
};

export const verifyDailyCashflowExcludesInternalTransfers = (): {
    passed: boolean;
    message: string;
} => {
    const transactions: Transaction[] = [
        createTestTransaction('inc-1', 1000, 'income', 'Income'),
        createTestTransaction('exp-1', -200, 'expense', 'Groceries'),
        createTestTransaction('xfer-1', -500, 'transferInternal', 'Transfer'),
    ];

    const dailyBuckets = MathLogic.getDailyCashflowBuckets(transactions);

    if (dailyBuckets.length !== 1) {
        return { passed: false, message: 'Expected 1 daily bucket' };
    }

    const bucket = dailyBuckets[0];
    // Income should be 1000, expense should be 200, net should be 800
    // Internal transfer should be excluded
    const passed = bucket.income === 1000 && bucket.expense === 200 && bucket.net === 800;

    return {
        passed,
        message: passed
            ? 'Daily cashflow correctly excludes internal transfers'
            : `Failed: income=${bucket.income}, expense=${bucket.expense}, net=${bucket.net}`,
    };
};

// --- Run All Verifications ---

export const runAllVerifications = (): {
    allPassed: boolean;
    results: Record<string, { passed: boolean; details?: string }>;
} => {
    const results: Record<string, { passed: boolean; details?: string }> = {};

    const incomeCheck = verifyInternalTransferExclusionFromIncome();
    results['Income excludes internal transfers'] = {
        passed: incomeCheck.passed,
        details: `Expected: ${incomeCheck.expected}, Actual: ${incomeCheck.actual}`,
    };

    const spendingCheck = verifyInternalTransferExclusionFromSpending();
    results['Spending excludes internal transfers'] = {
        passed: spendingCheck.passed,
        details: `Expected: ${spendingCheck.expected}, Actual: ${spendingCheck.actual}`,
    };

    const transferTotalCheck = verifyInternalTransferTotalCalculation();
    results['Internal transfer total calculation'] = {
        passed: transferTotalCheck.passed,
        details: `Expected: ${transferTotalCheck.expected}, Actual: ${transferTotalCheck.actual}`,
    };

    const classificationCheck = verifyInternalTransferClassification();
    results['Internal transfer classification'] = {
        passed: classificationCheck.passed,
        details: classificationCheck.message,
    };

    const cashflowCheck = verifyDailyCashflowExcludesInternalTransfers();
    results['Daily cashflow excludes internal transfers'] = {
        passed: cashflowCheck.passed,
        details: cashflowCheck.message,
    };

    const allPassed = Object.values(results).every((r) => r.passed);

    return { allPassed, results };
};

/**
 * Console runner for manual verification.
 * Can be executed via: npx ts-node src/lib/__tests__/internalTransferLogic.verify.ts
 */
if (typeof require !== 'undefined' && require.main === module) {
    const { allPassed, results } = runAllVerifications();
    console.log('\n=== Internal Transfer Logic Verification ===\n');
    Object.entries(results).forEach(([name, result]) => {
        const status = result.passed ? '✅ PASS' : '❌ FAIL';
        console.log(`${status}: ${name}`);
        if (result.details) console.log(`       ${result.details}`);
    });
    console.log(`\n${allPassed ? '✅ All checks passed!' : '❌ Some checks failed.'}\n`);
    process.exit(allPassed ? 0 : 1);
}
