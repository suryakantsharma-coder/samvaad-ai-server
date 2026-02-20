import { CreateHospitalPayload } from "../types/hospital.type";
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
