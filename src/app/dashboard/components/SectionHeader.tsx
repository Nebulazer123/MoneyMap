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
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-emerald-300">
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 rounded-full bg-emerald-400"
          />
          {label}
        </span>
      )}
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-white sm:text-xl">{title}</h2>
        {caption && <p className="text-sm text-zinc-400">{caption}</p>}
      </div>
    </div>
  );
}
