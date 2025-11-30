import React from "react";

type SectionHeaderProps = {
  label?: string;
  title: string;
  caption?: string;
  className?: string;
};

export function SectionHeader({ label, title, caption, className = "" }: SectionHeaderProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <span className="inline-flex items-center rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-100">
          {label}
        </span>
      )}
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-white sm:text-2xl">{title}</h2>
        {caption && <p className="text-sm text-zinc-400">{caption}</p>}
      </div>
    </div>
  );
}
