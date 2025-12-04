import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  LEGACY_STORAGE_MONTH_KEY,
  LEGACY_STORAGE_YEAR_KEY,
  STORAGE_MONTH_FROM_KEY,
  STORAGE_MONTH_TO_KEY,
  STORAGE_YEAR_FROM_KEY,
  STORAGE_YEAR_TO_KEY,
} from "../../../lib/dashboard/config";
import { transactions } from "../../../lib/fakeData";

type RangeState = {
  fromMonth: number;
  fromYear: number;
  toMonth: number;
  toYear: number;
};

const parseNumber = (value: string | null) => {
  if (value === null) return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

export function useDateRange() {
  const hasTouchedRangeRef = useRef(false);
  const getDefaultThreeMonthRange = useCallback((): RangeState => {
    const now = new Date();
    const currentMonth = now.getUTCMonth();
    const currentYear = now.getUTCFullYear();
    const endDate = new Date(Date.UTC(currentYear, currentMonth, 1));
    endDate.setUTCMonth(endDate.getUTCMonth() - 1);
    const toMonth = endDate.getUTCMonth();
    const toYear = endDate.getUTCFullYear();
    const startDate = new Date(Date.UTC(toYear, toMonth, 1));
    startDate.setUTCMonth(startDate.getUTCMonth() - 2);
    return {
      fromMonth: startDate.getUTCMonth(),
      fromYear: startDate.getUTCFullYear(),
      toMonth,
      toYear,
    };
  }, []);

  const defaultRange = useMemo(() => getDefaultThreeMonthRange(), [getDefaultThreeMonthRange]);
  const baseSampleDate = useMemo(
    () => new Date(transactions[0]?.date ?? new Date()),
    [],
  );

  const [selectedMonthFrom, setSelectedMonthFrom] = useState<number>(defaultRange.fromMonth);
  const [selectedYearFrom, setSelectedYearFrom] = useState<number>(defaultRange.fromYear);
  const [selectedMonthTo, setSelectedMonthTo] = useState<number>(defaultRange.toMonth);
  const [selectedYearTo, setSelectedYearTo] = useState<number>(defaultRange.toYear);

  const normalizedRange = useMemo(() => {
    const startValue = selectedYearFrom * 12 + selectedMonthFrom;
    const endValue = selectedYearTo * 12 + selectedMonthTo;
    if (startValue <= endValue) {
      return {
        start: { month: selectedMonthFrom, year: selectedYearFrom },
        end: { month: selectedMonthTo, year: selectedYearTo },
      };
    }
    return {
      start: { month: selectedMonthTo, year: selectedYearTo },
      end: { month: selectedMonthFrom, year: selectedYearFrom },
    };
  }, [selectedMonthFrom, selectedYearFrom, selectedMonthTo, selectedYearTo]);

  const rangeStartDateString = `${normalizedRange.start.year}-${String(normalizedRange.start.month + 1).padStart(2, "0")}-01`;
  const rangeEndDay = new Date(
    Date.UTC(normalizedRange.end.year, normalizedRange.end.month + 1, 0),
  ).getUTCDate();
  const rangeEndDateString = `${normalizedRange.end.year}-${String(normalizedRange.end.month + 1).padStart(2, "0")}-${String(rangeEndDay).padStart(2, "0")}`;

  const yearOptions = useMemo(() => {
    const baseYear = baseSampleDate.getUTCFullYear();
    const candidates = [
      baseYear,
      selectedYearFrom,
      selectedYearTo,
      selectedYearFrom - 1,
      selectedYearFrom + 1,
      selectedYearTo - 1,
      selectedYearTo + 1,
    ];
    return Array.from(new Set(candidates)).sort((a, b) => a - b);
  }, [baseSampleDate, selectedYearFrom, selectedYearTo]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedMonthFrom = window.localStorage.getItem(STORAGE_MONTH_FROM_KEY);
    const storedYearFrom = window.localStorage.getItem(STORAGE_YEAR_FROM_KEY);
    const storedMonthTo = window.localStorage.getItem(STORAGE_MONTH_TO_KEY);
    const storedYearTo = window.localStorage.getItem(STORAGE_YEAR_TO_KEY);
    const legacyMonth = window.localStorage.getItem(LEGACY_STORAGE_MONTH_KEY);
    const legacyYear = window.localStorage.getItem(LEGACY_STORAGE_YEAR_KEY);
    const fallbackRange = getDefaultThreeMonthRange();
    const fallbackMonth = fallbackRange.fromMonth;
    const fallbackYear = fallbackRange.fromYear;
    const fallbackToMonth = fallbackRange.toMonth;
    const fallbackToYear = fallbackRange.toYear;
    const parsedFromMonth = parseNumber(storedMonthFrom) ?? parseNumber(legacyMonth);
    const parsedFromYear = parseNumber(storedYearFrom) ?? parseNumber(legacyYear);
    const parsedToMonth =
      parseNumber(storedMonthTo) ?? parseNumber(storedMonthFrom) ?? parseNumber(legacyMonth);
    const parsedToYear =
      parseNumber(storedYearTo) ?? parseNumber(storedYearFrom) ?? parseNumber(legacyYear);
    startTransition(() => {
      setSelectedMonthFrom(parsedFromMonth ?? fallbackMonth);
      setSelectedYearFrom(parsedFromYear ?? fallbackYear);
      setSelectedMonthTo(parsedToMonth ?? parsedFromMonth ?? fallbackToMonth);
      setSelectedYearTo(parsedToYear ?? parsedFromYear ?? fallbackToYear);
    });
  }, [getDefaultThreeMonthRange]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_MONTH_FROM_KEY, String(selectedMonthFrom));
    window.localStorage.setItem(STORAGE_YEAR_FROM_KEY, String(selectedYearFrom));
    window.localStorage.setItem(STORAGE_MONTH_TO_KEY, String(selectedMonthTo));
    window.localStorage.setItem(STORAGE_YEAR_TO_KEY, String(selectedYearTo));
  }, [selectedMonthFrom, selectedYearFrom, selectedMonthTo, selectedYearTo]);

  return {
    selectedMonthFrom,
    setSelectedMonthFrom,
    selectedYearFrom,
    setSelectedYearFrom,
    selectedMonthTo,
    setSelectedMonthTo,
    selectedYearTo,
    setSelectedYearTo,
    normalizedRange,
    rangeStartDateString,
    rangeEndDateString,
    yearOptions,
    defaultRange,
    baseSampleDate,
    getDefaultThreeMonthRange,
    hasTouchedRangeRef,
  };
}
