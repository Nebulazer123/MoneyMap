import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  LEGACY_STORAGE_MONTH_KEY,
  LEGACY_STORAGE_YEAR_KEY,
  STORAGE_FLOW_KEY,
  STORAGE_MONTH_FROM_KEY,
  STORAGE_MONTH_TO_KEY,
  STORAGE_STATEMENT_KEY,
  STORAGE_YEAR_FROM_KEY,
  STORAGE_YEAR_TO_KEY,
} from "../../../lib/dashboard/config";
import { generateSampleStatement, type Transaction } from "../../../lib/fakeData";

type FlowStep = "idle" | "statement" | "analyzing" | "results";

const DEMO_STATEMENT_STORAGE_KEY = "moneymap_demo_statement_v1";

type StoredStatementPayload = {
  transactions: Transaction[];
  range: { fromMonth: number; fromYear: number; toMonth: number; toYear: number };
  flowStep: FlowStep;
};

const parseNumber = (value: string | null) => {
  if (value === null) return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const isValidRange = (range: StoredStatementPayload["range"]) =>
  range &&
  [range.fromMonth, range.fromYear, range.toMonth, range.toYear].every(
    (value) => typeof value === "number" && !Number.isNaN(value),
  );

const normalizeFlowStep = (flow: FlowStep): FlowStep => (flow === "results" ? "results" : "statement");

const readStoredDemoStatement = (): StoredStatementPayload | null => {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(DEMO_STATEMENT_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as StoredStatementPayload;
    if (!parsed || !Array.isArray(parsed.transactions) || parsed.transactions.length === 0) return null;
    if (!isValidRange(parsed.range)) return null;
    return {
      transactions: parsed.transactions,
      range: parsed.range,
      flowStep: normalizeFlowStep(parsed.flowStep),
    };
  } catch {
    return null;
  }
};

const writeStoredDemoStatement = (payload: StoredStatementPayload) => {
  if (typeof window === "undefined") return;
  if (!Array.isArray(payload.transactions) || payload.transactions.length === 0) return;
  const flow = normalizeFlowStep(payload.flowStep);
  const data: StoredStatementPayload = { ...payload, flowStep: flow };
  try {
    window.localStorage.setItem(DEMO_STATEMENT_STORAGE_KEY, JSON.stringify(data));
    window.localStorage.setItem(STORAGE_FLOW_KEY, flow);
    window.localStorage.setItem(STORAGE_STATEMENT_KEY, JSON.stringify(payload.transactions));
    window.localStorage.setItem(STORAGE_MONTH_FROM_KEY, String(payload.range.fromMonth));
    window.localStorage.setItem(STORAGE_YEAR_FROM_KEY, String(payload.range.fromYear));
    window.localStorage.setItem(STORAGE_MONTH_TO_KEY, String(payload.range.toMonth));
    window.localStorage.setItem(STORAGE_YEAR_TO_KEY, String(payload.range.toYear));
  } catch {
    // ignore storage failures
  }
};

type UseStatementFlowParams = {
  selectedMonthFrom: number;
  selectedYearFrom: number;
  selectedMonthTo: number;
  selectedYearTo: number;
  defaultRange: { fromMonth: number; fromYear: number; toMonth: number; toYear: number };
  setSelectedMonthFrom: (value: number) => void;
  setSelectedYearFrom: (value: number) => void;
  setSelectedMonthTo: (value: number) => void;
  setSelectedYearTo: (value: number) => void;
  rangeStartDateString: string;
  rangeEndDateString: string;
  hasTouchedRangeRef: React.MutableRefObject<boolean>;
  resetTab: () => void;
  onResetExtras?: () => void;
};

export function useStatementFlow({
  selectedMonthFrom,
  selectedYearFrom,
  selectedMonthTo,
  selectedYearTo,
  defaultRange,
  setSelectedMonthFrom,
  setSelectedYearFrom,
  setSelectedMonthTo,
  setSelectedYearTo,
  rangeStartDateString,
  rangeEndDateString,
  hasTouchedRangeRef,
  resetTab,
  onResetExtras,
}: UseStatementFlowParams) {
  const [flowStep, setFlowStep] = useState<FlowStep>("idle");
  const [fullStatementTransactions, setFullStatementTransactions] = useState<Transaction[]>([]);
  const [showStatement, setShowStatement] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const analyzeTimeoutRef = useRef<number | null>(null);
  const lastGeneratedRangeRef = useRef<string | null>(null);
  const hydratedFromStorageRef = useRef(false);

  const statementTransactions = useMemo(() => {
    if (flowStep !== "results") {
      return fullStatementTransactions;
    }
    const startTimestamp = Date.parse(`${rangeStartDateString}T00:00:00Z`);
    const endTimestamp = Date.parse(`${rangeEndDateString}T23:59:59Z`);
    if (Number.isNaN(startTimestamp) || Number.isNaN(endTimestamp)) {
      return fullStatementTransactions;
    }
    return fullStatementTransactions.filter((tx) => {
      const ts = Date.parse(`${tx.date}T00:00:00Z`);
      if (Number.isNaN(ts)) return false;
      return ts >= startTimestamp && ts <= endTimestamp;
    });
  }, [flowStep, fullStatementTransactions, rangeEndDateString, rangeStartDateString]);

  useEffect(() => {
    return () => {
      if (analyzeTimeoutRef.current !== null) {
        window.clearTimeout(analyzeTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const flow = window.localStorage.getItem(STORAGE_FLOW_KEY) as FlowStep | null;
    const saved = window.localStorage.getItem(STORAGE_STATEMENT_KEY);
    if (flow && saved) {
      try {
        const parsed: Transaction[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const storedMonthFrom = window.localStorage.getItem(STORAGE_MONTH_FROM_KEY);
          const storedYearFrom = window.localStorage.getItem(STORAGE_YEAR_FROM_KEY);
          const storedMonthTo = window.localStorage.getItem(STORAGE_MONTH_TO_KEY);
          const storedYearTo = window.localStorage.getItem(STORAGE_YEAR_TO_KEY);
          const legacyMonth = window.localStorage.getItem(LEGACY_STORAGE_MONTH_KEY);
          const legacyYear = window.localStorage.getItem(LEGACY_STORAGE_YEAR_KEY);
          const parsedFromMonth = parseNumber(storedMonthFrom) ?? parseNumber(legacyMonth);
          const parsedFromYear = parseNumber(storedYearFrom) ?? parseNumber(legacyYear);
          const parsedToMonth =
            parseNumber(storedMonthTo) ?? parseNumber(storedMonthFrom) ?? parseNumber(legacyMonth);
          const parsedToYear =
            parseNumber(storedYearTo) ?? parseNumber(storedYearFrom) ?? parseNumber(legacyYear);
          const resolvedFromMonth = parsedFromMonth ?? defaultRange.fromMonth;
          const resolvedFromYear = parsedFromYear ?? defaultRange.fromYear;
          const resolvedToMonth = parsedToMonth ?? parsedFromMonth ?? defaultRange.toMonth;
          const resolvedToYear = parsedToYear ?? parsedFromYear ?? defaultRange.toYear;
          lastGeneratedRangeRef.current = `${resolvedFromYear}-${resolvedFromMonth}:${resolvedToYear}-${resolvedToMonth}`;
          startTransition(() => {
            setFullStatementTransactions(parsed);
            if (flow === "statement" || flow === "results") {
              setFlowStep(flow);
              setShowStatement(flow === "results" ? false : true);
            }
          });
          hydratedFromStorageRef.current = true;
          hasTouchedRangeRef.current = flow === "results" || flow === "statement" || flow === "analyzing";
        }
      } catch {
        // ignore bad data
      }
    }
  }, [defaultRange, hasTouchedRangeRef]);

  useEffect(() => {
    if (lastGeneratedRangeRef.current !== null) return;
    if (fullStatementTransactions.length === 0) return;
    lastGeneratedRangeRef.current = `${selectedYearFrom}-${selectedMonthFrom}:${selectedYearTo}-${selectedMonthTo}`;
  }, [
    fullStatementTransactions.length,
    selectedMonthFrom,
    selectedMonthTo,
    selectedYearFrom,
    selectedYearTo,
  ]);

  const startStatement = useCallback(() => {
    const generated = generateSampleStatement(
      selectedMonthFrom,
      selectedYearFrom,
      selectedMonthTo,
      selectedYearTo,
    );
    lastGeneratedRangeRef.current = `${selectedYearFrom}-${selectedMonthFrom}:${selectedYearTo}-${selectedMonthTo}`;
    hasTouchedRangeRef.current = true;
    setFullStatementTransactions(generated);
    setFlowStep("statement");
    setShowStatement(true);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_FLOW_KEY, "statement");
      window.localStorage.setItem(
        STORAGE_STATEMENT_KEY,
        JSON.stringify(generated),
      );
    }
    resetTab();
  }, [resetTab, selectedMonthFrom, selectedMonthTo, selectedYearFrom, selectedYearTo, hasTouchedRangeRef]);

  const handleStart = () => {
    startStatement();
  };

  const handleRegenerate = () => {
    startStatement();
  };

  const handleAnalyze = () => {
    if (statementTransactions.length === 0) return;
    setFlowStep("analyzing");
    analyzeTimeoutRef.current = window.setTimeout(() => {
      setFlowStep("results");
      setShowStatement(false);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_FLOW_KEY, "results");
        window.localStorage.setItem(
          STORAGE_STATEMENT_KEY,
          JSON.stringify(fullStatementTransactions),
        );
      }
      analyzeTimeoutRef.current = null;
    }, 700);
  };

  const handleRestart = () => {
    if (analyzeTimeoutRef.current !== null) {
      window.clearTimeout(analyzeTimeoutRef.current);
      analyzeTimeoutRef.current = null;
    }
    setFlowStep("idle");
    setFullStatementTransactions([]);
    setShowStatement(true);
    setIsEditing(false);
    setSelectedMonthFrom(defaultRange.fromMonth);
    setSelectedYearFrom(defaultRange.fromYear);
    setSelectedMonthTo(defaultRange.toMonth);
    setSelectedYearTo(defaultRange.toYear);
    lastGeneratedRangeRef.current = null;
    hasTouchedRangeRef.current = false;
    onResetExtras?.();
    hydratedFromStorageRef.current = false;
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_FLOW_KEY);
      window.localStorage.removeItem(STORAGE_STATEMENT_KEY);
      window.localStorage.removeItem(STORAGE_MONTH_FROM_KEY);
      window.localStorage.removeItem(STORAGE_YEAR_FROM_KEY);
      window.localStorage.removeItem(STORAGE_MONTH_TO_KEY);
      window.localStorage.removeItem(STORAGE_YEAR_TO_KEY);
      window.localStorage.removeItem(LEGACY_STORAGE_MONTH_KEY);
      window.localStorage.removeItem(LEGACY_STORAGE_YEAR_KEY);
    }
    resetTab();
  };

  const handleToggleEditing = (force?: boolean) => {
    setIsEditing((prev) => {
      const next = typeof force === "boolean" ? force : !prev;
      setShowStatement(true);
      return next;
    });
  };

  const handleAddTransaction = (details: {
    date: string;
    description: string;
    category: string;
    amount: string;
  }): boolean => {
    const trimmedDescription = details.description.trim();
    const parsedAmount = Number(details.amount);
    if (!trimmedDescription || Number.isNaN(parsedAmount)) return false;
    const kind: Transaction["kind"] =
      details.category === "Income"
        ? "income"
        : details.category === "Subscriptions"
          ? "subscription"
          : details.category === "Fees"
            ? "fee"
            : "expense";
    const newTx: Transaction = {
      id: `manual_${Date.now()}`,
      date: details.date,
      description: trimmedDescription,
      amount: parsedAmount,
      category: details.category,
      kind,
      source: "Manual entry",
    };
    setFullStatementTransactions((prev) => {
      const updated = [...prev, newTx];
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_STATEMENT_KEY, JSON.stringify(updated));
        window.localStorage.setItem(
          STORAGE_FLOW_KEY,
          flowStep === "results" ? "results" : "statement",
        );
      }
      return updated;
    });
    return true;
  };

  useEffect(() => {
    const currentRangeKey = `${selectedYearFrom}-${selectedMonthFrom}:${selectedYearTo}-${selectedMonthTo}`;
    const startValue = selectedYearFrom * 12 + selectedMonthFrom;
    const endValue = selectedYearTo * 12 + selectedMonthTo;
    const isRangeValid = startValue <= endValue;
    if (flowStep === "results") {
      lastGeneratedRangeRef.current = currentRangeKey;
      return;
    }
    if (!isRangeValid) return;
    const hasStatement = fullStatementTransactions.length > 0;
    const hasTouchedRange = hasTouchedRangeRef.current;
    if (!hasTouchedRange && flowStep === "idle" && !hasStatement) return;
    if (currentRangeKey === lastGeneratedRangeRef.current && hasStatement) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    startStatement();
  }, [
    selectedMonthFrom,
    selectedYearFrom,
    selectedMonthTo,
    selectedYearTo,
    flowStep,
    startStatement,
    fullStatementTransactions.length,
    hasTouchedRangeRef,
  ]);

  return {
    flowStep,
    setFlowStep,
    fullStatementTransactions,
    setFullStatementTransactions,
    showStatement,
    setShowStatement,
    isEditing,
    setIsEditing,
    statementTransactions,
    analyzeTimeoutRef,
    lastGeneratedRangeRef,
    hydratedFromStorageRef,
    handleStart,
    handleRegenerate,
    handleAnalyze,
    handleRestart,
    handleToggleEditing,
    handleAddTransaction,
  };
}
