import React from "react";

import { months } from "../../../lib/dashboard/config";
import type { Transaction } from "../../../lib/fakeData";
import AddTransactionRow from "./AddTransactionRow";

export type StatementMonth = { key: number; label: string; transactions: Transaction[] };

type Props = {
  flowStep: "idle" | "statement" | "analyzing" | "results";
  showStatement: boolean;
  isEditing: boolean;
  selectedMonthFrom: number;
  selectedYearFrom: number;
  selectedMonthTo: number;
  selectedYearTo: number;
  yearOptions: number[];
  onStart: () => void;
  onRegenerate: () => void;
  onAnalyze: () => void;
  onToggleEditing: () => void;
  onToggleShowStatement: () => void;
  setSelectedMonthFrom: (value: number) => void;
  setSelectedYearFrom: (value: number) => void;
  setSelectedMonthTo: (value: number) => void;
  setSelectedYearTo: (value: number) => void;
  statementMonths: StatementMonth[];
  showGroupedTable: boolean;
  expandedMonths: Set<number>;
  setExpandedMonths: React.Dispatch<React.SetStateAction<Set<number>>>;
  statementTransactionsSorted: Transaction[];
  statementTransactions: Transaction[];
  currency: Intl.NumberFormat;
  dateFormatter: Intl.DateTimeFormat;
  categoryOptions: readonly string[];
  normalizedRange: { start: { month: number; year: number }; end: { month: number; year: number } };
  onAddTransaction: (details: { date: string; description: string; category: string; amount: string }) => boolean;
  onChangeCategory: (txId: string, category: string) => void;
};

