import { authFetch } from "./api";
import { mapHospitalAdminDashboardData } from "./mapHospitalAdminDashboard";
import type {
  HospitalAdminDashboardData,
  HospitalAdminDashboardPreset,
} from "../types/hospitalAdminDashboard.type";
import type { DashboardDateRange, DashboardResponse } from "../screens/Dashboard/dashboardResponse";

const DEFAULT_PATIENT_OVERVIEW_LIMIT = 10;

export type FetchHospitalAdminDashboardParams = {
  /** When set, sends `preset=` and ignores from/to. */
  preset?: HospitalAdminDashboardPreset;
  fromDate?: string;
  toDate?: string;
  patientPage?: number;
  patientLimit?: number;
  signal?: AbortSignal;
};

export type FetchHospitalAdminDashboardResult = {
  dashboard: DashboardResponse;
  /** Echoed range from `data.filters` for UI sync. */
  filters: DashboardDateRange;
};

function unwrapDashboardData(raw: unknown): HospitalAdminDashboardData | null {
  if (raw == null || typeof raw !== "object") return null;
  const root = raw as Record<string, unknown>;
  if (root.success === false) {
    const msg = root.message ?? root.error ?? "Dashboard request failed";
    throw new Error(typeof msg === "string" ? msg : String(msg));
  }
  const data = root.data;
  if (data == null || typeof data !== "object") return null;
  return data as HospitalAdminDashboardData;
}

/**
 * GET /api/dashboard/hospital-admin
 * @see HospitalAdminDashboardPreset for `preset` query values.
 */
export async function fetchHospitalAdminDashboard(
  params: FetchHospitalAdminDashboardParams,
): Promise<FetchHospitalAdminDashboardResult> {
  const search = new URLSearchParams();
  if (params.preset) {
    search.set("preset", params.preset);
  } else if (params.fromDate?.trim() && params.toDate?.trim()) {
    search.set("from_date", params.fromDate.trim());
    search.set("to_date", params.toDate.trim());
  }

  const page = Math.max(1, params.patientPage ?? 1);
  const limit = Math.max(
    1,
    Math.min(100, params.patientLimit ?? DEFAULT_PATIENT_OVERVIEW_LIMIT),
  );
  search.set("page", String(page));
  search.set("limit", String(limit));

  const raw = await authFetch(`/api/dashboard/hospital-admin?${search.toString()}`, {
    method: "GET",
    signal: params.signal,
  });

  const data = unwrapDashboardData(raw);
  const dashboard = mapHospitalAdminDashboardData(data);

  const filters = data?.filters;
  const start = filters?.startDate?.trim();
  const end = filters?.endDate?.trim();
  if (!start || !end) {
    throw new Error("Dashboard response missing filters.startDate / endDate.");
  }

  return {
    dashboard,
    filters: { start, end },
  };
}
