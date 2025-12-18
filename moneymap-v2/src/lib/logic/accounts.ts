import { Transaction } from '../types';

export const accountTypeLabels: Record<string, string> = {
    checking: "Checking",
    savings: "Savings",
    credit: "Credit card",
    investment: "Investment",
    loan: "Loan",
    other: "Other",
    wallet: "Wallet",
};

export const titleCase = (str: string) => {
    return str
        .toLowerCase()
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
};

export const inferAccountTypeFromLabel = (label: string) => {
    const lower = label.toLowerCase();
    if (/(checking)/.test(lower)) return "checking";
    if (/(savings)/.test(lower)) return "savings";
    if (/(cash app|wallet|venmo|paypal)/.test(lower)) return "wallet";
    if (/(visa|card|debit)/.test(lower)) return "credit";
    if (/(loan|mortgage|finance|auto)/.test(lower)) return "loan";
    return "other";
};

export const extractLabelAndLast4 = (raw: string) => {
    const last4Match = raw.match(/ending\s*([0-9]{4})|\b([0-9]{4})\b/i);
    const last4 = last4Match ? last4Match[1] ?? last4Match[2] : null;
    const cleaned = raw.replace(/ending\s*[0-9]{4}/gi, "").replace(/\b[0-9]{4}\b/g, "").trim();
    const label = titleCase(cleaned || raw);
    return { label, last4: last4 ?? undefined };
};

export const normalizeTransferAccountKey = (description: string): string => {
    // Strip "Transfer to/from" prefix
    let cleaned = description.replace(/^transfer\s+(to|from)\s+/i, "").trim();

    // Extract last 4 digits if present
    const last4Match = cleaned.match(/\b([0-9]{4})\s*$/i);
    const last4 = last4Match ? last4Match[1] : null;

    // Remove last4 from label
    if (last4) {
        cleaned = cleaned.replace(/\b[0-9]{4}\s*$/, "").trim();
    }

    // Normalize spacing and case
    const normalized = cleaned.toLowerCase().replace(/\s+/g, " ").trim();

    return `${normalized}::${last4 ?? ""}`;
};

export type CandidateAccount = {
    key: string;
    label: string;
    ending?: string;
    accountType: string;
    transactions: { tx: Transaction; side: "source" | "target" }[];
    count: number;
};

export const detectAccountCandidates = (
    transactions: Transaction[],
    existingAccountKeys: Set<string>
): CandidateAccount[] => {
    const candidates = new Map<string, CandidateAccount>();

    transactions.forEach((tx) => {
        if (!tx.kind.startsWith("transfer")) return;

        // Use new normalization for consistent account identity
        const accountKey = normalizeTransferAccountKey(tx.description);

        // Skip if this key already exists as an account
        if (existingAccountKeys.has(accountKey)) return;

        const parsed = extractLabelAndLast4(tx.description.replace(/^transfer\s+(to|from)\s+/i, ""));
        const baseLabel = parsed.label || "Account";
        const accountType = inferAccountTypeFromLabel(baseLabel);

        const existing = candidates.get(accountKey) ?? {
            key: accountKey,
            label: baseLabel,
            ending: parsed.last4,
            accountType,
            transactions: [],
            count: 0,
        };

        // Determine side based on transaction flow
        const side: "source" | "target" = tx.amount < 0 ? "source" : "target";
        existing.transactions.push({ tx, side });
        existing.count += 1;
        candidates.set(accountKey, existing);
    });

    return Array.from(candidates.values()).sort((a, b) => b.count - a.count);
};
