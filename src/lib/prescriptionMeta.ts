import type {
  Prescription,
  PrescriptionAppointmentDetail,
  PrescriptionDoctorInfo,
  PrescriptionHospital,
  PrescriptionMedicine,
  PrescriptionPatientInfo,
} from "../types/prescription.type";

export function decodeHtmlEntities(s: string): string {
  if (typeof document === "undefined") return s.replace(/&#x2F;/g, "/");
  const ta = document.createElement("textarea");
  ta.innerHTML = s;
  return ta.value;
}

function isPatientInfo(
  p: Prescription["patient"],
): p is PrescriptionPatientInfo {
  return typeof p === "object" && p !== null && "fullName" in p;
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
  if (isPatientInfo(rx.patient)) return rx.patient.fullName;
  return rx.patientName ?? "—";
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

export function formatHospitalPhone(h: PrescriptionHospital): string {
  const cc = h.phoneCountryCode?.trim() ?? "";
  const num = h.phoneNumber?.trim() ?? "";
  if (cc && num) return `${cc} ${num}`;
  return num || "—";
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
