import type { Transaction } from "../fakeData";

export type SuspiciousEntry = { tx: Transaction; reason: string };

export type DuplicateClusterView = {
  key: string;
  label: string;
  category: string;
  suspiciousTransactions: SuspiciousEntry[];
  suspiciousTotal: number;
  allTransactions: Transaction[];
  flaggedIds: Set<string>;
  reasonById: Map<string, string>;
  lastNormalChargeDate: string | null;
  lastNormalDate: string | null;
};

const median = (values: number[]) => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
};

const monthKey = (date: string) => {
  const d = new Date(date);
  return `${d.getUTCFullYear()}-${d.getUTCMonth()}`;
};

const isStreamingMerchant = (tx: Transaction) => tx.category === "Subscriptions";

const isPhoneMerchant = (tx: Transaction) =>
  tx.category === "Bills & services" &&
  /wireless|mobile|cell|phone/i.test(`${tx.description} ${tx.target ?? ""}`);

export const buildDuplicateClusters = (
  transactions: Transaction[],
  duplicateDecisions: Record<string, "confirmed" | "dismissed">,
): DuplicateClusterView[] => {
  const groups = new Map<string, Transaction[]>();
  transactions.forEach((tx) => {
    const key = tx.description || tx.target || tx.source || "Merchant";
    const list = groups.get(key) ?? [];
    list.push(tx);
    groups.set(key, list);
  });

  const clusters: DuplicateClusterView[] = [];

  groups.forEach((list, key) => {
    const sorted = [...list].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
    const baseline = median(sorted.map((tx) => Math.abs(tx.amount)));
    const flaggedIds = new Set<string>();
    const reasonById = new Map<string, string>();
    const byMonth = new Map<string, Transaction[]>();
    sorted.forEach((tx) => {
      const m = monthKey(tx.date);
      const arr = byMonth.get(m) ?? [];
      arr.push(tx);
      byMonth.set(m, arr);
    });

    const streaming = isStreamingMerchant(sorted[0]!);
    const phone = isPhoneMerchant(sorted[0]!);

    const closeToBaseline = (amt: number, tolerance: number) =>
      baseline > 0 && Math.abs(amt - baseline) / baseline <= tolerance;

    byMonth.forEach((monthTxs) => {
      const amounts = monthTxs.map((tx) => Math.abs(tx.amount));
      const multipleCharges = monthTxs.length > 1;

      monthTxs.forEach((tx) => {
        const amt = Math.abs(tx.amount);
        if (baseline === 0) return;
        if (streaming) {
          const withinBand = closeToBaseline(amt, 0.15);
          const high = (amt - baseline) / baseline > 0.15;
          if (multipleCharges && withinBand) {
            flaggedIds.add(tx.id);
            reasonById.set(tx.id, "Extra charge this month");
          } else if (high) {
            flaggedIds.add(tx.id);
            reasonById.set(tx.id, "Higher than usual for this subscription");
          }
        } else if (phone) {
          const high = (amt - baseline) / baseline > 0.2;
          const qualifies = amt >= baseline * 0.5;
          if (high) {
            flaggedIds.add(tx.id);
            reasonById.set(tx.id, "Higher than usual for this plan");
          } else if (multipleCharges && qualifies) {
            flaggedIds.add(tx.id);
            reasonById.set(tx.id, "Extra charge this month");
          }
        } else {
          const dupMatch = monthTxs.some(
            (other) => other.id !== tx.id && Math.abs(Math.abs(other.amount) - amt) < 0.01,
          );
          if (dupMatch && multipleCharges) {
            flaggedIds.add(tx.id);
            reasonById.set(tx.id, "Double charge at same amount");
          }
        }
      });
    });

    const suspiciousTransactions = sorted
      .filter((tx) => flaggedIds.has(tx.id))
      .filter((tx) => duplicateDecisions[tx.id] !== "dismissed")
      .map((tx) => ({ tx, reason: reasonById.get(tx.id) ?? "Possible duplicate" }));

    if (suspiciousTransactions.length === 0) return;

    const suspiciousTotal = suspiciousTransactions.reduce(
      (sum, entry) => sum + Math.abs(entry.tx.amount),
      0,
    );
    const normalTransactions = sorted.filter((tx) => !flaggedIds.has(tx.id));
    const lastNormalChargeDate =
      normalTransactions.length > 0
        ? normalTransactions[normalTransactions.length - 1].date
        : sorted.length > 0
          ? sorted[sorted.length - 1].date
          : null;

    clusters.push({
      key,
      label: key,
      category: sorted[0]?.category ?? "",
      suspiciousTransactions,
      suspiciousTotal,
      allTransactions: sorted,
      flaggedIds,
      reasonById,
      lastNormalDate: lastNormalChargeDate,
      lastNormalChargeDate,
    });
  });

  return clusters;
};
