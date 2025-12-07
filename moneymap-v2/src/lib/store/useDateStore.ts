import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GlobalDateState } from '../types';

interface DateStoreActions {
    setDatasetRange: (start: Date, end: Date) => void;
    setViewRange: (start: Date, end: Date) => void;
    extendDatasetRange: (newEnd: Date) => void;
    regenerateStatements: () => void;
    syncToday: () => void;
}

type DateStore = GlobalDateState & DateStoreActions;

// Helper to ensure dates are Date objects (handling hydration from JSON strings)
const ensureDate = (d: Date | string): Date => {
    if (d instanceof Date) return d;
    return new Date(d);
};

export const useDateStore = create<DateStore>()(
    persist(
        (set, get) => ({
            // Initial State
            datasetStart: new Date(new Date().getFullYear(), new Date().getMonth() - 6, 1), // Default 6 months back
            datasetEnd: new Date(),
            viewStart: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1), // Default last month
            viewEnd: new Date(),
            today: new Date(),
            lastGeneratedAt: Date.now(),
            profileId: crypto.randomUUID(),

            // Actions
            setDatasetRange: (start, end) => {
                set({
                    datasetStart: ensureDate(start),
                    datasetEnd: ensureDate(end),
                    lastGeneratedAt: Date.now()
                });
            },

            setViewRange: (start, end) => {
                const { datasetStart, datasetEnd } = get();
                // Clamp view to dataset bounds
                const dsStart = ensureDate(datasetStart);
                const dsEnd = ensureDate(datasetEnd);

                let newStart = ensureDate(start);
                let newEnd = ensureDate(end);

                if (newStart < dsStart) newStart = dsStart;
                if (newEnd > dsEnd) newEnd = dsEnd;
                if (newStart > newEnd) newStart = newEnd;

                set({ viewStart: newStart, viewEnd: newEnd });
            },

            extendDatasetRange: (newEnd) => {
                const { datasetEnd } = get();
                const currentEnd = ensureDate(datasetEnd);
                const targetEnd = ensureDate(newEnd);

                if (targetEnd > currentEnd) {
                    set({
                        datasetEnd: targetEnd,
                        // Do NOT update profileId - we are extending, not regenerating
                        lastGeneratedAt: Date.now()
                    });
                }
            },

            regenerateStatements: () => {
                // Full reset with new profile
                set({
                    profileId: crypto.randomUUID(),
                    lastGeneratedAt: Date.now(),
                    // Reset view to default relative to today? 
                    // Or keep current view if possible?
                    // Let's keep current view range but re-clamped if needed.
                });
            },

            syncToday: () => {
                const now = new Date();
                set({ today: now });

                // Auto-extend dataset if today is past datasetEnd (stale state)
                const { datasetEnd } = get();
                const dsEnd = ensureDate(datasetEnd);

                if (now > dsEnd) {
                    // If we are significantly past, extend to today
                    set({ datasetEnd: now });
                }
            }
        }),
        {
            name: 'moneymap-date-store',
            partialize: (state) => ({
                datasetStart: state.datasetStart,
                datasetEnd: state.datasetEnd,
                viewStart: state.viewStart,
                viewEnd: state.viewEnd,
                lastGeneratedAt: state.lastGeneratedAt,
                profileId: state.profileId,
                // Do NOT persist 'today' - it must be fresh on load
            }),
            onRehydrateStorage: () => (state) => {
                if (state) {
                    // Convert JSON strings back to Date objects
                    state.datasetStart = ensureDate(state.datasetStart);
                    state.datasetEnd = ensureDate(state.datasetEnd);
                    state.viewStart = ensureDate(state.viewStart);
                    state.viewEnd = ensureDate(state.viewEnd);

                    // Sync today immediately after hydration
                    state.syncToday();
                }
            }
        }
    )
);
