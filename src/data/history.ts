import { authFetch } from "./api";

/**
 * GET /api/patients/:patientId/overview
 * Returns patient, appointments, and prescriptions (Bearer token via authFetch).
 */
export const getPatientHistory = async (patientId: string) => {
  return authFetch(`/api/patients/${patientId}/overview`, {
    method: "GET",
  });
};
