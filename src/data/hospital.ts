import {
  CreateHospitalPayload,
  Hospital,
  UpdateHospitalPayload,
} from "../types/hospital.type";
import { authFetch } from "./api";

/** Default page size for list + search (matches API docs example). */
export const HOSPITAL_LIST_PAGE_LIMIT = 20;

function asDict(v: unknown): Record<string, unknown> | null {
  if (v != null && typeof v === "object" && !Array.isArray(v)) {
    return v as Record<string, unknown>;
  }
  return null;
}

export type HospitalsListParsed = {
  hospitals: Hospital[];
  page: number;
  limit: number;
  totalPages: number;
  total: number;
};

/** Normalizes GET /hospitals and GET /hospitals/search responses for pagination. */
export function parseHospitalsListResponse(
  raw: unknown,
  fallbackPage: number,
  fallbackLimit: number,
): HospitalsListParsed {
  const root = asDict(raw) ?? {};
  const dataNode = asDict(root.data) ?? root;
  const hospitals = Array.isArray(dataNode.hospitals)
    ? (dataNode.hospitals as Hospital[])
    : [];
  const pagination = asDict(dataNode.pagination) ?? {};
  const totalRaw = Number(
    pagination.total ?? dataNode.total ?? dataNode.totalCount,
  );
  const total = Number.isFinite(totalRaw) ? totalRaw : hospitals.length;
  const page =
    Number(pagination.page ?? dataNode.page ?? fallbackPage) || 1;
  const limit =
    Number(pagination.limit ?? dataNode.limit ?? fallbackLimit) ||
    fallbackLimit;
  const totalPagesRaw = Number(
    pagination.totalPages ?? dataNode.totalPages,
  );
  const totalPages =
    Number.isFinite(totalPagesRaw) && totalPagesRaw > 0 ?
      totalPagesRaw
    : Math.max(1, Math.ceil(total / limit) || 1);
  return { hospitals, page, limit, totalPages, total };
}

/** Parses POST /api/hospitals response for the new hospital's `_id`. */
export function extractHospitalIdFromCreateResponse(
  raw: unknown,
): string | null {
  if (raw == null || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const fromObj = (obj: Record<string, unknown>): string | null => {
    const h = obj.hospital;
    if (h && typeof h === "object" && h !== null && "_id" in h) {
      const id = (h as { _id?: unknown })._id;
      return typeof id === "string" && id.trim() ? id.trim() : null;
    }
    const id = obj._id;
    return typeof id === "string" && id.trim() ? id.trim() : null;
  };
  const data = o.data;
  if (data && typeof data === "object" && data !== null) {
    const d = data as Record<string, unknown>;
    const nested = fromObj(d);
    if (nested) return nested;
    const h = d.hospital;
    if (h && typeof h === "object" && h !== null) {
      const inner = fromObj(h as Record<string, unknown>);
      if (inner) return inner;
    }
  }
  return fromObj(o);
}

/** Creates a hospital; returns the new hospital id. */
export const createHospital = async (
  hospital: CreateHospitalPayload,
): Promise<string> => {
  const data = (await authFetch("/api/hospitals", {
    method: "POST",
    body: hospital as object,
  })) as Record<string, unknown>;
  if (data.success === false) {
    const msg = data.message ?? data.error;
    throw new Error(
      typeof msg === "string" ? msg : "Failed to create hospital",
    );
  }
  const hospitalId = extractHospitalIdFromCreateResponse(data);
  if (!hospitalId) {
    throw new Error(
      "Hospital was created but the server did not return an id. Try refreshing the list.",
    );
  }
  return hospitalId;
};

export type GetHospitalsParams = {
  page?: number;
  limit?: number;
  /** When set, lists only matching hospitals (`GET /api/hospitals?isActive=...`). */
  isActive?: boolean;
};

export const getHospitals = async (params?: GetHospitalsParams) => {
  const search = new URLSearchParams();
  if (params?.page != null) search.set("page", String(params.page));
  if (params?.limit != null) search.set("limit", String(params.limit));
  if (params?.isActive !== undefined) {
    search.set("isActive", String(params.isActive));
  }
  const qs = search.toString();
  return authFetch(`/api/hospitals${qs ? `?${qs}` : ""}`, { method: "GET" });
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
 * Image upload: multipart field `file` (same as curl: `-F 'file=@...'`).
 */
export const updateHospital = async (
  hospitalId: string,
  payload: UpdateHospitalPayload,
  logoFile?: File | null,
): Promise<unknown> => {
  if (logoFile) {
    const fd = new FormData();
    for (const [key, value] of Object.entries(payload)) {
      if (value === undefined || value === null) continue;
      if (Array.isArray(value)) {
        fd.append(key, JSON.stringify(value));
      } else {
        fd.append(key, String(value));
      }
    }
    fd.append("file", logoFile, logoFile.name);
    return authFetch(`/api/hospitals/${hospitalId}`, {
      method: "PATCH",
      body: fd,
    });
  }
  return authFetch(`/api/hospitals/${hospitalId}`, {
    method: "PATCH",
    body: payload as object,
  }) as Promise<{ success?: boolean; data?: { hospital?: Hospital } }>;
};

export const searchHospitals = async (
  q: string,
  page: number,
  limit: number,
  isActive?: boolean,
) => {
  const params = new URLSearchParams({
    q,
    page: String(page),
    limit: String(limit),
  });
  if (isActive !== undefined) {
    params.set("isActive", String(isActive));
  }
  return authFetch(`/api/hospitals/search?${params.toString()}`, {
    method: "GET",
  });
};
