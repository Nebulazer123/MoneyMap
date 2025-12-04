// Test script to verify data is loaded
console.log('=== MoneyMap Data Verification ===');

// Check localStorage for persisted state
const dataStore = localStorage.getItem('moneymap-data-storage');
const uiStore = localStorage.getItem('moneymap-ui-storage');

console.log('Data Store:', dataStore ? 'Present' : 'Missing');
console.log('UI Store:', uiStore ? 'Present' : 'Missing');

if (dataStore) {
    try {
        const parsed = JSON.parse(dataStore);
        console.log('Transactions count:', parsed.state?.transactions?.length || 0);
        if (parsed.state?.transactions?.length > 0) {
            const firstTx = parsed.state.transactions[0];
            const lastTx = parsed.state.transactions[parsed.state.transactions.length - 1];
            console.log('First transaction date:', firstTx.date);
            console.log('Last transaction date:', lastTx.date);
        }
    } catch (e) {
        console.error('Error parsing data store:', e);
    }
}

if (uiStore) {
    try {
        const parsed = JSON.parse(uiStore);
        console.log('Date range from:', parsed.state?.dateRange?.from);
        console.log('Date range to:', parsed.state?.dateRange?.to);
    } catch (e) {
        console.error('Error parsing UI store:', e);
    }
}

console.log('\nTo reset and see data:');
console.log('1. Run: localStorage.clear()');
console.log('2. Reload the page');
