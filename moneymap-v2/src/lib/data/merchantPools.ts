// Merchant Pools for Lifestyle Profile Generation
// CANONICAL SOURCE: docs/lifestyle_merchant_pools_v1.md
// Keep this file in sync with the doc. Do NOT add merchants here without updating the doc first.

// ============================================================================
// 1. Subscriptions & Digital Services
// ============================================================================

// §1.1 Streaming (TV/Video) — pool size: 15
export const STREAMING_VIDEO = [
    "Netflix",
    "Amazon Prime Video",
    "Disney+",
    "Hulu",
    "Max",
    "Peacock",
    "Paramount+",
    "Apple TV+",
    "YouTube TV",
    "YouTube Premium",
    "Sling TV",
    "Crunchyroll",
    "Philo",
    "Starz",
    "ESPN+",
];

// §1.2 Music — pool size: 8
export const MUSIC_SUBSCRIPTIONS = [
    "Spotify",
    "Apple Music",
    "YouTube Music",
    "Amazon Music",
    "Pandora",
    "SoundCloud Go+",
    "Tidal",
    "iHeartRadio Plus",
];

// §1.3 Cloud Storage — pool size: 8
export const CLOUD_STORAGE = [
    "iCloud+",
    "Google Drive",
    "Dropbox",
    "Microsoft OneDrive",
    "Box",
    "Mega",
    "pCloud",
    "Amazon Photos",
];

// §1.4 Gyms — pool size: 15
export const GYM_MERCHANTS = [
    "Planet Fitness",
    "LA Fitness",
    "24 Hour Fitness",
    "Anytime Fitness",
    "Gold's Gym",
    "Crunch Fitness",
    "YMCA",
    "Equinox",
    "Life Time Fitness",
    "Orangetheory Fitness",
    "F45 Training",
    "Snap Fitness",
    "Retro Fitness",
    "Blink Fitness",
    "UFC Gym",
];

// §1.5 Software / Other Subscriptions — pool size: 20
export const SOFTWARE_SUBSCRIPTIONS = [
    "Microsoft 365",
    "Adobe Creative Cloud",
    "Google Workspace",
    "Zoom Pro",
    "Slack Pro",
    "Notion Plus",
    "Evernote Premium",
    "1Password",
    "LastPass Premium",
    "Duolingo Super",
    "Grammarly Premium",
    "Headspace",
    "Calm",
    "WeightWatchers Digital",
    "Noom",
    "New York Times Digital",
    "Wall Street Journal Digital",
    "GitHub Copilot",
    "ChatGPT Plus",
    "HelloFresh",
];

// ============================================================================
// 2. Financial Institutions & Accounts
// ============================================================================

// §2.1 Banks — pool size: 20
export const BANK_MERCHANTS = [
    "JPMorgan Chase Bank",
    "Bank of America",
    "Wells Fargo Bank",
    "Citibank",
    "U.S. Bank",
    "PNC Bank",
    "Truist Bank",
    "Capital One Bank",
    "TD Bank",
    "Citizens Bank",
    "Fifth Third Bank",
    "KeyBank",
    "Ally Bank",
    "Navy Federal Credit Union",
    "Discover Bank",
    "Charles Schwab Bank",
    "Goldman Sachs Bank USA",
    "Huntington Bank",
    "Regions Bank",
    "BMO Harris Bank",
];

// §2.2 Credit Card Issuers / Card Products — pool size: 20
export const CREDIT_CARD_ISSUERS = [
    "Chase Freedom Flex",
    "Chase Sapphire Preferred",
    "Chase Sapphire Reserve",
    "Bank of America Customized Cash Rewards",
    "Wells Fargo Active Cash",
    "Citi Double Cash",
    "Citi Premier Card",
    "Capital One Venture Rewards",
    "Capital One Quicksilver",
    "American Express Gold Card",
    "American Express Blue Cash Preferred",
    "American Express Platinum Card",
    "Discover it Cash Back",
    "Discover it Chrome",
    "Barclays Uber Visa",
    "Synchrony Amazon Store Card",
    "Target REDcard Credit",
    "Walmart Rewards Card",
    "Lowe's Advantage Card",
    "Costco Anywhere Visa Card",
];

