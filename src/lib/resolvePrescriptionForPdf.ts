import { getHospitalById } from "../data/hospital";
import { getPatientById } from "../data/patient";
import type { Hospital } from "../types/hospital.type";
import type {
  Prescription,
  PrescriptionHospital,
} from "../types/prescription.type";
import {
  getPatientAgeForPdf,
  getPatientGenderForPdf,
  getPatientPhoneForPdf,
  getPatientWeightForPdf,
} from "./prescriptionMeta";

function getHospitalIdFromEmbedded(embedded: unknown): string | null {
  if (typeof embedded === "string" && embedded.trim()) return embedded.trim();
  if (embedded != null && typeof embedded === "object" && "_id" in embedded) {
    const id = (embedded as { _id?: unknown })._id;
    return typeof id === "string" && id.trim() ? id.trim() : null;
  }
  return null;
}

function prescriptionHospitalFromApi(h: Hospital): PrescriptionHospital {
  return {
    _id: h._id,
    name: h.name,
    phoneCountryCode: h.phoneCountryCode,
    phoneNumber: h.phoneNumber,
    email: h.email,
    contactPerson: h.contactPerson,
    registrationNumber: h.registrationNumber,
    address: h.address,
    city: h.city,
    pincode: h.pincode,
    logoUrl: h.logoUrl,
  };
}

function applyMergedHospital(
  rx: Prescription,
  merged: PrescriptionHospital,
): Prescription {
  if (rx.hospital !== undefined && rx.hospital !== null) {
    return { ...rx, hospital: merged };
  }
  const meds = rx.medicines;
  if (meds?.[0]) {
    return {
      ...rx,
      medicines: [{ ...meds[0], hospital: merged }, ...meds.slice(1)],
    };
  }
  return { ...rx, hospital: merged };
}

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

function parsePatientDetailsFromPatientResponse(res: unknown): {
  age?: number;
  gender?: string;
  phoneNumber?: string;
  weight?: number;
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
  const phoneNumber =
    typeof p.phoneNumber === "string" && p.phoneNumber.trim()
      ? p.phoneNumber.trim()
      : undefined;
  let weight: number | undefined;
  if (typeof p.weight === "number" && !Number.isNaN(p.weight)) weight = p.weight;
  else if (typeof p.weight === "string" && p.weight.trim() !== "") {
    const n = Number(p.weight.replace(/[^\d.]/g, ""));
    if (!Number.isNaN(n)) weight = n;
  }
  return {
    ...(age !== undefined ? { age } : {}),
    ...(gender ? { gender } : {}),
    ...(phoneNumber ? { phoneNumber } : {}),
    ...(weight !== undefined ? { weight } : {}),
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
  const missingPhone = getPatientPhoneForPdf(rx) === "—";
  const missingWeight = getPatientWeightForPdf(rx) === "—";
  if (!missingAge && !missingGender && !missingPhone && !missingWeight) return rx;

  const id = getPatientIdForLookup(rx);
  if (!id) return rx;

  try {
    const raw = await getPatientById(id);
    const { age, gender, phoneNumber, weight } =
      parsePatientDetailsFromPatientResponse(raw);
    let next: Prescription = { ...rx };
    if (missingAge && age != null) next = { ...next, patientAge: age };
    if (missingGender && gender) next = { ...next, patientGender: gender };
    if (missingPhone && phoneNumber) {
      next = { ...next, patientPhoneNumber: phoneNumber };
    }
    if (missingWeight && weight != null) {
      next = { ...next, patientWeight: weight };
    }
    return next;
  } catch {
    return rx;
  }
}

/**
 * When the prescription embeds a hospital without `logoUrl` (common if populate omits it),
 * loads `GET /api/hospitals/:id` so the PDF can rasterize `/uploads/hospitals/...`.
 * Skipped without auth (e.g. public prescription link — backend should embed `logoUrl` there).
 */
export async function resolvePrescriptionHospitalLogoForPdf(
  rx: Prescription,
): Promise<Prescription> {
  const hasToken =
    typeof localStorage !== "undefined" && !!localStorage.getItem("token");
  if (!hasToken) return rx;

  const embedded = rx.hospital ?? rx.medicines?.[0]?.hospital;
  const id = getHospitalIdFromEmbedded(embedded);
  if (!id) return rx;

  const existingLogo =
    typeof embedded === "object" &&
    embedded !== null &&
    typeof (embedded as PrescriptionHospital).logoUrl === "string"
      ? (embedded as PrescriptionHospital).logoUrl?.trim()
      : "";
  if (existingLogo) return rx;

  try {
    const res = await getHospitalById(id);
    const full = res?.data?.hospital;
    if (!full?.logoUrl?.trim()) return rx;
    const base: PrescriptionHospital =
      typeof embedded === "object" && embedded !== null
        ? (embedded as PrescriptionHospital)
        : { _id: id, name: "", phoneNumber: "" };
    const merged: PrescriptionHospital = {
      ...base,
      ...prescriptionHospitalFromApi(full),
    };
    return applyMergedHospital(rx, merged);
  } catch {
    return rx;
  }
}
