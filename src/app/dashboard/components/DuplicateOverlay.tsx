import React from "react";

import type { DuplicateClusterView } from "../../../lib/dashboard/duplicates";
import { GlassPanel } from "./GlassPanel";

type Props = {
  duplicateClusters: DuplicateClusterView[];
  duplicateDecisions: Record<string, "confirmed" | "dismissed">;
  expandedDuplicateClusters: Set<string>;
  toggleDuplicateCluster: (key: string) => void;
  handleCloseDuplicateOverlay: () => void;
  handleConfirmDuplicate: (id: string) => void;
  handleDismissDuplicate: (id: string) => void;
  duplicateOverlayRef: React.RefObject<HTMLDivElement>;
  currency: Intl.NumberFormat;
  dateFormatter: Intl.DateTimeFormat;
};

export function DuplicateOverlay({
  duplicateClusters,
  duplicateDecisions,
  expandedDuplicateClusters,
  toggleDuplicateCluster,
  handleCloseDuplicateOverlay,
  handleConfirmDuplicate,
  handleDismissDuplicate,
  duplicateOverlayRef,
  currency,
  dateFormatter,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 px-3 py-6">
      <GlassPanel
        variant="hero"
        ref={duplicateOverlayRef}
        tabIndex={-1}
        className="w-full max-w-5xl p-0 overflow-hidden backdrop-blur-xl sm:backdrop-blur-2xl ring-white/12 shadow-2xl outline-none"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-4 sm:px-5">
          <h3 className="text-lg font-semibold text-white">Possible duplicate charges</h3>
          <button
            type="button"
            className="rounded-full border border-zinc-700 px-3 py-2 text-xs font-semibold text-white transition hover:border-zinc-500 hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
            onClick={handleCloseDuplicateOverlay}
          >
            Close
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-4 sm:p-5 space-y-3 text-sm text-zinc-200">
          {duplicateClusters.length === 0 ? (
            <p className="text-zinc-400">No suspected duplicates for this statement.</p>
          ) : (
            duplicateClusters.map((cluster) => {
              const isExpanded = expandedDuplicateClusters.has(cluster.key);
              const suspiciousCount = cluster.suspiciousTransactions.length;
              return (
                <GlassPanel key={cluster.key} variant="card" className="p-0 backdrop-blur-xl">
                  <button
                    type="button"
                    onClick={() => toggleDuplicateCluster(cluster.key)}
                    className="flex w-full items-center justify-between px-4 py-3 text-left text-white transition hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
                  >
                    <span>{cluster.label}</span>
                    <span className="text-xs text-zinc-400">
                      {suspiciousCount} suspicious · {currency.format(cluster.suspiciousTotal)}
                    </span>
                  </button>
                  {isExpanded && (
                    <div className="divide-y divide-zinc-800 text-xs text-zinc-200">
                      {cluster.suspiciousTransactions.map(({ tx, reason }) => {
                        const decision = duplicateDecisions[tx.id];
                        return (
                          <div key={tx.id} className="grid grid-cols-6 items-center px-4 py-2">
                            <span className="text-zinc-400">{dateFormatter.format(new Date(tx.date))}</span>
                            <span className="truncate pr-2" title={tx.description}>
                              {tx.description}
                            </span>
                            <span className="text-zinc-400">{tx.category}</span>
                            <span className="text-amber-200">{reason}</span>
                            <span
                              className={`text-right font-semibold ${
                                tx.amount > 0 ? "text-emerald-400" : tx.amount < 0 ? "text-red-300" : "text-zinc-200"
                              }`}
                            >
                              {currency.format(tx.amount)}
                            </span>
                            <div className="flex justify-end gap-2">
                              {decision !== "dismissed" ? (
                                <>
                                  <button
                                    type="button"
                                    className="rounded-full border border-amber-300/60 px-2 py-[3px] text-[10px] font-semibold text-amber-100 transition hover:border-amber-200 hover:bg-amber-900/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-200/70 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
                                    onClick={() => handleConfirmDuplicate(tx.id)}
                                  >
                                    Confirm
                                  </button>
                                  <button
                                    type="button"
                                    className="rounded-full border border-zinc-700 px-2 py-[3px] text-[10px] font-semibold text-zinc-200 transition hover:border-zinc-500 hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
                                    onClick={() => handleDismissDuplicate(tx.id)}
                                  >
                                    Dismiss
                                  </button>
                                </>
                              ) : decision === "confirmed" ? (
                                <span className="text-[10px] text-amber-200">Marked</span>
                              ) : (
                                <span className="text-[10px] text-zinc-500">Dismissed</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </GlassPanel>
              );
            })
          )}
        </div>
      </GlassPanel>
    </div>
  );
}




