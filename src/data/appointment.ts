import {
  AppointmentPayload,
  RescheduleAppointmentPayload,
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

  const response = await fetch(
    `http://localhost:3000/api/appointments?${search.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    },
  );
  const data = await response.json();
  return data;
};

export const searchAppointments = async (
  q: string,
  page: number,
  limit: number,
) => {
  const params = new URLSearchParams({ q, page: String(page), limit: String(limit) });
  const response = await fetch(
    `http://localhost:3000/api/appointments/search?${params.toString()}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    },
  );
  return response.json();
};

// curl -X POST "http://localhost:3000/api/appointments" \
//   -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
//   -H "Content-Type: application/json" \
// -d '{"patient":"PATIENT_ID","doctor":"DOCTOR_ID","reason":"Follow-up check","status":"Upcoming","type":"Hospital","appointmentDateTime":"2025-02-10T10:00:00.000Z"}'

export const createAppointment = async (appointment: AppointmentPayload) => {
  const response = await fetch("http://localhost:3000/api/appointments", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(appointment),
  });
  const data = await response.json();
  return data;
};

export const deleteAppointment = async (appointmentId: string) => {
  const response = await fetch(
    `http://localhost:3000/api/appointments/${appointmentId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    },
  );
  return response.json();
};

// curl -X PATCH "http://localhost:3000/api/appointments/APPOINTMENT_ID" \
//   -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
//   -H "Content-Type: application/json" \
// -d '{"status":"Completed"}'

export const updateAppointment = async (
  appointmentId: string,
  payload: RescheduleAppointmentPayload,
) => {
  const response = await fetch(
    `http://localhost:3000/api/appointments/${appointmentId}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        appointmentDateTime: payload.appointmentDateTime,
      }),
    },
  );
  return response.json();
};

export const MarkAsDoneAppointment = async (appointmentId: string) => {
  const response = await fetch(
    `http://localhost:3000/api/appointments/${appointmentId}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "Completed" }),
    },
  );
  const data = await response.json();
  return data;
};
