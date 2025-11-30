"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { GlassPanel } from "./dashboard/components/GlassPanel";

type Slide =
  | { title: string; heading: string; body: string }
  | { title: string; heading: string; list: string[]; cta?: boolean };

export default function Home() {
  const [isLearnMoreOpen, setIsLearnMoreOpen] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);

  const stepCards = [
    {
      title: "Upload a messy month",
      description: "Paychecks, bills, everyday purchases.",
      icon: "📄",
    },
    {
      title: "Flag your accounts",
      description: "Internal transfers stay separate.",
      icon: "🏦",
    },
    {
      title: "Spot hidden fees",
      description: "Subscriptions and charges, revealed.",
      icon: "🔍",
    },
  ];

  const learnMoreSlides: Slide[] = useMemo(
    () => [
      {
        title: "Step 1",
        heading: "Drop in a messy month",
        body: "Upload your paychecks, bills, and purchases—even the statement that feels overwhelming.",
      },
      {
        title: "Step 2",
        heading: "Let MoneyMap sort it",
        body: "Mark your accounts so transfers disappear from totals. Everything else gets grouped clearly.",
      },
      {
        title: "Step 3",
        heading: "See what matters",
        body: "Subscriptions, bank fees, and patterns that need attention—all in one clean view.",
      },
      {
        title: "Ready",
        heading: "Your dashboard awaits",
        list: ["Net cash flow", "Income breakdown", "Spending by category", "Subscription tracker"],
        cta: true,
      },
    ],
    [],
  );

  const currentSlide = learnMoreSlides[activeSlide] ?? learnMoreSlides[0];
  const isLastSlide = activeSlide === learnMoreSlides.length - 1;

  const handleClose = () => {
    setIsLearnMoreOpen(false);
    setActiveSlide(0);
  };

  const goToSlide = (next: number) => {
    if (next < 0 || next >= learnMoreSlides.length) return;
    setActiveSlide(next);
  };

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Background gradient */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-zinc-950 via-zinc-950 to-black"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.08),transparent_50%),radial-gradient(ellipse_at_bottom,rgba(139,92,246,0.06),transparent_50%)]"
      />

      <div className="relative text-white">
        <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 pb-16 pt-8 sm:gap-12 sm:px-6 sm:pt-12 lg:px-8">
          {/* Hero Section */}
          <section className="animate-fade-rise">
            <GlassPanel variant="hero" className="text-center sm:py-16">
              <div className="mx-auto max-w-2xl space-y-6">
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Demo
                </span>
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                  MoneyMap
                </h1>
                <p className="text-lg text-zinc-300 sm:text-xl">
                  Stress test your spending without sharing real bank logins.
                </p>
                <p className="text-sm text-zinc-500">
                  Synthetic data only. Nothing leaves your browser.
                </p>
                <div className="flex flex-col items-center justify-center gap-3 pt-2 sm:flex-row sm:gap-4">
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition-all hover:bg-zinc-100 hover:shadow-lg hover:shadow-white/10"
                  >
                    Open dashboard
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setIsLearnMoreOpen(true);
                      setActiveSlide(0);
                    }}
                    className="inline-flex items-center justify-center rounded-full border border-zinc-700 px-6 py-3 text-sm font-medium text-zinc-300 transition-all hover:border-zinc-500 hover:bg-white/5 hover:text-white"
                  >
                    How it works
                  </button>
                </div>
              </div>
            </GlassPanel>
          </section>

          {/* Step Cards */}
          <section className="animate-fade-rise" style={{ animationDelay: "0.1s" }}>
            <div className="mb-6 text-center">
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                Three steps
              </p>
              <h2 className="mt-2 text-xl font-semibold text-white sm:text-2xl">
                See a messy month cleaned up
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {stepCards.map((card, idx) => (
                <div
                  key={card.title}
                  className="group relative overflow-hidden rounded-2xl border border-white/8 bg-gradient-to-b from-zinc-900/80 to-zinc-950/80 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/5"
                >
                  <div className="flex h-full flex-col">
                    <span className="text-2xl">{card.icon}</span>
                    <p className="mt-4 text-xs font-medium uppercase tracking-wider text-zinc-500">
                      Step {idx + 1}
                    </p>
                    <h3 className="mt-1 text-base font-semibold text-white">
                      {card.title}
                    </h3>
                    <p className="mt-2 text-sm text-zinc-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      {card.description}
                    </p>
                  </div>
                  {/* Subtle glow on hover */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    style={{
                      background: "radial-gradient(circle at 50% 0%, rgba(16,185,129,0.08), transparent 60%)",
                    }}
                  />
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* How it works overlay */}
        {isLearnMoreOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm"
            onClick={handleClose}
            role="presentation"
          >
            <div
              className="w-full max-w-lg animate-fade-rise rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                    {currentSlide.title}
                  </p>
                  <h3 className="mt-1 text-xl font-semibold text-white">{currentSlide.heading}</h3>
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-full p-2 text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
                  aria-label="Close"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mt-4">
                {"body" in currentSlide ? (
                  <p className="text-sm leading-relaxed text-zinc-400">{currentSlide.body}</p>
                ) : (
                  <ul className="space-y-2 text-sm text-zinc-400">
                    {currentSlide.list.map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {"cta" in currentSlide && currentSlide.cta && (
                <Link
                  href="/dashboard"
                  onClick={handleClose}
                  className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-zinc-100"
                >
                  Get started
                </Link>
              )}

              <div className="mt-6 flex items-center justify-between">
                <div className="flex gap-1.5">
                  {learnMoreSlides.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => goToSlide(idx)}
                      className={`h-2 w-2 rounded-full transition-all ${
                        idx === activeSlide ? "bg-white w-4" : "bg-zinc-700 hover:bg-zinc-500"
                      }`}
                      aria-label={`Go to slide ${idx + 1}`}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => goToSlide(activeSlide - 1)}
                    disabled={activeSlide === 0}
                    className="rounded-full px-3 py-1.5 text-xs font-medium text-zinc-400 transition hover:bg-zinc-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Back
                  </button>
                  {!isLastSlide && (
                    <button
                      type="button"
                      onClick={() => goToSlide(activeSlide + 1)}
                      className="rounded-full bg-zinc-800 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-zinc-700"
                    >
                      Next
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
