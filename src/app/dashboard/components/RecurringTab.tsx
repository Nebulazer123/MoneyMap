import React from "react";

import type { TabId } from "../../../lib/dashboard/config";
import type { Transaction } from "../../../lib/fakeData";
import { SectionHeader } from "./SectionHeader";

type Props = {
  currency: Intl.NumberFormat;
  dateFormatter: Intl.DateTimeFormat;
  recurringRows: Transaction[];
  duplicateDecisions: Record<string, "confirmed" | "dismissed">;
  activeDuplicateIds: Set<string>;
  duplicateMetaById: Map<string, { clusterKey: string; label: string; category: string; lastNormalDate: string | null }>;
  handleOpenDuplicateOverlay: (trigger?: HTMLElement | null) => void;
  handleConfirmDuplicate: (id: string) => void;
  handleDismissDuplicate: (id: string) => void;
  flowStep: TabId | "idle" | "statement" | "analyzing" | "results";
};

export function RecurringTab({
  currency,
  dateFormatter,
  recurringRows,
  duplicateDecisions,
  activeDuplicateIds,
  duplicateMetaById,
  handleOpenDuplicateOverlay,
  handleConfirmDuplicate,
  handleDismissDuplicate,
}: Props) {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="Subscriptions, bills, and auto payments"
        description="This month's recurring charges"
      />
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-6 text-zinc-200 sm:px-6">
      <div className="mt-3 flex flex-wrap items-center gap-3">
        {activeDuplicateIds.size > 0 ? (
          <p className="text-xs text-amber-200">We spotted charges that look off-pattern. Review them to confirm or dismiss.</p>
        ) : (
          <p className="text-xs text-zinc-500">No suspected duplicates right now.</p>
        )}
        <button
          type="button"
          onClick={(e) => handleOpenDuplicateOverlay(e.currentTarget)}
          className="ml-auto inline-flex items-center justify-center rounded-full border border-zinc-700 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:border-zinc-500 hover:bg-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
        >
          Show possible duplicates
        </button>
      </div>
      <div className="mt-4 overflow-x-auto rounded-lg border border-zinc-800">
        <div className="min-w-[520px]">
          <div className="grid grid-cols-4 bg-zinc-900/80 px-3 py-2 text-left text-xs font-semibold text-zinc-300 sm:px-4 sm:text-sm">
            <span>Name</span>
            <span>Category</span>
            <span className="text-right">Amount</span>
            <span className="text-right">Date</span>
          </div>
          <div className="divide-y divide-zinc-800">
            {recurringRows.map((row) => {
              const displayCategory =
                row.category === "Utilities" || row.category === "Bills & services" || row.category === "Bills"
                  ? "Bills and services"
                  : row.category;
              const duplicateDecision = duplicateDecisions[row.id];
              const isDuplicate = activeDuplicateIds.has(row.id);
              const isSuspicious = isDuplicate && duplicateDecision !== "dismissed";
              const meta = duplicateMetaById.get(row.id);
              const lastCharged = meta?.lastNormalDate ?? row.date;
              return (
                <div key={row.id} className="grid grid-cols-4 items-center px-3 py-3 text-xs text-zinc-200 sm:px-4 sm:text-sm">
                  <div className="flex flex-col gap-1">
                    <span className="flex items-center gap-2 truncate" title={row.description}>
                      <span className="truncate">{row.description}</span>
                      {isSuspicious && (
                        <div className="group relative inline-flex items-center">
                          <span className="rounded-full border border-amber-300/50 bg-amber-900/30 px-2 py-[2px] text-[10px] font-medium text-amber-100">possible duplicate</span>
                          <div className="pointer-events-none absolute left-0 top-full z-10 mt-2 hidden w-max flex-col gap-2 rounded-lg border border-zinc-700 bg-zinc-900/90 px-3 py-2 text-[11px] text-zinc-200 shadow-lg group-hover:flex group-focus-within:flex">
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                className="rounded-full border border-amber-300/50 px-2 py-[3px] font-semibold text-amber-100 transition hover:border-amber-200 hover:bg-amber-900/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-200/70"
                                onClick={() => handleConfirmDuplicate(row.id)}
                              >
                                Confirm problem
                              </button>
                              <button
                                type="button"
                                className="rounded-full border border-zinc-700 px-2 py-[3px] font-semibold text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                                onClick={() => handleDismissDuplicate(row.id)}
                              >
                                Dismiss
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </span>
                    {isSuspicious && (
                      <p className="text-[11px] text-zinc-500">Last charged on {dateFormatter.format(new Date(lastCharged))}</p>
                    )}
                  </div>
                  <span className="text-zinc-400">{displayCategory}</span>
                  <span className="text-right font-medium">{currency.format(row.amount)}</span>
                  <span className="text-right text-zinc-400">{dateFormatter.format(new Date(row.date))}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
