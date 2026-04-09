import { API_BASE_URL } from "../config";
import type { PublicTelecallerPayload } from "../types/telecaller.type";

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

type DoctorRow = NonNullable<PublicTelecallerPayload["doctors"]>[number];

function parseOneDoctor(node: unknown): DoctorRow | null {
  const d = asDict(node);
  if (!d) return null;
  const _id = getString(d._id) ?? getString(d.id) ?? getString(d.doctorId);
  const fullName =
    getString(d.fullName) ?? getString(d.name) ?? getString(d.doctorName);
  if (!_id || !fullName) return null;
  return {
    _id,
    fullName,
    designation: getString(d.designation),
    availability: getString(d.availability) ?? getString(d.workingHours),
    email: getString(d.email),
  };
}

function parseDoctors(node: unknown): PublicTelecallerPayload["doctors"] {
  if (Array.isArray(node)) {
    const doctors = node
      .map((item) => parseOneDoctor(item))
      .filter(Boolean) as NonNullable<PublicTelecallerPayload["doctors"]>;
    return doctors.length ? doctors : undefined;
  }
  const one = parseOneDoctor(node);
  return one ? [one] : undefined;
}

function parseLastAppointment(
  node: unknown,
): PublicTelecallerPayload["lastAppointment"] {
  const a = asDict(node);
  if (!a) return undefined;
  const doctorNode = asDict(a.doctor);
  const reason = getString(a.reason) ?? getString(a.visitReason);
  const doctorId =
    getString(a.doctorId) ??
    getString(doctorNode?._id) ??
    getString(a.doctor);
  const doctorName =
    getString(a.doctorName) ??
    getString(doctorNode?.fullName) ??
    getString(a.doctorFullName);
  if (!reason && !doctorId && !doctorName) return undefined;
  return {
    reason,
    doctorId,
    doctorName,
  };
}

export async function fetchPublicTelecallerDetails(
  patientId: string,
): Promise<PublicTelecallerPayload | null> {
  const id = patientId.trim();
  if (!id) return null;

  try {
    const url = `${API_BASE_URL}/api/tele-caller/patients/${encodeURIComponent(id)}`;
    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
    });
    const raw = (await response.json().catch(() => null)) as unknown;
    if (!response.ok) return null;
    const root = asDict(raw);
    if (!root || root.success === false) return null;
    const data = asDict(root.data) ?? root;
    const patient = parsePatient(data.patient ?? data.patientDetails ?? data);
    if (!patient) return null;
    const hospital = parseHospital(data.hospital ?? data.hospitalDetails);
    const doctorsFromList = parseDoctors(
      data.doctors ?? data.availableDoctors ?? data.hospitalDoctors,
    );
    const doctorsFromSingle = parseOneDoctor(
      data.doctor ?? data.assignedDoctor ?? data.doctorDetails,
    );
    const doctors =
      doctorsFromList?.length ?
        doctorsFromList
      : doctorsFromSingle ?
        [doctorsFromSingle]
      : undefined;
    const appointmentNode = asDict(
      data.appointment ??
        data.latestAppointment ??
        data.lastAppointment ??
        data.lastVisit,
    );
    const appointmentId =
      getString(appointmentNode?._id) ??
      getString(appointmentNode?.appointmentId) ??
      getString(data.appointmentId);
    const lastAppointment = parseLastAppointment(appointmentNode);
    const hospitalId = getString(data.hospitalId) ?? hospital?._id;
    return {
      patient,
      hospital,
      appointmentId,
      hospitalId,
      lastAppointment,
      doctors,
    };
  } catch {
    return null;
  }
}
