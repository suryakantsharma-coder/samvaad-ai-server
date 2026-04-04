import { API_BASE_URL } from "../config";
import type { Prescription } from "../types/prescription.type";

/**
 * GET /api/public/prescriptions/:id — no authentication.
 */
export async function fetchPublicPrescription(
  prescriptionId: string,
): Promise<Prescription | null> {
  const id = prescriptionId.trim();
  if (!id) return null;
  const url = `${API_BASE_URL}/api/public/prescriptions/${encodeURIComponent(id)}`;
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
    });
    const raw = await res.json().catch(() => null);
    if (!res.ok) return null;
    return parsePublicPrescriptionResponse(raw);
  } catch {
    return null;
  }
}

function parsePublicPrescriptionResponse(raw: unknown): Prescription | null {
  if (raw == null || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (r.success === false) return null;
  const d = r.data;
  if (d != null && typeof d === "object") {
    const inner = d as Record<string, unknown>;
    if (inner.prescription != null && typeof inner.prescription === "object") {
      return inner.prescription as Prescription;
    }
    if ("_id" in inner && "patientName" in inner) {
      return d as Prescription;
    }
  }
  if ("_id" in (r as object) && "patientName" in (r as object)) {
    return r as unknown as Prescription;
  }
  return null;
}
