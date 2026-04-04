import { authFetch } from "./api";

function responseIndicatesSavedCreds(raw: unknown): boolean {
  if (raw == null || typeof raw !== "object") return false;
  const r = raw as Record<string, unknown>;
  if (r.success === false) return false;

  const data = r.data;
  if (data != null) {
    if (typeof data === "object" && !Array.isArray(data)) {
      return Object.keys(data as object).length > 0;
    }
    if (typeof data === "string") return data.trim().length > 0;
    return true;
  }

  if (
    "waba_id" in r ||
    "phone_number_id" in r ||
    "creds" in r ||
    "accessToken" in r
  ) {
    return true;
  }

  return r.success === true;
}

/**
 * GET /api/whatsapp/creds?hospitalId=... (Bearer token).
 * Returns true when the API indicates WhatsApp credentials are already stored.
 */
export async function hasWhatsappHospitalCreds(hospitalId: string): Promise<boolean> {
  const id = hospitalId.trim();
  if (!id) return false;
  try {
    const params = new URLSearchParams({ hospitalId: id });
    const raw = await authFetch(`/api/whatsapp/creds?${params.toString()}`, {
      method: "GET",
    });
    return responseIndicatesSavedCreds(raw);
  } catch {
    return false;
  }
}

/** Raw JSON from GET /api/whatsapp/creds?hospitalId=... for Graph onboarding. */
export async function fetchWhatsappCredsForOnboarding(
  hospitalId: string,
): Promise<unknown | null> {
  const id = hospitalId.trim();
  if (!id) return null;
  try {
    const params = new URLSearchParams({ hospitalId: id });
    return await authFetch(`/api/whatsapp/creds?${params.toString()}`, {
      method: "GET",
    });
  } catch {
    return null;
  }
}

/** Flags persisted for WhatsApp Graph onboarding (PUT upsert body). */
export interface WhatsappOnboardingStatusPayload {
  hospitalId: string;
  registrationPhone: boolean;
  subscribeApp: boolean;
  verifyRegistration: boolean;
}

export function parseWhatsappOnboardingStatus(
  raw: unknown,
  hospitalIdFallback: string,
): WhatsappOnboardingStatusPayload | null {
  if (raw == null || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (r.success === false) return null;
  const d = r.data;
  const o =
    d != null && typeof d === "object" && !Array.isArray(d)
      ? (d as Record<string, unknown>)
      : r;
  const hid = (
    o.hospitalId ??
    o.hospital_id ??
    hospitalIdFallback
  ).toString().trim();
  const registrationPhone = Boolean(
    o.registrationPhone ?? o.registration_phone,
  );
  const subscribeApp = Boolean(o.subscribeApp ?? o.subscribe_app);
  const verifyRegistration = Boolean(
    o.verifyRegistration ?? o.verify_registration,
  );
  return {
    hospitalId: hid || hospitalIdFallback.trim(),
    registrationPhone,
    subscribeApp,
    verifyRegistration,
  };
}

/**
 * GET /api/whatsapp/onboarding?hospitalId=... (Authorization: Bearer …)
 */
export async function getWhatsappOnboardingStatus(
  hospitalId: string,
): Promise<WhatsappOnboardingStatusPayload | null> {
  const id = hospitalId.trim();
  if (!id) return null;
  try {
    const params = new URLSearchParams({ hospitalId: id });
    const raw = await authFetch(`/api/whatsapp/onboarding?${params.toString()}`, {
      method: "GET",
    });
    return parseWhatsappOnboardingStatus(raw, id);
  } catch {
    return null;
  }
}

/**
 * PUT /api/whatsapp/onboarding — upsert onboarding flags for a hospital.
 */
export async function putWhatsappOnboardingStatus(
  payload: WhatsappOnboardingStatusPayload,
): Promise<unknown> {
  return authFetch("/api/whatsapp/onboarding", {
    method: "PUT",
    body: {
      hospitalId: payload.hospitalId.trim(),
      registrationPhone: payload.registrationPhone,
      subscribeApp: payload.subscribeApp,
      verifyRegistration: payload.verifyRegistration,
    },
  });
}
