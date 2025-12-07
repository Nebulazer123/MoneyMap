// Crypto metadata helpers for Yahoo Finance symbol format

export const CRYPTO_METADATA: Record<string, { displayName: string; symbol: string; type: string }> = {
    'BTC-USD': { displayName: 'Bitcoin', symbol: 'BTC', type: 'Layer 1 Coin' },
    'ETH-USD': { displayName: 'Ethereum', symbol: 'ETH', type: 'Layer 1 Coin' },
    'SOL-USD': { displayName: 'Solana', symbol: 'SOL', type: 'Layer 1 Coin' },
    'ADA-USD': { displayName: 'Cardano', symbol: 'ADA', type: 'Layer 1 Coin' },
    'XRP-USD': { displayName: 'Ripple', symbol: 'XRP', type: 'Coin' },
    'DOT-USD': { displayName: 'Polkadot', symbol: 'DOT', type: 'Layer 0 Coin' },
    'DOGE-USD': { displayName: 'Dogecoin', symbol: 'DOGE', type: 'Meme Coin' },
    'AVAX-USD': { displayName: 'Avalanche', symbol: 'AVAX', type: 'Layer 1 Coin' },
    'LINK-USD': { displayName: 'Chainlink', symbol: 'LINK', type: 'Token' },
    'MATIC-USD': { displayName: 'Polygon', symbol: 'MATIC', type: 'Layer 2 Token' },
    'BNB-USD': { displayName: 'Binance Coin', symbol: 'BNB', type: 'Exchange Coin' },
    'UNI-USD': { displayName: 'Uniswap', symbol: 'UNI', type: 'DeFi Token' },
    'LTC-USD': { displayName: 'Litecoin', symbol: 'LTC', type: 'Coin' },
    'XLM-USD': { displayName: 'Stellar', symbol: 'XLM', type: 'Coin' },
    'ATOM-USD': { displayName: 'Cosmos', symbol: 'ATOM', type: 'Layer 0 Coin' },
};

// Default symbols for initial load (Yahoo Finance format)
export const DEFAULT_CRYPTOS = [
    'BTC-USD', 'ETH-USD', 'SOL-USD', 'ADA-USD', 'XRP-USD', 'DOT-USD',
    'DOGE-USD', 'AVAX-USD', 'LINK-USD', 'MATIC-USD', 'BNB-USD',
    'UNI-USD', 'LTC-USD', 'XLM-USD', 'ATOM-USD'
];

// Initial holdings (demo data with Yahoo symbols)
export const INITIAL_HOLDINGS = [
    { id: '1', cryptoId: 'BTC-USD', name: 'Bitcoin', shares: 0.5, avgCost: 45000, addedAt: new Date('2024-06-15') },
    { id: '2', cryptoId: 'ETH-USD', name: 'Ethereum', shares: 5, avgCost: 2500, addedAt: new Date('2024-03-20') },
    { id: '3', cryptoId: 'SOL-USD', name: 'Solana', shares: 100, avgCost: 50, addedAt: new Date('2024-08-10') },
];

// Initial watchlist (demo data with Yahoo symbols)
export const INITIAL_WATCHLIST = [
    { id: '1', cryptoId: 'ADA-USD', name: 'Cardano', addedAt: new Date() },
    { id: '2', cryptoId: 'DOT-USD', name: 'Polkadot', addedAt: new Date() },
    { id: '3', cryptoId: 'AVAX-USD', name: 'Avalanche', addedAt: new Date() },
];

// Helper to get crypto display info
export function getCryptoInfo(cryptoId: string) {
    return CRYPTO_METADATA[cryptoId] || {
        displayName: cryptoId.replace('-USD', ''),
        symbol: cryptoId.replace('-USD', ''),
        type: 'Crypto'
    };
}

// Auto-refresh interval in milliseconds (5 minutes)
export const REFRESH_INTERVAL_MS = 300000;
