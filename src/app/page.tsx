"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { GlassPanel } from "./dashboard/components/GlassPanel";
import { SectionHeader } from "./dashboard/components/SectionHeader";

type Slide =
  | { title: string; heading: string; body: string }
  | { title: string; heading: string; list: string[] };

function AnimatedCounter({
  targetValue,
  format,
  className = "",
}: {
  targetValue: number;
  format: (value: number) => string;
  className?: string;
}) {
  const [displayValue, setDisplayValue] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    if (!hasStarted) {
      const timer = setTimeout(() => setHasStarted(true), 100);
      return () => clearTimeout(timer);
    }

    if (!hasStarted || displayValue >= targetValue) return;

    const duration = 1500; // 1.5 seconds
    const startTime = Date.now();

    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);
      const currentValue = Math.floor(progress * targetValue);
      setDisplayValue(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayValue(targetValue);
      }
    };

    requestAnimationFrame(animate);
  }, [hasStarted, displayValue, targetValue]);

  return <div className={className}>{format(displayValue)}</div>;
}

export default function Home() {
  const router = useRouter();
  const [isLearnMoreOpen, setIsLearnMoreOpen] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);

  const stepCards = [
    {
      title: "Drop in a messy month",
      stepCopy: "Paychecks, bills, and swipes — drop in the chaos.",
      icon: (
        <svg className="h-8 w-8 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
        </svg>
      ),
    },
    {
      title: "Let MoneyMap sort the clutter",
      stepCopy: "Claim your accounts so transfers stop double-counting.",
      icon: (
        <svg className="h-8 w-8 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: "Spot subscriptions and fees",
      stepCopy: "See recurring charges and junk fees at a glance.",
      icon: (
        <svg className="h-8 w-8 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
  ];

  const learnMoreSlides: Slide[] = useMemo(
    () => [
      {
        title: "Step one",
        heading: "Drop in a messy month",
        body: "Paychecks, bills, and everyday swipes — the statement that feels too chaotic to read.",
      },
      {
        title: "Step two",
        heading: "Let MoneyMap sort the clutter",
        body: "Mark which accounts are yours so internal transfers stop inflating your spending.",
      },
      {
        title: "Step three",
        heading: "Spot subscriptions and fees",
        body: "Catch recurring charges and junk fees so you know what is quietly draining your month.",
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
  const isLastSlide = activeSlide === learnMoreSlides.length - 1;

  const handleClose = () => {
    setIsLearnMoreOpen(false);
    setActiveSlide(0);
  };

  const handleGetStarted = () => {
    handleClose();
    router.push("/dashboard");
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
        className="pointer-events-none absolute inset-0 bg-black/55 backdrop-blur-2xl bg-[radial-gradient(circle_at_18%_18%,rgba(27,148,120,0.08),transparent_42%),radial-gradient(circle_at_82%_14%,rgba(109,40,217,0.08),transparent_38%),linear-gradient(to_bottom,rgba(3,4,7,0.86),rgba(4,6,10,0.96))] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
      />
      <div className="relative text-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-16 px-4 pb-24 pt-24 sm:px-8 lg:px-10">
          <section className="relative">
            <GlassPanel variant="hero" className="relative overflow-hidden sm:px-10 sm:py-14">
              <div className="relative z-10 max-w-3xl space-y-4">
                <span className="inline-flex items-center rounded-full border border-purple-400/50 bg-purple-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-purple-100">
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
                    className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-100 hover:shadow-[0_0_20px_rgba(255,255,255,0.4)]"
                  >
                    Open the dashboard
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setIsLearnMoreOpen(true);
                      setActiveSlide(0);
                    }}
                    className="inline-flex items-center justify-center rounded-full border border-purple-400/60 px-5 py-3 text-sm font-semibold text-purple-100 transition hover:border-purple-300 hover:bg-purple-500/20 hover:shadow-[0_0_20px_rgba(168,85,247,0.4)]"
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
                    variant="card"
                    className="group relative flex h-auto flex-col overflow-hidden backdrop-blur-xl sm:backdrop-blur-2xl transition duration-200 hover:-translate-y-1 hover:ring-white/18 hover:shadow-[0_25px_70px_rgba(0,0,0,0.35)] focus-within:-translate-y-1 focus-within:ring-purple-200/40 focus-within:ring-2 focus-within:shadow-[0_25px_70px_rgba(0,0,0,0.35)] animate-fade-rise"
                    style={{ animationDelay: `${idx * 100}ms` }}
                  >
                    <div className="flex flex-col gap-4 p-5 outline-none focus-visible:outline-none" tabIndex={0}>
                      <div className="flex items-start gap-3">
                        <div className="mt-1 flex-shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12">
                          {card.icon}
                        </div>
                        <div className="flex-1">
                          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500 mb-1">Step {idx + 1}</div>
                          <p className="text-base font-semibold text-white sm:text-lg">{card.title}</p>
                        </div>
                      </div>
                      <div className="max-h-0 overflow-hidden opacity-0 transition-all duration-300 ease-out group-hover:max-h-32 group-hover:opacity-100 group-focus-within:max-h-32 group-focus-within:opacity-100">
                        <p className="text-sm text-zinc-300 leading-relaxed">{card.stepCopy}</p>
                      </div>
                    </div>
                  </GlassPanel>
                ))}
              </div>
            </GlassPanel>
          </section>

          <section className="mt-4">
            <div className="space-y-4">
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold text-white">Built for privacy and clarity</h2>
                <p className="text-sm text-zinc-400">What makes MoneyMap different</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  {
                    title: "Privacy First",
                    description: "No real bank connections. All processing stays in your browser.",
                    icon: (
                      <svg className="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    ),
                  },
                  {
                    title: "Lightning Fast",
                    description: "Analysis happens instantly. No waiting for API calls.",
                    icon: (
                      <svg className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    ),
                  },
                  {
                    title: "Smart Categories",
                    description: "Automatically sorts transactions into meaningful groups.",
                    icon: (
                      <svg className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                    ),
                  },
                  {
                    title: "Detects Recurring",
                    description: "Finds subscriptions and recurring charges automatically.",
                    icon: (
                      <svg className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    ),
                  },
                  {
                    title: "Real Insights",
                    description: "Spending patterns, cash flow, and budget guidance.",
                    icon: (
                      <svg className="h-6 w-6 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    ),
                  },
                  {
                    title: "Multi-Account",
                    description: "Handle checking, savings, credit cards all at once.",
                    icon: (
                      <svg className="h-6 w-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.856-1.487M15 10a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    ),
                  },
                ].map((feature, idx) => (
                  <GlassPanel
                    key={feature.title}
                    variant="card"
                    className="group relative flex flex-col p-5 transition duration-300 hover:-translate-y-1 hover:ring-white/18 hover:shadow-[0_25px_70px_rgba(0,0,0,0.35)] animate-fade-rise"
                    style={{ animationDelay: `${(idx + 3) * 100}ms` }}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="flex-shrink-0 transition-transform duration-300 group-hover:scale-110">
                        {feature.icon}
                      </div>
                    </div>
                    <h3 className="text-base font-semibold text-white mb-2">{feature.title}</h3>
                    <p className="text-sm text-zinc-400">{feature.description}</p>
                  </GlassPanel>
                ))}
              </div>
            </div>
          </section>

          <section className="mt-4">
            <GlassPanel variant="hero" className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold text-white">See your money clearly</h2>
                <p className="text-sm text-zinc-400">Dashboard preview from a sample month</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "Net Cash Flow", value: 3893, format: (v: number) => `$${v.toLocaleString()}`, color: "text-emerald-400" },
                  { label: "Income This Period", value: 25385, format: (v: number) => `$${v.toLocaleString()}`, color: "text-blue-400" },
                  { label: "Total Spending", value: 21491, format: (v: number) => `$${v.toLocaleString()}`, color: "text-orange-400" },
                  { label: "Subscriptions", value: 1338, format: (v: number) => `$${v.toLocaleString()}`, color: "text-purple-400" },
                ].map((metric, idx) => (
                  <GlassPanel
                    key={metric.label}
                    variant="card"
                    className="flex flex-col p-5 animate-fade-rise"
                    style={{ animationDelay: `${(idx + 9) * 100}ms` }}
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-400 mb-3">{metric.label}</p>
                    <AnimatedCounter
                      targetValue={metric.value}
                      format={metric.format}
                      className={`text-2xl font-bold ${metric.color}`}
                    />
                  </GlassPanel>
                ))}
              </div>
              <p className="text-center text-xs text-zinc-500 pt-4">Sample data from a demo month. Your actual data will vary.</p>
            </GlassPanel>
          </section>
        </div>

        {isLearnMoreOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm"
            onClick={handleClose}
            role="presentation"
          >
            <GlassPanel
              variant="hero"
              className="relative w-full max-w-[520px] sm:max-w-[560px] border-white/14 bg-black/60 p-0 ring-white/12 shadow-[0_32px_120px_rgba(0,0,0,0.65)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative flex flex-col gap-6 p-6 sm:p-7">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-200">
                      HOW THIS DEMO WORKS
                    </p>
                    <h3 className="mt-2 text-xl font-semibold text-white">{currentSlide.title}</h3>
                  </div>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-white transition hover:border-white/40 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-300/60"
                    aria-label="Close overlay"
                  >
                    Close
                  </button>
                </div>

                <div className="relative">
                  <div
                    className="group relative isolate mx-auto flex w-full max-w-[360px] flex-col rounded-[28px] bg-black/55 px-5 py-6 sm:px-6 sm:py-7 ring-1 ring-white/12 shadow-[0_25px_70px_rgba(0,0,0,0.55)] backdrop-blur-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple-300/60 focus-visible:outline-offset-4"
                    tabIndex={0}
                  >
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-x-6 top-4 h-9 rounded-full bg-gradient-to-b from-white/12 via-white/4 to-transparent opacity-70"
                    />
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute -inset-px rounded-[30px] ring-1 ring-white/12 shadow-[0_18px_44px_rgba(88,28,135,0.25),0_18px_44px_rgba(16,185,129,0.18)]"
                    />
                    <div className="relative z-10 flex flex-col gap-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-400">{currentSlide.title}</p>
                      <h4 className="text-lg font-semibold leading-tight text-white sm:text-xl">{currentSlide.heading}</h4>
                      <div
                        className="mt-1 max-h-0 overflow-hidden text-sm text-zinc-300 opacity-0 transition-all duration-200 ease-out motion-reduce:max-h-none motion-reduce:opacity-100 motion-reduce:translate-y-0 group-hover:max-h-40 group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:max-h-40 group-focus-within:opacity-100 group-focus-within:translate-y-0 translate-y-1"
                      >
                        {"body" in currentSlide ? (
                          <p className="leading-relaxed">{currentSlide.body}</p>
                        ) : (
                          <ul className="list-disc space-y-1 pl-5">
                            {currentSlide.list.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        )}
                        {isLastSlide && (
                          <button
                            type="button"
                            onClick={handleGetStarted}
                            className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-300/60"
                          >
                            Get started
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    {learnMoreSlides.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => goToSlide(idx)}
                        className={`h-2.5 w-2.5 rounded-full transition ${
                          idx === activeSlide ? "bg-white" : "bg-white/30 hover:bg-white/60"
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
                      className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-white transition hover:border-white/40 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-300/60 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Prev
                    </button>
                    <button
                      type="button"
                      onClick={() => goToSlide(activeSlide + 1)}
                      disabled={isLastSlide}
                      className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-white transition hover:border-white/40 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-300/60 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </GlassPanel>
          </div>
        )}
      </div>
    </main>
  );
}
