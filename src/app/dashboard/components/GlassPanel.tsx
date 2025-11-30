import React from "react";

type GlassPanelProps = {
  children: React.ReactNode;
  className?: string;
  variant?: "hero" | "card";
};

export function GlassPanel({ children, className = "", variant = "card" }: GlassPanelProps) {
  const variantClasses =
    variant === "hero" ? "p-6 sm:p-8 md:p-10 border border-white/18" : "p-4 sm:p-5 border border-white/14";

  return (
    <div
      className={`relative overflow-hidden rounded-[28px] ${variantClasses} bg-[linear-gradient(140deg,rgba(11,17,28,0.9),rgba(12,22,36,0.8))] shadow-[0_24px_60px_rgba(0,0,0,0.4)] backdrop-blur-2xl transition duration-200 ${className}`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-px rounded-[26px] border border-white/18 shadow-inner shadow-white/5"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(14,165,233,0.08),transparent_36%),radial-gradient(circle_at_85%_8%,rgba(16,185,129,0.09),transparent_34%)] opacity-70"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(125deg,rgba(255,255,255,0.07),rgba(255,255,255,0)_40%)] opacity-40 mix-blend-screen"
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
