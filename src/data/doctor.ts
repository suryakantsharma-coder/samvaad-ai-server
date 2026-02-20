import { CreateDoctorPayload } from "../types/doctor.type";
import { authFetch } from "./api";

export const addDoctor = async (doctor: CreateDoctorPayload) => {
  return authFetch("/api/doctors", {
    method: "POST",
    body: doctor as object,
  });
};

export const getDoctors = async (page: number, limit: number) => {
  return authFetch(`/api/doctors?page=${page}&limit=${limit}`, {
    method: "GET",
  });
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
