// Centralized category and detection rules for MoneyMap
// This file is a single source of truth for category names, group mapping,
// subscription/bill flags, merchant patterns, and budget guideline ratios.

export const CATEGORY_NAMES = [
    "Income",
    "Rent",
    "Groceries",
    "Dining",
    "Transport",
    "Subscriptions",
    "Utilities",
    "Bills & services",
    "Insurance",
    "Education",
    "Fees",
    "Other",
    "Transfer",
    "Auto",
    "Loans",
    "Health",
] as const;

export type CategoryName = typeof CATEGORY_NAMES[number];

// Map of categories to higher-level dashboard groups
// These group ids mirror those used by the dashboard overview config.
export const categoryToGroups: Record<CategoryName, readonly string[]> = {
    Income: [],
    Rent: ["rent_utils"],
    Utilities: ["rent_utils"],
    Groceries: ["groceries_dining"],
    Dining: ["groceries_dining"],
    Transport: ["auto"],
    Auto: ["auto"],
    Loans: ["other_fees"],
    Subscriptions: ["subscriptions"],
    "Bills & services": ["bills_services"],
    Insurance: ["insurance"],
    Education: ["education"],
    Fees: ["other_fees"],
    Other: ["other_fees"],
    Transfer: ["transfers"],
    Health: ["insurance"],
};

export const classifyDescription = (
    description: string,
): "Insurance" | "Loans" | "Education" | "Bills & services" => {
    const lower = description.toLowerCase();
    if (/tuition|college|university|school|education|bursar/.test(lower)) return "Education";
    if (/loan|lender|servicer|finance|mortgage|car payment|auto payment|repayment/.test(lower)) return "Loans";
    if (/insurance|premium/.test(lower)) return "Insurance";
    return "Bills & services";
};

// Categories that are usually subscription-like
const subscriptionCategoryNames = new Set(
    ["Subscriptions"] as ReadonlyArray<CategoryName>,
);

// Categories that are bill-like
const billCategoryNames = new Set(
    ["Utilities", "Bills & services", "Insurance", "Education"] as ReadonlyArray<CategoryName>,
);

const essentialCategoryNames = new Set([
    "Rent",
    "Groceries",
    "Bills & services",
    "Insurance",
    "Loans",
    "Education",
    "Health",
    "Transport",
    "Auto",
    "Utilities",
]);

// Common description patterns that indicate bills or recurring payments
export const billishDescriptionPatterns: readonly RegExp[] = [
    /mortgage|rent/i,
    /loan\s*payment|repayment|student\s*loan/i,
    /car\s*payment|auto\s*payment/i,
    /auto\s*insurance|health\s*insurance|insurance\b/i,
    /internet|wifi|broadband|isp/i,
    /mobile\s*plan|wireless|cell|phone\s*(bill|plan)?/i,
    /tuition|bursar/i,
    /utility|electric|water|power|gas\s*service|sewer/i,
];

// Known merchant/term patterns per category for detection and heuristics
export const knownMerchantPatterns: Record<CategoryName, readonly RegExp[]> = {
    Income: [/payroll|salary|wages|direct\s*deposit|income|employer|paycheck/i],
    Rent: [/rent|mortgage/i],
    Utilities: [/internet|wifi|broadband|utility|electric|water|power|sewer|gas\s*service/i],
    Groceries: [/grocery|groceries|market|supercenter|supermarket|costco|aldi|safeway|trader\s*joes?/i],
    Dining: [/dining|restaurant|cafe|coffee|lunch|dinner|brunch|takeout|food\s*truck/i],
    Transport: [/fuel|gas\b|uber|lyft|ride|transit|metro|bus|train|pass/i],
    Auto: [/auto\s*(payment|lender|loan)|fuel|gas\s*station|shell|exxon|chevron|bp\b/i],
    Loans: [/loan|lender|servicer|finance|mortgage|car\s*payment|auto\s*payment|repayment|student\s*loan/i],
    Subscriptions: [/netflix|hulu|disney|prime\s*video|apple\s*tv|spotify|youtube\s*music|icloud|adobe|dropbox/i],
    "Bills & services": [/mobile|wireless|cell|phone|insurance|loan|tuition|bursar/i],
    Insurance: [/insurance|premium/i],
    Education: [/tuition|college|university|school|bursar/i],
    Health: [/health|medical|doctor|hospital|pharmacy|prescription|dental|vision/i],
    Fees: [/fee|surcharge|service\s*fee/i],
    Other: [/amazon|shopping|retail|pharmacy/i],
    Transfer: [/transfer|cash\s*app|venmo|paypal/i],
};

// Budget guidance ratios per category (sum need not equal 1; guidance only)
export const budgetGuidelineRatios: Record<string, number> = {
    Rent: 0.3,
    Transport: 0.15,
    Subscriptions: 0.05,
    Dining: 0.1,
    "Bills & services": 0.15,
};

// Optional aliases to normalize incoming category strings
const categoryAliasesLower: Record<string, CategoryName> = {
    bills: "Bills & services",
};

export const normalizeCategoryName = (category: string): CategoryName | string => {
    const lower = category.toLowerCase();
    const alias = categoryAliasesLower[lower];
    if (alias) return alias;
    // Attempt exact match against known names
    const found = (CATEGORY_NAMES as readonly string[]).find((n) => n.toLowerCase() === lower);
    return (found as CategoryName) ?? category;
};

export const isSubscriptionCategory = (category: string): boolean => {
    const norm = normalizeCategoryName(category);
    return typeof norm === "string" && subscriptionCategoryNames.has(norm as CategoryName);
};

export const isBillLikeCategory = (category: string): boolean => {
    const norm = normalizeCategoryName(category);
    return typeof norm === "string" && billCategoryNames.has(norm as CategoryName);
};

export const isEssentialCategory = (category: string): boolean => {
    const norm = normalizeCategoryName(category);
    return typeof norm === "string" && essentialCategoryNames.has(norm as CategoryName);
};

export const isBillishDescription = (description: string): boolean =>
    billishDescriptionPatterns.some((re) => re.test(description));

export const matchesKnownMerchant = (
    description: string,
    category: CategoryName,
): boolean => {
    const patterns = knownMerchantPatterns[category] ?? [];
    return patterns.some((re) => re.test(description));
};
