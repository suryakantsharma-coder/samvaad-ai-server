import {
  CreateHospitalPayload,
  Hospital,
  UpdateHospitalPayload,
} from "../types/hospital.type";
import { authFetch } from "./api";

export const createHospital = async (hospital: CreateHospitalPayload) => {
  const data = (await authFetch("/api/hospitals", {
    method: "POST",
    body: hospital as object,
  })) as { message?: string };
  if (data?.message) throw new Error(data.message);
  return data;
};

export const getHospitals = async () => {
  return authFetch("/api/hospitals", { method: "GET" });
};

/**
 * GET /api/hospitals/:hospitalId
 * Fetches a single hospital by ID (Bearer token required).
 */
export const getHospitalById = async (
  hospitalId: string,
): Promise<{ success?: boolean; data?: { hospital?: Hospital } }> => {
  return authFetch(`/api/hospitals/${hospitalId}`, {
    method: "GET",
  }) as Promise<{ success?: boolean; data?: { hospital?: Hospital } }>;
};

/**
 * PATCH /api/hospitals/:hospitalId
 * Updates hospital details (Bearer token required).
 */
export const updateHospital = async (
  hospitalId: string,
  payload: UpdateHospitalPayload,
): Promise<{ success?: boolean; data?: { hospital?: Hospital } }> => {
  return authFetch(`/api/hospitals/${hospitalId}`, {
    method: "PATCH",
    body: payload as object,
  }) as Promise<{ success?: boolean; data?: { hospital?: Hospital } }>;
};

export const searchHospitals = async (
  q: string,
  page: number,
  limit: number,
) => {
  const params = new URLSearchParams({
    q,
    page: String(page),
    limit: String(limit),
  });
  return authFetch(`/api/hospitals/search?${params.toString()}`, {
    method: "GET",
  });
};
