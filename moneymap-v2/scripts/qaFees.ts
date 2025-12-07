
import { generateTransactions } from '../src/lib/generators/transactionEngine';
import { generateLifestyleProfile } from '../src/lib/generators/lifestyleProfile';

const runQA = () => {
    console.log("Starting Fees QA...");

    // Generate a profile
    const profileId = 'qa-fees-user-' + Date.now();
    const profile = generateLifestyleProfile(profileId);

    // Generate 6 months of data
    const start = new Date(2025, 0, 1);
    const end = new Date(2025, 5, 30);

    console.log(`Generating transactions for profileId: ${profileId}...`);
    const transactions = generateTransactions(profile, start, end, 'full');

    // Filter fees
    const fees = transactions.filter(t => t.kind === 'fee');
    console.log(`Total Fees Generated: ${fees.length}`);

    // Check 1: ATM Fees present (if profile has them)
    const atmFees = fees.filter(f => f.description.includes('ATM') || (f.merchantName && f.merchantName.includes('ATM')));
    const otherFees = fees.filter(f => !atmFees.includes(f));

    console.log(`ATM Fees: ${atmFees.length}`);
    console.log(`Other Fees: ${otherFees.length}`);

    // Check 2: ATM Consistency
    const atmMap = new Map<string, number>();
    let atmConsistent = true;
    atmFees.forEach(f => {
        const name = f.merchantName || 'Unknown ATM';
        if (atmMap.has(name)) {
            if (Math.abs(Math.abs(f.amount) - Math.abs(atmMap.get(name)!)) > 0.01) {
                console.error(`❌ Inconsistent ATM Fee for ${name}: ${f.amount} vs ${atmMap.get(name)}`);
                atmConsistent = false;
            }
        } else {
            atmMap.set(name, Math.abs(f.amount));
        }
    });

    if (atmConsistent && atmFees.length > 0) console.log("✅ ATM Fees are consistent per merchant.");
    if (atmFees.length === 0) console.log("⚠️ No ATM Fees generated (possible chance).");

    // Check 3: Whole Dollar Other Fees
    let wholeDollar = true;
    let nonWholeCount = 0;
    otherFees.forEach(f => {
        if (f.amount % 1 !== 0) {
            wholeDollar = false;
            nonWholeCount++;
            console.warn(`⚠️ Non-whole dollar fee found: ${f.description} ($${f.amount})`);
        }
    });

    if (wholeDollar) {
        console.log("✅ All Non-ATM Fees are whole amounts.");
    } else {
        console.log(`ℹ️ ${nonWholeCount} / ${otherFees.length} Non-ATM fees have cents (allowed, but checking bias).`);
    }

    // Check 4: Diversity
    const uniqueTypes = new Set(fees.map(f => f.description));
    console.log(`Unique Fee Types: ${uniqueTypes.size}`);

    if (uniqueTypes.size >= 3 && uniqueTypes.size <= 8) {
        console.log("✅ Fee type diversity within expected range (3-8).");
    } else {
        console.warn(`⚠️ Fee type diversity ${uniqueTypes.size} is outside soft target.`);
    }

    if (fees.length > 0) {
        console.log("\nSample Fees:");
        fees.slice(0, 5).forEach(f => console.log(` - ${f.date} | ${f.merchantName} | $${f.amount} | ${f.description}`));
    }
}

runQA();
