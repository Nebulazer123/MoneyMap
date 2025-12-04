export type TransactionKind =
  | "income"
  | "expense"
  | "subscription"
  | "fee"
  | "transferInternal"
  | "transferExternal"
  | "refund";

export type AccountKey = "navy_checking" | "cash_app" | "visa_debit" | string;

export type BaseAccountId = "checking" | "savings";

export type BaseAccount = {
  id: BaseAccountId;
  label: string;
  fullAccountNumber: string;
  last4: string;
};

export type Transaction = {
  id: string;
  date: string; // ISO string
  description: string;
  amount: number; // positive for inflow, negative for outflow
  category: string;
  kind: TransactionKind;
  source: string;
  target?: string;
  sourceKey?: AccountKey;
  targetKey?: AccountKey;
  sourceAccountId?: BaseAccountId;
};

export type OwnershipMap = Record<AccountKey, boolean>;

export type BudgetGuidanceItem = {
  category: string;
  name: string;
  actual: number;
  actualAmount: number;
  recommendedMax: number;
  recommendedAmount: number;
  delta: number;
  differenceAmount: number;
  differenceDirection: "over" | "under";
};

// Centralized category and detection rules
import {
  isSubscriptionCategory,
  isBillLikeCategory,
  isBillishDescription,
  matchesKnownMerchant,
  budgetGuidelineRatios as rulesBudgetGuidelineRatios,
} from "./categoryRules";

const BANK_MERCHANTS = [
  "Navy Federal Credit Union",
  "Chase Bank",
  "Bank of America",
  "Wells Fargo",
  "Capital One Bank",
  "PNC Bank",
  "US Bank",
  "Citi Bank",
  "Truist Bank",
  "Regions Bank",
  "TD Bank",
];

const WALLET_MERCHANTS = ["Cash App", "Venmo", "PayPal", "Apple Cash", "Google Pay", "Zelle"];

const CREDIT_CARD_LABELS = [
  "Chase Freedom",
  "Chase Sapphire",
  "Capital One Venture",
  "Capital One Quicksilver",
  "Citi Double Cash",
  "Discover It",
  "American Express Blue Cash",
  "American Express Gold",
];

// Generate random account numbers once per run for checking and savings accounts
const generateAccountNumber = (): string => {
  return Math.floor(100000000000 + Math.random() * 900000000000).toString();
};

let baseAccountsCache: BaseAccount[] | null = null;

export const getBaseAccounts = (): BaseAccount[] => {
  if (!baseAccountsCache) {
    const checkingNumber = generateAccountNumber();
    const savingsNumber = generateAccountNumber();
    baseAccountsCache = [
      {
        id: "checking",
        label: "Checking",
        fullAccountNumber: checkingNumber,
        last4: checkingNumber.slice(-4),
      },
      {
        id: "savings",
        label: "Savings",
        fullAccountNumber: savingsNumber,
        last4: savingsNumber.slice(-4),
      },
    ];
  }
  return baseAccountsCache;
};

export const getBaseAccount = (id: BaseAccountId): BaseAccount => {
  const accounts = getBaseAccounts();
  return accounts.find((acc) => acc.id === id)!;
};

export const formatBaseAccountLabel = (accountId: BaseAccountId, includeFullNumber = false): string => {
  const account = getBaseAccount(accountId);
  if (includeFullNumber) {
    return `${account.label} ****${account.last4}`;
  }
  return `${account.label} -${account.last4}`;
};

// Helper to determine if a transaction should use ACH or Visa based on category/description
const isAchTransaction = (category: string, description: string): boolean => {
  const achCategories = ["Utilities", "Insurance", "Bills & services", "Rent", "Auto", "Education", "Loans"];
  const achKeywords = ["insurance", "utility", "utilities", "internet", "mobile", "phone", "loan", "mortgage", "rent"];
  
  if (achCategories.includes(category)) return true;
  
  const lowerDesc = description.toLowerCase();
  return achKeywords.some(keyword => lowerDesc.includes(keyword));
};

// Generate realistic single-sided transfer descriptions
const generateTransferDescription = (
  accountId: BaseAccountId,
  direction: "to" | "from",
  counterpartyLabel: string,
  counterpartyLast4: string,
): string => {
  if (direction === "to") {
    return `Transfer to ${counterpartyLabel} ${counterpartyLast4}`;
  }
  return `Transfer from ${counterpartyLabel} ${counterpartyLast4}`;
};

// Generate internal transfer between checking and savings
const generateInternalTransferDescription = (
  fromAccountId: BaseAccountId,
  toAccountId: BaseAccountId,
): string => {
  const toAccount = getBaseAccount(toAccountId);
  return `Transfer to ${toAccount.label} ${toAccount.last4}`;
};

const RENT_PAYEES = [
  "Greystone Apartments",
  "Maple Grove Apartments",
  "Lakeside Apartments",
  "Oak Ridge Apartments",
  "Sunrise Property Management",
  "Summit Property Management",
  "Wells Fargo Home Mortgage",
  "Chase Home Lending",
  "Rocket Mortgage",
  "Veterans United Home Loans",
];

const INTERNET_PROVIDERS = [
  "Xfinity Internet",
  "Spectrum Internet",
  "Cox Communications",
  "AT&T Internet",
  "Verizon Fios",
  "Frontier Internet",
];

const MOBILE_CARRIERS = [
  "Verizon Wireless",
  "AT&T Wireless",
  "T Mobile",
  "Cricket Wireless",
  "Metro by T Mobile",
  "Boost Mobile",
];

const AUTO_INSURERS = [
  "Geico Auto Insurance",
  "Progressive Auto Insurance",
  "State Farm Insurance",
  "Allstate Insurance",
  "USAA Insurance",
  "Farmers Insurance",
];

const HEALTH_INSURERS = ["Blue Cross Health Insurance", "United Health Insurance", "Cigna Health Insurance"];

const STUDENT_LOAN_SERVICERS = [
  "Nelnet Student Loans",
  "Navient Student Loans",
  "FedLoan Servicing",
  "Great Lakes Student Loans",
  "Department of Education Loans",
  "Community College Tuition Office",
  "State University Bursar",
  "City College Financial Services",
];

const GYM_MERCHANTS = ["Planet Fitness", "Golds Gym", "LA Fitness", "Anytime Fitness", "Crunch Fitness", "YMCA"];

const STREAMING_VIDEO = [
  "Netflix",
  "Hulu",
  "Disney Plus",
  "Max",
  "Amazon Prime Video",
  "Amazon Prime",
  "Apple TV Plus",
  "Peacock",
  "Paramount Plus",
];

const MUSIC_SUBSCRIPTIONS = ["Spotify", "Apple Music", "YouTube Music", "Amazon Music", "Pandora", "Tidal"];

const CLOUD_AND_SOFTWARE = [
  "Adobe Creative Cloud",
  "Microsoft 365",
  "Dropbox",
  "Google Drive Storage",
  "iCloud Storage",
  "Evernote Premium",
];

