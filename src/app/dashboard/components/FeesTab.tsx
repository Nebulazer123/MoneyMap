import React from "react";

import type { Transaction } from "../../../lib/fakeData";

type Props = {
  currency: Intl.NumberFormat;
  dateFormatter: Intl.DateTimeFormat;
  feeRows: Transaction[];
  totalFees: number;
};

export function FeesTab({ currency, dateFormatter, feeRows, totalFees }: Props) {
  return (
    <div className="space-y-4 animate-fade-rise">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Fees</h2>
          <p className="text-sm text-zinc-500">Bank fees and service charges</p>
        </div>
        <div className="rounded-full border border-zinc-800 bg-zinc-900/50 px-4 py-2 text-sm">
          <span className="text-zinc-400">Total: </span>
          <span className="font-semibold text-white">{currency.format(totalFees)}</span>
        </div>
      </div>
      <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/50">
        <div className="min-w-[480px]">
          <div className="grid grid-cols-3 px-4 py-3 text-left text-xs font-medium text-zinc-500">
            <span>Name</span>
            <span className="text-right">Amount</span>
            <span className="text-right">Date</span>
          </div>
          <div className="divide-y divide-zinc-800/50">
            {feeRows.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-zinc-500">No fees detected</div>
            ) : (
              feeRows.map((row) => (
                <div key={row.id} className="grid grid-cols-3 items-center px-4 py-3 text-sm text-zinc-300">
                  <span className="truncate" title={row.description}>
                    {row.description}
                  </span>
                  <span className="text-right font-medium text-white">{currency.format(row.amount)}</span>
                  <span className="text-right text-zinc-500">{dateFormatter.format(new Date(row.date))}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