export function StatementPanel({
  flowStep,
  showStatement,
  isEditing,
  selectedMonthFrom,
  selectedYearFrom,
  selectedMonthTo,
  selectedYearTo,
  yearOptions,
  onStart,
  onRegenerate,
  onAnalyze,
  onToggleEditing,
  onToggleShowStatement,
  setSelectedMonthFrom,
  setSelectedYearFrom,
  setSelectedMonthTo,
  setSelectedYearTo,
  statementMonths,
  showGroupedTable,
  expandedMonths,
  setExpandedMonths,
  statementTransactionsSorted,
  statementTransactions,
  currency,
  dateFormatter,
  categoryOptions,
  normalizedRange,
  onAddTransaction,
  onChangeCategory,
}: Props) {
  return (
    <>
      {flowStep === "idle" && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 px-5 py-8 text-center text-zinc-200">
          <h2 className="text-xl font-semibold text-white">Start your demo analysis</h2>
          <p className="mt-2 text-sm text-zinc-400">MoneyMap will generate a randomized demo statement and analyze it locally.</p>
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={onStart}
              className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black transition hover:bg-zinc-200"
            >
              Generate sample statement
            </button>
          </div>
        </div>
      )}

      {(flowStep === "statement" || flowStep === "analyzing" || flowStep === "results") && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 px-5 py-6 text-zinc-200 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Demo statement</h2>
              <p className="text-sm text-zinc-400">
                Randomized transactions across your selected months - income, bills, subscriptions, fees, and transfers.
              </p>
              {isEditing && <p className="mt-1 text-xs text-zinc-500">Editing only affects this demo and saves locally on this device.</p>}
              <div className="mt-2 flex flex-col gap-3 text-xs text-zinc-300 sm:gap-4 md:flex-row md:items-start md:gap-6">
                <div className="flex w-full flex-col gap-2 rounded-lg border border-zinc-800/80 bg-zinc-900/60 p-3 sm:gap-3 md:w-auto">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400">From</span>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
                    <label className="flex flex-col gap-1 text-zinc-400" htmlFor="month-from-select">
                      <span>Month</span>
                      <select
                        id="month-from-select"
                        className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-white"
                        value={selectedMonthFrom}
                        onChange={(e) => setSelectedMonthFrom(Number(e.target.value))}
                      >
                        {months.map((m, idx) => (
                          <option key={m} value={idx}>
                            {m}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="flex flex-col gap-1 text-zinc-400" htmlFor="year-from-select">
                      <span>Year</span>
                      <select
                        id="year-from-select"
                        className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-white"
                        value={selectedYearFrom}
                        onChange={(e) => setSelectedYearFrom(Number(e.target.value))}
                      >
                        {yearOptions.map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>
                <div className="flex w-full flex-col gap-2 rounded-lg border border-zinc-800/80 bg-zinc-900/60 p-3 sm:gap-3 md:w-auto">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400">To</span>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
                    <label className="flex flex-col gap-1 text-zinc-400" htmlFor="month-to-select">
                      <span>Month</span>
                      <select
                        id="month-to-select"
                        className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-white"
                        value={selectedMonthTo}
                        onChange={(e) => setSelectedMonthTo(Number(e.target.value))}
                      >
                        {months.map((m, idx) => (
                          <option key={m} value={idx}>
                            {m}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="flex flex-col gap-1 text-zinc-400" htmlFor="year-to-select">
                      <span>Year</span>
                      <select
                        id="year-to-select"
                        className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-white"
                        value={selectedYearTo}
                        onChange={(e) => setSelectedYearTo(Number(e.target.value))}
                      >
                        {yearOptions.map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onToggleEditing}
                className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
                  isEditing ? "border-emerald-400 bg-emerald-900/40 text-emerald-100" : "border-zinc-700 bg-zinc-900 text-white hover:border-zinc-500 hover:bg-zinc-800"
                }`}
              >
                {isEditing ? "Done editing" : "Edit transactions"}
              </button>
              {flowStep !== "results" && (
                <>
                  <button
                    type="button"
                    onClick={onRegenerate}
                    disabled={flowStep === "analyzing"}
                    className="rounded-full border border-zinc-700 px-4 py-2 text-xs font-semibold text-white transition hover:border-zinc-500 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Regenerate statement
                  </button>
                  <button
                    type="button"
                    onClick={onAnalyze}
                    disabled={flowStep === "analyzing" || statementTransactions.length === 0}
                    className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs font-semibold text-black shadow-sm transition hover:bg-zinc-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-white/80 focus-visible:ring-offset-zinc-900 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Analyze this statement
                    <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <path d="M3.75 8h8.5m0 0L9.5 4.75M12.25 8 9.5 11.25" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </>
              )}
              {flowStep === "results" && (
                <button
                  type="button"
                  onClick={onToggleShowStatement}
                  className="rounded-full border border-zinc-700 px-4 py-2 text-xs font-semibold text-white transition hover:border-zinc-500 hover:bg-zinc-800"
                >
                  {showStatement ? "Hide statement" : "Show statement"}
                </button>
              )}
            </div>
          </div>
          {flowStep === "analyzing" && (
            <div className="mt-4 flex items-center gap-2 text-sm text-zinc-300">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent" />
              <span>Analyzing...</span>
            </div>
          )}
          {showStatement && (
            <div className="mt-4">
              {showGroupedTable ? (
                <div className="space-y-3">
                  {statementMonths.map((month) => {
                    const isOpen = expandedMonths.has(month.key);
                    const monthTotal = month.transactions.reduce((sum, tx) => sum + tx.amount, 0);
                    return (
                      <div key={month.key} className="rounded-xl border border-zinc-800 bg-zinc-900/70">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedMonths((prev) => {
                              const next = new Set(prev);
                              if (next.has(month.key)) {
                                next.delete(month.key);
                              } else {
                                next.add(month.key);
                              }
                              return next;
                            })
                          }
                          className="flex w-full items-center justify-between rounded-t-xl px-4 py-3 text-left transition hover:bg-zinc-800/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                        >
                          <div>
                            <p className="text-sm font-semibold text-white">{month.label}</p>
                            <p className="text-xs text-zinc-400">{month.transactions.length} transactions · {currency.format(monthTotal)}</p>
                          </div>
                          <svg className={`h-4 w-4 text-zinc-400 transition-transform ${isOpen ? "rotate-90" : ""}`} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                            <path d="M6 3.75 11 8l-5 4.25" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                        {isOpen && (
                          <div className="overflow-x-auto border-t border-zinc-800">
                            <div className="min-w-[520px]">
                              <div className="grid grid-cols-4 bg-zinc-900/80 px-3 py-2 text-left text-xs font-semibold text-zinc-300 sm:px-4 sm:text-sm">
                                <span>Date</span>
                                <span>Description</span>
                                <span>Category</span>
                                <span className="text-right">Amount</span>
                              </div>
                              <div className="divide-y divide-zinc-800">
                                {month.transactions.map((tx) => (
                                  <div key={tx.id} className="grid grid-cols-4 items-center px-3 py-3 text-xs text-zinc-200 sm:px-4 sm:text-sm">
                                    <span className="text-zinc-300">{dateFormatter.format(new Date(tx.date))}</span>
                                    <span className="truncate" title={tx.description}>
                                      {tx.description}
                                    </span>
                                    <span className="text-zinc-400">
                                      {isEditing ? (
                                        <select
                                          className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-200 outline-none"
                                          value={tx.category}
                                          onChange={(e) => onChangeCategory(tx.id, e.target.value)}
                                        >
                                          {categoryOptions.map((cat) => (
                                            <option key={cat} value={cat}>
                                              {cat}
                                            </option>
                                          ))}
                                        </select>
                                      ) : (
                                        tx.category
                                      )}
                                    </span>
                                    <span className={`text-right font-medium ${tx.amount > 0 ? "text-emerald-400" : tx.amount < 0 ? "text-red-300" : "text-zinc-200"}`}>
                                      {currency.format(tx.amount)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-zinc-800">
                  <div className="min-w-[520px]">
                    <div className="grid grid-cols-4 bg-zinc-900/80 px-3 py-2 text-left text-xs font-semibold text-zinc-300 sm:px-4 sm:text-sm">
                      <span>Date</span>
                      <span>Description</span>
                      <span>Category</span>
                      <span className="text-right">Amount</span>
                    </div>
                    {statementTransactionsSorted.length === 0 ? (
                      <div className="px-3 py-3 text-xs text-zinc-400 sm:px-4 sm:text-sm">No transactions in this view.</div>
                    ) : (
                      <div className="divide-y divide-zinc-800">
                        {statementTransactionsSorted.map((tx) => (
                          <div key={tx.id} className="grid grid-cols-4 items-center px-3 py-3 text-xs text-zinc-200 sm:px-4 sm:text-sm">
                            <span className="text-zinc-300">{dateFormatter.format(new Date(tx.date))}</span>
                            <span className="truncate" title={tx.description}>
                              {tx.description}
                            </span>
                            <span className="text-zinc-400">
                              {isEditing ? (
                                <select
                                  className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-200 outline-none"
                                  value={tx.category}
                                  onChange={(e) => onChangeCategory(tx.id, e.target.value)}
                                >
                                  {categoryOptions.map((cat) => (
                                    <option key={cat} value={cat}>
                                      {cat}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                tx.category
                              )}
                            </span>
                            <span className={`text-right font-medium ${tx.amount > 0 ? "text-emerald-400" : tx.amount < 0 ? "text-red-300" : "text-zinc-200"}`}>
                              {currency.format(tx.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {isEditing && (
                    <div className="border-t border-zinc-800 bg-zinc-900/70 px-3 py-3 sm:px-4">
                      <AddTransactionRow
                        rangeStartMonth={normalizedRange.start.month}
                        rangeStartYear={normalizedRange.start.year}
                        rangeEndMonth={normalizedRange.end.month}
                        rangeEndYear={normalizedRange.end.year}
                        onAdd={onAddTransaction}
                      />
                    </div>
                  )}
                </div>
              )}
              {isEditing && showGroupedTable && (
                <div className="mt-3 rounded-xl border border-zinc-800 bg-zinc-900/70 px-3 py-3 sm:px-4">
                  <AddTransactionRow
                    rangeStartMonth={normalizedRange.start.month}
                    rangeStartYear={normalizedRange.start.year}
                    rangeEndMonth={normalizedRange.end.month}
                    rangeEndYear={normalizedRange.end.year}
                    onAdd={onAddTransaction}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}
