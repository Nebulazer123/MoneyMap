// Category helper utilities: string normalization, display mapping, emoji lookups, and overview grouping helpers consumed by the dashboard's analytics and UI.
import { Transaction } from "../fakeData";
import { overviewGroupMeta, type OverviewGroupKey } from "./config";
import { classifyDescription } from "../categoryRules";

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

export const getTransactionDisplayCategory = (tx: Transaction): string => {
  if (tx.category === "Bills & services") {
    return classifyDescription(tx.description);
  }
  return tx.category;
};

export const getOverviewGroupForCategory = (category: string): OverviewGroupKey | null => {
  const entry = Object.entries(overviewGroupMeta).find(([, meta]) =>
    meta.categories.includes(category),
  );
  return (entry?.[0] as OverviewGroupKey | undefined) ?? null;
};

export const getCategoriesForGroup = (groupId: OverviewGroupKey): string[] =>
  overviewGroupMeta[groupId]?.categories ?? [];
