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

/**
 * Resolves the hospital `Doctor` row for a logged-in staff user (match by email).
 * Tries search first, then a single page with a high limit.
 */
export async function findDoctorForHospitalUserEmail(
  email: string,
): Promise<Doctor | null> {
  const want = email.trim().toLowerCase();
  if (!want) return null;

  const matchIn = (list: Doctor[]) =>
    list.find((d) => String(d.email ?? "").trim().toLowerCase() === want) ??
    null;

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
