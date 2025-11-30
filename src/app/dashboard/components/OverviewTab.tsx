import React, { useMemo } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

import { overviewGroupMeta, categoryEmojis, type OverviewGroupKey } from "../../../lib/dashboard/config";
import { getCategoriesForGroup, getTransactionDisplayCategory } from "../../../lib/dashboard/categories";
import type { Transaction } from "../../../lib/fakeData";
import { SectionHeader } from "./SectionHeader";
import { GlassPanel } from "./GlassPanel";

export type SpendingGroup = {
  id: OverviewGroupKey;
  label: string;
  value: number;
  categories: { name: string; amount: number }[];
  color: string;
  emoji: string;
  percent: number;
};

type DetailCardConfig = {
  label: string;
  categories: string[];
  groupId: OverviewGroupKey;
  emoji: string;
};

const detailCardsConfig: DetailCardConfig[] = [
  { label: "Rent", categories: ["Rent"], groupId: "rent_utils", emoji: categoryEmojis.Rent },
  { label: "Utilities", categories: ["Utilities"], groupId: "rent_utils", emoji: categoryEmojis.Utilities },
  { label: "Auto", categories: ["Transport"], groupId: "auto", emoji: categoryEmojis.Transport },
  { label: "Subscriptions", categories: ["Subscriptions"], groupId: "subscriptions", emoji: categoryEmojis.Subscriptions },
  { label: "Bills and services", categories: ["Bills & services", "Bills"], groupId: "bills_services", emoji: categoryEmojis["Bills & services"] },
  { label: "Groceries", categories: ["Groceries"], groupId: "groceries_dining", emoji: categoryEmojis.Groceries },
  { label: "Dining", categories: ["Dining"], groupId: "groceries_dining", emoji: categoryEmojis.Dining ?? categoryEmojis.Groceries },
  { label: "Fees", categories: ["Fees"], groupId: "other_fees", emoji: categoryEmojis.Fees },
  { label: "Insurance", categories: ["Insurance"], groupId: "insurance", emoji: categoryEmojis.Insurance },
  { label: "Transfers", categories: ["Transfer"], groupId: "transfers", emoji: categoryEmojis.Transfer },
  { label: "Education", categories: ["Education"], groupId: "education", emoji: categoryEmojis.Education },
  { label: "Other", categories: ["Other", "Loans"], groupId: "other_fees", emoji: categoryEmojis.Other },
];

export type OverviewTabProps = {
  currency: Intl.NumberFormat;
  dateFormatter: Intl.DateTimeFormat;
  groupedSpendingData: SpendingGroup[];
  activeGroupId: OverviewGroupKey | null;
  onSelectGroup: (groupId: OverviewGroupKey | null) => void;
  categoryBreakdown: { category: string; amount: number }[];
  overviewTransactions: Transaction[];
  flowStep: "idle" | "statement" | "analyzing" | "results";
};