// §2.3 Bank-Like / P2P Payment Services — flexible pool (Zelle excluded per doc)
export const P2P_SERVICES = [
    "PayPal",
    "Cash App",
    "Venmo",
    "Apple Cash",
    "Google Pay",
    "Wise",
    "Western Union",
    "MoneyGram",
    "Remitly",
    "Chime",
];

// §2.4 Investment Companies / Brokerages — pool size: 6
export const INVESTMENT_BROKERAGES = [
    "Vanguard",
    "Fidelity Investments",
    "Charles Schwab",
    "Robinhood",
    "E*TRADE",
    "Merrill Edge",
];

// ============================================================================
// 3. Loans, Rent, and Insurance
// ============================================================================

// §3.1 Loan Servicers — pool size: 20
export const LOAN_SERVICERS = [
    "Ally Financial",
    "Capital One Auto Finance",
    "Wells Fargo Auto",
    "Chase Auto Finance",
    "Santander Consumer USA",
    "Toyota Financial Services",
    "Honda Financial Services",
    "Ford Motor Credit",
    "GM Financial",
    "Navient",
    "Nelnet",
    "SoFi",
    "Discover Personal Loans",
    "Marcus by Goldman Sachs",
    "Upstart",
    "LendingClub",
    "Rocket Mortgage",
    "Freedom Mortgage",
    "Navy Federal Credit Union Loans",
    "OneMain Financial",
];

// §3.2 Rent / Mortgage Providers — pool size: 15
export const RENT_MORTGAGE_PROVIDERS = [
    "Greystar Residential",
    "Camden Property Trust",
    "AvalonBay Communities",
    "Equity Residential",
    "Lincoln Property Company",
    "Invitation Homes",
    "Progress Residential",
    "Mid-America Apartment Communities",
    "Essex Property Trust",
    "Rocket Mortgage",
    "Wells Fargo Home Mortgage",
    "Chase Home Lending",
    "Bank of America Home Loans",
    "Local Property Management Co.",
    "Main Street Apartments",
];

// §3.3 Utilities — pool size: 25
export const UTILITY_PROVIDERS = [
    "Duke Energy",
    "Pacific Gas & Electric",
    "Southern Company",
    "Florida Power & Light",
    "Dominion Energy",
    "Con Edison",
    "National Grid",
    "Xcel Energy",
    "CenterPoint Energy",
    "Entergy",
    "FirstEnergy",
    "PPL Electric Utilities",
    "NV Energy",
    "Georgia Power",
    "Consumers Energy",
    "Reliant Energy",
    "City Utilities",
    "City Water & Sewer",
    "City Gas",
    "County Electric Cooperative",
    "Municipal Electric Authority",
    "Spectrum Utilities",
    "Utility Billing Services",
    "Regional Water Authority",
    "Regional Gas & Electric",
];

// §3.4 Phone Subscriptions — pool size: 10
export const MOBILE_CARRIERS = [
    "Verizon Wireless",
    "AT&T Wireless",
    "T-Mobile",
    "Google Fi",
    "Xfinity Mobile",
    "Spectrum Mobile",
    "Cricket Wireless",
    "Boost Mobile",
    "Metro by T-Mobile",
    "Mint Mobile",
];

// §3.5 Car Insurance — pool size: 10
export const CAR_INSURANCE = [
    "State Farm",
    "GEICO",
    "Progressive",
    "Allstate",
    "USAA",
    "Farmers Insurance",
    "Nationwide",
    "Liberty Mutual",
    "Travelers Insurance",
    "AAA Insurance",
];

// §3.6 Life Insurance — pool size: 5
export const LIFE_INSURANCE = [
    "New York Life",
    "Northwestern Mutual",
    "Prudential",
    "MetLife",
    "Lincoln Financial Group",
];

// §3.7 Home Insurance — pool size: 5
export const HOME_INSURANCE = [
    "State Farm",
    "Allstate",
    "Liberty Mutual",
    "Farmers Insurance",
    "USAA",
];

