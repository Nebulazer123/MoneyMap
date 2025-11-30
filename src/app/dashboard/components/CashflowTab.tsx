import React from "react";

import type { Transaction } from "../../../lib/fakeData";
import type { TabId } from "../../../lib/dashboard/config";
import InfoTip from "./InfoTip";
import { SectionHeader } from "./SectionHeader";
import { GlassPanel } from "./GlassPanel";

type CashflowRow = {
  date: string;
  totalInflowForThatDate: number;
  totalOutflowForThatDate: number;
  netForThatDate: number;
};

type CashflowMonth = {
  key: number;
  label: string;
  rows: CashflowRow[];
  totalIn: number;
  totalOut: number;
  totalNet: number;
};

type Props = {
  currency: Intl.NumberFormat;
  dateFormatter: Intl.DateTimeFormat;
  statementTransactions: Transaction[];
  cashFlowRows: CashflowRow[];
  cashflowMonths: CashflowMonth[];
  showGroupedCashflow: boolean;
  expandedCashflowMonths: Set<number>;
  setExpandedCashflowMonths: React.Dispatch<React.SetStateAction<Set<number>>>;
  expandedCashflowDates: Record<string, boolean>;
  setExpandedCashflowDates: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  flowStep: "idle" | "statement" | "analyzing" | "results" | TabId;
};