const GROCERY_STORES = [
  "Walmart Supercenter",
  "Target",
  "Costco Wholesale",
  "Sams Club",
  "Kroger",
  "Publix",
  "Aldi",
  "Trader Joes",
  "Whole Foods Market",
  "Safeway",
];

const FAST_FOOD_RESTAURANTS = [
  "McDonalds",
  "Burger King",
  "Wendys",
  "Taco Bell",
  "Chick fil A",
  "Subway",
  "KFC",
  "Popeyes",
  "Chipotle",
  "Panda Express",
];

const COFFEE_SHOPS = [
  "Starbucks",
  "Dunkin",
  "Tim Hortons",
  "Dutch Bros Coffee",
  "Peets Coffee",
  "Blue Bottle Coffee",
];

const CASUAL_DINING = [
  "Olive Garden",
  "Chilis Grill and Bar",
  "Applebees",
  "Texas Roadhouse",
  "Buffalo Wild Wings",
  "Red Lobster",
  "Outback Steakhouse",
  "Red Robin",
  "Pizza Hut",
  "Local Diner",
];

const GAS_STATIONS = [
  "Shell",
  "Chevron",
  "BP",
  "Exxon",
  "Mobil",
  "Marathon",
  "Sunoco",
  "7 Eleven Fuel",
  "Circle K",
  "Costco Gas",
];

const RIDESHARE_AND_DELIVERY = [
  "Uber Rides",
  "Lyft Rides",
  "Uber",
  "Lyft",
  "Metro Transit",
  "Uber Eats",
  "DoorDash",
  "Grubhub",
  "Instacart",
];

const RETAIL_SHOPS = [
  "Amazon Marketplace",
  "Walmart",
  "Target",
  "Best Buy",
  "Home Depot",
  "Lowes",
  "IKEA",
  "TJ Maxx",
  "Marshalls",
  "Ross Dress for Less",
];

const PHARMACY_MERCHANTS = ["CVS Pharmacy", "Walgreens", "Walmart Pharmacy", "Costco Pharmacy"];

const UTILITY_PROVIDERS = [
  "City Utilities",
  "Metro Energy",
  "Water & Power Co.",
  "Regional Electric",
  "Green Energy Services",
  "PG&E",
  "ComEd",
  "Water Company",
];

const CAR_LENDERS = ["Ally Auto", "Capital One Auto", "Honda Finance", "Chase Auto", "Toyota Financial"];

export const categoryEmojis: Record<string, string> = {
  Rent: "🏠",
  Groceries: "🛒",
  Dining: "🍽",
  Transport: "🚌",
  Subscriptions: "📺",
  Utilities: "💡",
  "Bills & services": "🧾",
  Fees: "💸",
  Other: "🧾",
};

