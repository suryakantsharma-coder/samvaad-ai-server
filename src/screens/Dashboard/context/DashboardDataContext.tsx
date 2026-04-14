import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DASHBOARD_PATIENT_PREVIEW_LIMIT,
  fetchHospitalAdminDashboard,
} from "../../../data/dashboard";
import { showError } from "../../../lib/toast";
import type { HospitalAdminDashboardPreset } from "../../../types/hospitalAdminDashboard.type";
import {
  type DashboardDateRange,
  type DashboardResponse,
  emptyDashboardPlaceholder,
  defaultDashboardDateRange,
  toYMDLocal,
} from "../dashboardResponse";

export type { DashboardDateRange, DashboardResponse };

function parseYMD(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export type DashboardDataContextValue = {
  dateRange: DashboardDateRange;
  setDateRange: (r: DashboardDateRange) => void;
  setStartDate: (start: string) => void;
  setEndDate: (end: string) => void;
  applyPresetDays: (days: number) => void;
  applyThisMonth: () => void;
  /** Active API preset when using Last 7 / Last 30 / This month; `null` when using custom From/To. */
  dashboardPreset: HospitalAdminDashboardPreset | null;
  response: DashboardResponse;
  loading: boolean;
  error: string | null;
};

const DashboardDataContext = createContext<DashboardDataContextValue | null>(
  null,
);

function isLikelyAbortError(e: unknown): boolean {
  if (e instanceof DOMException && e.name === "AbortError") return true;
  if (e instanceof Error && e.name === "AbortError") return true;
  const msg = e instanceof Error ? e.message : "";
  return typeof msg === "string" && /aborted|abort/i.test(msg);
}

function normalizeRange(range: DashboardDateRange): DashboardDateRange {
  let { start, end } = range;
  if (!start || !end) return defaultDashboardDateRange();
  const a = parseYMD(start);
  const b = parseYMD(end);
  if (b < a) {
    return { start: toYMDLocal(b), end: toYMDLocal(a) };
  }
  return { start, end };
}

export function DashboardDataProvider({
  children,
}: {
  children: ReactNode;
}): JSX.Element {
  const [dateRange, setDateRangeState] = useState<DashboardDateRange>(() =>
    defaultDashboardDateRange(),
  );
  const [dashboardPreset, setDashboardPreset] =
    useState<HospitalAdminDashboardPreset | null>("last_30_days");
  const [response, setResponse] = useState<DashboardResponse>(
    emptyDashboardPlaceholder,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const setDateRange = useCallback((r: DashboardDateRange) => {
    setDashboardPreset(null);
    setDateRangeState(normalizeRange(r));
  }, []);

  const setStartDate = useCallback((start: string) => {
    setDashboardPreset(null);
    setDateRangeState((prev) => normalizeRange({ ...prev, start }));
  }, []);

  const setEndDate = useCallback((end: string) => {
    setDashboardPreset(null);
    setDateRangeState((prev) => normalizeRange({ ...prev, end }));
  }, []);

  const applyPresetDays = useCallback((days: number) => {
    if (days === 7) {
      setDashboardPreset("last_7_days");
      return;
    }
    if (days === 30) {
      setDashboardPreset("last_30_days");
      return;
    }
    const safe = Math.max(1, Math.min(366, days));
    setDashboardPreset(null);
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - (safe - 1));
    setDateRangeState({
      start: toYMDLocal(start),
      end: toYMDLocal(end),
    });
  }, []);

  const applyThisMonth = useCallback(() => {
    setDashboardPreset("this_month");
  }, []);

  const customRangeFetchKey =
    dashboardPreset != null
      ? "__preset__"
      : `${dateRange.start}|${dateRange.end}`;

  useEffect(() => {
    const ac = new AbortController();
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchHospitalAdminDashboard({
          preset: dashboardPreset ?? undefined,
          fromDate: dashboardPreset ? undefined : dateRange.start,
          toDate: dashboardPreset ? undefined : dateRange.end,
          patientPage: 1,
          patientLimit: DASHBOARD_PATIENT_PREVIEW_LIMIT,
          signal: ac.signal,
        });
        if (!cancelled) {
          setResponse(result.dashboard);
          setDateRangeState(normalizeRange(result.filters));
        }
      } catch (e) {
        if (cancelled || ac.signal.aborted || isLikelyAbortError(e)) return;
        const msg =
          e instanceof Error ? e.message : "Could not load dashboard data.";
        setError(msg);
        showError("Dashboard", msg);
        // Do not call setResponse here — keeps last snapshot (or empty placeholder before first success).
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      ac.abort();
    };
  }, [dashboardPreset, customRangeFetchKey]);

  const value = useMemo(
    () => ({
      dateRange,
      setDateRange,
      setStartDate,
      setEndDate,
      applyPresetDays,
      applyThisMonth,
      dashboardPreset,
      response,
      loading,
      error,
    }),
    [
      dateRange,
      setDateRange,
      setStartDate,
      setEndDate,
      applyPresetDays,
      applyThisMonth,
      dashboardPreset,
      response,
      loading,
      error,
    ],
  );

  return (
    <DashboardDataContext.Provider value={value}>
      {children}
    </DashboardDataContext.Provider>
  );
}

export function useDashboardData(): DashboardDataContextValue {
  const ctx = useContext(DashboardDataContext);
  if (!ctx) {
    throw new Error("useDashboardData must be used within DashboardDataProvider");
  }
  return ctx;
}
