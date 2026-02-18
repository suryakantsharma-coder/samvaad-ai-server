// curl -s -X POST "http://localhost:3000/api/hospitals" \
//   -H "Authorization: Bearer $ACCESS" \
//   -H "Content-Type: application/json" \
// -d '{"name":"Test Hospital","phoneNumber":"1234567890","email":"test@hospital.com","contactPerson":"Admin","registrationNumber":"REG001","address":"1 Main St","city":"Mumbai","pincode":"400001","url":"https://test.com"}'

import { CreateHospitalPayload, Hospital } from "../types/hospital.type";

export const createHospital = async (hospital: CreateHospitalPayload) => {
  const response = await fetch("http://localhost:3000/api/hospitals", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
    body: JSON.stringify(hospital),
  });
  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: response.statusText }));
    throw new Error(error?.message ?? "Failed to create hospital");
  }
  return response.json();
};

export const getHospitals = async () => {
  const response = await fetch("http://localhost:3000/api/hospitals", {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
  return response.json();
};

export const searchHospitals = async (
  q: string,
  page: number,
  limit: number,
) => {
  const params = new URLSearchParams({ q, page: String(page), limit: String(limit) });
  const response = await fetch(
    `http://localhost:3000/api/hospitals/search?${params.toString()}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    },
  );
  return response.json();
};
