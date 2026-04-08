import { getPatientById } from "../data/patient";
import type { Prescription } from "../types/prescription.type";
import {
  getPatientAgeForPdf,
  getPatientGenderForPdf,
} from "./prescriptionMeta";

function getPatientIdForLookup(rx: Prescription): string | null {
  if (typeof rx.patient === "string" && rx.patient.trim()) {
    return rx.patient.trim();
  }
  if (typeof rx.patient === "object" && rx.patient !== null) {
    const o = rx.patient as Record<string, unknown>;
    if (typeof o._id === "string" && o._id.trim()) return o._id.trim();
  }
  return null;
}

function parseAgeGenderFromPatientResponse(res: unknown): {
  age?: number;
  gender?: string;
} {
  if (res == null || typeof res !== "object") return {};
  const r = res as Record<string, unknown>;
  let node: unknown = r;
  if ("data" in r && r.data != null && typeof r.data === "object") {
    const d = r.data as Record<string, unknown>;
    node = d.patient != null ? d.patient : d;
  }
  if (node == null || typeof node !== "object") return {};
  const p = node as Record<string, unknown>;
  let age: number | undefined;
  if (typeof p.age === "number" && !Number.isNaN(p.age)) age = p.age;
  else if (typeof p.age === "string" && p.age.trim() !== "") {
    const n = Number(p.age.trim());
    if (!Number.isNaN(n)) age = n;
  }
  const gender =
    typeof p.gender === "string" && p.gender.trim()
      ? p.gender.trim()
      : undefined;
  return {
    ...(age !== undefined ? { age } : {}),
    ...(gender ? { gender } : {}),
  };
}

/**
 * When the prescription only has a patient id (or partial embed) without age/gender,
 * loads `/api/patients/:id` so the PDF can show demographics. Skipped without auth (e.g. public link).
 */
export async function resolvePrescriptionDemographicsForPdf(
  rx: Prescription,
): Promise<Prescription> {
  const hasToken =
    typeof localStorage !== "undefined" && !!localStorage.getItem("token");
  if (!hasToken) return rx;

  const missingAge = getPatientAgeForPdf(rx) === "—";
  const missingGender = getPatientGenderForPdf(rx) === "—";
  if (!missingAge && !missingGender) return rx;

  const id = getPatientIdForLookup(rx);
  if (!id) return rx;

  try {
    const raw = await getPatientById(id);
    const { age, gender } = parseAgeGenderFromPatientResponse(raw);
    let next: Prescription = { ...rx };
    if (missingAge && age != null) next = { ...next, patientAge: age };
    if (missingGender && gender) next = { ...next, patientGender: gender };
    return next;
  } catch {
    return rx;
  }
}
