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
    <div className="relative">
      <div className="flex flex-wrap items-center justify-center gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelectTab(tab.id)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-white/10 text-white"
                : "text-zinc-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <button
        type="button"
        className="mt-3 w-full text-center text-xs text-zinc-500 transition hover:text-zinc-300 sm:absolute sm:right-0 sm:top-1/2 sm:mt-0 sm:w-auto sm:-translate-y-1/2"
        onClick={onToggleEditing}
      >
        {isEditing ? "Done editing" : "Edit transactions"}
      </button>
    </div>
  );
}