export const transactions: Transaction[] = [
  {
    id: "t1",
    date: "2025-11-01",
    description: "Paycheck - Direct Deposit",
    amount: 5200,
    category: "Income",
    kind: "income",
    source: "Employer Payroll",
    target: "Primary checking",
  },
  {
    id: "t2",
    date: "2025-11-02",
    description: "Rent or mortgage",
    amount: -1850,
    category: "Rent",
    kind: "expense",
    source: "Primary checking",
    target: "Landlord ACH",
  },
  {
    id: "t3",
    date: "2025-11-03",
    description: "Groceries - Fresh Market",
    amount: -86.45,
    category: "Groceries",
    kind: "expense",
    source: "Credit card",
    target: "Fresh Market",
  },
  {
    id: "t4",
    date: "2025-11-04",
    description: "Coffee & Breakfast",
    amount: -14.75,
    category: "Dining",
    kind: "expense",
    source: "Credit card",
    target: "Cafe",
  },
  {
    id: "t5",
    date: "2025-11-04",
    description: "Streaming Bundle",
    amount: -21.99,
    category: "Subscriptions",
    kind: "subscription",
    source: "Credit card",
    target: "Streaming Service",
  },
  {
    id: "t6",
    date: "2025-11-05",
    description: "Mobile Plan",
    amount: -78,
    category: "Subscriptions",
    kind: "subscription",
    source: "Credit card",
    target: "Wireless Carrier",
  },
  {
    id: "t7",
    date: "2025-11-05",
    description: "Bank Maintenance Fee",
    amount: -12,
    category: "Fees",
    kind: "fee",
    source: "Navy Federal checking",
    target: "Bank Fee",
  },
  {
    id: "t8",
    date: "2025-11-06",
    description: "Groceries - Corner Mart",
    amount: -45.12,
    category: "Groceries",
    kind: "expense",
    source: "Credit card",
    target: "Corner Mart",
  },
  {
    id: "t9",
    date: "2025-11-07",
    description: "Dinner with friends",
    amount: -64.5,
    category: "Dining",
    kind: "expense",
    source: "Credit card",
    target: "Restaurant",
  },
  {
    id: "t10",
    date: "2025-11-08",
    description: "Gym Membership",
    amount: -55,
    category: "Subscriptions",
    kind: "subscription",
    source: "Credit card",
    target: "Local Gym",
  },
  {
    id: "t11",
    date: "2025-11-08",
    description: "ATM Network Fee",
    amount: -3.5,
    category: "Fees",
    kind: "fee",
    source: "Navy Federal checking",
    target: "ATM Operator",
  },
  {
    id: "t12",
    date: "2025-11-09",
    description: "Groceries - Weekend stock-up",
    amount: -126.33,
    category: "Groceries",
    kind: "expense",
    source: "Credit card",
    target: "Grocery Store",
  },
  {
    id: "t13",
    date: "2025-11-10",
    description: "Ride-share",
    amount: -18.6,
    category: "Transport",
    kind: "expense",
    source: "Credit card",
    target: "Ride-share",
  },
  {
    id: "t14",
    date: "2025-11-11",
    description: "Lunch - Sandwich shop",
    amount: -13.25,
    category: "Dining",
    kind: "expense",
    source: "Credit card",
    target: "Sandwich Shop",
  },
  {
    id: "t15",
    date: "2025-11-12",
    description: "Cloud storage",
    amount: -9.99,
    category: "Subscriptions",
    kind: "subscription",
    source: "Credit card",
    target: "Cloud Storage",
  },
  {
    id: "t16",
    date: "2025-11-13",
    description: "Groceries - Bulk store",
    amount: -94.8,
    category: "Groceries",
    kind: "expense",
    source: "Credit card",
    target: "Bulk Store",
  },
  {
    id: "t17",
    date: "2025-11-14",
    description: "Dinner - Takeout",
    amount: -32.4,
    category: "Dining",
    kind: "expense",
    source: "Credit card",
    target: "Takeout",
  },
  {
    id: "t18",
    date: "2025-11-15",
    description: "Electric and water",
    amount: -92.75,
    category: "Utilities",
    kind: "expense",
    source: "Primary checking",
    target: "City Utilities",
  },
  {
    id: "t19",
    date: "2025-11-16",
    description: "Groceries - Produce stand",
    amount: -38.9,
    category: "Groceries",
    kind: "expense",
    source: "Credit card",
    target: "Produce Stand",
  },
  {
    id: "t20",
    date: "2025-11-17",
    description: "Music subscription",
    amount: -10.99,
    category: "Subscriptions",
    kind: "subscription",
    source: "Credit card",
    target: "Music Service",
  },
  {
    id: "t21",
    date: "2025-11-18",
    description: "ATM Network Fee",
    amount: -3.5,
    category: "Fees",
    kind: "fee",
    source: "Navy Federal checking",
    target: "ATM Operator",
  },
  {
    id: "t22",
    date: "2025-11-19",
    description: "Groceries - Weeknight shop",
    amount: -57.21,
    category: "Groceries",
    kind: "expense",
    source: "Credit card",
    target: "Grocery Store",
  },
  {
    id: "t23",
    date: "2025-11-20",
    description: "Lunch - Food truck",
    amount: -11.8,
    category: "Dining",
    kind: "expense",
    source: "Credit card",
    target: "Food Truck",
  },
  {
    id: "t24",
    date: "2025-11-21",
    description: "Internet Service",
    amount: -72,
    category: "Subscriptions",
    kind: "subscription",
    source: "Primary checking",
    target: "ISP",
  },
  {
    id: "t25",
    date: "2025-11-22",
    description: "Weekend brunch",
    amount: -42.3,
    category: "Dining",
    kind: "expense",
    source: "Credit card",
    target: "Cafe",
  },
  {
    id: "t26",
    date: "2025-11-23",
    description: "Groceries - Essentials",
    amount: -61.77,
    category: "Groceries",
    kind: "expense",
    source: "Credit card",
    target: "Grocery Store",
  },
  {
    id: "t27",
    date: "2025-11-24",
    description: "Late fee - Card payment",
    amount: -25,
    category: "Fees",
    kind: "fee",
    source: "Credit card",
    target: "Issuer Fee",
  },
  {
    id: "t28",
    date: "2025-11-25",
    description: "Coworking day pass",
    amount: -28,
    category: "Other",
    kind: "expense",
    source: "Credit card",
    target: "Coworking Space",
  },
  {
    id: "t29",
    date: "2025-11-26",
    description: "Groceries - Quick grab",
    amount: -24.65,
    category: "Groceries",
    kind: "expense",
    source: "Credit card",
    target: "Mini Market",
  },
  {
    id: "t30",
    date: "2025-11-27",
    description: "Dinner - Date night",
    amount: -74.9,
    category: "Dining",
    kind: "expense",
    source: "Credit card",
    target: "Restaurant",
  },
  {
    id: "t31",
    date: "2025-11-28",
    description: "Streaming add-on",
    amount: -7.99,
    category: "Subscriptions",
    kind: "subscription",
    source: "Credit card",
    target: "Streaming Service",
  },
  {
    id: "t32",
    date: "2025-11-29",
    description: "Groceries - Pantry refill",
    amount: -83.45,
    category: "Groceries",
    kind: "expense",
    source: "Credit card",
    target: "Grocery Store",
  },
  {
    id: "t33",
    date: "2025-11-30",
    description: "Paycheck - Bonus",
    amount: 500,
    category: "Income",
    kind: "income",
    source: "Employer Payroll",
    target: "Navy Federal checking",
  },
  {
    id: "t34",
    date: "2025-11-06",
    description: "Added from primary checking",
    amount: 300,
    category: "Transfer",
    kind: "transferInternal",
    source: "Primary checking",
    target: "Cash App",
    sourceKey: "navy_checking",
    targetKey: "cash_app",
  },
  {
    id: "t35",
    date: "2025-11-10",
    description: "Added from primary checking",
    amount: 250,
    category: "Transfer",
    kind: "transferInternal",
    source: "Primary checking",
    target: "Cash App",
    sourceKey: "navy_checking",
    targetKey: "cash_app",
  },
  {
    id: "t36",
    date: "2025-11-18",
    description: "Cash out to card",
    amount: -220,
    category: "Transfer",
    kind: "transferInternal",
    source: "Cash App",
    target: "Visa debit",
    sourceKey: "cash_app",
    targetKey: "visa_debit",
  },
  {
    id: "t37",
    date: "2025-11-25",
    description: "Cash out to card",
    amount: -180,
    category: "Transfer",
    kind: "transferInternal",
    source: "Cash App",
    target: "Visa debit",
    sourceKey: "cash_app",
    targetKey: "visa_debit",
  },
  {
    id: "t38",
    date: "2025-11-12",
    description: "Transfer from checking to Cash App",
    amount: 2000,
    category: "Transfer",
    kind: "transferInternal",
    source: "Primary checking",
    target: "Cash App",
    sourceKey: "navy_checking",
    targetKey: "cash_app",
  },
  {
    id: "t39",
    date: "2025-11-13",
    description: "Cash App transfer to Visa debit",
    amount: -1950,
    category: "Transfer",
    kind: "transferInternal",
    source: "Cash App",
    target: "Visa debit",
    sourceKey: "cash_app",
    targetKey: "visa_debit",
  },
  {
    id: "t40",
    date: "2025-11-04",
    description: "Groceries - Farmers market",
    amount: -32.5,
    category: "Groceries",
    kind: "expense",
    source: "Credit card",
    target: "Farmers Market",
  },
  {
    id: "t41",
    date: "2025-11-09",
    description: "Lunch - Office cafeteria",
    amount: -11.25,
    category: "Dining",
    kind: "expense",
    source: "Credit card",
    target: "Cafeteria",
  },
  {
    id: "t42",
    date: "2025-11-14",
    description: "Transit pass reload",
    amount: -25,
    category: "Transport",
    kind: "expense",
    source: "Credit card",
    target: "Transit Authority",
  },
  {
    id: "t43",
    date: "2025-11-17",
    description: "Pharmacy essentials",
    amount: -28.6,
    category: "Other",
    kind: "expense",
    source: "Credit card",
    target: "Pharmacy",
  },
  {
    id: "t44",
    date: "2025-11-20",
    description: "Gas - Weekend refill",
    amount: -42.75,
    category: "Transport",
    kind: "expense",
    source: "Credit card",
    target: "Gas Station",
  },
  {
    id: "t45",
    date: "2025-11-23",
    description: "Service fee - card payment",
    amount: -6.5,
    category: "Fees",
    kind: "fee",
    source: "Credit card",
    target: "Payment Processor",
  },
  {
    id: "t46",
    date: "2025-11-02",
    description: "Car payment",
    amount: -320,
    category: "Transport",
    kind: "expense",
    source: "Primary checking",
    target: "Auto lender",
  },
  {
    id: "t47",
    date: "2025-11-08",
    description: "Health insurance premium",
    amount: -265,
    category: "Bills & services",
    kind: "expense",
    source: "Primary checking",
    target: "Health insurer",
  },
  {
    id: "t48",
    date: "2025-11-11",
    description: "Auto insurance payment",
    amount: -142,
    category: "Bills & services",
    kind: "expense",
    source: "Primary checking",
    target: "Auto insurer",
  },
  {
    id: "t49",
    date: "2025-11-18",
    description: "Student loan payment",
    amount: -210,
    category: "Bills & services",
    kind: "expense",
    source: "Primary checking",
    target: "Loan servicer",
  },
  {
    id: "t50",
    date: "2025-11-26",
    description: "College tuition payment",
    amount: -180,
    category: "Bills & services",
    kind: "expense",
    source: "Primary checking",
    target: "College",
  },
  {
    id: "t51",
    date: "2025-11-19",
    description: "Gas station fill-up",
    amount: -48.5,
    category: "Transport",
    kind: "expense",
    source: "Credit card",
    target: "Gas Station",
  },
  {
    id: "t52",
    date: "2025-11-12",
    description: "Netflix subscription",
    amount: -15.99,
    category: "Subscriptions",
    kind: "subscription",
    source: "Credit card",
    target: "Netflix",
  },
  {
    id: "t53",
    date: "2025-11-14",
    description: "Netflix subscription",
    amount: -15.99,
    category: "Subscriptions",
    kind: "subscription",
    source: "Credit card",
    target: "Netflix",
  },
  {
    id: "t54",
    date: "2025-11-09",
    description: "Mobile plan duplicate",
    amount: -78,
    category: "Subscriptions",
    kind: "subscription",
    source: "Credit card",
    target: "Wireless Carrier",
  },
  {
    id: "t55",
    date: "2025-11-12",
    description: "Mobile plan duplicate",
    amount: -78,
    category: "Subscriptions",
    kind: "subscription",
    source: "Credit card",
    target: "Wireless Carrier",
  },
];

