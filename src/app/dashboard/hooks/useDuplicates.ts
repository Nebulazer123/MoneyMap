import { useEffect, useMemo, useRef, useState } from "react";

import { buildDuplicateClusters, type DuplicateClusterView } from "../../../lib/dashboard/duplicates";
import { STORAGE_DUPLICATE_DECISIONS_KEY } from "../../../lib/dashboard/config";
import type { Transaction } from "../../../lib/fakeData";

type DuplicateDecisions = Record<string, "confirmed" | "dismissed">;

export function useDuplicates(transactions: Transaction[]) {
  const [duplicateDecisions, setDuplicateDecisions] = useState<DuplicateDecisions>(() => {
    if (typeof window === "undefined") return {};
    try {
      const stored = window.localStorage.getItem(STORAGE_DUPLICATE_DECISIONS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as DuplicateDecisions;
        if (parsed && typeof parsed === "object") return parsed;
      }
    } catch {
      // ignore bad data
    }
    return {};
  });
  const [showDuplicateOverlay, setShowDuplicateOverlay] = useState(false);
  const duplicateOverlayTriggerRef = useRef<HTMLElement | null>(null);
  const duplicateOverlayRef = useRef<HTMLDivElement | null>(null);
  const [expandedDuplicateClusters, setExpandedDuplicateClusters] = useState<Set<string>>(new Set());

  const duplicateClusters: DuplicateClusterView[] = useMemo(
    () => buildDuplicateClusters(transactions, duplicateDecisions),
    [duplicateDecisions, transactions],
  );

  const activeDuplicateIds = useMemo(
    () =>
      new Set(
        duplicateClusters.flatMap((cluster) => cluster.suspiciousTransactions.map((entry) => entry.tx.id)),
      ),
    [duplicateClusters],
  );

  const duplicateMetaById = useMemo(() => {
    const map = new Map<
      string,
      { clusterKey: string; label: string; category: string; lastNormalDate: string | null; reason: string | null }
    >();
    duplicateClusters.forEach((cluster) => {
      const lastCharged = cluster.lastNormalChargeDate ?? cluster.lastNormalDate;
      cluster.allTransactions.forEach((tx) => {
        map.set(tx.id, {
          clusterKey: cluster.key,
          label: cluster.label,
          category: cluster.category,
          lastNormalDate: lastCharged,
          reason: cluster.reasonById.get(tx.id) ?? null,
        });
      });
    });
    return map;
  }, [duplicateClusters]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_DUPLICATE_DECISIONS_KEY, JSON.stringify(duplicateDecisions));
  }, [duplicateDecisions]);

  useEffect(() => {
    if (!showDuplicateOverlay) return;
    const previousOverflow =
      typeof document !== "undefined" ? (document.body.style.overflow as string | undefined) : undefined;
    if (typeof document !== "undefined") {
      document.body.style.overflow = "hidden";
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setShowDuplicateOverlay(false);
        return;
      }
      if (event.key !== "Tab") return;
      const container = duplicateOverlayRef.current;
      if (!container) return;
      const focusable = container.querySelectorAll<HTMLElement>(
        'a, button, textarea, input, select, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (event.shiftKey) {
        if (active === first || active === container) {
          event.preventDefault();
          last.focus();
        }
      } else if (active === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    const focusTarget =
      duplicateOverlayRef.current?.querySelector<HTMLElement>("[data-autofocus]") ??
      duplicateOverlayRef.current;
    focusTarget?.focus();
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (typeof document !== "undefined" && typeof previousOverflow === "string") {
        document.body.style.overflow = previousOverflow;
      }
    };
  }, [showDuplicateOverlay]);

  useEffect(() => {
    if (showDuplicateOverlay) return;
    const trigger = duplicateOverlayTriggerRef.current;
    if (trigger) {
      trigger.focus();
      duplicateOverlayTriggerRef.current = null;
    }
  }, [showDuplicateOverlay]);

  useEffect(() => {
    if (!showDuplicateOverlay) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setExpandedDuplicateClusters(new Set());
  }, [showDuplicateOverlay]);

  const handleDuplicateDecision = (txId: string, decision: "confirmed" | "dismissed") => {
    setDuplicateDecisions((prev) => ({ ...prev, [txId]: decision }));
  };

  const handleDismissDuplicate = (txId: string) => handleDuplicateDecision(txId, "dismissed");
  const handleConfirmDuplicate = (txId: string) => handleDuplicateDecision(txId, "confirmed");
  const handleOpenDuplicateOverlay = (trigger?: HTMLElement | null) => {
    if (typeof document !== "undefined") {
      duplicateOverlayTriggerRef.current = trigger ?? (document.activeElement as HTMLElement | null);
    }
    setShowDuplicateOverlay(true);
  };
  const handleCloseDuplicateOverlay = () => {
    setShowDuplicateOverlay(false);
  };
  const toggleDuplicateCluster = (key: string) => {
    setExpandedDuplicateClusters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const resetDuplicates = () => {
    setDuplicateDecisions({});
    setShowDuplicateOverlay(false);
    setExpandedDuplicateClusters(new Set());
    duplicateOverlayTriggerRef.current = null;
  };

  return {
    duplicateClusters,
    activeDuplicateIds,
    duplicateMetaById,
    duplicateDecisions,
    setDuplicateDecisions,
    resetDuplicates,
    showDuplicateOverlay,
    handleOpenDuplicateOverlay,
    handleCloseDuplicateOverlay,
    expandedDuplicateClusters,
    toggleDuplicateCluster,
    handleDismissDuplicate,
    handleConfirmDuplicate,
    duplicateOverlayRef,
    duplicateOverlayTriggerRef,
  };
}
