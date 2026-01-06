"use client";

import Link from "next/link";
import { ArrowLeft, Github, Shield, Database, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";

export default function AboutPage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-white">
            {/* Background Glow */}
            <div className="fixed -top-40 -left-40 h-96 w-96 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />
            <div className="fixed -bottom-40 -right-40 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-2xl w-full space-y-8 animate-fade-in">
                {/* Back Link */}
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Home
                </Link>

                {/* Header */}
                <div className="space-y-4">
                    <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-purple-300 via-blue-300 to-cyan-300 bg-clip-text text-transparent">
                        About MoneyMap
                    </h1>
                    <p className="text-lg text-zinc-400">
                        A modern, local-first personal finance dashboard built to demonstrate
                        full-stack development skills with Next.js, React, and TypeScript.
                    </p>
                </div>

                {/* What This Is */}
                <GlassCard className="p-6 space-y-4">
                    <div className="flex items-center gap-3">
                        <Sparkles className="h-5 w-5 text-purple-400" />
                        <h2 className="text-xl font-semibold text-white">What This Demonstrates</h2>
                    </div>
                    <ul className="space-y-2 text-zinc-300 text-sm">
                        <li className="flex items-start gap-2">
                            <span className="text-purple-400 mt-1">•</span>
                            <span><strong>Next.js 16 App Router</strong> with server and client components</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-purple-400 mt-1">•</span>
                            <span><strong>React 19</strong> with hooks, state management (Zustand), and modern patterns</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-purple-400 mt-1">•</span>
                            <span><strong>TypeScript</strong> with strict typing throughout</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-purple-400 mt-1">•</span>
                            <span><strong>Tailwind CSS 4</strong> with custom glassmorphism design system</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-purple-400 mt-1">•</span>
                            <span><strong>Data visualization</strong> with Recharts and interactive dashboards</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-purple-400 mt-1">•</span>
                            <span><strong>API integration</strong> with caching, rate limiting, and error handling</span>
                        </li>
                    </ul>
                </GlassCard>

                {/* Demo Data Notice */}
                <GlassCard className="p-6 space-y-4" tint="amber">
                    <div className="flex items-center gap-3">
                        <Database className="h-5 w-5 text-amber-400" />
                        <h2 className="text-xl font-semibold text-white">Demo Data Notice</h2>
                    </div>
                    <p className="text-zinc-300 text-sm leading-relaxed">
                        All financial data displayed is <strong>synthetically generated</strong> for demonstration purposes.
                        No real bank connections, transactions, or personal financial information is used.
                        The &quot;lifestyle profiles&quot; create realistic-looking transaction patterns
                        including merchants, subscriptions, and spending categories.
                    </p>
                </GlassCard>

                {/* Privacy */}
                <GlassCard className="p-6 space-y-4" tint="emerald">
                    <div className="flex items-center gap-3">
                        <Shield className="h-5 w-5 text-emerald-400" />
                        <h2 className="text-xl font-semibold text-white">Privacy</h2>
                    </div>
                    <p className="text-zinc-300 text-sm leading-relaxed">
                        MoneyMap is <strong>local-first</strong>. All data is stored in your browser&apos;s
                        localStorage and never sent to external servers. There is no user tracking,
                        analytics, or data collection. External API calls (for stocks, news, etc.)
                        are made server-side and do not include any personal information.
                    </p>
                </GlassCard>

                {/* Contact / Links */}
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <Link href="/dashboard">
                        <Button size="lg" className="w-full sm:w-auto gap-2 bg-white text-black hover:bg-zinc-200">
                            <Sparkles className="h-4 w-4" />
                            Try the Demo
                        </Button>
                    </Link>
                    <a
                        href="https://github.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex"
                    >
                        <Button
                            size="lg"
                            variant="secondary"
                            className="w-full sm:w-auto gap-2 border-white/20 hover:bg-white/10"
                        >
                            <Github className="h-4 w-4" />
                            View Source
                        </Button>
                    </a>
                </div>

                {/* Footer */}
                <p className="text-center text-zinc-500 text-xs pt-8">
                    Built with Next.js, React, TypeScript, and Tailwind CSS
                </p>
            </div>
        </div>
    );
}

