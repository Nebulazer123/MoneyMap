import React from "react";

type SectionHeaderProps = {
  label?: string;
  title: string;
  caption?: string;
  className?: string;
};

export function SectionHeader({ label, title, caption, className = "" }: SectionHeaderProps) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && (
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-300/70 bg-[linear-gradient(120deg,rgba(16,185,129,0.16),rgba(124,58,237,0.08))] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-50 shadow-[0_12px_28px_rgba(16,185,129,0.16),0_10px_30px_rgba(124,58,237,0.12)] backdrop-blur-sm">
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_0_6px_rgba(16,185,129,0.18),0_0_0_10px_rgba(124,58,237,0.08)]"
          />
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