export const budgetGuidelineRatios: Record<string, number> = rulesBudgetGuidelineRatios;

let sampleRunCounter = 0;

export type OwnershipMode = "spending" | "payment" | "notMine";



export type AccountModeMap = Record<AccountKey, OwnershipMode>;

export function isInternalTransfer(
  t: Transaction,
  ownershipMap: OwnershipMap = {},
  accountModes?: AccountModeMap,
): boolean {
  if (!t.kind.startsWith("transfer")) return false;
  if (!t.sourceKey || !t.targetKey) return false;
  const sourceMode =
    accountModes?.[t.sourceKey] ?? (ownershipMap[t.sourceKey] ? ("spending" as OwnershipMode) : "notMine");
  const targetMode =
    accountModes?.[t.targetKey] ?? (ownershipMap[t.targetKey] ? ("spending" as OwnershipMode) : "notMine");
  const sourceOwned = sourceMode !== "notMine";
  const targetOwned = targetMode !== "notMine";
  const bothOwned = sourceOwned && targetOwned;
  const eitherPayment = sourceMode === "payment" || targetMode === "payment";
  return bothOwned && !eitherPayment;
}

export function getInternalTransfersTotal(
  list: Transaction[],
  ownershipMap: OwnershipMap = {},
  accountModes?: AccountModeMap,
): number {
  return list.reduce((sum, tx) => {
    if (!isInternalTransfer(tx, ownershipMap, accountModes)) return sum;
    return sum + Math.abs(tx.amount);
  }, 0);
}

export function isRealIncome(
  t: Transaction,
  ownershipMap: OwnershipMap = {},
  accountModes?: AccountModeMap,
): boolean {
  if (isInternalTransfer(t, ownershipMap, accountModes)) return false;
  const sourceMode = t.sourceKey ? accountModes?.[t.sourceKey] : undefined;
  const targetMode = t.targetKey ? accountModes?.[t.targetKey] : undefined;
  if (t.kind.startsWith("transfer")) {
    if (sourceMode === "spending" && targetMode === "payment") {
      return false;
    }
    return t.amount > 0;
  }
  return t.kind === "income";
}

export function isRealSpending(
  t: Transaction,
  ownershipMap: OwnershipMap = {},
  accountModes?: AccountModeMap,
): boolean {
  if (isInternalTransfer(t, ownershipMap, accountModes)) return false;
  const sourceMode = t.sourceKey ? accountModes?.[t.sourceKey] : undefined;
  const targetMode = t.targetKey ? accountModes?.[t.targetKey] : undefined;
  if (t.kind.startsWith("transfer")) {
    if (sourceMode === "spending" && targetMode === "payment") {
      return true;
    }
    return t.amount < 0;
  }
  return t.kind === "expense" || t.kind === "subscription" || t.kind === "fee";
}

export function getTotalIncome(
  list: Transaction[],
  ownershipMap: OwnershipMap = {},
  accountModes?: AccountModeMap,
): number {
  return list
    .filter((t) => isRealIncome(t, ownershipMap, accountModes))
    .reduce((sum, t) => sum + t.amount, 0);
}

export function getTotalSpending(
  list: Transaction[],
  ownershipMap: OwnershipMap = {},
  accountModes?: AccountModeMap,
): number {
  return list
    .filter((t) => isRealSpending(t, ownershipMap, accountModes))
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
}

export function getNetThisMonth(
  list: Transaction[],
  ownershipMap: OwnershipMap = {},
  accountModes?: AccountModeMap,
): number {
  return getTotalIncome(list, ownershipMap, accountModes) - getTotalSpending(list, ownershipMap, accountModes);
}

export function getTotalSubscriptions(
  list: Transaction[],
  ownershipMap: OwnershipMap = {},
  accountModes?: AccountModeMap,
): number {
  return list
    .filter((t) => t.kind === "subscription" && !isInternalTransfer(t, ownershipMap, accountModes))
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
}

export function getTotalFees(
  list: Transaction[],
  ownershipMap: OwnershipMap = {},
  accountModes?: AccountModeMap,
): number {
  return list
    .filter((t) => t.kind === "fee" && !isInternalTransfer(t, ownershipMap, accountModes))
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
}

export function getSubscriptionTransactions(
  list: Transaction[],
  ownershipMap: OwnershipMap = {},
  accountModes?: AccountModeMap,
): Transaction[] {
  return list.filter(
    (t) => t.kind === "subscription" && !isInternalTransfer(t, ownershipMap, accountModes),
  );
}

export function getFeeTransactions(
  list: Transaction[],
  ownershipMap: OwnershipMap = {},
  accountModes?: AccountModeMap,
): Transaction[] {
  return list.filter((t) => t.kind === "fee" && !isInternalTransfer(t, ownershipMap, accountModes));
}

export function getSpendingByCategory(
  list: Transaction[],
  ownershipMap: OwnershipMap = {},
  accountModes?: AccountModeMap,
): { category: string; amount: number }[] {
  const totals = new Map<string, number>();

  list.filter((t) => isRealSpending(t, ownershipMap, accountModes)).forEach((t) => {
    const prev = totals.get(t.category) ?? 0;
    totals.set(t.category, prev + Math.abs(t.amount));
  });

  return Array.from(totals.entries()).map(([category, amount]) => ({
    category,
    amount,
  }));
}

