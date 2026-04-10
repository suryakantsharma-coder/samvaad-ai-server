import { authFetch } from "./api";

type Dict = Record<string, unknown>;

function asDict(v: unknown): Dict | null {
  return v != null && typeof v === "object" && !Array.isArray(v)
    ? (v as Dict)
    : null;
}

function getStr(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

export type GoogleCalendarConnectionStatus = {
  connected: boolean;
  /** Optional detail from API (e.g. calendar id, email). */
  detail?: string;
};

function parseStatusPayload(raw: unknown): GoogleCalendarConnectionStatus {
  const root = asDict(raw);
  const inner =
    (asDict(root?.data) ?? root) ?? ({} as Record<string, unknown>);

  const flag =
    inner["connected"] ??
    inner["enabled"] ??
    inner["isConnected"] ??
    inner["linked"] ??
    inner["googleCalendarConnected"] ??
    inner["calendarConnected"];
  let connected = false;
  if (typeof flag === "boolean") {
    connected = flag;
  } else if (typeof flag === "string") {
    const s = flag.toLowerCase();
    connected = s === "true" || s === "connected" || s === "linked";
  } else {
    const st = getStr(inner["status"])?.toLowerCase();
    if (st) {
      connected =
        st === "connected" ||
        st === "active" ||
        st === "enabled" ||
        st === "authorized";
    }
  }

  const detail =
    getStr(inner["email"]) ??
    getStr(inner["calendarEmail"]) ??
    getStr(inner["accountEmail"]) ??
    getStr(inner["message"]);

  return { connected, detail };
}

/**
 * GET /api/hospitals/:hospitalId/google-calendar/status
 */
export async function fetchGoogleCalendarStatus(
  hospitalId: string,
): Promise<GoogleCalendarConnectionStatus> {
  const raw = await authFetch(
    `/api/hospitals/${encodeURIComponent(hospitalId)}/google-calendar/status`,
    { method: "GET" },
  );
  const root = asDict(raw);
  if (root && root.success === false) {
    throw new Error(
      getStr(root.message) ??
        getStr(root.error) ??
        "Could not load Google Calendar status.",
    );
  }
  return parseStatusPayload(raw);
}

/**
 * GET /api/hospitals/:hospitalId/google-calendar/auth-url
 * Returns URL to open for OAuth (same tab or new tab).
 */
export async function fetchGoogleCalendarAuthUrl(
  hospitalId: string,
): Promise<string> {
  const raw = await authFetch(
    `/api/hospitals/${encodeURIComponent(hospitalId)}/google-calendar/auth-url`,
    { method: "GET" },
  );
  const root = asDict(raw);
  if (root && root.success === false) {
    throw new Error(
      getStr(root.message) ??
        getStr(root.error) ??
        "Could not get Google authorization URL.",
    );
  }
  const inner = asDict(root?.data) ?? root ?? ({} as Dict);
  const nested = asDict(inner["data"]);
  const url =
    getStr(inner["url"]) ??
    getStr(inner["authUrl"]) ??
    getStr(inner["authorizationUrl"]) ??
    getStr(nested?.["url"]);
  if (!url) {
    throw new Error("Server did not return an authorization URL.");
  }
  return url;
}
