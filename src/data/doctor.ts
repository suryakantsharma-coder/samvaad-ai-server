import {
  CreateDoctorPayload,
  UpdateDoctorPayload,
  Doctor,
} from "../types/doctor.type";
import { authFetch } from "./api";

function doctorsFromListResponse(response: unknown): Doctor[] {
  const root = response as Record<string, unknown> | undefined;
  const data =
    root && typeof root.data === "object" && root.data !== null
      ? (root.data as Record<string, unknown>)
      : {};
  const arr = data.doctors;
  return Array.isArray(arr) ? (arr as Doctor[]) : [];
}

export const addDoctor = async (doctor: CreateDoctorPayload) => {
  return authFetch("/api/doctors", {
    method: "POST",
    body: doctor as object,
  });
};

export const updateDoctor = async (
  doctorId: string,
  payload: UpdateDoctorPayload,
) => {
  return authFetch(`/api/doctors/${doctorId}`, {
    method: "PATCH",
    body: payload as object,
  });
};

export const deleteDoctor = async (doctorId: string) => {
  return authFetch(`/api/doctors/${doctorId}`, {
    method: "DELETE",
  });
};

export const getDoctors = async (page: number, limit: number) => {
  return authFetch(`/api/doctors?page=${page}&limit=${limit}`, {
    method: "GET",
  });
};

/** Lightweight row for dropdowns (GET /api/doctors/names). */
export type DoctorNameRow = {
  _id: string;
  fullName: string;
};

