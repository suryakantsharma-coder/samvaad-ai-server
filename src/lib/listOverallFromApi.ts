/** Fields commonly returned on list endpoints under `data.overall`. */
export type ListOverallPatch = {
  totalAppointments?: number;
  totalPatients?: number;
  totalDoctors?: number;
  totalPrescriptions?: number;
};

const KEYS = [
  "totalAppointments",
  "totalPatients",
  "totalDoctors",
  "totalPrescriptions",
] as const;

/** Reads numeric fields from `data.overall` when present. */
export function pickOverallFromApiData(data: unknown): ListOverallPatch {
  if (data == null || typeof data !== "object") return {};
  const overall = (data as Record<string, unknown>).overall;
  if (overall == null || typeof overall !== "object") return {};
  const o = overall as Record<string, unknown>;
  const patch: ListOverallPatch = {};
  for (const key of KEYS) {
    const v = o[key];
    if (typeof v === "number" && Number.isFinite(v)) patch[key] = v;
  }
  if (patch.totalPrescriptions === undefined) {
    const alt = o.totalPrescription ?? o.total_prescriptions;
    if (typeof alt === "number" && Number.isFinite(alt)) {
      patch.totalPrescriptions = alt;
    }
  }
  return patch;
}
