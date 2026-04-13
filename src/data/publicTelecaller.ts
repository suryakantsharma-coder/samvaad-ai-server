import { API_BASE_URL } from "../config";
import type { PublicTelecallerPayload } from "../types/telecaller.type";

type Dict = Record<string, unknown>;

function asDict(v: unknown): Dict | null {
  return v != null && typeof v === "object" ? (v as Dict) : null;
}

function getString(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

function parseNonNegativeNumber(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v) && v >= 0) return v;
  if (typeof v === "string" && v.trim()) {
    const n = Number(v.trim());
    if (Number.isFinite(n) && n >= 0) return n;
  }
  return undefined;
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
  const teleCallerPrice = parseNonNegativeNumber(h.teleCallerPrice);
  return {
    _id,
    name,
    phoneCountryCode: getString(h.phoneCountryCode),
    phoneNumber: getString(h.phoneNumber),
    email: getString(h.email),
    address: getString(h.address),
    city: getString(h.city),
    pincode: getString(h.pincode),
    ...(teleCallerPrice != null ? { teleCallerPrice } : {}),
  };
}

type DoctorRow = NonNullable<PublicTelecallerPayload["doctors"]>[number];

/** Many APIs omit `email` or use alternate keys / nested `user`. */
function pickDoctorEmail(node: Dict | null | undefined): string | undefined {
  if (!node) return undefined;
  const user = asDict(node.user);
  return (
    getString(node.email) ??
    getString(node.doctorEmail) ??
    getString(node.emailId) ??
    getString(node.primaryEmail) ??
    getString(node.workEmail) ??
    getString(user?.email)
  );
}

/** Used when mapping secured `/api/doctors` rows so Razorpay notes get the same fields as public payload. */
export function extractDoctorEmail(node: unknown): string | undefined {
  return pickDoctorEmail(asDict(node));
}

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
    email: pickDoctorEmail(d),
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

/**
 * Backend may expose doctor email on the patient payload root (not inside each `doctors[]` row).
 * Merge when rows are missing `email`, using optional `doctorId` to pick the right row.
 */
function enrichDoctorsWithPayloadDoctorEmail(
  doctors: NonNullable<PublicTelecallerPayload["doctors"]> | undefined,
  payloadEmail: string | undefined,
  payloadDoctorId: string | undefined,
): NonNullable<PublicTelecallerPayload["doctors"]> | undefined {
  if (!doctors?.length || !payloadEmail?.trim()) return doctors;
  const email = payloadEmail.trim();
  const targetId = payloadDoctorId?.trim();
  return doctors.map((d) => {
    if (d.email?.trim()) return d;
    if (targetId) {
      if (d._id === targetId) return { ...d, email };
      return d;
    }
    if (doctors.length === 1) return { ...d, email };
    return d;
  });
}

function pickDoctorEmailFromPayloadRoot(data: Dict): {
  email?: string;
  doctorId?: string;
} {
  const email =
    getString(data.doctorEmail) ??
    getString(data.assignedDoctorEmail) ??
    getString(data.primaryDoctorEmail) ??
    getString(data.doctorsEmail) ??
    pickDoctorEmail(asDict(data.doctor)) ??
    pickDoctorEmail(asDict(data.assignedDoctor)) ??
    pickDoctorEmail(asDict(data.doctorDetails)) ??
    pickDoctorEmail(asDict(data.selectedDoctor));
  const doctorId =
    getString(data.doctorId) ??
    getString(data.assignedDoctorId) ??
    getString(data.primaryDoctorId) ??
    getString(asDict(data.doctor)?._id) ??
    getString(asDict(data.assignedDoctor)?._id);
  return { email, doctorId };
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
  const doctorEmail =
    getString(a.doctorEmail) ??
    pickDoctorEmail(doctorNode) ??
    pickDoctorEmail(asDict(a.assignedDoctor)) ??
    pickDoctorEmail(asDict(a.doctorDetails));
  if (!reason && !doctorId && !doctorName) return undefined;
  return {
    reason,
    doctorId,
    doctorName,
    doctorEmail,
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
    let doctors =
      doctorsFromList?.length ?
        doctorsFromList
      : doctorsFromSingle ?
        [doctorsFromSingle]
      : undefined;

    const { email: payloadDoctorEmail, doctorId: payloadDoctorId } =
      pickDoctorEmailFromPayloadRoot(data);
    doctors = enrichDoctorsWithPayloadDoctorEmail(
      doctors,
      payloadDoctorEmail,
      payloadDoctorId,
    );

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
    let lastAppointment = parseLastAppointment(appointmentNode);
    if (
      lastAppointment &&
      !lastAppointment.doctorEmail?.trim() &&
      payloadDoctorEmail?.trim()
    ) {
      const laId = lastAppointment.doctorId?.trim();
      if (!payloadDoctorId || !laId || laId === payloadDoctorId) {
        lastAppointment = {
          ...lastAppointment,
          doctorEmail: payloadDoctorEmail.trim(),
        };
      }
    }
    const hospitalId = getString(data.hospitalId) ?? hospital?._id;
    const priceFromRoot = parseNonNegativeNumber(data.teleCallerPrice);
    let hospitalOut = hospital;
    if (
      hospitalOut &&
      hospitalOut.teleCallerPrice == null &&
      priceFromRoot != null
    ) {
      hospitalOut = { ...hospitalOut, teleCallerPrice: priceFromRoot };
    }
    return {
      patient,
      hospital: hospitalOut,
      appointmentId,
      hospitalId,
      lastAppointment,
      doctors,
    };
  } catch {
    return null;
  }
}