// §3.8 Health Insurance — pool size: 5
export const HEALTH_INSURANCE = [
    "UnitedHealthcare",
    "Anthem Blue Cross Blue Shield",
    "Cigna",
    "Aetna",
    "Kaiser Permanente",
];

// ============================================================================
// 4. Everyday Spending & Commerce
// ============================================================================

// §4.1 Rideshare / Transport — pool size: 7
export const RIDESHARE_TRANSPORT = [
    "Uber",
    "Lyft",
    "Lime Scooters",
    "Bird Scooters",
    "Zipcar",
    "Turo",
    "Enterprise Rent-A-Car",
];

// §4.2 Food Delivery — pool size: 15
export const FOOD_DELIVERY = [
    "DoorDash",
    "Uber Eats",
    "Grubhub",
    "Postmates",
    "Instacart",
    "Shipt",
    "Seamless",
    "Caviar",
    "Pizza Hut Delivery",
    "Domino's Delivery",
    "Papa Johns Delivery",
    "Chick-fil-A Delivery",
    "Panera Bread Delivery",
    "Gopuff",
    "Amazon Fresh",
];

// §4.3 Gas / Convenience Stores — pool size: 25
export const GAS_STATIONS = [
    "Shell",
    "Chevron",
    "BP",
    "Exxon",
    "Mobil",
    "Texaco",
    "Valero",
    "Speedway",
    "Circle K",
    "7-Eleven",
    "Wawa",
    "QuikTrip",
    "Casey's General Store",
    "Buc-ee's",
    "Sunoco",
    "Marathon",
    "Phillips 66",
    "Citgo",
    "Cumberland Farms",
    "RaceTrac",
    "Raceway",
    "Sheetz",
    "Kwik Trip",
    "Love's Travel Stops",
    "Pilot Flying J",
];

// §4.4 Grocery Stores — pool size: 30
export const GROCERY_STORES = [
    "Walmart",
    "Kroger",
    "Costco",
    "Sam's Club",
    "Target",
    "Aldi",
    "Publix",
    "Whole Foods Market",
    "Trader Joe's",
    "Safeway",
    "Albertsons",
    "H-E-B",
    "Meijer",
    "WinCo Foods",
    "Food Lion",
    "Giant Food",
    "Giant Eagle",
    "Wegmans",
    "Hy-Vee",
    "Harris Teeter",
    "Fred Meyer",
    "Sprouts Farmers Market",
    "BJ's Wholesale Club",
    "Ralphs",
    "Smith's Food & Drug",
    "Vons",
    "Piggly Wiggly",
    "Ingles Markets",
    "King Soopers",
    "Fry's Food Stores",
];

// §4.5 Restaurants (Dine-In) — pool size: 25
export const RESTAURANTS_DINING = [
    "Olive Garden",
    "Chili's Grill & Bar",
    "Applebee's",
    "Texas Roadhouse",
    "Outback Steakhouse",
    "LongHorn Steakhouse",
    "Red Lobster",
    "Cracker Barrel",
    "IHOP",
    "Denny's",
    "The Cheesecake Factory",
    "Buffalo Wild Wings",
    "Red Robin",
    "TGI Fridays",
    "P.F. Chang's",
    "Carrabba's Italian Grill",
    "Bonefish Grill",
    "Logan's Roadhouse",
    "Waffle House",
    "Perkins Restaurant & Bakery",
    "Ruby Tuesday",
    "BJ's Restaurant & Brewhouse",
    "Golden Corral",
    "O'Charley's",
    "Hooters",
];

// §4.6 Fast Food — pool size: 30
export const FAST_FOOD_RESTAURANTS = [
    "McDonald's",
    "Burger King",
    "Wendy's",
    "Taco Bell",
    "KFC",
    "Popeyes",
    "Chick-fil-A",
    "Subway",
    "Domino's Pizza",
    "Pizza Hut",
    "Little Caesars",
    "Papa Johns",
    "Sonic Drive-In",
    "Jack in the Box",
    "Dairy Queen",
    "Whataburger",
    "Culver's",
    "Raising Cane's",
    "Chipotle Mexican Grill",
    "Panera Bread",
    "Five Guys",
    "Jimmy John's",
    "Jersey Mike's Subs",
    "Checkers / Rally's",
    "Hardee's",
    "Carl's Jr.",
    "Del Taco",
    "Wingstop",
    "Zaxby's",
    "In-N-Out Burger",
];

