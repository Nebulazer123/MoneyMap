import React from "react";

import type { TabId } from "../../../lib/dashboard/config";

export type SummaryCard = {
  label: string;
  value: string;
  to: TabId;
};

type Props = {
  cards: SummaryCard[];
  onSelect: (tab: TabId) => void;
};

export function SummaryCards({ cards, onSelect }: Props) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <button
          key={card.label}
          type="button"
          onClick={() => onSelect(card.to)}
          aria-label={`Open ${card.label}`}
          className="w-full cursor-pointer rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-600 hover:bg-zinc-800 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-zinc-600"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-purple-100/70">{card.label}</p>
          <p className="mt-2 text-xl font-semibold text-white sm:text-2xl">{card.value}</p>
          <p className="mt-2 text-xs text-right text-zinc-500">Click for details</p>
        </button>
      ))}
    </div>
  );
}
