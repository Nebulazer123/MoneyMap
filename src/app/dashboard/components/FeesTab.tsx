import React from "react";

import type { Transaction } from "../../../lib/fakeData";
import { SectionHeader } from "./SectionHeader";

type Props = {
  currency: Intl.NumberFormat;
  dateFormatter: Intl.DateTimeFormat;
  feeRows: Transaction[];
  totalFees: number;
};

export function FeesTab({ currency, dateFormatter, feeRows, totalFees }: Props) {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="Fees and charges that pile up"
        description="Bank and service fees this month"
      />
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-6 text-zinc-200 sm:px-6">
      <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-900/70 px-4 py-3 text-sm text-zinc-300">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-zinc-400">Total fees this month</span>
          <span className="text-lg font-semibold text-white">{currency.format(totalFees)}</span>
        </div>
      </div>
      <div className="mt-4 overflow-x-auto rounded-lg border border-zinc-800">
        <div className="min-w-[480px]">
          <div className="grid grid-cols-3 bg-zinc-900/80 px-3 py-2 text-left text-xs font-semibold text-zinc-300 sm:px-4 sm:text-sm">
            <span>Name</span>
            <span className="text-right">Amount</span>
            <span className="text-right">Date</span>
          </div>
          <div className="divide-y divide-zinc-800">
            {feeRows.map((row) => (
              <div key={row.id} className="grid grid-cols-3 items-center px-3 py-3 text-xs text-zinc-200 sm:px-4 sm:text-sm">
                <span className="truncate" title={row.description}>
                  {row.description}
                </span>
                <span className="text-right font-medium">{currency.format(row.amount)}</span>
                <span className="text-right text-zinc-400">{dateFormatter.format(new Date(row.date))}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
