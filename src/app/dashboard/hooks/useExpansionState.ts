import { useEffect, useMemo, useState } from "react";

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
  const [expandedCashflowMonths, setExpandedCashflowMonths] = useState<Set<number>>(
    () => new Set(),
  );
  const [expandedCashflowDates, setExpandedCashflowDates] = useState<Record<string, boolean>>({});
  const monthsKey = useMemo(
    () => cashflowMonths.map((m) => m.key).join("|"),
    [cashflowMonths],
  );

  useEffect(() => {
    if (!showGroupedTable) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setExpandedMonths(new Set());
  }, [monthsSignature, showGroupedTable]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setExpandedCashflowMonths(new Set());
  }, [monthsKey]);

  return {
    expandedMonths,
    setExpandedMonths,
    expandedCashflowMonths,
    setExpandedCashflowMonths,
    expandedCashflowDates,
    setExpandedCashflowDates,
  };
}
