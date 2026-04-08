import { API_BASE_URL } from "../config";
import type { PublicTelecallerPayload } from "../types/telecaller.type";
import { authFetch } from "./api";

type Dict = Record<string, unknown>;

function asDict(v: unknown): Dict | null {
  return v != null && typeof v === "object" ? (v as Dict) : null;
}

function getString(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

function parsePatient(node: unknown): PublicTelecallerPayload["patient"] | null {
  const p = asDict(node);
  if (!p) return null;
  const _id = getString(p._id) ?? getString(p.id);
  const fullName = getString(p.fullName) ?? getString(p.name);
  if (!_id || !fullName) return null;
  const ageRaw = p.age;
  const age =
    typeof ageRaw === "number" && !Number.isNaN(ageRaw)
      ? ageRaw
      : typeof ageRaw === "string" && ageRaw.trim()
        ? Number(ageRaw)
        : undefined;
  return {
    _id,
    fullName,
    phoneNumber: getString(p.phoneNumber),
    age: age != null && !Number.isNaN(age) ? age : undefined,
    gender: getString(p.gender),
  };
}

function parseHospital(node: unknown): PublicTelecallerPayload["hospital"] {
  const h = asDict(node);
  if (!h) return undefined;
  const _id = getString(h._id) ?? getString(h.id);
  const name = getString(h.name);
  if (!_id || !name) return undefined;
  return {
    _id,
    name,
    phoneCountryCode: getString(h.phoneCountryCode),
    phoneNumber: getString(h.phoneNumber),
    email: getString(h.email),
    address: getString(h.address),
    city: getString(h.city),
    pincode: getString(h.pincode),
  };
}

function parseDoctors(node: unknown): PublicTelecallerPayload["doctors"] {
  if (!Array.isArray(node)) return undefined;
  const doctors = node
    .map((item) => {
      const d = asDict(item);
      if (!d) return null;
      const _id = getString(d._id) ?? getString(d.id);
      const fullName = getString(d.fullName) ?? getString(d.name);
      if (!_id || !fullName) return null;
      return {
        _id,
        fullName,
        designation: getString(d.designation),
        availability: getString(d.availability),
      };
    })
    .filter(Boolean) as NonNullable<PublicTelecallerPayload["doctors"]>;
  return doctors.length ? doctors : undefined;
}

export async function fetchPublicTelecallerDetails(
  patientId: string,
): Promise<PublicTelecallerPayload | null> {
  const id = patientId.trim();
  if (!id) return null;

  try {
    const raw = (await authFetch(
      `${API_BASE_URL}/api/tele-caller/patients/${encodeURIComponent(id)}`,
      { method: "GET" },
    )) as unknown;
    const root = asDict(raw);
    if (!root || root.success === false) return null;
    const data = asDict(root.data) ?? root;
    const patient = parsePatient(data.patient ?? data.patientDetails ?? data);
    if (!patient) return null;
    const hospital = parseHospital(data.hospital ?? data.hospitalDetails);
    const doctors = parseDoctors(data.doctors ?? data.availableDoctors);
    const appointmentNode = asDict(data.appointment ?? data.latestAppointment);
    const appointmentId =
      getString(appointmentNode?._id) ??
      getString(appointmentNode?.appointmentId) ??
      getString(data.appointmentId);
    const hospitalId = getString(data.hospitalId) ?? hospital?._id;
    return {
      patient,
      hospital,
      appointmentId,
      hospitalId,
      doctors,
    };
  } catch {
    return null;
  }
}
