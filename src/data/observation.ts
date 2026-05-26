import { authFetch } from "./api";

export interface ObservationEntryPayload {
  text: string;
  time: string;
}

export interface CreateObservationPayload {
  patientId: string;
  observations: ObservationEntryPayload[];
}

/** GET /api/observations/search?patientId=:id */
export const searchObservationsByPatient = async (patientId: string) => {
  const params = new URLSearchParams({ patientId: patientId.trim() });
  return authFetch(`/api/observations/search?${params.toString()}`, {
    method: "GET",
  });
};

/** POST /api/observations */
export const createObservation = async (payload: CreateObservationPayload) => {
  return authFetch("/api/observations", {
    method: "POST",
    body: payload as object,
  });
};

/** POST /api/observations/:observationId/entries */
export const addObservationEntry = async (
  observationId: string,
  payload: ObservationEntryPayload,
) => {
  return authFetch(`/api/observations/${observationId}/entries`, {
    method: "POST",
    body: payload as object,
  });
};
