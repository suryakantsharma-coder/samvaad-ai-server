import {
  CreatePrescriptionPayload,
  Prescription,
  UpdatePrescriptionPayload,
} from "../types/prescription.type";
import { authFetch } from "./api";

export type PrescriptionStatusFilter = "Draft" | "Sent" | "Completed";

export interface PrescriptionListParams {
  page: number;
  limit: number;
  patientId?: string;
  appointmentId?: string;
  status?: PrescriptionStatusFilter;
  startDate?: string;
  endDate?: string;
  /** Server filters list to prescriptions for this doctor (e.g. hospital admin dashboard). */
  doctorEmail?: string;
}

export const getPrescriptions = async (params: PrescriptionListParams) => {
  const search = new URLSearchParams();
  search.set("page", String(params.page));
  search.set("limit", String(params.limit));
  if (params.patientId) search.set("patientId", params.patientId);
  if (params.appointmentId) search.set("appointmentId", params.appointmentId);
  if (params.status) search.set("status", params.status);
  const start = params.startDate?.trim();
  const end = params.endDate?.trim();
  if (start) search.set("startDate", start);
  if (end) search.set("endDate", end);
  const docMail = params.doctorEmail?.trim();
  if (docMail) search.set("doctorEmail", docMail);

  return authFetch(`/api/prescriptions?${search.toString()}`, {
    method: "GET",
  });
};

export const searchPrescriptions = async (
  q: string,
  page: number,
  limit: number,
  options?: { doctorEmail?: string },
) => {
  const params = new URLSearchParams({
    q,
    page: String(page),
    limit: String(limit),
  });
  const docMail = options?.doctorEmail?.trim();
  if (docMail) params.set("doctorEmail", docMail);
  return authFetch(`/api/prescriptions/search?${params.toString()}`, {
    method: "GET",
  });
};

export const getPrescriptionById = async (id: string) => {
  return authFetch(`/api/prescriptions/${id}`, {
    method: "GET",
  });
};

export const createPrescription = async (
  payload: CreatePrescriptionPayload,
) => {
  return authFetch("/api/prescriptions", {
    method: "POST",
    body: payload as object,
  });
};

export const updatePrescription = async (
  prescriptionId: string,
  payload: UpdatePrescriptionPayload,
) => {
  const data = (await authFetch(`/api/prescriptions/${prescriptionId}`, {
    method: "PATCH",
    body: payload as object,
  })) as { message?: string; error?: string };
  if (data?.message) throw new Error(data.message);
  if (data?.error) throw new Error(String(data.error));
  return data;
};

export const deletePrescription = async (prescriptionId: string) => {
  return authFetch(`/api/prescriptions/${prescriptionId}`, {
    method: "DELETE",
  });
};
