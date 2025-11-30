import React from "react";
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

import type { OverviewGroupKey } from "../../../lib/dashboard/config";
import { categoryEmojis } from "../../../lib/dashboard/config";
import { getDisplayCategory } from "../../../lib/dashboard/categories";
import type { Transaction } from "../../../lib/fakeData";

export type SpendingGroup = {
  id: OverviewGroupKey;
  label: string;
  value: number;
  categories: { name: string; amount: number }[];
  color: string;
  emoji: string;
  percent: number;
};

export type OverviewTabProps = {
  currency: Intl.NumberFormat;
  dateFormatter: Intl.DateTimeFormat;
  groupedSpendingData: SpendingGroup[];
  activeSpendingGroupId: OverviewGroupKey | null;
  onSelectSpendingGroup: (groupId: OverviewGroupKey | null) => void;
  categoryBreakdown: { category: string; amount: number }[];
  activeOverviewCategory: string;
  onSelectOverviewCategory: (category: string) => void;
  overviewTransactions: Transaction[];
  flowStep: "idle" | "statement" | "analyzing" | "results";
};

export function OverviewTab({
  currency,
  dateFormatter,
  groupedSpendingData,
  activeSpendingGroupId,
  onSelectSpendingGroup,
  categoryBreakdown,
  activeOverviewCategory,
  onSelectOverviewCategory,
  overviewTransactions,
  flowStep,
}: OverviewTabProps) {
  const categoryEmojiLookup = categoryEmojis as Record<string, string>;
  const activeGroupDetails = groupedSpendingData.find((group) => group.id === activeSpendingGroupId) ?? null;
  const showChart = flowStep === "results" && groupedSpendingData.length > 0;

  const getGroupIdFromEntry = (entry: unknown): OverviewGroupKey | null => {
    if (!entry || typeof entry !== "object") return null;
    const candidate = entry as { id?: string; payload?: { id?: string } };
    return (candidate.id ?? candidate.payload?.id ?? null) as OverviewGroupKey | null;
  };

  return (
    <div className="rounded-xl border border-dashed border-zinc-700 bg-zinc-900/60 px-4 py-6 text-zinc-300 sm:px-6 sm:py-8">
      <h2 className="text-lg font-semibold text-white text-center">Overview</h2>
      <p className="mt-2 text-center text-sm text-zinc-400">Where your money went this month.</p>
      {showChart && (
        <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-5 sm:px-6" tabIndex={-1}>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Spending by category</h3>
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
                  onClick={(entry) => onSelectSpendingGroup(getGroupIdFromEntry(entry))}
                  onMouseEnter={(entry) => onSelectSpendingGroup(getGroupIdFromEntry(entry))}
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
              const isActive = item.id === activeSpendingGroupId;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectSpendingGroup(item.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onSelectSpendingGroup(item.id);
                    }
                  }}
                  className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${
                    isActive
                      ? "border-zinc-500 bg-zinc-800"
                      : "border-zinc-800 bg-zinc-900 hover:border-zinc-700 hover:bg-zinc-800"
                  }`}
                >
                  <div className="flex items-center gap-3 text-zinc-200">
                    <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="flex items-center gap-1">
                      <span aria-hidden="true">{item.emoji}</span>
                      <span>{item.label === "Transport" ? "Auto" : item.label}</span>
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
                  {activeGroupDetails.emoji} {activeGroupDetails.label === "Transport" ? "Auto" : activeGroupDetails.label}
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
        </div>
      )}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {categoryBreakdown.map((item) => (
          <button
            key={item.category}
            type="button"
            onClick={() => onSelectOverviewCategory(item.category)}
            className={`w-full rounded-lg border px-4 py-3 text-left transition ${
              activeOverviewCategory === item.category
                ? "border-zinc-600 bg-zinc-800"
                : "border-zinc-800 bg-zinc-900 hover:border-zinc-700 hover:bg-zinc-800"
            }`}
          >
            <p className="flex items-center gap-2 text-sm text-zinc-400">
              <span aria-hidden="true">{categoryEmojiLookup[item.category] ?? ""}</span>
              <span>{getDisplayCategory(item.category)}</span>
            </p>
            <p className="mt-1 text-lg font-semibold text-white">{currency.format(item.amount)}</p>
          </button>
        ))}
      </div>
      <div className="mt-6 space-y-2 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Transactions for {getDisplayCategory(activeOverviewCategory)}</h3>
        </div>
        <div className="overflow-x-auto rounded-lg border border-zinc-800">
          <div className="min-w-[520px]">
            <div className="grid grid-cols-3 bg-zinc-900/80 px-3 py-2 text-left text-xs font-semibold text-zinc-300 sm:px-4 sm:text-sm">
              <span>Date</span>
              <span>Description</span>
              <span className="text-right">Amount</span>
            </div>
            {overviewTransactions.length === 0 ? (
              <div className="px-3 py-3 text-xs text-zinc-400 sm:px-4 sm:text-sm">No transactions for this category in this period.</div>
            ) : (
              <div className="divide-y divide-zinc-800">
                {overviewTransactions.map((tx) => (
                  <div key={tx.id} className="grid grid-cols-3 items-center px-3 py-3 text-xs text-zinc-200 sm:px-4 sm:text-sm">
                    <span className="text-zinc-300">{dateFormatter.format(new Date(tx.date))}</span>
                    <span className="truncate" title={tx.description}>
                      {tx.description}
                    </span>
                    <span className="text-right font-medium">{currency.format(tx.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