export function CashflowTab({
  currency,
  dateFormatter,
  statementTransactions,
  cashFlowRows,
  cashflowMonths,
  showGroupedCashflow,
  expandedCashflowMonths,
  setExpandedCashflowMonths,
  expandedCashflowDates,
  setExpandedCashflowDates,
}: Props) {
  return (
    <GlassPanel variant="card" className="px-4 py-6 text-zinc-200 sm:px-6 animate-fade-rise backdrop-blur-xl sm:backdrop-blur-2xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <SectionHeader title="Cashflow" caption="Income and spending over the month." />
        <InfoTip label={"Shows daily money in and out.\nInternal transfers between your own accounts are filtered out."} />
      </div>
      {showGroupedCashflow ? (
        <div className="mt-4 space-y-3">
          {cashflowMonths.map((month) => {
            const isExpanded = expandedCashflowMonths.has(month.key);
            const toggle = () =>
              setExpandedCashflowMonths((prev: Set<number>) => {
                const next = new Set(prev);
                if (next.has(month.key)) {
                  next.delete(month.key);
                } else {
                  next.add(month.key);
                }
                return next;
              });
            return (
              <GlassPanel
                key={month.key}
                variant="card"
                className="overflow-hidden p-0 transition transform hover:-translate-y-0.5 hover:ring-white/14 focus-within:ring-2 focus-within:ring-emerald-300/60 focus-within:ring-offset-2 focus-within:ring-offset-zinc-900 backdrop-blur-xl sm:backdrop-blur-2xl"
              >
                <div
                  role="button"
                  tabIndex={0}
                  onClick={toggle}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      toggle();
                    }
                  }}
                  className="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-zinc-800/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                >
                  <div className="space-y-1 text-sm">
                    <p className="font-semibold text-white">{month.label}</p>
                    <div className="flex flex-wrap gap-4 text-[11px] text-zinc-400">
                      <span>In: {currency.format(month.totalIn)}</span>
                      <span>Out: {currency.format(month.totalOut)}</span>
                      <span className={`font-semibold ${month.totalNet >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                        Net: {currency.format(month.totalNet)}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    aria-label="Toggle daily rows for this month"
                    aria-expanded={isExpanded}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggle();
                    }}
                    className="text-zinc-400 transition hover:text-zinc-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <path d={isExpanded ? "M4 10 8 6l4 4" : "M4 6l4 4 4-4"} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
                {isExpanded && (
                  <div className="overflow-x-auto border-t border-zinc-800">
                    <div className="min-w-[520px]">
                      <div className="grid grid-cols-4 bg-zinc-900/80 px-3 py-2 text-left text-xs font-semibold text-zinc-300 sm:px-4 sm:text-sm">
                        <span>Date</span>
                        <span className="text-right">Inflow</span>
                        <span className="text-right">Outflow</span>
                        <span className="text-right">Net</span>
                      </div>
                      <div className="divide-y divide-zinc-800">
                        {month.rows.map((row) => {
                          const isDayExpanded = expandedCashflowDates[row.date];
                          const dayTransactions = statementTransactions.filter((tx) => tx.date === row.date);
                          return (
                            <div key={row.date} className="text-xs sm:text-sm">
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedCashflowDates((prev) => ({
                                    ...prev,
                                    [row.date]: !prev[row.date],
                                  }))
                                }
                                onKeyDown={(event) => {
                                  if (event.key === "Enter" || event.key === " ") {
                                    event.preventDefault();
                                    setExpandedCashflowDates((prev) => ({
                                      ...prev,
                                      [row.date]: !prev[row.date],
                                    }));
                                  }
                                }}
                                className="grid w-full grid-cols-4 items-center px-3 py-3 text-left text-zinc-200 transition hover:bg-zinc-900 sm:px-4"
                              >
                                <span className="text-zinc-300">{dateFormatter.format(new Date(row.date))}</span>
                                <span className="text-right font-medium">{currency.format(row.totalInflowForThatDate)}</span>
                                <span className="text-right font-medium text-zinc-300">{currency.format(row.totalOutflowForThatDate)}</span>
                                <span className={`flex items-center justify-end gap-2 text-right font-semibold ${row.netForThatDate >= 0 ? "text-emerald-400" : "text-red-300"}`}>
                                  <span aria-hidden="true" className={`text-zinc-400 transition-transform ${isDayExpanded ? "rotate-90" : ""}`}>
                                    {isDayExpanded ? "▾" : "▸"}
                              </span>
                              {currency.format(row.netForThatDate)}
                            </span>
                          </button>
                          {isDayExpanded && (
                            <div className="border-t border-white/10 bg-zinc-950/70 px-4 py-3 text-zinc-200">
                              {dayTransactions.length === 0 ? (
                                <p className="text-[11px] text-zinc-400">No transactions for this day.</p>
                              ) : (
                                <div className="space-y-2 text-[11px] sm:text-xs">
                                  {dayTransactions.map((tx) => (
                                        <div key={tx.id} className="flex items-center justify-between">
                                          <span className="truncate pr-2" title={tx.description}>
                                            {tx.description}
                                          </span>
                                          <span className={`font-semibold ${tx.amount > 0 ? "text-emerald-400" : tx.amount < 0 ? "text-red-300" : "text-zinc-200"}`}>
                                            {currency.format(tx.amount)}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-lg border border-zinc-800">
          <div className="min-w-[520px]">
            <div className="grid grid-cols-4 bg-zinc-900/80 px-3 py-2 text-left text-xs font-semibold text-zinc-300 sm:px-4 sm:text-sm">
              <span>Date</span>
              <span className="text-right">Inflow</span>
              <span className="text-right">Outflow</span>
              <span className="text-right">Net</span>
            </div>
            <div className="divide-y divide-zinc-800">
              {cashFlowRows.map((row) => {
                const isDayExpanded = expandedCashflowDates[row.date];
                const dayTransactions = statementTransactions.filter((tx) => tx.date === row.date);
                return (
                  <div key={row.date} className="text-xs sm:text-sm">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedCashflowDates((prev) => ({
                          ...prev,
                          [row.date]: !prev[row.date],
                        }))
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setExpandedCashflowDates((prev) => ({
                            ...prev,
                            [row.date]: !prev[row.date],
                          }));
                        }
                      }}
                      className="grid w-full grid-cols-4 items-center px-3 py-3 text-left text-zinc-200 transition hover:bg-zinc-900 sm:px-4"
                    >
                      <span className="text-zinc-300">{dateFormatter.format(new Date(row.date))}</span>
                      <span className="text-right font-medium">{currency.format(row.totalInflowForThatDate)}</span>
                      <span className="text-right font-medium text-zinc-300">{currency.format(row.totalOutflowForThatDate)}</span>
                      <span className={`flex items-center justify-end gap-2 text-right font-semibold ${row.netForThatDate >= 0 ? "text-emerald-400" : "text-red-300"}`}>
                        <span aria-hidden="true" className={`text-zinc-400 transition-transform ${isDayExpanded ? "rotate-90" : ""}`}>
                          {isDayExpanded ? "▾" : "▸"}
                        </span>
                        {currency.format(row.netForThatDate)}
                      </span>
                    </button>
                    {isDayExpanded && (
                      <div className="border-t border-zinc-800 bg-zinc-900/70 px-4 py-3 text-zinc-200">
                        {dayTransactions.length === 0 ? (
                          <p className="text-[11px] text-zinc-400">No transactions for this day.</p>
                        ) : (
                          <div className="space-y-2 text-[11px] sm:text-xs">
                            {dayTransactions.map((tx) => (
                              <div key={tx.id} className="flex items-center justify-between">
                                <span className="truncate pr-2" title={tx.description}>
                                  {tx.description}
                                </span>
                                <span className={`font-semibold ${tx.amount > 0 ? "text-emerald-400" : tx.amount < 0 ? "text-red-300" : "text-zinc-200"}`}>
                                  {currency.format(tx.amount)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </GlassPanel>
  );
}
