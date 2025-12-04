import React, { useState, useRef, useEffect } from "react";

import { tabs, type TabId } from "../../../lib/dashboard/config";

type Props = {
  activeTab: TabId;
  onSelectTab: (tab: TabId) => void;
  isEditing: boolean;
  onToggleEditing: () => void;
};

export function TabsBar({ activeTab, onSelectTab, isEditing, onToggleEditing }: Props) {
  const [underlineStyle, setUnderlineStyle] = useState({ left: 0, width: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);

  const underlineClassByTab: Record<TabId, string> = {
    overview: "from-purple-500 to-purple-400",
    recurring: "from-rose-500 to-rose-400",
    fees: "from-amber-500 to-amber-400",
    cashflow: "from-emerald-500 to-emerald-400",
    review: "from-pink-500 to-pink-400",
  };

  const activeClassesByTab: Record<TabId, string> = {
    overview:
      "border-purple-500/40 bg-purple-500/10 text-white shadow-[0_0_16px_rgba(168,85,247,0.2)]",
    recurring:
      "border-rose-500/40 bg-rose-500/10 text-white shadow-[0_0_16px_rgba(244,63,94,0.22)]",
    fees:
      "border-amber-500/40 bg-amber-500/10 text-white shadow-[0_0_16px_rgba(245,158,11,0.22)]",
    cashflow:
      "border-emerald-500/40 bg-emerald-500/10 text-white shadow-[0_0_16px_rgba(16,185,129,0.22)]",
    review:
      "border-pink-500/40 bg-pink-500/10 text-white shadow-[0_0_16px_rgba(236,72,153,0.22)]",
  };

  const hoverAccentByTab: Record<TabId, string> = {
    overview: "hover:border-purple-400/40 hover:shadow-[0_0_12px_rgba(168,85,247,0.18)]",
    recurring: "hover:border-rose-400/40 hover:shadow-[0_0_12px_rgba(244,63,94,0.18)]",
    fees: "hover:border-amber-400/40 hover:shadow-[0_0_12px_rgba(245,158,11,0.18)]",
    cashflow: "hover:border-emerald-400/40 hover:shadow-[0_0_12px_rgba(16,185,129,0.18)]",
    review: "hover:border-pink-400/40 hover:shadow-[0_0_12px_rgba(236,72,153,0.18)]",
  };

  const dotColorByTab: Record<TabId, string> = {
    overview: "bg-purple-400",
    recurring: "bg-rose-400",
    fees: "bg-amber-400",
    cashflow: "bg-emerald-400",
    review: "bg-pink-400",
  };

  useEffect(() => {
    if (activeTabRef.current && containerRef.current) {
      const tabRect = activeTabRef.current.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();
      setUnderlineStyle({
        left: tabRect.left - containerRect.left,
        width: tabRect.width,
      });
    }
  }, [activeTab]);

  return (
    <div className="relative pt-2">
      <div className="absolute inset-x-0 top-0 h-px bg-zinc-800" />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-zinc-900 to-transparent sm:hidden" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-zinc-900 to-transparent sm:hidden" />
      <div className="flex items-center gap-2">
        <div ref={containerRef} className="relative flex w-full snap-x snap-mandatory items-center gap-3 overflow-x-auto px-2 pb-2 sm:justify-center">
          {/* Animated underline */}
          <div
            className={`absolute bottom-0 h-1.5 bg-gradient-to-r ${underlineClassByTab[activeTab]} rounded-full transition-all duration-300 ease-out`}
            style={{
              left: `${underlineStyle.left}px`,
              width: `${underlineStyle.width}px`,
            }}
          />
          
          {tabs.map((tab) => (
            <button
              key={tab.id}
              ref={activeTab === tab.id ? activeTabRef : null}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className={`snap-start rounded-full border px-6 py-3.5 text-sm sm:text-base font-semibold transition duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${
                activeTab === tab.id
                  ? activeClassesByTab[tab.id]
                  : `border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 ${hoverAccentByTab[tab.id]}`
              }`}
            >
              <span className="flex items-center gap-2">
                <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${dotColorByTab[tab.id]}`} />
                {tab.label}
              </span>
            </button>
          ))}
        </div>
        <button
          type="button"
          className="hidden sm:inline-flex items-center justify-center rounded-full border border-zinc-800 px-3 py-2 text-xs font-medium text-zinc-300 transition hover:border-zinc-600 hover:bg-zinc-800 hover:shadow-[0_0_12px_rgba(168,85,247,0.15)]"
          onClick={onToggleEditing}
        >
          {isEditing ? "Done editing" : "Edit statement transactions"}
        </button>
      </div>
      <button
        type="button"
        className="mt-2 inline-flex items-center justify-center rounded-full border border-zinc-800 px-3 py-2 text-xs font-medium text-zinc-300 transition hover:border-zinc-600 hover:bg-zinc-800 hover:shadow-[0_0_12px_rgba(168,85,247,0.15)] sm:hidden"
        onClick={onToggleEditing}
      >
        {isEditing ? "Done editing" : "Edit statement transactions"}
      </button>
    </div>
  );
}
