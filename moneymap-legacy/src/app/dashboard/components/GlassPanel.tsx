import React from "react";

type GlassPanelProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: "hero" | "card";
  tone?: "calm" | "vivid";
};

export const GlassPanel = React.forwardRef<HTMLDivElement, GlassPanelProps>(
  (
    {
      children,
      className = "",
      variant = "card",
      tone = "calm",
      ...rest
    },
    ref
  ) => {
    const variantClasses =
      variant === "hero"
        ? "p-6 sm:p-8 md:p-10 border border-white/18 shadow-[0_26px_80px_rgba(0,0,0,0.48)]"
        : "p-4 sm:p-5 border border-white/12 shadow-[0_18px_60px_rgba(0,0,0,0.42)]";

    const bgCalm =
      "bg-[radial-gradient(circle_at_12%_18%,rgba(52,211,153,0.06),transparent_36%),radial-gradient(circle_at_86%_16%,rgba(124,58,237,0.06),transparent_34%),linear-gradient(155deg,rgba(6,8,14,0.94),rgba(8,10,16,0.86),rgba(7,9,14,0.9))]";

    const bgVivid =
      "bg-[radial-gradient(circle_at_14%_20%,rgba(168,85,247,0.16),transparent_42%),radial-gradient(circle_at_88%_18%,rgba(124,58,237,0.12),transparent_38%),linear-gradient(155deg,rgba(6,8,14,0.92),rgba(7,9,14,0.86),rgba(8,10,16,0.9))]";

    const toneClasses = tone === "vivid" ? bgVivid : bgCalm;

    return (
      <div
        ref={ref}
        {...rest}
        className={`relative overflow-hidden rounded-[26px] sm:rounded-[28px] ${variantClasses} ${toneClasses} ring-1 ring-white/10 backdrop-blur-2xl transition duration-200 ${className}`}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-px rounded-[24px] sm:rounded-[26px] border border-white/12 bg-[linear-gradient(120deg,rgba(255,255,255,0.12),rgba(255,255,255,0)_42%)] opacity-75 shadow-inner shadow-white/5"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_8%,rgba(124,58,237,0.07),transparent_30%),radial-gradient(circle_at_92%_6%,rgba(52,211,153,0.05),transparent_26%)] opacity-60 mix-blend-soft-light"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.12),rgba(255,255,255,0)_38%)] opacity-25 mix-blend-screen"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_0%_100%,rgba(124,58,237,0.08),transparent_32%),radial-gradient(circle_at_100%_100%,rgba(52,211,153,0.045),transparent_30%)] opacity-70"
        />
        <div className="relative z-10">{children}</div>
      </div>
    );
  }
);

GlassPanel.displayName = "GlassPanel";
export default GlassPanel;  