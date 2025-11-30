"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { GlassPanel } from "./dashboard/components/GlassPanel";
import { SectionHeader } from "./dashboard/components/SectionHeader";

type Slide =
  | { title: string; heading: string; body: string }
  | { title: string; heading: string; list: string[] };

export default function Home() {
  const [isLearnMoreOpen, setIsLearnMoreOpen] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);

  const stepCards = [
    {
      title: "Start with a messy month",
      stepCopy: "Start with a messy month of paychecks, bills, and everyday swipes.",
    },
    {
      title: "Tell us which accounts are yours",
      stepCopy: "Flag your own accounts so internal transfers stop inflating spending or income.",
    },
    {
      title: "Scan subscriptions and fees",
      stepCopy: "Spot recurring charges and junk fees without ever touching real bank logins.",
    },
  ];

  const learnMoreSlides: Slide[] = useMemo(
    () => [
      {
        title: "Step one",
        heading: "Drop in a messy month",
        body:
          "Upload or copy in paychecks, bills, and small purchases - basically the statement that feels too messy to look at.",
      },
      {
        title: "Step two",
        heading: "Let MoneyMap sort the clutter",
        body:
          "Mark which accounts are yours so internal transfers disappear from spending, then see everything else grouped clearly.",
      },
      {
        title: "Step three",
        heading: "Spot subscriptions and fees",
        body:
          "Scan a clean ledger of subscriptions, bank fees, and other leaks so you know what is draining your month.",
      },
      {
        title: "What you will see on your dashboard",
        heading: "A quick snapshot every time",
        list: ["Net", "Income", "Spending", "Subscriptions"],
      },
    ],
    [],
  );

  const currentSlide = learnMoreSlides[activeSlide] ?? learnMoreSlides[0];

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
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[url('/home-grid-bg.png')] bg-cover bg-center"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_32%,rgba(24,30,48,0.28),rgba(0,0,0,0.94)),linear-gradient(to_bottom,rgba(0,0,0,0.78),rgba(0,0,0,0.96))]"
      />
      <div className="relative text-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 pb-16 pt-20 sm:px-6 lg:px-8">
          <section className="relative">
            <GlassPanel variant="hero" className="relative overflow-hidden sm:px-10 sm:py-14">
              <div className="relative z-10 max-w-3xl space-y-4">
                <span className="inline-flex items-center rounded-full border border-emerald-400/50 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-100">
                  Phase one demo
                </span>
                <div className="space-y-3">
                  <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">Welcome to MoneyMap</h1>
                  <p className="max-w-2xl text-lg text-zinc-100">
                    Stress test your spending without sharing real bank logins.
                  </p>
                  <p className="max-w-3xl text-sm text-zinc-400">
                    Everything here runs on synthetic statements in your browser. No bank credentials, no uploads, just a safe
                    walkthrough of what MoneyMap could feel like.
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
                  >
                    Open the dashboard
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setIsLearnMoreOpen(true);
                      setActiveSlide(0);
                    }}
                    className="inline-flex items-center justify-center rounded-full border border-zinc-700 px-5 py-3 text-sm font-semibold text-white transition hover:border-zinc-500 hover:bg-zinc-800"
                  >
                    How it works
                  </button>
                </div>
              </div>
            </GlassPanel>
          </section>

          <section className="mt-2 sm:mt-0">
            <GlassPanel variant="hero" className="space-y-6 sm:p-8">
              <SectionHeader
                label="How this demo works"
                title="Three quick steps to see a messy month cleaned up."
                caption="All of it stays fake, but the flow mirrors how MoneyMap would treat a real statement."
              />
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {stepCards.map((card, idx) => (
                  <GlassPanel
                    key={card.title}
                    className="group relative h-full transition duration-200 hover:-translate-y-1 hover:border-white/20 hover:shadow-[0_25px_70px_rgba(0,0,0,0.35)] focus-within:-translate-y-1 focus-within:border-white/22"
                  >
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Step {idx + 1}</div>
                    <p className="mt-2 text-sm font-semibold text-white">{card.title}</p>
                    <p className="mt-2 text-sm text-zinc-300">{card.stepCopy}</p>
                  </GlassPanel>
                ))}
              </div>
            </GlassPanel>
          </section>
        </div>

        {isLearnMoreOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
            onClick={handleClose}
            role="presentation"
          >
            <div
              className="w-full max-w-3xl rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                    How this demo works
                  </p>
                  <h3 className="mt-1 text-xl font-semibold text-white">{currentSlide.title}</h3>
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-full border border-zinc-700 px-3 py-1 text-xs font-semibold text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-800"
                  aria-label="Close overlay"
                >
                  Close
                </button>
              </div>
              <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
                <h4 className="text-lg font-semibold text-white">{currentSlide.heading}</h4>
                {"body" in currentSlide ? (
                  <p className="mt-2 text-sm text-zinc-300">{currentSlide.body}</p>
                ) : (
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-300">
                    {currentSlide.list.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div className="flex gap-2">
                  {learnMoreSlides.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => goToSlide(idx)}
                      className={`h-2.5 w-2.5 rounded-full transition ${
                        idx === activeSlide ? "bg-white" : "bg-zinc-700 hover:bg-zinc-500"
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
                    className="rounded-full border border-zinc-700 px-3 py-1 text-xs font-semibold text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <button
                    type="button"
                    onClick={() => goToSlide(activeSlide + 1)}
                    disabled={activeSlide === learnMoreSlides.length - 1}
                    className="rounded-full border border-zinc-700 px-3 py-1 text-xs font-semibold text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
