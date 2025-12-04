"use client";

import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { useUIStore } from '@/lib/store/useUIStore';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
    children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
    const { isSidebarOpen } = useUIStore();

    return (
        <div className="relative min-h-screen bg-[url('/dashboard-bg.png')] bg-cover bg-center bg-fixed text-white selection:bg-purple-500/30 overflow-hidden">
            {/* Layered glass gradients */}
            <div className="absolute inset-0 bg-black/80 z-0" />
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-black/70 blur-2xl opacity-70 z-0" />
            <div className="absolute inset-0 pointer-events-none z-0">
                <div className="absolute -inset-10 bg-[radial-gradient(circle_at_20%_20%,rgba(168,85,247,0.15),transparent_40%),radial-gradient(circle_at_80%_10%,rgba(34,211,238,0.12),transparent_35%),radial-gradient(circle_at_20%_80%,rgba(16,185,129,0.12),transparent_35%)] blur-3xl" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_70%,rgba(236,72,153,0.12),transparent_45%)] blur-2xl opacity-70" />
            </div>

            <div className="relative z-10 flex min-h-screen">
                <Sidebar />

                <main
                    className={cn(
                        "min-h-screen w-full transition-all duration-300 ease-in-out",
                        isSidebarOpen ? "md:pl-64" : "pl-0"
                    )}
                >
                    <div className="mx-auto w-full px-4 py-8 sm:px-6 lg:px-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
