"use client";

import { useState } from "react";

const faqItems = [
  {
    question: "Is this connected to my real bank?",
    answer:
      "No. Phase one runs entirely on fake, locally generated statements. There are no bank connections, API keys, or real credentials involved.",
  },
  {
    question: "Will MoneyMap ever store my data?",
    answer:
      "The intent is local-first. If persistence is added later, it will be opt-in with explicit consent and clear visibility into what is saved.",
  },
  {
    question: "Can I trust the numbers in the demo?",
    answer:
      "The math mirrors real-world cash flow patterns, but merchants, dates, and amounts are randomized to stay synthetic.",
  },
  {
    question: "Why build this?",
    answer:
      "It is a portfolio-level experiment in financial UX, data modeling, and calm language around money for reviewers and potential collaborators.",
  },
];

export default function AboutPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleItem = (index: number) => {
    setOpenIndex((current) => (current === index ? null : index));
  };

  return (
    <main className="text-white">
      <div className="mx-auto max-w-6xl space-y-10 px-4 pb-16 pt-10 sm:space-y-12 sm:px-6 lg:px-8 lg:pt-14">
        <section className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 sm:p-8 shadow-lg shadow-black/20">
          <div className="inline-flex items-center rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">
            Phase one demo
          </div>
          <div className="mt-4 space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">About MoneyMap</h1>
            <p className="text-sm text-zinc-300 sm:text-base">
              MoneyMap is a personal finance dashboard concept that runs entirely on synthetic demo data in this phase. It never connects to real banks or cards and keeps everything local to your browser.
            </p>
            <p className="text-xs text-zinc-500 sm:text-sm">Built with Next.js, TypeScript, Tailwind, and local demo data.</p>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-md shadow-black/10">
            <h3 className="text-lg font-semibold text-white">Who this is for</h3>
            <ul className="mt-3 space-y-2 text-sm text-zinc-300">
              <li className="flex gap-2"><span className="text-emerald-300">•</span><span>People who struggle to read messy bank statements.</span></li>
              <li className="flex gap-2"><span className="text-emerald-300">•</span><span>Early stage founders or hiring managers evaluating a finance UX concept.</span></li>
              <li className="flex gap-2"><span className="text-emerald-300">•</span><span>Students learning to reason about cash flow.</span></li>
            </ul>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-md shadow-black/10">
            <h3 className="text-lg font-semibold text-white">What MoneyMap does in phase one</h3>
            <ul className="mt-3 space-y-2 text-sm text-zinc-300">
              <li className="flex gap-2"><span className="text-emerald-300">•</span><span>Generate messy synthetic statements.</span></li>
              <li className="flex gap-2"><span className="text-emerald-300">•</span><span>Classify income, spending, subscriptions, fees, and transfers.</span></li>
              <li className="flex gap-2"><span className="text-emerald-300">•</span><span>Surface guidance in plain language.</span></li>
            </ul>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-md shadow-black/10">
            <h3 className="text-lg font-semibold text-white">What it does not do yet</h3>
            <ul className="mt-3 space-y-2 text-sm text-zinc-300">
              <li className="flex gap-2"><span className="text-emerald-300">•</span><span>Never connects to banks or cards.</span></li>
              <li className="flex gap-2"><span className="text-emerald-300">•</span><span>Does not store uploads.</span></li>
              <li className="flex gap-2"><span className="text-emerald-300">•</span><span>Not a replacement for accounting software.</span></li>
            </ul>
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 shadow-md shadow-black/10">
          <div className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500">How MoneyMap thinks about your month</div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
              <p className="text-sm font-semibold text-white">1. Ingest a messy statement</p>
              <p className="mt-2 text-sm text-zinc-300">Randomizes merchants, dates, and amounts to mirror real noise without risking real accounts.</p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
              <p className="text-sm font-semibold text-white">2. Separate real spending from transfers</p>
              <p className="mt-2 text-sm text-zinc-300">Applies ownership rules to ignore money that just moves between your own accounts so totals stay honest.</p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
              <p className="text-sm font-semibold text-white">3. Highlight subscriptions, fees, and oddities</p>
              <p className="mt-2 text-sm text-zinc-300">Surfaces duplicate charges, recurring bills, and trends that might need your attention.</p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-md shadow-black/10">
            <h3 className="text-lg font-semibold text-white">Vision</h3>
            <p className="mt-3 text-sm text-zinc-300">
              MoneyMap should eventually accept real statements locally in the browser, label them clearly, and give calm suggestions instead of noisy alerts. The long-term idea is a privacy-first coach, not a bank.
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-md shadow-black/10">
            <h3 className="text-lg font-semibold text-white">Privacy and data</h3>
            <p className="mt-3 text-sm text-zinc-300">
              The current build uses fake data only and never uploads anything. Future phases will keep analysis local where possible and ask for explicit consent before storing or sharing.
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-md shadow-black/10 lg:col-span-3">
            <h3 className="text-lg font-semibold text-white">For employers and reviewers</h3>
            <p className="mt-3 text-sm text-zinc-300">
              This is a personal side project to practice interface design, data modeling, and clear language around money. You can treat this repo and demo as a portfolio sample.
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-md shadow-black/10">
          <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-500">Contact</h3>
          <p className="mt-2 text-sm text-zinc-300">
            For now, imagine a contact email such as support@moneymapdemo.com, or reach out using the details in the project readme.
          </p>
        </section>

        <section className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 shadow-md shadow-black/10">
          <h2 className="text-2xl font-semibold text-white">Roadmap</h2>
          <div className="space-y-3">
            {[
              {
                label: "Phase one — demo only",
                body: "Synthetic statements, ownership-aware analytics, and interactive dashboard tabs with no real uploads.",
              },
              {
                label: "Phase two — local uploads",
                body: "User-supplied CSV uploads parsed in the browser, sharper duplicate detection, and more helpful guidance.",
              },
              {
                label: "Phase three — shared insights",
                body: "Optional account saving, trend history, and ways to export or share summaries while still keeping ownership clear.",
              },
            ].map((item, index) => (
              <div
                key={item.label}
                className="relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 pl-5 transition hover:border-emerald-600/60"
              >
                <span className="absolute left-0 top-0 h-full w-1 bg-emerald-500/70" aria-hidden="true" />
                <p className="text-sm font-semibold text-white">{item.label}</p>
                <p className="mt-2 text-sm text-zinc-300">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 shadow-md shadow-black/10">
          <h2 className="text-2xl font-semibold text-white">FAQ</h2>
          <div className="space-y-3">
            {faqItems.map((item, index) => {
              const isOpen = openIndex === index;
              return (
                <div key={item.question} className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/70">
                  <button
                    type="button"
                    onClick={() => toggleItem(index)}
                    className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-white transition hover:bg-zinc-800/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
                  >
                    <span>{item.question}</span>
                    <span className="text-xs text-zinc-400">{isOpen ? "−" : "+"}</span>
                  </button>
                  {isOpen && (
                    <div className="border-t border-zinc-800 px-4 py-3 text-sm text-zinc-300 transition-all duration-200">
                      {item.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
