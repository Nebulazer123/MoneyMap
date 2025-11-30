"use client";

import { useState } from "react";
import { GlassPanel } from "../dashboard/components/GlassPanel";

const faqItems = [
  {
    question: "Is this connected to my real bank?",
    answer: "No. Phase one runs on synthetic demo data only.",
  },
  {
    question: "Will MoneyMap ever store my data?",
    answer: "Not in this demo. If future versions store anything, they will say so clearly and ask first.",
  },
  {
    question: "Can I trust the numbers in the demo?",
    answer: "The math feels real, but merchants, dates, and amounts are randomized so it stays fake.",
  },
  {
    question: "Why build this?",
    answer: "It is a portfolio experiment in financial UX, data modeling, and clear language around money.",
  },
];

export default function AboutPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleItem = (index: number) => {
    setOpenIndex((current) => (current === index ? null : index));
  };

  return (
    <main className="text-white">
      <div className="mx-auto max-w-6xl space-y-8 px-4 pb-16 pt-10 sm:space-y-10 sm:px-6 lg:px-8 lg:pt-14">
        <GlassPanel variant="hero" className="sm:p-8">
          <div className="inline-flex items-center rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">
            Phase one demo
          </div>
          <div className="mt-4 space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">About MoneyMap</h1>
            <p className="text-sm text-zinc-300 sm:text-base">
              MoneyMap is a personal finance side project that runs entirely on synthetic demo data in this first phase. It never connects to real banks or cards. Everything stays in your browser.
            </p>
            <p className="text-xs text-zinc-500 sm:text-sm">Built with Next.js, TypeScript, Tailwind, and a lot of fake statements.</p>
          </div>
        </GlassPanel>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <GlassPanel className="h-full p-5">
            <div className="group inline-flex flex-col gap-2">
              <h3 className="text-lg font-semibold text-white">Who this is for</h3>
              <div className="h-px w-10 bg-emerald-500/60 transition-all group-hover:w-16" />
            </div>
            <ul className="mt-3 space-y-2 text-sm text-zinc-300">
              <li className="flex gap-2"><span className="text-emerald-300">{"•"}</span><span>People who stare at their bank app and feel slightly lost.</span></li>
              <li className="flex gap-2"><span className="text-emerald-300">{"•"}</span><span>Students learning how cash flow really behaves.</span></li>
              <li className="flex gap-2"><span className="text-emerald-300">{"•"}</span><span>Early stage founders or hiring managers testing a finance UX concept.</span></li>
            </ul>
          </GlassPanel>
          <GlassPanel className="h-full p-5">
            <div className="group inline-flex flex-col gap-2">
              <h3 className="text-lg font-semibold text-white">What MoneyMap does in phase one</h3>
              <div className="h-px w-10 bg-emerald-500/60 transition-all group-hover:w-16" />
            </div>
            <ul className="mt-3 space-y-2 text-sm text-zinc-300">
              <li className="flex gap-2"><span className="text-emerald-300">{"•"}</span><span>Generates messy synthetic statements.</span></li>
              <li className="flex gap-2"><span className="text-emerald-300">{"•"}</span><span>Labels income, spending, subscriptions, fees, and transfers.</span></li>
              <li className="flex gap-2"><span className="text-emerald-300">{"•"}</span><span>Turns the mess into simple summaries and charts.</span></li>
            </ul>
          </GlassPanel>
          <GlassPanel className="h-full p-5">
            <div className="group inline-flex flex-col gap-2">
              <h3 className="text-lg font-semibold text-white">What it does not do yet</h3>
              <div className="h-px w-10 bg-emerald-500/60 transition-all group-hover:w-16" />
            </div>
            <ul className="mt-3 space-y-2 text-sm text-zinc-300">
              <li className="flex gap-2"><span className="text-emerald-300">{"•"}</span><span>Does not connect to banks or credit cards.</span></li>
              <li className="flex gap-2"><span className="text-emerald-300">{"•"}</span><span>Does not store uploads or account credentials.</span></li>
              <li className="flex gap-2"><span className="text-emerald-300">{"•"}</span><span>Is not accounting software and does not pretend to be.</span></li>
            </ul>
          </GlassPanel>
        </section>

        <GlassPanel className="space-y-4 p-6">
          <div className="group inline-flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500">
            <span>How MoneyMap reads a month.</span>
            <div className="h-px w-10 bg-emerald-500/60 transition-all group-hover:w-16" />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <GlassPanel className="p-4">
              <p className="text-sm font-semibold text-white">1. Ingest a messy statement</p>
              <p className="mt-2 text-sm text-zinc-300">Randomizes merchants, dates, and amounts to imitate real noise without touching real accounts.</p>
            </GlassPanel>
            <GlassPanel className="p-4">
              <p className="text-sm font-semibold text-white">2. Separate real spending from transfers</p>
              <p className="mt-2 text-sm text-zinc-300">Applies ownership rules so moves between your own accounts do not inflate income or spending.</p>
            </GlassPanel>
            <GlassPanel className="p-4">
              <p className="text-sm font-semibold text-white">3. Highlight subscriptions, fees, and oddities</p>
              <p className="mt-2 text-sm text-zinc-300">Surfaces duplicate charges, recurring bills, and patterns that might need your attention.</p>
            </GlassPanel>
          </div>
        </GlassPanel>

        <section className="grid gap-4 lg:grid-cols-3">
          <GlassPanel className="p-5">
            <div className="group inline-flex flex-col gap-2">
              <h3 className="text-lg font-semibold text-white">Vision</h3>
              <div className="h-px w-10 bg-emerald-500/60 transition-all group-hover:w-16" />
            </div>
            <p className="mt-3 text-sm text-zinc-300">
              Long term, MoneyMap should accept real statements locally in the browser, label them clearly, and give calm suggestions instead of panic. The tool should feel like a coach that explains your month, not a bank that sells you products.
            </p>
          </GlassPanel>
          <GlassPanel className="p-5">
            <div className="group inline-flex flex-col gap-2">
              <h3 className="text-lg font-semibold text-white">Privacy and data</h3>
              <div className="h-px w-10 bg-emerald-500/60 transition-all group-hover:w-16" />
            </div>
            <p className="mt-3 text-sm text-zinc-300">
              This demo only uses fake data and never uploads anything. Future phases should still keep analysis local when possible and always ask for explicit consent before storing or sharing anything.
            </p>
          </GlassPanel>
          <GlassPanel className="p-5 lg:col-span-3">
            <div className="group inline-flex flex-col gap-2">
              <h3 className="text-lg font-semibold text-white">For employers and reviewers</h3>
              <div className="h-px w-10 bg-emerald-500/60 transition-all group-hover:w-16" />
            </div>
            <p className="mt-3 text-sm text-zinc-300">
              This is a personal side project to practice interface design, data modeling, and clear language around money. You can treat this repo and demo as a portfolio sample rather than a finished product.
            </p>
          </GlassPanel>
        </section>

        <GlassPanel className="p-5">
          <div className="group inline-flex flex-col gap-2">
            <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-500">Contact</h3>
            <div className="h-px w-10 bg-emerald-500/60 transition-all group-hover:w-16" />
          </div>
          <p className="mt-2 text-sm text-zinc-300">
            For now, imagine a contact email such as support@moneymapdemo.com. In reality, the best way to reach me is through the details in the project readme.
          </p>
        </GlassPanel>

        <GlassPanel className="space-y-4 p-6">
          <div className="group inline-flex flex-col gap-2">
            <h2 className="text-2xl font-semibold text-white">Roadmap</h2>
            <div className="h-px w-10 bg-emerald-500/60 transition-all group-hover:w-16" />
          </div>
          <div className="space-y-3">
            {[
              {
                label: "Phase one — demo only",
                body: "Synthetic statements, ownership aware analytics, and interactive dashboard tabs using demo data only.",
                variant: "primary",
              },
              {
                label: "Phase two — local uploads",
                body: "Local CSV uploads parsed in the browser, sharper duplicate detection, and more specific guidance about subscriptions and fees.",
                variant: "secondary",
              },
              {
                label: "Phase three — shared insights",
                body: "Optional account saving, trend history, and ways to export or share summaries while keeping ownership clear.",
                variant: "secondary",
              },
            ].map((item) => (
              <div
                key={item.label}
                className={`relative overflow-hidden rounded-xl p-4 pl-5 transition duration-200 hover:-translate-y-0.5 hover:border-emerald-400/40 ${
                  item.variant === "primary"
                    ? "border border-emerald-500/70 bg-emerald-500/10 shadow-md shadow-emerald-500/15"
                    : "border border-zinc-700 bg-zinc-900/70"
                }`}
              >
                <span className="absolute left-0 top-0 h-full w-1 bg-emerald-500/70" aria-hidden="true" />
                <p className="text-sm font-semibold text-white">{item.label}</p>
                <p className="mt-2 text-sm text-zinc-300">{item.body}</p>
              </div>
            ))}
          </div>
        </GlassPanel>

        <GlassPanel className="space-y-4 p-6">
          <div className="group inline-flex flex-col gap-2">
            <h2 className="text-2xl font-semibold text-white">FAQ</h2>
            <div className="h-px w-10 bg-emerald-500/60 transition-all group-hover:w-16" />
          </div>
          <div className="divide-y divide-zinc-800">
            {faqItems.map((item, index) => {
              const isOpen = openIndex === index;
              return (
                <div key={item.question} className="overflow-hidden rounded-xl border border-zinc-800/80 bg-white/5 transition duration-200 hover:-translate-y-0.5 hover:border-emerald-400/50">
                  <button
                    type="button"
                    onClick={() => toggleItem(index)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-white transition duration-200 hover:bg-zinc-800/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 sm:px-6"
                  >
                    <span>{item.question}</span>
                    <span
                      className={`text-xs text-zinc-400 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}
                      aria-hidden="true"
                    >
                      &gt;
                    </span>
                  </button>
                  {isOpen && (
                    <div className="border-t border-zinc-800 px-4 py-3 text-sm text-zinc-300 transition-all duration-200 sm:px-6">
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
