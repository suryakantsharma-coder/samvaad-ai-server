import { authFetch } from "./api";
import type { SuperAdminCallAnalyticsRow } from "../types/superAdminCallAnalytics.type";

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

function toStringValue(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function parseRows(raw: unknown): SuperAdminCallAnalyticsRow[] {
  if (!isRecord(raw)) throw new Error("Invalid usage analytics response.");
  if (raw.success === false) {
    const msg = raw.message ?? raw.error ?? "Failed to load usage analytics.";
    throw new Error(typeof msg === "string" ? msg : "Failed to load usage analytics.");
  }

  const rowsRaw = raw.data;
  if (!Array.isArray(rowsRaw)) return [];

  return rowsRaw
    .map((item) => {
      if (!isRecord(item)) return null;
      const hospitalId = toStringValue(item.hospitalId).trim();
      const hospitalName = toStringValue(item.hospitalName).trim();
      if (!hospitalId || !hospitalName) return null;

      return {
        hospitalId,
        hospitalName,
        voiceAgentNumber: toStringValue(item.voiceAgentNumber),
        totalCalls: toNumber(item.totalCalls),
        totalDuration: toNumber(item.totalDuration),
        totalCreditsUsed: toNumber(item.totalCreditsUsed),
        answeredCalls: toNumber(item.answeredCalls),
        missedCalls: toNumber(item.missedCalls),
        averageCallDuration: toNumber(item.averageCallDuration),
      };
    })
    .filter((row): row is SuperAdminCallAnalyticsRow => Boolean(row));
}

export async function fetchSuperAdminCallAnalytics(
  signal?: AbortSignal,
): Promise<SuperAdminCallAnalyticsRow[]> {
  const raw = await authFetch("/api/super-admin/call-analytics", {
    method: "GET",
    signal,
  });
  return parseRows(raw);
}
