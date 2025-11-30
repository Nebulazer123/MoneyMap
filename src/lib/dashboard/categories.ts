// Category helper utilities: string normalization, display mapping, emoji lookups, and overview grouping helpers consumed by the dashboard's analytics and UI.
import { Transaction } from "../fakeData";
import {
  categoryEmojis,
  displayCategoryLabels,
  overviewGroupMeta,
  overviewGroupOrder,
  type OverviewGroupKey,
} from "./config";

export const descriptionKey = (description: string) =>
  description
    .toLowerCase()
    .split(/\s+/)
    .slice(0, 3)
    .join(" ")
    .trim();

export const titleCase = (value: string) =>
  value
    .split(" ")
    .map((part) => (part ? `${part[0].toUpperCase()}${part.slice(1)}` : ""))
    .join(" ")
    .trim();

export const classifyBillsCategory = (
  description: string,
): "Insurance" | "Loans" | "Education" | "Bills & services" => {
  const lower = description.toLowerCase();
  if (/tuition|college|university|school|education|bursar/.test(lower)) return "Education";
  if (/loan|lender|servicer|finance|mortgage|car payment|auto payment|repayment/.test(lower)) return "Loans";
  if (/insurance|premium/.test(lower)) return "Insurance";
  return "Bills & services";
};

export const getTransactionDisplayCategory = (tx: Transaction): string => {
  if (tx.category === "Bills & services" || tx.category === "Bills") {
    return classifyBillsCategory(tx.description);
  }
  return tx.category;
};

export const getDisplayCategory = (category: string) => displayCategoryLabels[category] ?? category;

export const getCategoryEmoji = (category: string) => categoryEmojis[category];

export const getOverviewGroupForCategory = (category: string): OverviewGroupKey | null => {
  const entry = Object.entries(overviewGroupMeta).find(([, meta]) =>
    meta.categories.includes(category),
  );
  return (entry?.[0] as OverviewGroupKey | undefined) ?? null;
};

export const getCategoriesForGroup = (groupId: OverviewGroupKey): string[] =>
  overviewGroupMeta[groupId]?.categories ?? [];

export const getOverviewGroupOrder = (): OverviewGroupKey[] => [...overviewGroupOrder];
