export type TransactionKind =
  | "income"
  | "expense"
  | "subscription"
  | "fee"
  | "transferInternal"
  | "transferExternal"
  | "refund";

export type AccountKey = "navy_checking" | "cash_app" | "visa_debit" | string;

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

const COFFEE_SHOPS = ["Starbucks", "Dunkin", "Tim Hortons", "Dutch Bros Coffee"];

const CASUAL_DINING = [
  "Olive Garden",
  "Chilis Grill and Bar",
  "Applebees",
  "Texas Roadhouse",
  "Buffalo Wild Wings",
  "Red Lobster",
  "Outback Steakhouse",
  "Red Robin",
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

const RIDESHARE_AND_DELIVERY = ["Uber Rides", "Lyft Rides", "Uber Eats", "DoorDash", "Grubhub", "Instacart"];

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

const UTILITY_PROVIDERS = ["City Utilities", "Metro Energy", "Water & Power Co.", "Regional Electric", "Green Energy Services"];

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
];

export const budgetGuidelineRatios: Record<string, number> = {
  Rent: 0.3,
  Transport: 0.15,
  Subscriptions: 0.05,
  Dining: 0.1,
  "Bills & services": 0.15,
};

let sampleRunCounter = 0;

export type OwnershipMode = "spending" | "payment" | "notMine";

export type TransferAccount = {
  id: AccountKey;
  label: string;
  ownedByDefault: boolean;
  ending?: string;
  accountType?: string;
};

export function getTransferAccounts(): TransferAccount[] {
  return [
    {
      id: "navy_checking",
      label: "Navy Federal checking",
      ownedByDefault: true,
      accountType: "Checking",
      ending: "3124",
    },
    {
      id: "cash_app",
      label: "Cash App",
      ownedByDefault: true,
      accountType: "Wallet",
      ending: "0884",
    },
    {
      id: "visa_debit",
      label: "Visa debit",
      ownedByDefault: true,
      accountType: "Debit card",
      ending: "9921",
    },
  ];
}

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
  const sourceOwned = sourceMode !== "notMine" && ownershipMap[t.sourceKey] === true;
  const targetOwned = targetMode !== "notMine" && ownershipMap[t.targetKey] === true;
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
    cleaned = cleaned.replace(new RegExp(`\\b${word}\\b`, "gi"), " ");
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
  const categoryLower = t.category.toLowerCase();
  const isSubscription = t.kind === "subscription";
  const isBillCategory =
    categoryLower === "utilities" ||
    categoryLower === "bills & services" ||
    categoryLower === "bills";
  const isPaymentDescription = /loan|mortgage|credit|card payment|car payment|auto payment|internet|wifi|phone|cable/i.test(
    t.description,
  );
  return isSubscription || isBillCategory || isPaymentDescription;
};

const median = (values: number[]): number => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
};

