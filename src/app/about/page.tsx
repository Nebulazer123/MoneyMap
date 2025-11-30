"use client";

import { useState } from "react";
import { GlassPanel } from "../dashboard/components/GlassPanel";

const faqItems = [
  {
    question: "Is this connected to my real bank?",
    answer: "No. This demo uses only synthetic data generated in your browser.",
  },
  {
    question: "Will MoneyMap store my data?",
    answer: "Not in this demo. Future versions will always ask before storing anything.",
  },
  {
    question: "Can I trust the numbers?",
    answer: "The math is real, but all merchants and amounts are randomized samples.",
  },
  {
    question: "Why build this?",
    answer: "A portfolio project exploring financial UX and clear language around money.",
  },
];

export default function AboutPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleItem = (index: number) => {
    setOpenIndex((current) => (current === index ? null : index));
  };

  return (
    <main className="text-white">
      <div className="mx-auto max-w-4xl space-y-6 px-4 pb-16 pt-4 sm:space-y-8 sm:px-6 lg:px-8">
        {/* Hero */}
        <GlassPanel variant="hero" className="text-center animate-fade-rise">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Demo
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">About MoneyMap</h1>
          <p className="mx-auto mt-4 max-w-xl text-sm text-zinc-400 sm:text-base">
            A personal finance demo that runs entirely on synthetic data. 
            No bank connections. Everything stays in your browser.
          </p>
        </GlassPanel>

        {/* Three Column Grid */}
        <section className="grid gap-4 sm:grid-cols-3 animate-fade-rise" style={{ animationDelay: "0.1s" }}>
          <GlassPanel className="h-full">
            <h3 className="text-sm font-semibold text-white">Who it's for</h3>
            <ul className="mt-3 space-y-2 text-sm text-zinc-400">
              <li>• People curious about their spending patterns</li>
              <li>• Students learning cash flow basics</li>
              <li>• Anyone reviewing a finance UX concept</li>
            </ul>
          </GlassPanel>
          <GlassPanel className="h-full">
            <h3 className="text-sm font-semibold text-white">What it does</h3>
            <ul className="mt-3 space-y-2 text-sm text-zinc-400">
              <li>• Generates synthetic statements</li>
              <li>• Labels income, spending, and fees</li>
              <li>• Creates simple summaries and charts</li>
            </ul>
          </GlassPanel>
          <GlassPanel className="h-full">
            <h3 className="text-sm font-semibold text-white">What it doesn't do</h3>
            <ul className="mt-3 space-y-2 text-sm text-zinc-400">
              <li>• Connect to real banks</li>
              <li>• Store credentials or uploads</li>
              <li>• Pretend to be accounting software</li>
            </ul>
          </GlassPanel>
        </section>

        {/* How it works */}
        <GlassPanel className="animate-fade-rise" style={{ animationDelay: "0.15s" }}>
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Process</p>
          <h2 className="mt-1 text-lg font-semibold text-white">How MoneyMap reads a month</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
              <p className="text-sm font-medium text-white">1. Ingest</p>
              <p className="mt-1 text-sm text-zinc-400">Random merchants and amounts simulate real noise.</p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
              <p className="text-sm font-medium text-white">2. Separate</p>
              <p className="mt-1 text-sm text-zinc-400">Transfers between your accounts don't inflate totals.</p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
              <p className="text-sm font-medium text-white">3. Highlight</p>
              <p className="mt-1 text-sm text-zinc-400">Subscriptions and fees surface for attention.</p>
            </div>
          </div>
        </GlassPanel>

        {/* Vision & Privacy */}
        <div className="grid gap-4 sm:grid-cols-2 animate-fade-rise" style={{ animationDelay: "0.2s" }}>
          <GlassPanel className="h-full">
            <h3 className="text-sm font-semibold text-white">Vision</h3>
            <p className="mt-2 text-sm text-zinc-400">
              MoneyMap should feel like a calm coach that explains your month—not a bank selling products.
            </p>
          </GlassPanel>
          <GlassPanel className="h-full">
            <h3 className="text-sm font-semibold text-white">Privacy</h3>
            <p className="mt-2 text-sm text-zinc-400">
              This demo never uploads anything. Analysis stays local, and future versions will always ask first.
            </p>
          </GlassPanel>
        </div>

        {/* Roadmap */}
        <GlassPanel className="animate-fade-rise" style={{ animationDelay: "0.25s" }}>
          <h2 className="text-lg font-semibold text-white">Roadmap</h2>
          <div className="mt-4 space-y-3">
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
              <p className="text-sm font-medium text-white">Phase 1 — Demo</p>
              <p className="mt-1 text-sm text-zinc-400">Synthetic statements and interactive dashboard.</p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
              <p className="text-sm font-medium text-zinc-300">Phase 2 — Local uploads</p>
              <p className="mt-1 text-sm text-zinc-500">CSV parsing in browser, sharper duplicate detection.</p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
              <p className="text-sm font-medium text-zinc-300">Phase 3 — Insights</p>
              <p className="mt-1 text-sm text-zinc-500">Optional saving, trends, and exportable summaries.</p>
            </div>
          </div>
        </GlassPanel>

        {/* FAQ */}
        <GlassPanel className="animate-fade-rise" style={{ animationDelay: "0.3s" }}>
          <h2 className="text-lg font-semibold text-white">FAQ</h2>
          <div className="mt-4 space-y-2">
            {faqItems.map((item, index) => {
              const isOpen = openIndex === index;
              return (
                <div key={item.question} className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50">
                  <button
                    type="button"
                    onClick={() => toggleItem(index)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-white transition hover:bg-zinc-800/50"
                  >
                    <span>{item.question}</span>
                    <span className={`text-zinc-500 transition-transform ${isOpen ? "rotate-45" : ""}`}>+</span>
                  </button>
                  {isOpen && (
                    <div className="border-t border-zinc-800 px-4 py-3 text-sm text-zinc-400">
                      {item.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </GlassPanel>
      </div>
    </main>
  );
}
