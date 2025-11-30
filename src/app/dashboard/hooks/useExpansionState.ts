import { useEffect, useState } from "react";

export function useExpansionState({
  showGroupedTable,
  monthsSignature,
  cashflowMonths,
}: {
  showGroupedTable: boolean;
  monthsSignature: string;
  cashflowMonths: { key: number }[];
}) {
  const [expandedMonths, setExpandedMonths] = useState<Set<number>>(new Set());
  const [expandedCashflowMonths, setExpandedCashflowMonths] = useState<Set<number>>(new Set());
  const [expandedCashflowDates, setExpandedCashflowDates] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!showGroupedTable) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setExpandedMonths(new Set());
  }, [monthsSignature, showGroupedTable]);

  useEffect(() => {
    if (cashflowMonths.length === 0) return;
    const latestKey = cashflowMonths[cashflowMonths.length - 1]?.key;
    if (cashflowMonths.length === 1) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setExpandedCashflowMonths(new Set([latestKey]));
      return;
    }
    if (cashflowMonths.length > 1 && expandedCashflowMonths.size === 0) {
      setExpandedCashflowMonths(new Set([latestKey]));
    }
  }, [cashflowMonths, expandedCashflowMonths.size]);

  return {
    expandedMonths,
    setExpandedMonths,
    expandedCashflowMonths,
    setExpandedCashflowMonths,
    expandedCashflowDates,
    setExpandedCashflowDates,
  };
}
