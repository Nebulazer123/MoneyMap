import { cn } from '@/lib/utils';
import { ReactNode, HTMLAttributes } from 'react';

// Accent color options for metric cards
export type AccentColor = 'green' | 'orange' | 'cyan' | 'purple' | 'yellow' | 'pink' | 'none';
export type GlassIntensity = 'light' | 'medium' | 'heavy' | 'ultra';
export type GlassTint = 'purple' | 'cyan' | 'emerald' | 'amber' | 'rose' | 'orange' | 'yellow' | 'pink' | 'blue' | 'white' | 'zinc' | 'slate' | 'teal' | 'lime' | 'indigo' | 'none';

const accentStyles: Record<AccentColor, string> = {
    green: 'border-l-4 border-l-emerald-500',
    orange: 'border-l-4 border-l-orange-500',
    cyan: 'border-l-4 border-l-cyan-500',
    purple: 'border-l-4 border-l-purple-500',
    yellow: 'border-l-4 border-l-yellow-500',
    pink: 'border-l-4 border-l-pink-500',
    none: '',
};

const intensityStyles: Record<GlassIntensity, string> = {
    light: 'bg-black/25 backdrop-blur-[16px] border-white/8 shadow-[0_8px_32px_rgba(0,0,0,0.3)]',
    medium: 'bg-black/35 backdrop-blur-[24px] border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.4)]',
    heavy: 'bg-black/45 backdrop-blur-[32px] border-white/12 shadow-[0_20px_60px_rgba(0,0,0,0.5)]',
    ultra: 'bg-black/55 backdrop-blur-[40px] border-white/15 shadow-[0_25px_80px_rgba(0,0,0,0.6)]',
};

const tintStyles: Record<GlassTint, string> = {
    purple: 'bg-purple-950/40 border-purple-500/25 shadow-[0_16px_48px_rgba(88,28,135,0.2)]',
    cyan: 'bg-cyan-950/40 border-cyan-500/25 shadow-[0_16px_48px_rgba(8,145,178,0.2)]',
    emerald: 'bg-emerald-950/40 border-emerald-500/25 shadow-[0_16px_48px_rgba(16,185,129,0.2)]',
    amber: 'bg-amber-950/40 border-amber-500/25 shadow-[0_16px_48px_rgba(217,119,6,0.2)]',
    rose: 'bg-rose-950/40 border-rose-500/25 shadow-[0_16px_48px_rgba(225,29,72,0.2)]',
    orange: 'bg-orange-950/40 border-orange-500/25 shadow-[0_16px_48px_rgba(234,88,12,0.2)]',
    yellow: 'bg-yellow-950/40 border-yellow-500/25 shadow-[0_16px_48px_rgba(202,138,4,0.2)]',
    pink: 'bg-pink-950/40 border-pink-500/25 shadow-[0_16px_48px_rgba(219,39,119,0.2)]',
    blue: 'bg-blue-950/40 border-blue-500/25 shadow-[0_16px_48px_rgba(59,130,246,0.2)]',
    white: 'bg-zinc-900/40 border-zinc-500/25 shadow-[0_16px_48px_rgba(0,0,0,0.3)]',
    zinc: 'bg-zinc-900/40 border-zinc-500/25 shadow-[0_16px_48px_rgba(0,0,0,0.3)]',
    slate: 'bg-slate-900/40 border-slate-500/25 shadow-[0_16px_48px_rgba(0,0,0,0.3)]',
    teal: 'bg-teal-950/40 border-teal-500/25 shadow-[0_16px_48px_rgba(20,184,166,0.2)]',
    lime: 'bg-lime-950/40 border-lime-500/25 shadow-[0_16px_48px_rgba(132,204,22,0.2)]',
    indigo: 'bg-indigo-950/40 border-indigo-500/25 shadow-[0_16px_48px_rgba(79,70,229,0.15)]',
    none: '',
};

export interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
    className?: string;
    contentClassName?: string;
    hoverEffect?: boolean;
    accent?: AccentColor;
    intensity?: GlassIntensity;
    tint?: GlassTint;
}

export function GlassCard({
    children,
    className,
    contentClassName,
    hoverEffect = false,
    accent = 'none',
    intensity = 'medium',
    tint = 'none',
    ...props
}: GlassCardProps) {
    return (
        <div
            className={cn(
                "relative overflow-hidden backdrop-blur-xl border rounded-2xl p-6 transition-all duration-300",
                intensityStyles[intensity],
                tint !== 'none' && tintStyles[tint],
                hoverEffect && "hover:scale-[1.01] hover:border-white/20 cursor-pointer",
                accentStyles[accent],
                className
            )}
            {...props}
        >
            {/* Faint glass glare - diagonal reflection */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/8 via-transparent to-transparent pointer-events-none" aria-hidden="true" />

            {/* Subtle top edge highlight */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" aria-hidden="true" />

            {/* Left edge glint */}
            <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-white/15 via-transparent to-transparent" aria-hidden="true" />

            {/* Content */}
            <div className={cn("relative z-10", contentClassName)}>
                {children}
            </div>
        </div>
    );
}
