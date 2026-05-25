import type {
  Prescription,
  PrescriptionAppointmentDetail,
  PrescriptionDoctorInfo,
  PrescriptionHospital,
  PrescriptionMedicine,
} from "../types/prescription.type";

export function decodeHtmlEntities(s: string): string {
  if (typeof document === "undefined") return s.replace(/&#x2F;/g, "/");
  const ta = document.createElement("textarea");
  ta.innerHTML = s;
  return ta.value;
}

export function isAppointmentDetail(
  a: Prescription["appointment"],
): a is PrescriptionAppointmentDetail {
  return typeof a === "object" && a !== null && "doctor" in a;
}

export function getHospital(
  rx: Prescription,
): PrescriptionHospital | undefined {
  return rx.hospital ?? rx.medicines?.[0]?.hospital;
}

export function getPatientDisplayName(rx: Prescription): string {
  if (typeof rx.patient === "object" && rx.patient !== null) {
    const o = rx.patient as Record<string, unknown>;
    const fromFull = typeof o.fullName === "string" ? o.fullName.trim() : "";
    const fromName = typeof o.name === "string" ? o.name.trim() : "";
    if (fromFull) return fromFull;
    if (fromName) return fromName;
  }
  return rx.patientName?.trim() || "—";
}

type LooseDemographics = { age?: unknown; gender?: unknown };
type LoosePatientInfo = {
  phoneNumber?: unknown;
  patientPhoneNumber?: unknown;
  weight?: unknown;
  patientWeight?: unknown;
};

function readAgeFromRecord(o: Record<string, unknown>): string | null {
  const v = o.age ?? o.Age;
  if (v == null) return null;
  if (typeof v === "number" && !Number.isNaN(v)) return String(v);
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v.trim());
    if (!Number.isNaN(n)) return String(n);
  }
  return null;
}

function readGenderFromRecord(o: Record<string, unknown>): string | null {
  const v = o.gender ?? o.Gender;
  if (typeof v === "string" && v.trim()) return v.trim();
  return null;
}

/** Age for PDF: nested `patient` object (any shape), `patientAge`, or loose `age` */
export function getPatientAgeForPdf(rx: Prescription): string {
  if (typeof rx.patient === "object" && rx.patient !== null) {
    const fromNested = readAgeFromRecord(rx.patient as Record<string, unknown>);
    if (fromNested) return fromNested;
  }
  if (rx.patientAge != null && !Number.isNaN(Number(rx.patientAge))) {
    return String(Number(rx.patientAge));
  }
  const loose = rx as Prescription & LooseDemographics;
  if (typeof loose.age === "number" && !Number.isNaN(loose.age)) {
    return String(loose.age);
  }
  if (typeof loose.age === "string" && loose.age.trim() !== "") {
    const n = Number(loose.age.trim());
    if (!Number.isNaN(n)) return String(n);
  }
  return "—";
}

/** Gender for PDF: nested `patient`, `patientGender`, or loose `gender` */
export function getPatientGenderForPdf(rx: Prescription): string {
  if (typeof rx.patient === "object" && rx.patient !== null) {
    const fromNested = readGenderFromRecord(
      rx.patient as Record<string, unknown>,
    );
    if (fromNested) return fromNested;
  }
  const root = rx.patientGender?.trim();
  if (root) return root;
  const loose = rx as Prescription & LooseDemographics;
  if (typeof loose.gender === "string" && loose.gender.trim()) {
    return loose.gender.trim();
  }
  return "—";
}

/** Phone for PDF: nested patient.phoneNumber, root patientPhoneNumber, or loose phoneNumber. */
export function getPatientPhoneForPdf(rx: Prescription): string {
  if (typeof rx.patient === "object" && rx.patient !== null) {
    const nested = rx.patient as Record<string, unknown>;
    if (typeof nested.phoneNumber === "string" && nested.phoneNumber.trim()) {
      return nested.phoneNumber.trim();
    }
  }
  if (typeof rx.patientPhoneNumber === "string" && rx.patientPhoneNumber.trim()) {
    return rx.patientPhoneNumber.trim();
  }
  const loose = rx as Prescription & LoosePatientInfo;
  if (typeof loose.phoneNumber === "string" && loose.phoneNumber.trim()) {
    return loose.phoneNumber.trim();
  }
  return "—";
}

function parseWeight(value: unknown): number | null {
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const numText = value.replace(/[^\d.]/g, "");
    const n = Number(numText);
    if (!Number.isNaN(n)) return n;
  }
  return null;
}

/** Weight for PDF: nested patient.weight, root patientWeight, or loose weight. */
export function getPatientWeightForPdf(rx: Prescription): string {
  if (typeof rx.patient === "object" && rx.patient !== null) {
    const nested = rx.patient as Record<string, unknown>;
    const w = parseWeight(nested.weight ?? nested.Weight);
    if (w != null) return `${w} kg`;
  }
  const rootWeight = parseWeight(rx.patientWeight);
  if (rootWeight != null) return `${rootWeight} kg`;
  const loose = rx as Prescription & LoosePatientInfo;
  const lw = parseWeight(loose.weight ?? loose.patientWeight);
  if (lw != null) return `${lw} kg`;
  return "—";
}

export function getDiagnosis(rx: Prescription): string {
  if (isAppointmentDetail(rx.appointment)) {
    return rx.appointment.reason?.trim() || "—";
  }
  return "—";
}

export function getDoctor(
  rx: Prescription,
): PrescriptionDoctorInfo | undefined {
  if (isAppointmentDetail(rx.appointment)) return rx.appointment.doctor;
  return rx.medicines?.[0]?.doctor;
}

export function formatHospitalAddress(h: PrescriptionHospital): string {
  const parts = [
    h.address,
    [h.city, h.pincode].filter(Boolean).join(", "),
  ].filter(Boolean);
  return parts.join("\n") || "—";
}

/** Minimum digits required to show a phone line (avoids lone +91 / empty). */
const MIN_PHONE_DIGITS = 7;

function digitCount(...chunks: (string | undefined)[]): number {
  return chunks.filter(Boolean).join("").replace(/\D/g, "").length;
}

/** True when the string has enough digits to display as a phone number. */
export function hasMeaningfulPhoneDigits(
  raw: string | undefined | null,
): boolean {
  return digitCount(raw) >= MIN_PHONE_DIGITS;
}

/** Formatted hospital contact, or empty string when no usable number (no "—", no lone country code). */
export function formatHospitalPhone(h: PrescriptionHospital): string {
  const cc = h.phoneCountryCode?.trim() ?? "";
  const num = h.phoneNumber?.trim() ?? "";
  if (digitCount(cc, num) < MIN_PHONE_DIGITS) return "";
  if (cc && num) return `${cc} ${num}`;
  if (num) return num;
  return "";
}

export function buildMedicineFrequencyLine(m: PrescriptionMedicine): string {
  if (m.frequency?.trim()) return decodeHtmlEntities(m.frequency.trim());
  const times: string[] = [];
  if (m.time?.breakfast) times.push("Breakfast");
  if (m.time?.lunch) times.push("Lunch");
  if (m.time?.dinner) times.push("Dinner");
  const meal = times.length ? times.join(", ") : "";
  const intake = m.intake ? `${m.intake} meal` : "";
  return [intake, meal].filter(Boolean).join(" · ") || "—";
}
