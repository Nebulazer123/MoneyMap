import { useRef } from "react";
import type { TouchEvent } from "react";

import { tabs, type TabId } from "../../../lib/dashboard/config";

export function useGestureTabs(activeTab: TabId, setActiveTab: (next: TabId) => void) {
  const swipeStateRef = useRef<{ startX: number; startY: number; triggered: boolean }>({
    startX: 0,
    startY: 0,
    triggered: false,
  });

  const handleSwipeStart = (event: TouchEvent) => {
    const touch = event.touches[0];
    swipeStateRef.current = { startX: touch.clientX, startY: touch.clientY, triggered: false };
  };

  const handleSwipeMove = (event: TouchEvent) => {
    const touch = event.touches[0];
    const dx = touch.clientX - swipeStateRef.current.startX;
    const dy = touch.clientY - swipeStateRef.current.startY;
    if (swipeStateRef.current.triggered) return;
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
    const currentIndex = tabs.findIndex((t) => t.id === activeTab);
    if (dx < 0 && currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1].id);
      swipeStateRef.current.triggered = true;
    } else if (dx > 0 && currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1].id);
      swipeStateRef.current.triggered = true;
    }
  };

  const handleSwipeEnd = () => {
    swipeStateRef.current = { startX: 0, startY: 0, triggered: false };
  };

  return { handleSwipeStart, handleSwipeMove, handleSwipeEnd };
}
