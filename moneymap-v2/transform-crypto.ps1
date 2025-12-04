# Transformation script to convert Stocks to Crypto
$filePath = "c:\Users\Corbin\Documents\MoneyMapProject\dev\moneymap\moneymap-v2\src\components\dashboard\Crypto.tsx"
$content = Get-Content $filePath -Raw

# Critical replacements for CoinGecko API
$content = $content -replace "DEFAULT_SYMBOLS = \[[\s\S]*?\];", @"
DEFAULT_CRYPTOS = [
    'bitcoin', 'ethereum', 'tether', 'binancecoin', 'solana', 
    'cardano', 'dogecoin', 'polkadot', 'shiba-inu', 'avalanche-2',
    'polygon', 'uniswap', 'litecoin', 'chainlink', 'near'
];
"@

$content = $content -replace "INITIAL_HOLDINGS:[\s\S]*?\];", @"
INITIAL_HOLDINGS: Omit<CryptoHolding, 'currentPrice'>[] = [
    { id: '1', cryptoId: 'bitcoin', name: 'Bitcoin', shares: 0.5, avgCost: 45000, addedAt: new Date('2024-06-15') },
    { id: '2', cryptoId: 'ethereum', name: 'Ethereum', shares: 5, avgCost: 2500, addedAt: new Date('2024-03-20') },
    { id: '3', cryptoId: 'solana', name: 'Solana', shares: 100, avgCost: 50, addedAt: new Date('2024-08-10') },
];
"@

$content = $content -replace "INITIAL_WATCHLIST:[\s\S]*?\];", @"
INITIAL_WATCHLIST: WatchlistItem[] = [
    { cryptoId: 'cardano', name: 'Cardano', addedAt: new Date() },
    { cryptoId: 'polkadot', name: 'Polkadot', addedAt: new Date() },
    { cryptoId: 'avalanche-2', name: 'Avalanche', addedAt: new Date() },
];
"@

# Update market status to 24/7
$content = $content -replace "function getMarketStatus\(\)[\s\S]*?return \{[\s\S]*?\};[\s]*?\}", @"
function getMarketStatus() {
    return {
        isOpen: true,
        statusMessage: 'Trading 24/7',
        nyTime: new Date().toLocaleTimeString(),
    };
}
"@

Set-Content $filePath $content
Write-Host "Crypto.tsx transformation complete!"
