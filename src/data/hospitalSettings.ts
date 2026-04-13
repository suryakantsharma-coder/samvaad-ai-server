import { authFetch } from "./api";
import type {
  CreateHospitalSettingsPayload,
  HospitalSettings,
  PatchHospitalSettingsPayload,
} from "../types/hospitalSettings.type";

function asDict(v: unknown): Record<string, unknown> | null {
  if (v != null && typeof v === "object" && !Array.isArray(v)) {
    return v as Record<string, unknown>;
  }
  return null;
}

function bool(v: unknown, fallback: boolean): boolean {
  return typeof v === "boolean" ? v : fallback;
}

/** Default payload for POST /api/hospital-settings when no settings exist yet. */
export const defaultHospitalSettingsPayload =
  (): CreateHospitalSettingsPayload => ({
    whatsapp: {
      isEnabled: true,
      appointment: true,
      prescription: true,
      medicinesReminder: false,
    },
    teleCaller: { isEnabled: true },
  });

function parseWhatsapp(
  raw: Record<string, unknown> | undefined,
): HospitalSettings["whatsapp"] {
  const d = raw ?? {};
  return {
    isEnabled: bool(d.isEnabled, true),
    appointment: bool(d.appointment, true),
    prescription: bool(d.prescription, true),
    medicinesReminder: bool(
      d.medicinesReminder ?? d.medicineReminder,
      false,
    ),
  };
}

function parseTeleCaller(
  raw: Record<string, unknown> | undefined,
): HospitalSettings["teleCaller"] {
  const d = raw ?? {};
  return {
    isEnabled: bool(d.isEnabled, true),
  };
}

export function parseHospitalSettingsPayload(raw: unknown): HospitalSettings | null {
  if (raw == null || typeof raw !== "object") return null;
  const root = raw as Record<string, unknown>;
  if (root.success === false) return null;

  const data = asDict(root.data) ?? root;
  const nested =
    asDict(data.hospitalSettings) ??
    asDict(data.settings) ??
    data;

  const wa = asDict(nested.whatsapp);
  const tc = asDict(nested.teleCaller);

  return {
    whatsapp: parseWhatsapp(wa ?? undefined),
    teleCaller: parseTeleCaller(tc ?? undefined),
  };
}

function throwIfFailed(raw: unknown, fallback: string): void {
  if (raw == null || typeof raw !== "object") return;
  const r = raw as Record<string, unknown>;
  if (r.success === false) {
    const msg = r.message ?? r.error;
    throw new Error(typeof msg === "string" ? msg : fallback);
  }
}

/**
 * GET /api/hospital-settings/me — current user’s hospital settings.
 * Returns null when the API reports failure or no parseable payload (caller may POST defaults).
 */
export async function fetchHospitalSettingsMe(): Promise<HospitalSettings | null> {
  const raw = await authFetch("/api/hospital-settings/me", { method: "GET" });
  if (raw != null && typeof raw === "object") {
    const r = raw as Record<string, unknown>;
    if (r.success === false) return null;
  }
  return parseHospitalSettingsPayload(raw);
}

/**
 * POST /api/hospital-settings — create initial settings for the hospital.
 */
export async function createHospitalSettings(
  payload: CreateHospitalSettingsPayload,
): Promise<HospitalSettings> {
  const raw = await authFetch("/api/hospital-settings", {
    method: "POST",
    body: payload as unknown as Record<string, unknown>,
  });
  throwIfFailed(raw, "Failed to save hospital settings");
  const parsed = parseHospitalSettingsPayload(raw);
  if (parsed) return parsed;
  throw new Error("Invalid response from hospital settings create");
}

/**
 * PATCH /api/hospital-settings/me — partial update (e.g. `{ whatsapp: { appointment: false } }`).
 */
export async function patchHospitalSettingsMe(
  payload: PatchHospitalSettingsPayload,
): Promise<HospitalSettings> {
  const raw = await authFetch("/api/hospital-settings/me", {
    method: "PATCH",
    body: payload as unknown as Record<string, unknown>,
  });
  throwIfFailed(raw, "Failed to update hospital settings");
  const parsed = parseHospitalSettingsPayload(raw);
  if (parsed) return parsed;
  throw new Error("Invalid response from hospital settings update");
}

/**
 * Loads settings, or creates defaults via POST when GET returns nothing / not found.
 */
export async function loadOrCreateHospitalSettings(): Promise<HospitalSettings> {
  try {
    const existing = await fetchHospitalSettingsMe();
    if (existing) return existing;
  } catch {
    /* try create */
  }
  try {
    await createHospitalSettings(defaultHospitalSettingsPayload());
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (!/already|exist|duplicate/i.test(msg)) throw e;
  }
  const again = await fetchHospitalSettingsMe();
  if (again) return again;
  throw new Error("Could not load hospital settings after create.");
}