export function getTransactionsByCategory(
  category: string,
  list: Transaction[],
  ownershipMap: OwnershipMap = {},
  accountModes?: AccountModeMap,
): Transaction[] {
  return list.filter(
    (t) => t.category === category && !isInternalTransfer(t, ownershipMap, accountModes),
  );
}

export function parseInstitutionAndLast4(
  description: string,
): { institution: string | null; last4: string | null } {
  const lower = description.toLowerCase();
  const last4Match = lower.match(
    /ending\s*([0-9]{4})|\b\*\s*([0-9]{4})|\.\.\.?\s*([0-9]{4})|\b([0-9]{4})\b/,
  );
  const last4 = last4Match ? last4Match[1] ?? last4Match[2] ?? last4Match[3] ?? last4Match[4] : null;

  let cleaned = lower
    .replace(/ending\s*[0-9]{4}/g, " ")
    .replace(/\*\s*[0-9]{4}/g, " ")
    .replace(/\.\.\.?\s*[0-9]{4}/g, " ")
    .replace(/\b[0-9]{4}\b/g, " ");

  const noiseWords = [
    "transfer",
    "added",
    "from",
    "to",
    "payment",
    "pay",
    "deposit",
    "debit",
    "credit",
    "card",
    "checking",
    "savings",
    "account",
    "wallet",
    "app",
    "loan",
    "auto",
    "cash app",
    "venmo",
    "paypal",
    "visa",
    "mastercard",
  ];

  noiseWords.forEach((word) => {
    cleaned = cleaned.replace(new RegExp(`\b${word}\b`, "gi"), " ");
  });

  cleaned = cleaned.replace(/\s+/g, " ").trim();
  const institution = cleaned.length > 0 ? cleaned : null;

  return { institution, last4 };
}

const normalizeRecurringLabel = (description: string): string =>
  description
    .toLowerCase()
    .replace(/ending\s*\d{2,4}/gi, "")
    .replace(/\b\d{2,4}\b/g, "")
    .replace(/\s+/g, " ")
    .trim();

const isRecurringCandidate = (t: Transaction): boolean => {
  if (t.kind.startsWith("transfer")) return false;
  const isSubscription = t.kind === "subscription" || isSubscriptionCategory(t.category);
  const isBillCategory = isBillLikeCategory(t.category);
  const isPaymentDescription = isBillishDescription(t.description);
  return isSubscription || isBillCategory || isPaymentDescription;
};

const median = (values: number[]): number => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
};

export const DUPLICATE_MIN_OCCURRENCES = 2;
export const DUPLICATE_INTERVAL_FACTOR = 0.6;
export const DUPLICATE_FAST_INTERVAL_FACTOR = 0.35;
export const DUPLICATE_AMOUNT_FACTOR = 0.3;

export type DuplicateCluster = {
  key: string;
  label: string;
  category: string;
  transactionIds: string[];
  suspiciousTransactionIds: string[];
  transactions: Transaction[];
  medianIntervalDays: number;
  medianAmount: number;
  lastNormalDate: string | null;
  lastNormalChargeDate: string | null;
};

export function analyzeDuplicateCharges(transactions: Transaction[]): {
  flaggedTransactionIds: Set<string>;
  clusters: DuplicateCluster[];
} {
  const grouped = new Map<string, Transaction[]>();
  const normalizeLabel = (value: string) => normalizeRecurringLabel(value) ?? value.toLowerCase().replace(/\s+/g, " ").trim();
  const DAY_MS = 1000 * 60 * 60 * 24;
  const THIRTY_DAYS = 32 * DAY_MS;

  transactions.forEach((t) => {
    if (!isRecurringCandidate(t)) return;
    const normalized = normalizeLabel(t.description);
    if (!normalized) return;
    const key = `${normalized}::${t.category.toLowerCase()}`;
    const list = grouped.get(key) ?? [];
    list.push(t);
    grouped.set(key, list);
  });

  const flaggedIds = new Set<string>();
  const clusters: DuplicateCluster[] = [];

  grouped.forEach((txs, key) => {
    if (txs.length < DUPLICATE_MIN_OCCURRENCES) return;
    const sorted = [...txs].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    const intervals: number[] = [];
    for (let i = 1; i < sorted.length; i += 1) {
      const prev = new Date(sorted[i - 1].date).getTime();
      const curr = new Date(sorted[i].date).getTime();
      intervals.push(Math.abs(curr - prev) / DAY_MS);
    }
    const medianInterval = intervals.length > 0 ? median(intervals) : 0;
    const medianAmount = median(sorted.map((t) => Math.abs(t.amount)));

    const clusterFlagged = new Set<string>();
    const lastByAmount = new Map<string, Transaction>();
    const monthAmountBuckets = new Map<string, Transaction[]>();

    sorted.forEach((tx) => {
      const absAmount = Math.abs(tx.amount);
      const amountKey = absAmount.toFixed(2);
      const date = new Date(tx.date);
      const monthKey = `${date.getUTCFullYear()}-${date.getUTCMonth()}`;
      const monthAmountKey = `${monthKey}-${amountKey}`;

      const list = monthAmountBuckets.get(monthAmountKey) ?? [];
      list.push(tx);
      monthAmountBuckets.set(monthAmountKey, list);

      const prev = lastByAmount.get(amountKey);
      if (prev) {
        const prevTs = new Date(prev.date).getTime();
        const currTs = new Date(tx.date).getTime();
        const diff = Math.abs(currTs - prevTs);
        if (diff <= THIRTY_DAYS) {
          clusterFlagged.add(tx.id);
          clusterFlagged.add(prev.id);
        }
      }
      lastByAmount.set(amountKey, tx);
    });

    monthAmountBuckets.forEach((list) => {
      if (list.length > 1) {
        list.forEach((tx) => clusterFlagged.add(tx.id));
      }
    });

    if (clusterFlagged.size === 0) return;
    clusterFlagged.forEach((id) => flaggedIds.add(id));

    const normalTransactions = sorted.filter((t) => !clusterFlagged.has(t.id));
    const lastNormalDate =
      normalTransactions.length > 0 ? normalTransactions[normalTransactions.length - 1].date : null;
    const representative = sorted[0];
    clusters.push({
      key,
      label: representative ? representative.description : key.split("::")[0],
      category: representative?.category ?? "",
      transactionIds: sorted.map((t) => t.id),
      suspiciousTransactionIds: sorted.filter((t) => clusterFlagged.has(t.id)).map((t) => t.id),
      transactions: sorted,
      medianIntervalDays: medianInterval,
      medianAmount,
      lastNormalDate,
      lastNormalChargeDate: lastNormalDate,
    });
  });

  return { flaggedTransactionIds: flaggedIds, clusters };
}