export const DUPLICATE_MIN_OCCURRENCES = 3;
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

  transactions.forEach((t) => {
    if (!isRecurringCandidate(t)) return;
    const normalized = normalizeRecurringLabel(t.description);
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
    const absAmounts = sorted.map((t) => Math.abs(t.amount));
    for (let i = 1; i < sorted.length; i += 1) {
      const prev = new Date(sorted[i - 1].date).getTime();
      const curr = new Date(sorted[i].date).getTime();
      const diffDays = Math.abs(curr - prev) / (1000 * 60 * 60 * 24);
      intervals.push(diffDays);
    }
    if (intervals.length === 0) return;
    const medianInterval = median(intervals);
    const medianAmount = median(absAmounts);
    if (medianInterval === 0) return;

    const fastThreshold = medianInterval * DUPLICATE_INTERVAL_FACTOR;
    const veryFastThreshold = medianInterval * DUPLICATE_FAST_INTERVAL_FACTOR;
    const amountThreshold = medianAmount * DUPLICATE_AMOUNT_FACTOR;
    const clusterFlagged = new Set<string>();

    for (let i = 1; i < sorted.length; i += 1) {
      const prev = sorted[i - 1];
      const curr = sorted[i];
      const prevTs = new Date(prev.date).getTime();
      const currTs = new Date(curr.date).getTime();
      const diffDays = Math.abs(currTs - prevTs) / (1000 * 60 * 60 * 24);
      const currAbs = Math.abs(curr.amount);
      const prevAbs = Math.abs(prev.amount);
      const isFast = diffDays < fastThreshold;
      const isVeryFast = diffDays < veryFastThreshold;
      const isAmountOutlier = Math.abs(currAbs - medianAmount) > amountThreshold;
      const isSameAmount = Math.abs(currAbs - prevAbs) < 0.01;
      const isFlagged = isFast || isAmountOutlier || (isSameAmount && isVeryFast);
      if (isFlagged) {
        clusterFlagged.add(curr.id);
        clusterFlagged.add(prev.id);
      }
    }

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
  const withEndings = (label: string, ending: string) => `${label} ending ${ending}`;
  const primaryLabel = withEndings(profile.primaryChecking.label, profile.primaryChecking.ending);
  const walletLabel = withEndings(profile.wallet.label, profile.wallet.ending);
  const paymentLabel = withEndings(profile.paymentAccount.label, profile.paymentAccount.ending);

  const tx = { ...t };
  const desc = tx.description.toLowerCase();

  if (tx.kind === "transferInternal") {
    if (desc.includes("checking") || desc.includes("transfer from checking")) {
      tx.description = `Transfer from ${primaryLabel} to ${walletLabel}`;
      tx.source = primaryLabel;
      tx.target = walletLabel;
      tx.sourceKey = "navy_checking";
      tx.targetKey = "cash_app";
    } else if (desc.includes("cash app transfer") || desc.includes("cash out to card")) {
      tx.description = `Cash App transfer to ${paymentLabel}`;
      tx.source = walletLabel;
      tx.target = paymentLabel;
      tx.sourceKey = "cash_app";
      tx.targetKey = "visa_debit";
    } else if (desc.includes("cash out")) {
      tx.description = `Transfer from ${walletLabel} to ${paymentLabel}`;
      tx.source = walletLabel;
      tx.target = paymentLabel;
      tx.sourceKey = "cash_app";
      tx.targetKey = "visa_debit";
    } else if (desc.includes("added from primary checking")) {
      tx.description = `Added from ${primaryLabel}`;
      tx.source = primaryLabel;
      tx.target = walletLabel;
      tx.sourceKey = "navy_checking";
      tx.targetKey = "cash_app";
    }
    return tx;
  }

  if (tx.category === "Groceries" || desc.includes("grocery") || desc.includes("market")) {
    const store = pickOne(profile.merchants.grocery);
    tx.description = `Groceries - ${store}`;
    tx.target = store;
  } else if (tx.category === "Dining" || desc.includes("dinner") || desc.includes("lunch") || desc.includes("brunch") || desc.includes("takeout") || desc.includes("food")) {
    if (desc.includes("coffee")) {
      const shop = pickOne(profile.merchants.coffee);
      tx.description = `Coffee - ${shop}`;
      tx.target = shop;
    } else if (desc.includes("food truck") || desc.includes("quick") || desc.includes("fast")) {
      const spot = pickOne(profile.merchants.fastFood);
      tx.description = `Dining - ${spot}`;
      tx.target = spot;
    } else {
      const spot = pickOne(profile.merchants.casualDining);
      tx.description = `Dining - ${spot}`;
      tx.target = spot;
    }
  } else if (desc.includes("ride-share") || desc.includes("rideshare")) {
    const ride = pickOne(profile.merchants.rideshare);
    tx.description = `${ride} trip`;
    tx.target = ride;
  } else if (desc.includes("rent") || desc.includes("mortgage")) {
    tx.description = `${profile.billers.rentPayee} rent`;
    tx.target = profile.billers.rentPayee;
  } else if (desc.includes("internet")) {
    tx.description = `${profile.billers.internet} internet`;
    tx.target = profile.billers.internet;
  } else if (desc.includes("mobile plan") || desc.includes("mobile")) {
    tx.description = `${profile.billers.mobile} mobile plan`;
    tx.target = profile.billers.mobile;
  } else if (desc.includes("music subscription") || desc.includes("music")) {
    tx.description = `${profile.billers.music} subscription`;
    tx.target = profile.billers.music;
  } else if (desc.includes("streaming")) {
    tx.description = `${profile.billers.streaming} subscription`;
    tx.target = profile.billers.streaming;
  } else if (desc.includes("gym")) {
    tx.description = `${profile.billers.gym} membership`;
    tx.target = profile.billers.gym;
  } else if (desc.includes("utilities") || desc.includes("electric")) {
    tx.description = `${profile.billers.utility} bill`;
    tx.target = profile.billers.utility;
  } else if (desc.includes("auto insurance")) {
    tx.description = `${profile.billers.autoInsurance} auto insurance`;
    tx.target = profile.billers.autoInsurance;
    tx.category = "Bills & services";
  } else if (desc.includes("health insurance")) {
    tx.description = `${profile.billers.healthInsurance} health insurance`;
    tx.target = profile.billers.healthInsurance;
    tx.category = "Bills & services";
  } else if (desc.includes("car payment")) {
    tx.description = `${profile.billers.carLender} car payment`;
    tx.target = profile.billers.carLender;
  } else if (desc.includes("loan payment")) {
    tx.description = `${profile.billers.studentLoan} payment`;
    tx.target = profile.billers.studentLoan;
  } else if (desc.includes("college tuition")) {
    tx.description = `${profile.billers.studentLoan} tuition`;
    tx.target = profile.billers.studentLoan;
  } else if (desc.includes("gas station") || desc.includes("gas -")) {
    tx.description = `${profile.billers.gasBrand} fuel`;
    tx.target = profile.billers.gasBrand;
  } else if (desc.includes("pharmacy") || desc.includes("health")) {
    const pharm = pickOne(profile.merchants.pharmacy);
    tx.description = `${pharm}`;
    tx.target = pharm;
  } else if (desc.includes("cloud") || desc.includes("storage")) {
    tx.description = `${profile.merchants.cloud} storage`;
    tx.target = profile.merchants.cloud;
    tx.category = "Subscriptions";
  } else if (desc.includes("card") && tx.kind === "expense") {
    tx.source = paymentLabel;
  } else if (desc.includes("amazon") || desc.includes("shopping") || tx.category === "Other") {
    const shop = pickOne(profile.merchants.retail);
    tx.target = tx.target ?? shop;
    tx.description = tx.description.includes("Amazon")
      ? tx.description
      : `${shop} purchase`;
  }

  if (tx.category === "Transfer" && tx.kind !== "transferInternal") {
    tx.source = primaryLabel;
  }

  if (tx.target?.toLowerCase().includes("checking")) {
    tx.target = primaryLabel;
  }

  return tx;
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
      const newDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

      const sign = Math.sign(profiled.amount) || 1;
      const baseAmount = Math.abs(profiled.amount);
      const factor = 0.85 + Math.random() * 0.3; // 0.85 - 1.15
      const amount = Number((baseAmount * factor * sign).toFixed(2));

      return {
        ...profiled,
        id: `run-${runId}-m${monthIndex}-t${index}`,
        date: newDate,
        amount,
      };
    }),
  );

  return generated.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
}
