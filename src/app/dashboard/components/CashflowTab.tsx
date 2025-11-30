import React, { useMemo } from "react";

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
  const transactionsByDate = useMemo(() => {
    const map: Record<string, Transaction[]> = {};
    for (const tx of statementTransactions) {
      const key = tx.date;
      (map[key] ||= []).push(tx);
    }
    return map;
  }, [statementTransactions]);

  const TableHeader = () => (
    <div className="grid grid-cols-4 bg-gradient-to-r from-purple-500/10 to-transparent px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.1em] text-purple-200 sm:px-4 sm:text-sm border-b border-purple-500/20">
      <span>Date</span>
      <span className="text-right">Inflow</span>
      <span className="text-right">Outflow</span>
      <span className="text-right">Net</span>
    </div>
  );

  const DayRow = ({ row }: { row: CashflowRow }) => {
    const isDayExpanded = expandedCashflowDates[row.date];
    const dayTransactions = transactionsByDate[row.date] ?? [];
    const panelId = `day-${row.date}`;
    return (
      <div className="text-xs sm:text-sm">
        <button
          type="button"
          aria-expanded={!!isDayExpanded}
          aria-controls={panelId}
          onClick={() =>
            setExpandedCashflowDates((prev) => ({
              ...prev,
              [row.date]: !prev[row.date],
            }))
          }
          className="grid w-full grid-cols-4 items-center px-3 py-3 text-left text-zinc-200 transition duration-200 hover:bg-zinc-800/60 sm:px-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-300/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
        >
          <span className="text-zinc-300">{dateFormatter.format(new Date(row.date))}</span>
          <span className="text-right font-medium text-emerald-400">{currency.format(row.totalInflowForThatDate)}</span>
          <span className="text-right font-medium text-rose-400">{currency.format(row.totalOutflowForThatDate)}</span>
          <span className={`flex items-center justify-end gap-2 text-right font-semibold ${row.netForThatDate >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
            <svg className={`h-3 w-3 text-zinc-400 transition-transform ${isDayExpanded ? "rotate-90" : ""}`} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {currency.format(row.netForThatDate)}
          </span>
        </button>
        {isDayExpanded && (
          <div id={panelId} className="border-t border-zinc-800 bg-zinc-900/70 px-4 py-3 text-zinc-200">
            {dayTransactions.length === 0 ? (
              <p className="text-[11px] text-zinc-400">No transactions for this day.</p>
            ) : (
              <div className="space-y-2 text-[11px] sm:text-xs">
                {dayTransactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between">
                    <span className="truncate pr-2" title={tx.description}>
                      {tx.description}
                    </span>
                    <span className={`font-semibold ${tx.amount > 0 ? "text-emerald-400" : tx.amount < 0 ? "text-rose-400" : "text-zinc-200"}`}>
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
  };

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
                className="overflow-hidden p-0 transition transform hover:-translate-y-0.5 hover:ring-white/14 hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)] focus-within:ring-2 focus-within:ring-purple-300/60 focus-within:ring-offset-2 focus-within:ring-offset-zinc-900 backdrop-blur-xl sm:backdrop-blur-2xl"
              >
                <button
                  type="button"
                  aria-expanded={isExpanded}
                  aria-controls={`month-${month.key}-rows`}
                  onClick={toggle}
                  className="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-zinc-800/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-300/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
                >
                  <div className="space-y-1 text-sm">
                    <p className="font-semibold text-white">{month.label}</p>
                    <div className="flex flex-wrap gap-4 text-[11px] text-zinc-400">
                      <span>In: {currency.format(month.totalIn)}</span>
                      <span>Out: {currency.format(month.totalOut)}</span>
                      <span className={`font-semibold ${month.totalNet >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        Net: {currency.format(month.totalNet)}
                      </span>
                    </div>
                  </div>
                  <svg className="h-4 w-4 text-zinc-400" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d={isExpanded ? "M4 10 8 6l4 4" : "M4 6l4 4 4-4"} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                {isExpanded && (
                  <div className="overflow-x-auto border-t border-zinc-800">
                    <div className="min-w-[520px]">
                      <TableHeader />
                      <div className="divide-y divide-zinc-800">
                        {month.rows.map((row) => (
                          <DayRow key={row.date} row={row} />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </GlassPanel>
            );
          })}
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-lg border border-zinc-800">
          <div className="min-w-[520px]">
            <TableHeader />
            <div className="divide-y divide-zinc-800">
              {cashFlowRows.map((row) => (
                <DayRow key={row.date} row={row} />
              ))}
            </div>
          </div>
        </div>
      )}
    </GlassPanel>
  );
}
