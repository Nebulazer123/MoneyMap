import React from "react";

type GlassPanelProps = {
  children: React.ReactNode;
  className?: string;
  variant?: "hero" | "card" | "tile";
  style?: React.CSSProperties;
};

export function GlassPanel({ children, className = "", variant = "card", style }: GlassPanelProps) {
  const variantStyles = {
    hero: "p-6 sm:p-8 md:p-10 rounded-3xl border border-white/10",
    card: "p-4 sm:p-5 rounded-2xl border border-white/8",
    tile: "p-4 rounded-xl border border-white/8",
  };

  return (
    <div
      style={style}
      className={`relative overflow-hidden ${variantStyles[variant]} bg-[linear-gradient(145deg,rgba(10,14,20,0.95),rgba(8,12,18,0.9))] shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-xl transition-all duration-300 ${className}`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-px rounded-[inherit] border border-white/5"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(16,185,129,0.06),transparent_50%),radial-gradient(ellipse_at_bottom_right,rgba(139,92,246,0.05),transparent_50%)]"
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
