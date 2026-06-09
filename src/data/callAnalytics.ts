import { authFetch } from "./api";
import type { CallAnalyticsPayload } from "../types/callAnalytics.type";

export interface FetchCallAnalyticsParams {
  page?: number;
  limit?: number;
  startDate: string;
  endDate: string;
  signal?: AbortSignal;
}

export interface FetchCallAnalyticsResult {
  data: CallAnalyticsPayload;
}

function normalizePositiveInt(value: number | undefined, fallback: number): number {
  const n = Number.isFinite(value) ? Math.trunc(value as number) : fallback;
  return n > 0 ? n : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object";
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function toStringOrUndefined(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function parseCallAnalyticsPayload(raw: unknown): CallAnalyticsPayload {
  if (!isRecord(raw)) {
    throw new Error("Invalid usage analytics response.");
  }
  if (raw.success === false) {
    const msg = raw.message ?? raw.error ?? "Failed to load usage analytics.";
    throw new Error(typeof msg === "string" ? msg : "Failed to load usage analytics.");
  }
  const rootData = raw.data;
  if (!isRecord(rootData)) {
    throw new Error("Usage analytics payload is missing.");
  }

  const totalsRaw = isRecord(rootData.totals) ? rootData.totals : {};
  const paginationRaw = isRecord(rootData.pagination) ? rootData.pagination : {};
  const callsRaw = Array.isArray(rootData.calls) ? rootData.calls : [];

  return {
    hospitalId: toStringOrUndefined(rootData.hospitalId),
    hospitalName: toStringOrUndefined(rootData.hospitalName),
    voiceAgentNumber: toStringOrUndefined(rootData.voiceAgentNumber),
    totals: {
      totalCalls: toNumber(totalsRaw.totalCalls),
      totalDuration: toNumber(totalsRaw.totalDuration),
      totalCreditsUsed: toNumber(totalsRaw.totalCreditsUsed),
      answeredCalls: toNumber(totalsRaw.answeredCalls),
      missedCalls: toNumber(totalsRaw.missedCalls),
      averageCallDuration: toNumber(totalsRaw.averageCallDuration),
    },
    calls: callsRaw
      .map((item) => {
        if (!isRecord(item)) return null;
        return {
          _id: String(item._id ?? item.callSid ?? ""),
          callSid: toStringOrUndefined(item.callSid ?? item.sid),
          from: toStringOrUndefined(item.from),
          to: toStringOrUndefined(item.to),
          direction: toStringOrUndefined(item.direction),
          duration: toNumber(item.duration),
          creditUsed: toNumber(item.creditUsed),
          status: toStringOrUndefined(item.status),
          answeredBy: toStringOrUndefined(item.answeredBy),
          startTime: toStringOrUndefined(item.startTime),
          endTime: toStringOrUndefined(item.endTime),
          createdAt: toStringOrUndefined(item.createdAt),
        };
      })
      .filter((row): row is CallAnalyticsPayload["calls"][number] => Boolean(row?._id)),
    pagination: {
      page: toNumber(paginationRaw.page, 1),
      limit: toNumber(paginationRaw.limit, 20),
      total: toNumber(paginationRaw.total),
      totalPages: toNumber(paginationRaw.totalPages, 1),
    },
  };
}

export async function fetchCallAnalytics(
  params: FetchCallAnalyticsParams,
): Promise<FetchCallAnalyticsResult> {
  const page = normalizePositiveInt(params.page, 1);
  const limit = normalizePositiveInt(params.limit, 20);
  const startDate = params.startDate.trim();
  const endDate = params.endDate.trim();
  if (!startDate || !endDate) {
    throw new Error("Start and end date are required.");
  }

  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    startDate,
    endDate,
  });

  const raw = await authFetch(`/api/admin/call-analytics?${query.toString()}`, {
    method: "GET",
    signal: params.signal,
  });

  return { data: parseCallAnalyticsPayload(raw) };
}
