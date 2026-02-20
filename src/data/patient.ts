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
) => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (filter && filter !== "all") {
    params.set("filter", filter);
  }
  return authFetch(`/api/patients?${params.toString()}`, {
    method: "GET",
  });
};

export const searchPatients = async (
  q: string,
  page: number,
  limit: number,
) => {
  const params = new URLSearchParams({
    q,
    page: String(page),
    limit: String(limit),
  });
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