export function OverviewTab({
  currency,
  dateFormatter,
  groupedSpendingData,
  activeGroupId,
  onSelectGroup,
  categoryBreakdown,
  overviewTransactions,
  flowStep,
}: OverviewTabProps) {
  const activeGroupDetails = groupedSpendingData.find((group) => group.id === activeGroupId) ?? null;
  const showChart = flowStep === "results" && groupedSpendingData.length > 0;
  const tableGroupMeta = activeGroupId ? overviewGroupMeta[activeGroupId] : null;
  const groupCategoryAmountMap = useMemo(() => {
    const map = new Map<OverviewGroupKey, Map<string, number>>();
    groupedSpendingData.forEach((group) => {
      map.set(group.id, new Map(group.categories.map((cat) => [cat.name, cat.amount])));
    });
    return map;
  }, [groupedSpendingData]);

  const getGroupIdFromEntry = (entry: unknown): OverviewGroupKey | null => {
    if (!entry || typeof entry !== "object") return null;
    const candidate = entry as { id?: string; payload?: { id?: string } };
    return (candidate.id ?? candidate.payload?.id ?? null) as OverviewGroupKey | null;
  };

  const detailCards = detailCardsConfig.map((card) => {
    const amountsForGroup = groupCategoryAmountMap.get(card.groupId);
    const amount = card.categories.reduce((sum, name) => sum + (amountsForGroup?.get(name) ?? 0), 0);
    return { ...card, amount };
  });

  const filteredTransactions = useMemo(() => {
    if (!activeGroupId) return [];
    const categories = new Set(getCategoriesForGroup(activeGroupId));
    if (categories.size === 0) return [];
    return overviewTransactions
      .map((tx) => ({ tx, displayCategory: getTransactionDisplayCategory(tx) }))
      .filter(({ displayCategory }) => categories.has(displayCategory))
      .sort(
        (a, b) =>
          Date.parse(`${a.tx.date}T00:00:00Z`) -
          Date.parse(`${b.tx.date}T00:00:00Z`),
      );
  }, [activeGroupId, overviewTransactions]);

  const transactionsEmptyState =
    flowStep !== "results" || filteredTransactions.length === 0
      ? "Transactions for this category will appear here after you analyze a sample statement."
      : null;

  return (
    <GlassPanel variant="card" className="px-4 py-6 text-zinc-300 sm:px-6 sm:py-8 animate-fade-rise">
      <SectionHeader title="Overview" caption="Where your money went this month." className="text-center" />
      {showChart && (
        <GlassPanel
          variant="card"
          className="mt-6 px-4 py-5 text-zinc-200 sm:px-6 backdrop-blur-xl sm:backdrop-blur-2xl"
          tabIndex={-1}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Spending by group</h3>
          </div>
          <div className="mt-4 h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={groupedSpendingData}
                  dataKey="value"
                  nameKey="label"
                  innerRadius={0}
                  outerRadius={125}
                  paddingAngle={0}
                  stroke="none"
                  strokeWidth={0}
                  isAnimationActive
                  animationDuration={800}
                  onClick={(entry) => onSelectGroup(getGroupIdFromEntry(entry))}
                  onMouseEnter={(entry) => onSelectGroup(getGroupIdFromEntry(entry))}
                >
                  {groupedSpendingData.map((item) => (
                    <Cell key={item.id} fill={item.color} cursor="pointer" />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {groupedSpendingData.map((item) => {
              const isActive = item.id === activeGroupId;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectGroup(item.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onSelectGroup(item.id);
                    }
                  }}
                  className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition transform focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-300/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 ${
                    isActive
                      ? "border-zinc-500 bg-zinc-800"
                      : "border-zinc-800 bg-zinc-900 hover:-translate-y-0.5 hover:border-zinc-600 hover:bg-zinc-800"
                  }`}
                >
                  <div className="flex items-center gap-3 text-zinc-200">
                    <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="flex items-center gap-1">
                      <span aria-hidden="true">{item.emoji}</span>
                      <span>{item.label}</span>
                    </span>
                  </div>
                  <div className="text-right text-xs text-zinc-400">
                    <div className="text-base font-semibold text-white">{`${item.percent}%`}</div>
                    <div className="text-[11px] text-zinc-500">{currency.format(item.value)}</div>
                  </div>
                </button>
              );
            })}
          </div>
          {activeGroupDetails && (
            <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-900/80 px-4 py-3 text-sm text-zinc-200">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">
                  {activeGroupDetails.emoji} {activeGroupDetails.label}
                </span>
                <span className="text-xs text-zinc-400">{currency.format(activeGroupDetails.value)}</span>
              </div>
              {activeGroupDetails.categories.length === 0 ? (
                <p className="mt-2 text-xs text-zinc-400">No transactions in this group yet.</p>
              ) : (
                <div className="mt-2 space-y-1">
                  {activeGroupDetails.categories.map((cat) => (
                    <div key={cat.name} className="flex items-center justify-between">
                      <span className="text-zinc-300">{cat.name}</span>
                      <span className="font-medium text-white">{currency.format(cat.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </GlassPanel>
      )}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {detailCards.map((card) => (
          <GlassPanel
            key={card.label}
            variant="card"
            role="button"
            tabIndex={0}
            onClick={() => onSelectGroup(card.groupId)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelectGroup(card.groupId);
              }
            }}
            className={`w-full px-4 py-3 text-left transition transform hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-300/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 ${
              activeGroupId === card.groupId ? "ring-purple-300/30" : "hover:ring-white/14"
            }`}
          >
            <p className="flex items-center gap-2 text-sm text-zinc-400">
              <span aria-hidden="true">{card.emoji}</span>
              <span>{card.label}</span>
            </p>
            <p className="mt-1 text-lg font-semibold text-white">{currency.format(card.amount)}</p>
          </GlassPanel>
        ))}
      </div>
      <div className="mt-6 space-y-2 rounded-xl border border-zinc-800 bg-zinc-950/70 px-4 py-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">
            Transactions for {tableGroupMeta ? tableGroupMeta.label : "this category"}
          </h3>
        </div>
        <div className="overflow-x-auto rounded-lg border border-zinc-800">
          <div className="min-w-[640px]">
            <div className="grid grid-cols-4 bg-zinc-900/80 px-3 py-2 text-left text-xs font-semibold text-zinc-300 sm:px-4 sm:text-sm">
              <span>Date</span>
              <span>Description</span>
              <span>Category</span>
              <span className="text-right">Amount</span>
            </div>
            {transactionsEmptyState ? (
              <div className="px-3 py-3 text-xs text-zinc-400 sm:px-4 sm:text-sm">{transactionsEmptyState}</div>
            ) : (
              <div className="divide-y divide-zinc-800">
                {filteredTransactions.map(({ tx, displayCategory }) => (
                  <div
                    key={tx.id}
                    className="grid grid-cols-4 items-center px-3 py-3 text-xs text-zinc-200 sm:px-4 sm:text-sm"
                  >
                    <span className="text-zinc-300">{dateFormatter.format(new Date(tx.date))}</span>
                    <span className="truncate" title={tx.description}>
                      {tx.description}
                    </span>
                    <span className="truncate text-zinc-400" title={displayCategory}>
                      {displayCategory}
                    </span>
                    <span className="text-right font-medium">{currency.format(tx.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </GlassPanel>
  );
}
