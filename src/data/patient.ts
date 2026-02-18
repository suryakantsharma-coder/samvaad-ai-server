import {
  CreatePatientPayload,
  UpdatePatientPayload,
} from "../types/patient.type";

const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("Not authenticated. Please log in and try again.");
  }
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

export const createPatient = async (patient: CreatePatientPayload) => {
  const response = await fetch("http://localhost:3000/api/patients", {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(patient),
  });
  return response.json();
};

export const getPatients = async (page: number, limit: number) => {
  const response = await fetch(
    `http://localhost:3000/api/patients?page=${page}&limit=${limit}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    },
  );
  console.log(response);
  return response.json();
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
  const response = await fetch(
    `http://localhost:3000/api/patients/search?${params.toString()}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    },
  );
  return response.json();
};

// curl --location --request PATCH 'http://localhost:3000/api/patients/69835a14befd5284c02772bb' \
// --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2OTgzMWY2NzQ5ZGM4MzNiMTQ2YTRlYjAiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NzA2MjQyNDUsImV4cCI6MTc3MDYyNTE0NSwiaXNzIjoic2FtdmFhZCJ9.UTycmGznyraRvhrFG1j5bUKmiYGV6eJMXruzhO534k8' \
// --header 'Content-Type: application/json' \
// --header 'Cookie: refreshToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2OTgxYWY3N2M1MmZlOGNmMzU0YjRlNTQiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NzAyMDA3MTEsImV4cCI6MTc3MDgwNTUxMSwiaXNzIjoic2FtdmFhZCJ9.6SyTAyrBpeG_yYCkWtYvqVniwLeCxzB118ykNUzcAQo' \
// --data '{"age":38,"phoneNumber":"+9876543211", "reason" : "cold"}'

export const updatePatient = async (
  patientId: string,
  patient: UpdatePatientPayload,
) => {
  const response = await fetch(
    `http://localhost:3000/api/patients/${patientId}`,
    {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify(patient),
    },
  );
  const data = await response.json();
  if (!response.ok) {
    const message =
      typeof data?.message === "string"
        ? data.message
        : data?.error || response.statusText || "Update failed";
    throw new Error(message);
  }
  return data;
};

// curl -X DELETE "http://localhost:3000/api/patients/PATIENT_ID" \
// -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

export const deletePatient = async (patientId: string) => {
  const response = await fetch(
    `http://localhost:3000/api/patients/${patientId}`,
    {
      method: "DELETE",
      headers: getAuthHeaders(),
    },
  );
  return response.json();
};
