 "use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Slide =
  | { title: string; heading: string; body: string }
  | { title: string; heading: string; list: string[] };

export default function Home() {
  const [isLearnMoreOpen, setIsLearnMoreOpen] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);

  const stepCards = [
    {
      title: "Have a messy statement?",
      defaultCopy: "Start with a month of paychecks, bills, and everyday spending.",
      stepCopy: "Drop in paychecks, bills, and small purchases you want to make sense of.",
    },
    {
      title: "Run the clutter through MoneyMap",
      defaultCopy: "Tell MoneyMap which accounts are yours so transfers stop bloating spending.",
      stepCopy:
        "We group regular charges, match your accounts, and turn the noise into a simple ledger.",
    },
    {
      title: "See subscriptions and fees clearly",
      defaultCopy: "Call out recurring charges, streaming, and the fees that pile up.",
      stepCopy:
        "We surface subscriptions, bank fees, and other recurring charges so they are easy to spot.",
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
          <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-950 via-[#0b1220] to-black px-6 py-12 shadow-[0_25px_80px_rgba(0,0,0,0.45)] ring-1 ring-white/10 sm:px-10 sm:py-16">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-80 bg-[radial-gradient(circle_at_18%_20%,rgba(255,255,255,0.08),transparent_38%),radial-gradient(circle_at_82%_12%,rgba(59,130,246,0.12),transparent_34%),radial-gradient(circle_at_50%_90%,rgba(16,185,129,0.1),transparent_45%)]"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.06)_0%,rgba(255,255,255,0)_28%),linear-gradient(300deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0)_32%)] opacity-70"
            />
            <div className="pointer-events-none absolute inset-8 rounded-2xl border border-white/5 bg-gradient-to-b from-white/5 via-white/0 to-transparent" />
            <div className="hero-wave" />
            <div className="hero-wave-fade" />
            <div className="relative z-10 max-w-3xl rounded-2xl border border-white/5 bg-black/30 p-6 backdrop-blur-sm sm:p-8">
              <div className="space-y-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                  Phase one demo
                </p>
                <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">MoneyMap</h1>
                <p className="max-w-3xl text-lg text-zinc-200">
                  Stress test your spending without sharing real data.
                </p>
                <p className="max-w-3xl text-sm text-zinc-400">
                  This demo runs on fake data only. It never connects to real banks or stores real statements.
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
                  >
                    Get started
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
            </div>
          </section>

          <section className="mx-auto max-w-6xl px-0 sm:px-0 mt-10 sm:mt-12 lg:mt-16">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-6 sm:p-8">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-white">How this demo works</h2>
                <p className="text-sm text-zinc-400">
                  Three quick steps to see how MoneyMap treats a messy month.
                </p>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {stepCards.map((card, idx) => (
                  <div
                    key={card.title}
                    tabIndex={0}
                    className="group relative rounded-xl border border-zinc-800 bg-zinc-900/80 p-4 transition-transform transition-shadow duration-200 hover:-translate-y-1 hover:border-zinc-600 hover:bg-zinc-900 hover:shadow-lg focus:-translate-y-1 focus:border-zinc-600 focus:bg-zinc-900 focus:shadow-lg focus:outline-none"
                  >
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                      Step {idx + 1}
                    </div>
                    <p className="mt-2 text-sm font-semibold text-white">{card.title}</p>
                    <p className="mt-1 text-sm text-zinc-400">{card.defaultCopy}</p>
                    <div className="pointer-events-none absolute left-0 right-0 top-full origin-top translate-y-2 opacity-0 transition-all duration-200 group-hover:translate-y-3 group-hover:opacity-100 group-focus:translate-y-3 group-focus:opacity-100">
                      <div className="rounded-xl border border-zinc-700 bg-zinc-900/90 p-3 shadow-lg">
                        <p className="text-sm text-zinc-200">{card.stepCopy}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
