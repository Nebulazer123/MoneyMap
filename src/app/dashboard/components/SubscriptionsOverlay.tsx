import React, { useMemo } from "react";

import type { Transaction } from "../../../lib/fakeData";

type Props = {
  subscriptions: Transaction[];
  currency: Intl.NumberFormat;
  dateFormatter: Intl.DateTimeFormat;
  onClose: () => void;
};

export function SubscriptionsOverlay({ subscriptions, currency, dateFormatter, onClose }: Props) {
  const grouped = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    subscriptions.forEach((tx) => {
      const merchant = tx.description || "Subscription";
      const list = map.get(merchant) ?? [];
      list.push(tx);
      map.set(merchant, list);
    });
    return Array.from(map.entries())
      .map(([merchant, rows]) => ({
        merchant,
        rows: [...rows].sort(
          (a, b) => Date.parse(`${a.date}T00:00:00Z`) - Date.parse(`${b.date}T00:00:00Z`),
        ),
        total: rows.reduce((sum, tx) => sum + Math.abs(tx.amount), 0),
      }))
      .sort((a, b) => b.total - a.total);
  }, [subscriptions]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 px-3 py-6">
      <div
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        className="w-full max-w-4xl rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl outline-none"
      >
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-4 sm:px-5">
          <h3 className="text-lg font-semibold text-white">Subscriptions this period</h3>
          <button
            type="button"
            className="rounded-full border border-zinc-700 px-3 py-2 text-xs font-semibold text-white transition hover:border-zinc-500 hover:bg-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-4 sm:p-5 space-y-3 text-sm text-zinc-200">
          {grouped.length === 0 ? (
            <p className="text-zinc-400">No subscriptions found for this period.</p>
          ) : (
            grouped.map((group) => (
              <div key={group.merchant} className="rounded-xl border border-zinc-800 bg-zinc-900/70">
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex flex-col">
                    <span className="font-semibold text-white">{group.merchant}</span>
                    <span className="text-xs text-zinc-400">Subscriptions</span>
                  </div>
                  <span className="text-sm font-semibold text-white">{currency.format(group.total)}</span>
                </div>
                <div className="divide-y divide-zinc-800 text-xs text-zinc-200">
                  {group.rows.map((tx) => (
                    <div key={tx.id} className="grid grid-cols-3 items-center gap-2 px-4 py-2">
                      <span className="text-zinc-400">{dateFormatter.format(new Date(tx.date))}</span>
                      <span className="truncate pr-2" title={tx.description}>
                        {tx.description}
                      </span>
                      <span className="text-right font-semibold">
                        {currency.format(Math.abs(tx.amount))}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