// §4.7 Other Food / Drink (Coffee, cafés) — pool size: 15
export const COFFEE_SHOPS = [
    "Starbucks",
    "Dunkin'",
    "Tim Hortons",
    "Peet's Coffee",
    "Caribou Coffee",
    "Dutch Bros Coffee",
    "The Human Bean",
    "Biggby Coffee",
    "Scooter's Coffee",
    "Blue Bottle Coffee",
    "Philz Coffee",
    "Joe & The Juice",
    "Krispy Kreme",
    "Local Cafe #1",
    "Local Cafe #2",
];

// §4.8 Shopping Stores (Non-Food, In-Person) — pool size: 25
export const RETAIL_SHOPS = [
    "Walmart",
    "Target",
    "Best Buy",
    "Home Depot",
    "Lowe's",
    "Menards",
    "IKEA",
    "Bed Bath & Beyond",
    "Kohl's",
    "Macy's",
    "JCPenney",
    "Nordstrom",
    "TJ Maxx",
    "Marshalls",
    "Ross Dress for Less",
    "Burlington",
    "Academy Sports + Outdoors",
    "Dick's Sporting Goods",
    "REI",
    "Michaels",
    "Hobby Lobby",
    "Staples",
    "Office Depot / OfficeMax",
    "PetSmart",
    "Petco",
];

// §4.9 Online Shopping — pool size: 20
export const ONLINE_SHOPPING = [
    "Amazon",
    "Walmart.com",
    "Target.com",
    "eBay",
    "Etsy",
    "AliExpress",
    "Temu",
    "Shein",
    "StockX",
    "GOAT",
    "Wayfair",
    "Chewy",
    "Wish",
    "Zappos",
    "Shopify Store",
    "TikTok Shop",
    "Fashion Nova",
    "ASOS",
    "Newegg",
    "B&H Photo Video",
];

// §4.10 Unknown / Random / Other — pool size: 5
export const UNKNOWN_MERCHANTS = [
    "Corner Street Vendor",
    "Local Gift Shop",
    "Downtown Market Stall",
    "Neighborhood Flea Market",
    "Pop-Up Shop",
];

// ============================================================================
// 5. Assets (Portfolio Holdings)
// ============================================================================

// §5.1 Crypto Assets — pool size: 8
export const CRYPTO_ASSETS = [
    "Bitcoin (BTC)",
    "Ethereum (ETH)",
    "Solana (SOL)",
    "Ripple (XRP)",
    "Binance Coin (BNB)",
    "Cardano (ADA)",
    "Dogecoin (DOGE)",
    "USD Coin (USDC)",
];

// §5.2 Stocks / ETFs — pool size: 50
export const STOCKS_ETFS = [
    "AAPL", "MSFT", "NVDA", "AMZN", "META", "GOOGL", "BRK.B", "TSLA", "AVGO", "JPM",
    "V", "JNJ", "UNH", "PG", "XOM", "LLY", "HD", "BAC", "COST", "WMT",
    "CRM", "ADBE", "NFLX", "PEP", "KO", "CSCO", "INTC", "AMD", "ORCL", "ABNB",
    "SPY", "QQQ", "IWM", "VTI", "VOO", "SMH", "XLK", "XLE", "XLF", "ARKK",
    "NKE", "MCD", "DIS", "T", "VZ", "PYPL", "SQ", "SHOP", "MRNA", "PFE",
];

// ============================================================================
// 6. Fees & ATM (Added Phase 3)
// ============================================================================

export const ATM_MERCHANTS = [
    "Chase ATM",
    "Bank of America ATM",
    "Wells Fargo ATM",
    "Citibank ATM",
    "Allpoint ATM",
    "PNC Bank ATM",
    "U.S. Bank ATM",
    "Cardtronics ATM",
    "LibertyX Bitcoin ATM",
    "ATM Network",
];

