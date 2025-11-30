import React from "react";

import { tabs, type TabId } from "../../../lib/dashboard/config";

type Props = {
  activeTab: TabId;
  onSelectTab: (tab: TabId) => void;
  isEditing: boolean;
  onToggleEditing: () => void;
};

export function TabsBar({ activeTab, onSelectTab, isEditing, onToggleEditing }: Props) {
  return (
    <div className="relative pt-2">
      <div className="absolute inset-x-0 top-0 h-px bg-zinc-800" />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-zinc-900 to-transparent sm:hidden" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-zinc-900 to-transparent sm:hidden" />
      <div className="flex items-center gap-2">
        <div className="flex w-full snap-x snap-mandatory items-center gap-3 overflow-x-auto px-2 pb-2 sm:justify-center">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className={`snap-start rounded-full border px-5 py-3 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${
                activeTab === tab.id
                  ? "border-zinc-500 bg-zinc-800 text-white shadow-sm"
                  : "border-zinc-700 bg-zinc-900 text-zinc-200 hover:border-zinc-500 hover:bg-zinc-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="hidden sm:inline-flex items-center justify-center rounded-full border border-zinc-800 px-3 py-2 text-xs font-medium text-zinc-300 transition hover:border-zinc-600 hover:bg-zinc-800"
          onClick={onToggleEditing}
        >
          {isEditing ? "Done editing" : "Edit statement transactions"}
        </button>
      </div>
      <button
        type="button"
        className="mt-2 inline-flex items-center justify-center rounded-full border border-zinc-800 px-3 py-2 text-xs font-medium text-zinc-300 transition hover:border-zinc-600 hover:bg-zinc-800 sm:hidden"
        onClick={onToggleEditing}
      >
        {isEditing ? "Done editing" : "Edit statement transactions"}
      </button>
    </div>
  );
}
