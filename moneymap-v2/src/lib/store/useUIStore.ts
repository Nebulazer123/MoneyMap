import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DateRange } from '../types';

export type DashboardTab = "dashboard" | "overview" | "recurring" | "fees" | "cashflow" | "review" | "statement" | "subscriptions" | "budget" | "accounts" | "stocks" | "crypto";

interface UIState {
    activeTab: DashboardTab;
    dateRange: DateRange;
    isSidebarOpen: boolean;
    apisEnabled: boolean;

    setActiveTab: (tab: DashboardTab) => void;
    setDateRange: (range: DateRange) => void;
    toggleSidebar: () => void;
    setSidebarOpen: (open: boolean) => void;
    setApisEnabled: (enabled: boolean) => void;
}

const now = new Date();
const currentYear = now.getFullYear();
const currentMonth = now.getMonth();

// Calculate 6 months ago
const sixMonthsAgo = new Date(now);
sixMonthsAgo.setMonth(currentMonth - 5); // 5 months back + current month = 6 months total

const defaultDateRange: DateRange = {
    from: new Date(sixMonthsAgo.getFullYear(), sixMonthsAgo.getMonth(), 1), // First day of 6 months ago
    to: new Date(currentYear, currentMonth + 1, 0),  // Last day of current month
};

export const useUIStore = create<UIState>()(
    persist(
        (set) => ({
            activeTab: 'dashboard',
            dateRange: defaultDateRange,
            isSidebarOpen: true,
            apisEnabled: true,

            setActiveTab: (tab) => set({ activeTab: tab }),
            setDateRange: (range) => set({ dateRange: range }),
            toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
            setSidebarOpen: (open) => set({ isSidebarOpen: open }),
            setApisEnabled: (enabled) => set({ apisEnabled: enabled }),
        }),
        {
            name: 'moneymap-ui-storage',
            partialize: (state) => ({
                activeTab: state.activeTab,
                isSidebarOpen: state.isSidebarOpen,
                // Date range might be better not persisted or carefully persisted to avoid stale dates
                dateRange: state.dateRange,
                apisEnabled: state.apisEnabled,
            }),
        }
    )
);