export const BANK_FEE_TYPES = [
    "Monthly Service Fee",
    "Overdraft Fee",
    "Wire Transfer Fee",
    "Paper Statement Fee",
    "Late Payment Fee",
    "Returned Item Fee",
    "Card Replacement Fee",
    "Express Delivery Fee",
    "Stop Payment Fee",
    "Insufficient Funds Fee",
    "Foreign Transaction Fee",
    "Account Maintenance Fee",
];

// ============================================================================
// Legacy Aliases (for backward compatibility)
// ============================================================================

export const WALLET_MERCHANTS = P2P_SERVICES;
export const RENT_PAYEES = RENT_MORTGAGE_PROVIDERS;
export const AUTO_INSURERS = CAR_INSURANCE;
export const HEALTH_INSURERS = HEALTH_INSURANCE;
export const CASUAL_DINING = RESTAURANTS_DINING;
export const CLOUD_AND_SOFTWARE = [...CLOUD_STORAGE, ...SOFTWARE_SUBSCRIPTIONS.slice(0, 6)];
export const RIDESHARE_AND_DELIVERY = [...RIDESHARE_TRANSPORT, ...FOOD_DELIVERY.slice(0, 4)];
export const INTERNET_PROVIDERS = MOBILE_CARRIERS.slice(0, 6);
export const CAR_LENDERS = LOAN_SERVICERS.slice(0, 5);
export const STUDENT_LOAN_SERVICERS = LOAN_SERVICERS.filter(l =>
    l.includes("Navient") || l.includes("Nelnet") || l.includes("SoFi")
);
export const PHARMACY_MERCHANTS = [
    "CVS Pharmacy",
    "Walgreens",
    "Walmart Pharmacy",
    "Costco Pharmacy",
];

// ============================================================================
// Master Export Object
// ============================================================================

export const MERCHANT_POOLS = {
    // Subscriptions & Digital
    streaming: STREAMING_VIDEO,
    music: MUSIC_SUBSCRIPTIONS,
    cloudStorage: CLOUD_STORAGE,
    software: SOFTWARE_SUBSCRIPTIONS,
    gym: GYM_MERCHANTS,

    // Financial
    bank: BANK_MERCHANTS,
    creditCard: CREDIT_CARD_ISSUERS,
    p2p: P2P_SERVICES,
    investment: INVESTMENT_BROKERAGES,
    loans: LOAN_SERVICERS,

    // Housing & Bills
    housing: RENT_MORTGAGE_PROVIDERS,
    utility: UTILITY_PROVIDERS,
    mobile: MOBILE_CARRIERS,

    // Insurance
    autoInsurance: CAR_INSURANCE,
    lifeInsurance: LIFE_INSURANCE,
    homeInsurance: HOME_INSURANCE,
    healthInsurance: HEALTH_INSURANCE,

    // Daily Spending
    rideshare: RIDESHARE_TRANSPORT,
    foodDelivery: FOOD_DELIVERY,
    gas: GAS_STATIONS,
    grocery: GROCERY_STORES,
    restaurant: RESTAURANTS_DINING,
    fastFood: FAST_FOOD_RESTAURANTS,
    coffee: COFFEE_SHOPS,

    // Shopping
    retail: RETAIL_SHOPS,
    onlineShopping: ONLINE_SHOPPING,
    unknown: UNKNOWN_MERCHANTS,

    // Assets
    crypto: CRYPTO_ASSETS,
    stocks: STOCKS_ETFS,

    // Fees & ATM
    atm: ATM_MERCHANTS,
    bankFees: BANK_FEE_TYPES,

    // Legacy aliases (for backward compatibility)
    wallet: P2P_SERVICES,
    rent: RENT_MORTGAGE_PROVIDERS,
    cloud: CLOUD_STORAGE,
    casualDining: RESTAURANTS_DINING,
    pharmacy: PHARMACY_MERCHANTS,
    internet: MOBILE_CARRIERS.slice(0, 6),
    autoInsurers: CAR_INSURANCE,
    healthInsurers: HEALTH_INSURANCE,
    carLender: LOAN_SERVICERS.slice(0, 5),
    studentLoan: LOAN_SERVICERS.filter(l =>
        l.includes("Navient") || l.includes("Nelnet") || l.includes("SoFi")
    ),
};
