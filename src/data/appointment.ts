import { authFetch } from "./api";
import {
  RescheduleAppointmentPayload,
  AppointmentPayload,
} from "../types/appointment.type";

export interface AppointmentListParams {
  page: number;
  limit: number;
  filter?: "all" | "today" | "tomorrow";
  fromDate?: string;
  toDate?: string;
  doctorId?: string;
  patientId?: string;
  status?: string;
}

export const getAppointments = async (params: AppointmentListParams) => {
  const search = new URLSearchParams();
  search.set("page", String(params.page));
  search.set("limit", String(params.limit));
  if (params.filter && params.filter !== "all") {
    search.set("filter", params.filter);
  }
  if (params.fromDate) search.set("fromDate", params.fromDate);
  if (params.toDate) search.set("toDate", params.toDate);
  if (params.doctorId) search.set("doctorId", params.doctorId);
  if (params.patientId) search.set("patientId", params.patientId);
  if (params.status) search.set("status", params.status);

  return authFetch(`/api/appointments?${search.toString()}`, {
    method: "GET",
  });
};

export const searchAppointments = async (
  q: string,
  page: number,
  limit: number,
) => {
  const params = new URLSearchParams({
    q,
    page: String(page),
    limit: String(limit),
  });
  return authFetch(`/api/appointments/search?${params.toString()}`, {
    method: "GET",
  });
};

export const createAppointment = async (appointment: AppointmentPayload) => {
  return authFetch("/api/appointments", {
    method: "POST",
    body: appointment as object,
  });
};

export const deleteAppointment = async (appointmentId: string) => {
  return authFetch(`/api/appointments/${appointmentId}`, {
    method: "DELETE",
  });
};

export const updateAppointment = async (
  appointmentId: string,
  payload: RescheduleAppointmentPayload,
) => {
  return authFetch(`/api/appointments/${appointmentId}`, {
    method: "PATCH",
    body: { appointmentDateTime: payload.appointmentDateTime } as object,
  });
};

export const MarkAsDoneAppointment = async (appointmentId: string) => {
  return authFetch(`/api/appointments/${appointmentId}`, {
    method: "PATCH",
    body: { status: "Completed" } as object,
  });
};
