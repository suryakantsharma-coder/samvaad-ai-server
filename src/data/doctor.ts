import { CreateDoctorPayload } from "../types/doctor.type";

export const addDoctor = async (doctor: CreateDoctorPayload) => {
  const response = await fetch("http://localhost:3000/api/doctors", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
    body: JSON.stringify(doctor),
  });
  return response.json();
};

export const getDoctors = async (page: number, limit: number) => {
  const response = await fetch(
    `http://localhost:3000/api/doctors?page=${page}&limit=${limit}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    },
  );
  return response.json();
};

export const searchDoctors = async (
  q: string,
  page: number,
  limit: number,
) => {
  const params = new URLSearchParams({ q, page: String(page), limit: String(limit) });
  const response = await fetch(
    `http://localhost:3000/api/doctors/search?${params.toString()}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    },
  );
  return response.json();
};