function parseDoctorNamesResponse(payload: unknown): DoctorNameRow[] {
  if (payload == null || typeof payload !== "object") return [];
  const root = payload as Record<string, unknown>;

  let raw: unknown[] = [];
  const data = root.data;
  if (Array.isArray(data)) {
    raw = data;
  } else if (data != null && typeof data === "object") {
    const d = data as Record<string, unknown>;
    if (Array.isArray(d.doctors)) raw = d.doctors;
    else if (Array.isArray(d.names)) raw = d.names;
  }
  if (raw.length === 0 && Array.isArray(root.doctors)) {
    raw = root.doctors;
  }

  const rows: DoctorNameRow[] = [];
  for (const item of raw) {
    if (item == null || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const id = o._id ?? o.id;
    const name = o.fullName ?? o.name;
    if (typeof id === "string" && id.trim() && typeof name === "string") {
      rows.push({ _id: id.trim(), fullName: name });
    }
  }
  return rows;
}

/**
 * GET /api/doctors/names — hospital-scoped id + display name list for filters/dropdowns.
 */
export const getDoctorNames = async (): Promise<DoctorNameRow[]> => {
  const res = await authFetch("/api/doctors/names", { method: "GET" });
  return parseDoctorNamesResponse(res);
};

export const searchDoctors = async (q: string, page: number, limit: number) => {
  const params = new URLSearchParams({
    q,
    page: String(page),
    limit: String(limit),
  });
  return authFetch(`/api/doctors/search?${params.toString()}`, {
    method: "GET",
  });
};

/** Parsed from GET /api/doctors/link-status */
export type DoctorLinkStatusResult = {
  /** True when API indicates the user/doctor is linked (incl. `linkedToHospital`). */
  linked: boolean;
  /** Present when API sends `linkedToHospital` (mirrors server field). */
  linkedToHospital?: boolean;
  /** Mongo doctor document id when the API returns it */
  doctorMongoId?: string;
};

function parseDoctorFromByEmailResponse(raw: unknown): Doctor | null {
  if (raw == null || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (r.success === false) return null;

  let doc: unknown = r.data;
  if (doc != null && typeof doc === "object") {
    const d = doc as Record<string, unknown>;
    if ("doctor" in d && d.doctor != null) doc = d.doctor;
  }
  if (
    doc != null &&
    typeof doc === "object" &&
    "_id" in doc &&
    typeof (doc as Record<string, unknown>)._id === "string"
  ) {
    return doc as Doctor;
  }
  if (r.doctor != null && typeof r.doctor === "object") {
    return r.doctor as Doctor;
  }
  return null;
}

function parseDoctorLinkStatusPayload(
  raw: unknown,
): DoctorLinkStatusResult | null {
  if (raw == null || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (r.success === false) return { linked: false };

  const candidates: Record<string, unknown>[] = [r];
  if (r.data != null && typeof r.data === "object") {
    const d = r.data as Record<string, unknown>;
    candidates.push(d);
    if (d.data != null && typeof d.data === "object") {
      candidates.push(d.data as Record<string, unknown>);
    }
  }

  for (const node of candidates) {
    const linkedRaw = node.linked ?? node.isLinked ?? node.is_linked ?? node.linkStatus;
    const hospitalLinkRaw =
      node.linkedToHospital ?? node.linked_to_hospital ?? node.linked_toHospital;
    const linkedToHospital =
      hospitalLinkRaw === true ||
      hospitalLinkRaw === 1 ||
      String(hospitalLinkRaw).toLowerCase() === "true";
    const hospitalExplicitlyUnlinked =
      hospitalLinkRaw === false ||
      hospitalLinkRaw === 0 ||
      String(hospitalLinkRaw).toLowerCase() === "false";
    const linked =
      linkedRaw === true ||
      linkedRaw === 1 ||
      String(linkedRaw).toLowerCase() === "true" ||
      String(node.status ?? "").toLowerCase() === "linked" ||
      String(node.linkStatus ?? "").toLowerCase() === "linked" ||
      String(node.linkStatus ?? "").toLowerCase() === "true" ||
      linkedToHospital;
    const explicitlyUnlinked =
      linkedRaw === false ||
      linkedRaw === 0 ||
      String(linkedRaw).toLowerCase() === "false" ||
      node.linked === false ||
      node.isLinked === false ||
      node.is_linked === false ||
      hospitalExplicitlyUnlinked;

    if (!linked && !explicitlyUnlinked) continue;

    let doctorMongoId: string | undefined;
    const idCandidates: unknown[] = [
      node.doctorId,
      node.doctor_id,
      node.doctorMongoId,
      node.mongoDoctorId,
      linked && typeof node._id === "string" ? node._id : undefined,
      typeof node.doctor === "string" ? node.doctor : undefined,
    ];
    for (const idRaw of idCandidates) {
      if (typeof idRaw === "string" && idRaw.trim()) {
        doctorMongoId = idRaw.trim();
        break;
      }
    }
    if (
      !doctorMongoId &&
      node.doctor != null &&
      typeof node.doctor === "object"
    ) {
      const did = (node.doctor as Record<string, unknown>)._id;
      if (typeof did === "string" && did.trim()) doctorMongoId = did.trim();
    }

    return {
      linked: !!linked,
      ...(linkedToHospital ? { linkedToHospital: true as const } : {}),
      doctorMongoId,
    };
  }

  return null;
}

/**
 * GET /api/doctors/by-email?email=…&hospitalId=… — hospital-scoped doctor row for linking.
 */
export async function getDoctorByEmail(
  email: string,
  hospitalId?: string | null,
): Promise<Doctor | null> {
  const e = email.trim();
  if (!e) return null;
  try {
    const params = new URLSearchParams({ email: e });
    const hid = hospitalId?.trim();
    if (hid) params.set("hospitalId", hid);
    const res = await authFetch(`/api/doctors/by-email?${params.toString()}`, {
      method: "GET",
    });
    return parseDoctorFromByEmailResponse(res);
  } catch {
    return null;
  }
}

/** Collapse concurrent link-status calls (same email + hospital) from Strict Mode / duplicate effects. */
const linkStatusInFlight = new Map<
  string,
  Promise<DoctorLinkStatusResult | null>
>();

/**
 * GET /api/doctors/link-status?email=…&hospitalId=… — link state for that hospital.
 */
export async function getDoctorLinkStatus(
  email: string,
  hospitalId?: string | null,
): Promise<DoctorLinkStatusResult | null> {
  const e = email.trim();
  if (!e) return null;
  const key = `${e.toLowerCase()}|${hospitalId?.trim() ?? ""}`;
  const existing = linkStatusInFlight.get(key);
  if (existing) return existing;

  const promise = (async (): Promise<DoctorLinkStatusResult | null> => {
    try {
      const params = new URLSearchParams({ email: e });
      const hid = hospitalId?.trim();
      if (hid) params.set("hospitalId", hid);
      const res = await authFetch(
        `/api/doctors/link-status?${params.toString()}`,
        { method: "GET" },
      );
      return parseDoctorLinkStatusPayload(res);
    } catch {
      return null;
    } finally {
      linkStatusInFlight.delete(key);
    }
  })();

  linkStatusInFlight.set(key, promise);
  return promise;
}

/**
 * Resolves the hospital `Doctor` row for a logged-in staff user (match by email).
 * Uses GET /api/doctors/by-email?hospitalId=… when available, then search + list fallback.
 */
export async function findDoctorForHospitalUserEmail(
  email: string,
  hospitalId?: string | null,
): Promise<Doctor | null> {
  const want = email.trim().toLowerCase();
  if (!want) return null;

  const matchIn = (list: Doctor[]) =>
    list.find((d) => String(d.email ?? "").trim().toLowerCase() === want) ??
    null;

  try {
    const byEmail = await getDoctorByEmail(email, hospitalId);
    if (byEmail) return byEmail;
  } catch {
    /* continue */
  }

  try {
    const searchRes = await searchDoctors(want, 1, 50);
    const fromSearch = matchIn(doctorsFromListResponse(searchRes));
    if (fromSearch) return fromSearch;
  } catch {
    /* continue */
  }

  try {
    const listRes = await getDoctors(1, 200);
    return matchIn(doctorsFromListResponse(listRes));
  } catch {
    return null;
  }
}
