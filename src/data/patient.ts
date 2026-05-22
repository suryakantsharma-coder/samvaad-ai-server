import {
  CreatePatientPayload,
  UpdatePatientPayload,
} from "../types/patient.type";
import { authFetch } from "./api";

export const createPatient = async (patient: CreatePatientPayload) => {
  return authFetch("/api/patients", {
    method: "POST",
    body: patient as object,
  });
};

export type PatientFilter = "all" | "today" | "tomorrow";

export const getPatientById = async (patientId: string) => {
  return authFetch(`/api/patients/${patientId}`, {
    method: "GET",
  });
};

/**
 * GET /api/patients/:patientId/overview
 * Returns patient details, appointments, and related overview data.
 */
export const getPatientOverview = async (patientId: string) => {
  return authFetch(`/api/patients/${patientId}/overview`, {
    method: "GET",
  });
};

export const getPatients = async (
  page: number,
  limit: number,
  filter?: PatientFilter,
  doctorId?: string | null,
  startDate?: string | null,
  endDate?: string | null,
  /** Optional name fragment — `GET /api/patients?doctor=…` (server-defined matching). */
  doctor?: string | null,
) => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (filter && filter !== "all") {
    params.set("filter", filter);
  }
  const id = doctorId?.trim();
  if (id) {
    params.set("doctorId", id);
  }
  const doctorName = doctor?.trim();
  if (doctorName) {
    params.set("doctor", doctorName);
  }
  const start = startDate?.trim();
  const end = endDate?.trim();
  if (start) {
    params.set("startDate", start);
  }
  if (end) {
    params.set("endDate", end);
  }
  return authFetch(`/api/patients?${params.toString()}`, {
    method: "GET",
  });
};

/** Optional scoping for `/api/patients/search` — same semantics as `GET /api/patients?doctor=` / `doctorId=`. */
export type PatientSearchDoctorScope = {
  doctor?: string;
  doctorId?: string;
};

export const searchPatients = async (
  q: string,
  page: number,
  limit: number,
  doctorScope?: PatientSearchDoctorScope,
) => {
  const params = new URLSearchParams({
    q,
    page: String(page),
    limit: String(limit),
  });
  const dn = doctorScope?.doctor?.trim();
  if (dn) params.set("doctor", dn);
  const did = doctorScope?.doctorId?.trim();
  if (did) params.set("doctorId", did);
  return authFetch(`/api/patients/search?${params.toString()}`, {
    method: "GET",
  });
};

export const updatePatient = async (
  patientId: string,
  patient: UpdatePatientPayload,
) => {
  const data = (await authFetch(`/api/patients/${patientId}`, {
    method: "PATCH",
    body: patient as object,
  })) as { message?: string; error?: string };
  if (data?.message) throw new Error(data.message);
  if (data?.error) throw new Error(String(data.error));
  return data;
};

export const deletePatient = async (patientId: string) => {
  return authFetch(`/api/patients/${patientId}`, {
    method: "DELETE",
  });
};