export function getRecurringDuplicateIds(
  fullList: Transaction[],
  viewList: Transaction[],
): Set<string> {
  const analysis = analyzeDuplicateCharges(fullList);
  const viewIds = new Set(viewList.map((t) => t.id));
  return new Set([...analysis.flaggedTransactionIds].filter((id) => viewIds.has(id)));
}

export function getCashFlowByDate(
  list: Transaction[],
  ownershipMap: OwnershipMap = {},
  accountModes?: AccountModeMap,
): {
  date: string;
  totalIncomeForThatDate: number;
  totalSpendingForThatDate: number;
  totalInflowForThatDate: number;
  totalOutflowForThatDate: number;
  netForThatDate: number;
}[] {
  const daily = new Map<
    string,
    {
      income: number;
      spending: number;
      inflow: number;
      outflow: number;
    }
  >();

  list.forEach((t) => {
    const entry =
      daily.get(t.date) ?? { income: 0, spending: 0, inflow: 0, outflow: 0 };

    // raw inflow/outflow (includes transfers) for display
    if (t.amount >= 0) {
      entry.inflow += t.amount;
    } else {
      entry.outflow += Math.abs(t.amount);
    }

    // real net impact excludes internal transfers
    if (isRealIncome(t, ownershipMap, accountModes)) {
      entry.income += t.amount;
    } else if (isRealSpending(t, ownershipMap, accountModes)) {
      entry.spending += Math.abs(t.amount);
    }
    daily.set(t.date, entry);
  });

  return Array.from(daily.entries())
    .map(([date, totals]) => ({
      date,
      totalIncomeForThatDate: totals.income,
      totalSpendingForThatDate: totals.spending,
      totalInflowForThatDate: totals.inflow,
      totalOutflowForThatDate: totals.outflow,
      netForThatDate: totals.income - totals.spending,
    }))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

export function getSummaryStats(
  list: Transaction[],
  ownershipMap: OwnershipMap = {},
  accountModes?: AccountModeMap,
): {
  totalIncome: number;
  totalSpending: number;
  net: number;
  totalSubscriptions: number;
  subscriptionCount: number;
  totalFees: number;
  totalInternalTransfers: number;
  largestSingleExpense:
    | {
        amount: number;
        description: string;
        category: string;
        date: string;
      }
    | null;
  topSpendingCategories: { category: string; amount: number }[];
} {
  const totalIncome = getTotalIncome(list, ownershipMap, accountModes);
  const totalSpending = getTotalSpending(list, ownershipMap, accountModes);
  const net = totalIncome - totalSpending;

  const subscriptionTransactions = getSubscriptionTransactions(list, ownershipMap, accountModes);
  const totalSubscriptions = getTotalSubscriptions(list, ownershipMap, accountModes);
  const subscriptionCount = subscriptionTransactions.length;

  const totalFees = getTotalFees(list, ownershipMap, accountModes);
  const totalInternalTransfers = getInternalTransfersTotal(list, ownershipMap, accountModes);

  const expenses = list.filter((t) => isRealSpending(t, ownershipMap, accountModes));
  const largestExpense =
    expenses.length > 0
      ? expenses.reduce((max, t) => (Math.abs(t.amount) > Math.abs(max.amount) ? t : max), expenses[0])
      : null;

  const topSpendingCategories = getSpendingByCategory(list, ownershipMap, accountModes)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3);

  return {
    totalIncome,
    totalSpending,
    net,
    totalSubscriptions,
    subscriptionCount,
    totalFees,
    totalInternalTransfers,
    largestSingleExpense: largestExpense
      ? {
          amount: Math.abs(largestExpense.amount),
          description: largestExpense.description,
          category: largestExpense.category,
          date: largestExpense.date,
        }
      : null,
    topSpendingCategories,
  };
}

export function getBudgetGuidance(
  list: Transaction[],
  ownershipMap: OwnershipMap = {},
  accountModes?: AccountModeMap,
): BudgetGuidanceItem[] {
  const totalIncome = getTotalIncome(list, ownershipMap, accountModes);
  const spendingByCategory = getSpendingByCategory(list, ownershipMap, accountModes);

  return Object.entries(budgetGuidelineRatios).map(([category, ratio]) => {
    const actual =
      spendingByCategory.find((item) => item.category === category)?.amount ?? 0;
    const recommendedMax = totalIncome * ratio;
    const delta = actual - recommendedMax;
    const direction: "over" | "under" = delta > 0 ? "over" : "under";
    const differenceAmount = Math.abs(delta);

    return {
      category,
      name: category,
      actual,
      actualAmount: actual,
      recommendedMax,
      recommendedAmount: recommendedMax,
      delta,
      differenceAmount,
      differenceDirection: direction,
    };
  });
}

type HouseholdProfile = {
  primaryChecking: { label: string; ending: string; accountKey: AccountKey };
  wallet: { label: string; ending: string; accountKey: AccountKey };
  paymentAccount: { label: string; ending: string; accountKey: AccountKey };
  billers: {
    internet: string;
    mobile: string;
    streaming: string;
    music: string;
    gym: string;
    autoInsurance: string;
    healthInsurance: string;
    lender: string;
    studentLoan: string;
    rentPayee: string;
    utility: string;
    carLender: string;
    gasBrand: string;
  };
  merchants: {
    grocery: string[];
    fastFood: string[];
    casualDining: string[];
    coffee: string[];
    retail: string[];
    pharmacy: string[];
    rideshare: string[];
    cloud: string;
  };
};

const pickOne = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const pickSome = <T>(arr: T[], count: number): T[] => {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.max(1, Math.min(count, arr.length)));
};
const fourDigits = () => String(Math.floor(1000 + Math.random() * 9000));

const buildHouseholdProfile = (): HouseholdProfile => {
  const primaryLabel = `${pickOne(BANK_MERCHANTS)} checking`;
  const walletLabel = pickOne(WALLET_MERCHANTS);
  const paymentLabel = pickOne(CREDIT_CARD_LABELS);
  return {
    primaryChecking: { label: primaryLabel, ending: fourDigits(), accountKey: "navy_checking" },
    wallet: { label: walletLabel, ending: fourDigits(), accountKey: "cash_app" },
    paymentAccount: { label: paymentLabel, ending: fourDigits(), accountKey: "visa_debit" },
    billers: {
      internet: pickOne(INTERNET_PROVIDERS),
      mobile: pickOne(MOBILE_CARRIERS),
      streaming: pickOne(STREAMING_VIDEO),
      music: pickOne(MUSIC_SUBSCRIPTIONS),
      gym: pickOne(GYM_MERCHANTS),
      autoInsurance: pickOne(AUTO_INSURERS),
      healthInsurance: pickOne(HEALTH_INSURERS),
      lender: pickOne(RENT_PAYEES),
      studentLoan: pickOne(STUDENT_LOAN_SERVICERS),
      rentPayee: pickOne(RENT_PAYEES),
      utility: pickOne(UTILITY_PROVIDERS),
      carLender: pickOne(CAR_LENDERS),
      gasBrand: pickOne(GAS_STATIONS),
    },
    merchants: {
      grocery: pickSome(GROCERY_STORES, 2),
      fastFood: pickSome(FAST_FOOD_RESTAURANTS, 2),
      casualDining: pickSome(CASUAL_DINING, 2),
      coffee: pickSome(COFFEE_SHOPS, 2),
      retail: pickSome(RETAIL_SHOPS, 2),
      pharmacy: pickSome(PHARMACY_MERCHANTS, 2),
      rideshare: pickSome(RIDESHARE_AND_DELIVERY, 2),
      cloud: pickOne(CLOUD_AND_SOFTWARE),
    },
  };
};

