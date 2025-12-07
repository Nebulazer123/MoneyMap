/**
 * Deterministic ID Generator for MoneyMap v2
 * Implements FNV-1a hashing for stable, collision-resistant IDs.
 */

// FNV-1a 32-bit hash implementation
const fnv1a = (str: string): number => {
    let hash = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
        hash ^= str.charCodeAt(i);
        hash = Math.imul(hash, 0x01000193);
    }
    return hash >>> 0; // Ensure unsigned 32-bit integer
};

// Base36 encoding for compact IDs
const toBase36 = (num: number): string => {
    return num.toString(36);
};

export type GenerationPhase = 'R' | 'S' | 'I' | 'V' | 'T' | 'F' | 'X';

/**
 * Generates a stable Transaction ID.
 * Format: {profilePrefix}-{epochMonth}-{phase}-{sequence}
 * Example: p7x2-612-R-024
 */
export const generateTransactionId = (
    profileId: string,
    date: Date,
    phase: GenerationPhase,
    sequence: number
): string => {
    // 1. Profile Prefix (first 4 chars of hash)
    const profileHash = fnv1a(profileId);
    const profilePrefix = toBase36(profileHash).substring(0, 4).padStart(4, '0');

    // 2. Epoch Month (months since Jan 2020)
    const year = date.getFullYear();
    const month = date.getMonth(); // 0-11
    const epochMonth = (year - 2020) * 12 + month;

    // 3. Sequence (padded to 3 chars base36)
    // 3 chars base36 max is 46655, plenty for monthly sequence per phase
    const seqStr = sequence.toString(36).padStart(3, '0');

    return `${profilePrefix}-${epochMonth}-${phase}-${seqStr}`;
};

/**
 * Generates a stable hash for checking duplicates or patterns.
 * Used for pattern fingerprinting.
 */
export const generatePatternFingerprint = (
    merchant: string,
    amount: number,
    dayOfMonth: number
): string => {
    const key = `${merchant.toLowerCase()}:${Math.round(amount)}:${dayOfMonth}`;
    return toBase36(fnv1a(key));
};

/**
 * Generates a deterministic seed for PRNG based on profile and month.
 */
export const generateMonthSeed = (profileId: string, year: number, month: number): number => {
    return fnv1a(`${profileId}:${year}:${month}`);
};
