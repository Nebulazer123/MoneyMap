import React from "react";

type GlassPanelProps = {
  children: React.ReactNode;
  className?: string;
  variant?: "hero" | "card";
};

export function GlassPanel({ children, className = "", variant = "card" }: GlassPanelProps) {
  const variantClasses =
    variant === "hero"
      ? "p-6 sm:p-8 md:p-10 border-white/18 bg-white/8"
      : "p-4 sm:p-5 border-white/12 bg-white/6";

  return (
    <div
      className={`relative overflow-hidden rounded-[28px] ${variantClasses} shadow-[0_30px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl transition duration-200 ${className}`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-px rounded-[26px] border border-white/10 shadow-inner shadow-white/5"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0)_38%)]"
      />
      <div className="relative">{children}</div>
    </div>
  );
}