const applyProfileToTransaction = (t: Transaction, profile: HouseholdProfile): Transaction => {
  const tx = { ...t };
  const desc = tx.description.toLowerCase();

  // Handle internal transfers - use realistic single-sided descriptions with last4
  if (tx.kind === "transferInternal") {
    const walletLabel = profile.wallet.label;
    const walletLast4 = profile.wallet.ending;
    
    if (tx.sourceKey === "navy_checking" && tx.targetKey === "cash_app") {
      // Transfer from checking to external wallet
      tx.description = generateTransferDescription("checking", "to", walletLabel, walletLast4);
      tx.source = formatBaseAccountLabel("checking");
      tx.target = `${walletLabel} ${walletLast4}`;
    } else if (tx.sourceKey === "cash_app" && tx.targetKey === "visa_debit") {
      // Transfer from wallet to payment card - not shown in our demo checking/savings
      const paymentLast4 = profile.paymentAccount.ending;
      tx.description = generateTransferDescription("checking", "to", profile.paymentAccount.label, paymentLast4);
      tx.source = `${walletLabel} ${walletLast4}`;
      tx.target = `${profile.paymentAccount.label} ${paymentLast4}`;
    }
    return tx;
  }

  // Use matchesKnownMerchant for more reliable category-based assignments
  // Apply ACH or VISA prefix based on transaction type
  if (matchesKnownMerchant(desc, "Groceries")) {
    const store = pickOne(profile.merchants.grocery);
    const useAch = isAchTransaction("Groceries", tx.description);
    tx.description = useAch ? `ACH - ${store}` : `VISA *${store}`;
    tx.target = store;
    tx.category = "Groceries";
  } else if (matchesKnownMerchant(desc, "Dining")) {
    if (desc.includes("coffee")) {
      const shop = pickOne(profile.merchants.coffee);
      tx.description = `VISA *${shop}`;
      tx.target = shop;
    } else if (desc.includes("food truck") || desc.includes("quick") || desc.includes("fast")) {
      const spot = pickOne(profile.merchants.fastFood);
      tx.description = `VISA *${spot}`;
      tx.target = spot;
    } else {
      const spot = pickOne(profile.merchants.casualDining);
      tx.description = `VISA *${spot}`;
      tx.target = spot;
    }
    tx.category = "Dining";
  } else if (matchesKnownMerchant(desc, "Transport")) {
    const ride = pickOne(profile.merchants.rideshare);
    tx.description = `VISA *${ride}`;
    tx.target = ride;
    tx.category = "Transport";
  } else if (matchesKnownMerchant(desc, "Rent")) {
    tx.description = `ACH - ${profile.billers.rentPayee}`;
    tx.target = profile.billers.rentPayee;
    tx.category = "Rent";
  } else if (matchesKnownMerchant(desc, "Utilities")) {
    tx.description = `ACH - ${profile.billers.utility}`;
    tx.target = profile.billers.utility;
    tx.category = "Utilities";
  } else if (matchesKnownMerchant(desc, "Subscriptions")) {
    if (desc.includes("music")) {
      tx.description = `ACH - ${profile.billers.music}`;
      tx.target = profile.billers.music;
    } else if (desc.includes("cloud") || desc.includes("storage")) {
      tx.description = `${profile.merchants.cloud} storage`;
      tx.target = profile.merchants.cloud;
    } else if (desc.includes("internet")) {
      tx.description = `ACH - ${profile.billers.internet}`;
      tx.target = profile.billers.internet;
    } else if (desc.includes("mobile")) {
      tx.description = `ACH - ${profile.billers.mobile}`;
      tx.target = profile.billers.mobile;
    } else {
      tx.description = `${profile.billers.streaming} subscription`;
      tx.target = profile.billers.streaming;
    }
    tx.category = "Subscriptions";
  } else if (matchesKnownMerchant(desc, "Bills & services")) {
    if (desc.includes("mobile")) {
      tx.description = `ACH - ${profile.billers.mobile}`;
      tx.target = profile.billers.mobile;
    } else if (desc.includes("insurance")) {
      tx.description = `ACH - ${profile.billers.autoInsurance}`;
      tx.target = profile.billers.autoInsurance;
    } else if (desc.includes("loan")) {
      tx.description = `ACH - ${profile.billers.studentLoan}`;
      tx.target = profile.billers.studentLoan;
    }
    tx.category = "Bills & services";
  } else if (matchesKnownMerchant(desc, "Auto")) {
    tx.description = `ACH - ${profile.billers.carLender}`;
    tx.target = profile.billers.carLender;
    tx.category = "Auto";
  } else if (matchesKnownMerchant(desc, "Other")) {
    const shop = pickOne(profile.merchants.retail);
    tx.target = tx.target ?? shop;
    tx.description = tx.description.includes("Amazon")
      ? `VISA *Amazon`
      : `VISA *${shop}`;
    tx.category = "Other";
  }

  return tx;
};

/**
 * Lovable style amount logic:
 *   subscriptions and bills stay very close to their base prices
 *   income moves a few percent around base
 *   transfers stay clean round numbers near base
 *   groceries, dining, transport, fees use realistic ranges by type
 */
