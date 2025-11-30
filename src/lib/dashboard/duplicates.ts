// Duplicate charge helpers: builds enriched duplicate clusters with baseline amounts, interval analysis, and flags for suspicious charges so the UI can render pills and overlays consistently.
import { analyzeDuplicateCharges, DuplicateCluster, Transaction } from "../fakeData";

export type DuplicateClusterView = DuplicateCluster & {
  suspiciousTransactions: Transaction[];
  suspiciousTotal: number;
  allTransactions: Transaction[];
  flaggedIds: Set<string>;
  lastNormalChargeDate: string | null;
  lastNormalDate: string | null;
};

const modeAmount = (amounts: number[]) => {
  const counts = new Map<number, number>();
  amounts.forEach((amt) => counts.set(amt, (counts.get(amt) ?? 0) + 1));
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  return sorted[0]?.[0] ?? 0;
};

const medianIntervalDays = (txs: Transaction[]) => {
  const intervals: number[] = [];
  for (let i = 1; i < txs.length; i += 1) {
    const prev = new Date(txs[i - 1].date).getTime();
    const curr = new Date(txs[i].date).getTime();
    intervals.push(Math.abs(curr - prev) / (1000 * 60 * 60 * 24));
  }
  if (intervals.length === 0) return 0;
  const sorted = intervals.sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
};

export const buildDuplicateClusters = (
  transactions: Transaction[],
  duplicateDecisions: Record<string, "confirmed" | "dismissed">,
): DuplicateClusterView[] => {
  const analysis = analyzeDuplicateCharges(transactions);
  return analysis.clusters.map((cluster) => {
    const allTransactions = cluster.transactions
      .map((tx) => transactions.find((fullTx) => fullTx.id === tx.id) ?? tx)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const flaggedIds = new Set(cluster.suspiciousTransactionIds);
    const suspiciousTransactions = allTransactions
      .filter((tx) => flaggedIds.has(tx.id))
      .filter((tx) => duplicateDecisions[tx.id] !== "dismissed");
    const suspiciousTotal = suspiciousTransactions.reduce(
      (sum, tx) => sum + Math.abs(tx.amount),
      0,
    );
    const lastNormalCandidates = allTransactions.filter((tx) => !flaggedIds.has(tx.id));
    const lastNormalChargeDate =
      lastNormalCandidates.length > 0
        ? lastNormalCandidates[lastNormalCandidates.length - 1].date
        : allTransactions.length > 0
          ? allTransactions[allTransactions.length - 1].date
          : null;
    return {
      ...cluster,
      suspiciousTransactions,
      suspiciousTotal,
      allTransactions,
      flaggedIds,
      lastNormalDate: lastNormalChargeDate,
      lastNormalChargeDate,
    };
  });
};
