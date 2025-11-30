import React from "react";

type SectionHeaderProps = {
  label?: string;
  title: string;
  caption?: string;
  className?: string;
  accentColor?: "purple" | "yellow";
};

export function SectionHeader({ label, title, caption, className = "", accentColor = "purple" }: SectionHeaderProps) {
  const isPurple = accentColor === "purple";
  const pillClasses = isPurple
    ? "inline-flex w-fit items-center gap-2 rounded-full border border-purple-300/70 bg-[linear-gradient(120deg,rgba(168,85,247,0.16),rgba(124,58,237,0.08))] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-purple-50 shadow-[0_12px_28px_rgba(168,85,247,0.16),0_10px_30px_rgba(124,58,237,0.12)] backdrop-blur-sm"
    : "inline-flex w-fit items-center gap-2 rounded-full border border-yellow-400/70 bg-[linear-gradient(120deg,rgba(250,204,21,0.2),rgba(234,179,8,0.1))] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-yellow-50 shadow-[0_12px_28px_rgba(250,204,21,0.16),0_10px_30px_rgba(234,179,8,0.12)] backdrop-blur-sm";
  const dotClasses = isPurple
    ? "h-1.5 w-1.5 rounded-full bg-purple-300 shadow-[0_0_0_6px_rgba(168,85,247,0.18),0_0_0_10px_rgba(124,58,237,0.08)]"
    : "h-1.5 w-1.5 rounded-full bg-yellow-300 shadow-[0_0_0_6px_rgba(250,204,21,0.22),0_0_0_10px_rgba(234,179,8,0.1)]";
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && (
        <span className={pillClasses}>
          <span aria-hidden="true" className={dotClasses} />
          {label}
        </span>
      )}
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold text-white sm:text-2xl leading-tight">{title}</h2>
        {caption && <p className="text-sm text-zinc-400">{caption}</p>}
      </div>
    </div>
  );
}