const getRandomizedAmount = (template: Transaction, profiled: Transaction): number => {
  const baseSource = profiled.amount !== 0 ? profiled : template;
  const baseAmountRaw = baseSource.amount;
  const sign = Math.sign(baseAmountRaw) || 1;
  const base = Math.abs(baseAmountRaw);

  const category = (profiled.category || template.category);
  const kind = profiled.kind || template.kind;
  const desc = (profiled.description || template.description).toLowerCase();

  // income: keep close to template paycheck and bonus
  if (kind === "income") {
    const min = base * 0.98;
    const max = base * 1.02;
    const val = min + Math.random() * (max - min);
    return Number((val * sign).toFixed(2));
  }

  // internal transfers: keep neat whole numbers near base
  if (kind === "transferInternal") {
    const step = base >= 500 ? 50 : 20;
    const direction = Math.random() < 0.5 ? -1 : 1;
    const jitter = step * Math.floor(Math.random() * 3) * direction; // 0, 1, or 2 steps
    const val = Math.max(20, base + jitter);
    return Math.round(val / 10) * 10 * sign; // round to nearest 10
  }

  const isSubscription = kind === "subscription" || isSubscriptionCategory(category);
  const isBill = isBillLikeCategory(category) || isBillishDescription(desc);

  // recurring bills and subscriptions: very little jitter
  if (isSubscription || isBill) {
    const min = base * 0.99;
    const max = base * 1.01;
    const val = min + Math.random() * (max - min);
    return Number((val * sign).toFixed(2));
  }

  // groceries: realistic bands for small vs large trips
  if (category === "Groceries") {
    const isSmallTrip = base < 50 || desc.includes("quick") || desc.includes("corner");
    const min = isSmallTrip ? 15 : 70;
    const max = isSmallTrip ? 60 : 220;
    const val = min + Math.random() * (max - min);
    return Number((val * sign).toFixed(2));
  }

  // dining: separate coffee, fast food, and casual dining
  if (category === "Dining") {
    if (desc.includes("coffee")) {
      const min = 4;
      const max = 18;
      const val = min + Math.random() * (max - min);
      return Number((val * sign).toFixed(2));
    }
    const min = 12;
    const max = 85;
    const val = min + Math.random() * (max - min);
    return Number((val * sign).toFixed(2));
  }

  // transport: rides vs gas
  if (category === "Transport") {
    if (desc.includes("fuel") || desc.includes("gas")) {
      const min = 35;
      const max = 85;
      const val = min + Math.random() * (max - min);
      return Number((val * sign).toFixed(2));
    }
    const min = 8;
    const max = 45;
    const val = min + Math.random() * (max - min);
    return Number((val * sign).toFixed(2));
  }

  // fees: tight, small, believable bands
  if (category === "Fees") {
    if (base <= 5) {
      return Number(((2.5 + Math.random() * 2) * sign).toFixed(2)); // e.g., ATM fee
    }
    if (base > 5 && base < 20) {
      return Number(((5 + Math.random() * 10) * sign).toFixed(2)); // e.g., service fee
    }
    return Number(((20 + Math.random() * 15) * sign).toFixed(2)); // e.g., late fee
  }

  // generic expenses and other spending
  if (kind === "expense") {
    const min = 10;
    const max = 250;
    const val = min + Math.random() * (max - min);
    return Number((val * sign).toFixed(2));
  }

  // fallback: gentle jitter around base
  const min = base * 0.95;
  const max = base * 1.05;
  const val = min + Math.random() * (max - min);
  return Number((val * sign).toFixed(2));
};

export function generateSampleStatement(
  monthFromOverride?: number,
  yearFromOverride?: number,
  monthToOverride?: number,
  yearToOverride?: number,
): Transaction[] {
  const runId = sampleRunCounter++;
  const profile = buildHouseholdProfile();
  const baseDate = new Date(transactions[0]?.date ?? new Date());
  const baseYear = baseDate.getUTCFullYear();
  const baseMonth = baseDate.getUTCMonth(); // zero based

  const startMonth = monthFromOverride ?? monthToOverride ?? baseMonth;
  const startYear = yearFromOverride ?? yearToOverride ?? baseYear;
  const endMonth = monthToOverride ?? monthFromOverride ?? baseMonth;
  const endYear = yearToOverride ?? yearFromOverride ?? baseYear;

  const startValue = startYear * 12 + startMonth;
  const endValue = endYear * 12 + endMonth;
  const [rangeStart, rangeEnd] =
    startValue <= endValue
      ? [
          { month: startMonth, year: startYear },
          { month: endMonth, year: endYear },
        ]
      : [
          { month: endMonth, year: endYear },
          { month: startMonth, year: startYear },
        ];

  const monthsInRange: { month: number; year: number }[] = [];
  let cursor = { ...rangeStart };
  while (cursor.year * 12 + cursor.month <= rangeEnd.year * 12 + rangeEnd.month) {
    monthsInRange.push({ ...cursor });
    const nextMonth = cursor.month + 1;
    if (nextMonth > 11) {
      cursor = { month: 0, year: cursor.year + 1 };
    } else {
      cursor = { month: nextMonth, year: cursor.year };
    }
  }

  const generated = monthsInRange.flatMap(({ month, year }, monthIndex) =>
    transactions.map((t, index) => {
      const profiled = applyProfileToTransaction(t, profile);
      const day = Math.floor(Math.random() * 28) + 1;
      const newDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(
        2,
        "0",
      )}`;

      const amount = getRandomizedAmount(t, profiled);

      // Assign source account ID - default to checking for all transactions
      // In real implementation, savings transactions would be added separately
      const sourceAccountId: BaseAccountId = "checking";

      return {
        ...profiled,
        id: `run-${runId}-m${monthIndex}-t${index}`,
        date: newDate,
        amount,
        sourceAccountId,
      };
    }),
  );

  // Add some savings-specific transactions for each month
  const savingsTransactions = monthsInRange.flatMap(({ month, year }, monthIndex) => {
    const savingsMonth: Transaction[] = [];
    
    // Interest earned (once per month, on first day)
    savingsMonth.push({
      id: `run-${runId}-m${monthIndex}-savings-interest`,
      date: `${year}-${String(month + 1).padStart(2, "0")}-01`,
      description: "Interest earned",
      amount: Number((0.5 + Math.random() * 2).toFixed(2)),
      category: "Income",
      kind: "income",
      source: formatBaseAccountLabel("savings"),
      target: "Savings",
      sourceAccountId: "savings",
    });
    
    // Internal transfer to checking (mid-month, about 50% of months)
    if (Math.random() > 0.5) {
      savingsMonth.push({
        id: `run-${runId}-m${monthIndex}-savings-to-checking`,
        date: `${year}-${String(month + 1).padStart(2, "0")}-${String(Math.floor(Math.random() * 10) + 10).padStart(2, "0")}`,
        description: generateInternalTransferDescription("savings", "checking"),
        amount: -(200 + Math.floor(Math.random() * 500)),
        category: "Transfer",
        kind: "transferInternal",
        source: formatBaseAccountLabel("savings"),
        target: formatBaseAccountLabel("checking"),
        sourceAccountId: "savings",
        targetKey: "checking_internal",
      });
    }
    
    // Internal transfer from checking (late month, about 60% of months)
    if (Math.random() > 0.4) {
      savingsMonth.push({
        id: `run-${runId}-m${monthIndex}-checking-to-savings`,
        date: `${year}-${String(month + 1).padStart(2, "0")}-${String(Math.floor(Math.random() * 5) + 20).padStart(2, "0")}`,
        description: generateInternalTransferDescription("checking", "savings"),
        amount: 500 + Math.floor(Math.random() * 1500),
        category: "Transfer",
        kind: "transferInternal",
        source: formatBaseAccountLabel("checking"),
        target: formatBaseAccountLabel("savings"),
        sourceAccountId: "checking",
        targetKey: "savings_internal",
      });
    }
    
    return savingsMonth;
  });

  return [...generated, ...savingsTransactions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
}
