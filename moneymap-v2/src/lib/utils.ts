import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function isDateInRange(dateStr: string, range: { from: Date; to: Date }): boolean {
    // Parse YYYY-MM-DD string to local midnight date object
    const [year, month, day] = dateStr.split('-').map(Number);
    const d = new Date(year, month - 1, day);

    // Normalize range to start/end of day to be safe, 
    // though usually 'from' is 00:00 and 'to' is 00:00 or 23:59.
    // Let's assume range.from/to are already Date objects.
    // We just need to compare timestamps or values.

    // To be safe against time components in range:
    const from = new Date(range.from);
    from.setHours(0, 0, 0, 0);

    const to = new Date(range.to);
    to.setHours(23, 59, 59, 999); // Include the full end day

    return d >= from && d <= to;
}
