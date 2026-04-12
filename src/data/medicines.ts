import { authFetch, type AuthFetchInit } from "./api";
import type { MedicineCatalogRow } from "../types/medicineCatalog.type";

export type CreateMedicinePayload = {
  medicineName: string;
  type: string;
  unit: string;
};

export type UpdateMedicinePayload = {
  medicineName?: string;
  type?: string;
  unit?: string;
};

const DEMO_MEDICINES: MedicineCatalogRow[] = [
  {
    _id: "1",
    name: "Paracetamol 500mg",
    medicineId: "MED-501",
    type: "Tablet",
    units: "mg",
  },
  {
    _id: "2",
    name: "Amoxicillin 250mg",
    medicineId: "MED-502",
    type: "Capsule",
    units: "mg",
  },
  {
    _id: "3",
    name: "Insulin Glargine",
    medicineId: "MED-503",
    type: "Injection",
    units: "IU",
  },
  {
    _id: "4",
    name: "Cough Syrup DX",
    medicineId: "MED-504",
    type: "Syrup",
    units: "ml",
  },
  {
    _id: "5",
    name: "Vitamin D3",
    medicineId: "MED-505",
    type: "Tablet",
    units: "IU",
  },
  {
    _id: "6",
    name: "Azithromycin 500mg",
    medicineId: "MED-506",
    type: "Tablet",
    units: "mg",
  },
];

function normalizeRow(
  raw: Record<string, unknown>,
  index: number,
  enforceId?: string,
): MedicineCatalogRow {
  const id =
    enforceId ||
    (typeof raw._id === "string" && raw._id) ||
    (typeof raw.id === "string" && raw.id) ||
    `med-${index}`;
  return {
    _id: id,
    name: String(raw.name ?? raw.medicineName ?? ""),
    medicineId: String(
      (raw.medicineId ??
        raw.code ??
        raw.sku ??
        (typeof raw.medicineCode === "string" ? raw.medicineCode : "")) ||
        `MED-${String(index + 1)}`,
    ),
    type: String(raw.type ?? "Tablet"),
    units: String(raw.units ?? raw.unit ?? "mg"),
  };
}

function extractMedicinesArray(raw: unknown): unknown[] {
  if (raw == null) return [];
  if (Array.isArray(raw)) return raw;
  const r = raw as Record<string, unknown>;
  const candidates = [
    r.data,
    (r.data as Record<string, unknown> | undefined)?.medicines,
    r.medicines,
    r.results,
    r.docs,
  ];
  for (const c of candidates) {
    if (Array.isArray(c)) return c;
    if (c && typeof c === "object") {
      const o = c as Record<string, unknown>;
      if (Array.isArray(o.medicines)) return o.medicines;
      if (Array.isArray(o.data)) return o.data;
    }
  }
  return [];
}

function extractTotal(raw: unknown): number | undefined {
  if (raw == null || typeof raw !== "object") return undefined;
  const r = raw as Record<string, unknown>;
  const data = r.data;
  if (data != null && typeof data === "object") {
    const d = data as Record<string, unknown>;
    const t = d.total ?? d.totalCount ?? d.count;
    if (typeof t === "number") return t;
  }
  if (typeof r.total === "number") return r.total;
  return undefined;
}

function throwIfApiError(raw: unknown): void {
  if (raw == null || typeof raw !== "object") return;
  const r = raw as Record<string, unknown>;
  if (r.success === false) {
    const msg = r.message ?? r.error;
    throw new Error(typeof msg === "string" ? msg : "Request failed");
  }
}

function unwrapMedicine(raw: unknown): Record<string, unknown> | null {
  if (raw == null || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const data = r.data;
  if (data != null && typeof data === "object") {
    const d = data as Record<string, unknown>;
    if (d.medicine != null && typeof d.medicine === "object") {
      return d.medicine as Record<string, unknown>;
    }
    if (d._id != null || d.medicineName != null || d.name != null) {
      return d;
    }
  }
  if (r.medicine != null && typeof r.medicine === "object") {
    return r.medicine as Record<string, unknown>;
  }
  if (r._id != null || r.medicineName != null || r.name != null) {
    return r;
  }
  return null;
}

type FetchOpts = Pick<AuthFetchInit, "signal">;

/** Maps UI filter to API `type` query (e.g. Tablet → tablet; matches "Co-tablet" server-side). */
export function typeFilterToApiParam(uiType: string): string | undefined {
  if (uiType === "all") return undefined;
  return uiType.trim().toLowerCase();
}

function filterDemoByApiType(
  rows: MedicineCatalogRow[],
  apiType: string | undefined,
): MedicineCatalogRow[] {
  if (!apiType) return rows;
  const needle = apiType.toLowerCase();
  return rows.filter((r) => r.type.toLowerCase().includes(needle));
}

/** GET /api/medicines — optional `type` filter (e.g. type=tablet). Fallback demo if unavailable. */
export async function fetchMedicinesList(
  page = 1,
  limit = 100,
  opts?: FetchOpts,
  typeApi?: string,
): Promise<{ rows: MedicineCatalogRow[]; total?: number }> {
  try {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (typeApi) params.set("type", typeApi);
    const raw = (await authFetch(`/api/medicines?${params.toString()}`, {
      method: "GET",
      signal: opts?.signal,
    })) as Record<string, unknown>;
    throwIfApiError(raw);
    const arr = extractMedicinesArray(raw);
    return {
      rows: arr.map((item, i) =>
        normalizeRow(item as Record<string, unknown>, i),
      ),
      total: extractTotal(raw) ?? arr.length,
    };
  } catch {
    const demo = filterDemoByApiType([...DEMO_MEDICINES], typeApi);
    return { rows: demo, total: demo.length };
  }
}

/** GET /api/medicines/search?q=&page=&limit=&type= */
export async function searchMedicines(
  q: string,
  page = 1,
  limit = 20,
  opts?: FetchOpts,
  typeApi?: string,
): Promise<{ rows: MedicineCatalogRow[]; total?: number }> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  const trimmed = q.trim();
  if (trimmed) params.set("q", trimmed);
  if (typeApi) params.set("type", typeApi);
  const raw = (await authFetch(
    `/api/medicines/search?${params.toString()}`,
    { method: "GET", signal: opts?.signal },
  )) as Record<string, unknown>;
  throwIfApiError(raw);
  const arr = extractMedicinesArray(raw);
  return {
    rows: arr.map((item, i) =>
      normalizeRow(item as Record<string, unknown>, i),
    ),
    total: extractTotal(raw),
  };
}

/** POST /api/medicines */
export async function createMedicine(
  payload: CreateMedicinePayload,
): Promise<MedicineCatalogRow> {
  const raw = (await authFetch("/api/medicines", {
    method: "POST",
    body: payload,
  })) as Record<string, unknown>;
  throwIfApiError(raw);
  const item = unwrapMedicine(raw);
  if (item) return normalizeRow(item, 0);
  const msg = raw.message ?? raw.error;
  throw new Error(
    typeof msg === "string" ? msg : "Failed to create medicine",
  );
}

/** PATCH /api/medicines/:id */
export async function updateMedicine(
  id: string,
  payload: UpdateMedicinePayload,
): Promise<MedicineCatalogRow> {
  const raw = (await authFetch(
    `/api/medicines/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      body: payload,
    },
  )) as Record<string, unknown>;
  throwIfApiError(raw);
  const item = unwrapMedicine(raw);
  if (item) {
    const row = normalizeRow(item, 0);
    if (!row._id || row._id === "med-0") {
      return normalizeRow({ ...item, _id: id }, 0, id);
    }
    return row;
  }
  const data = raw.data;
  const flat =
    data != null && typeof data === "object" && !Array.isArray(data)
      ? (data as Record<string, unknown>)
      : raw;
  if (flat && typeof flat === "object") {
    return normalizeRow({ _id: id, ...flat }, 0, id);
  }
  const msg = raw.message ?? raw.error;
  throw new Error(
    typeof msg === "string" ? msg : "Failed to update medicine",
  );
}

/** DELETE /api/medicines/:id (super admin). */
export async function deleteMedicine(id: string): Promise<void> {
  const raw = (await authFetch(
    `/api/medicines/${encodeURIComponent(id)}`,
    { method: "DELETE" },
  )) as Record<string, unknown>;
  throwIfApiError(raw);
}

export function exportMedicinesCsv(rows: MedicineCatalogRow[]): void {
  const header = "Medicine Name,Medicine ID,Type,Units\n";
  const body = rows
    .map(
      (r) =>
        `"${r.name.replace(/"/g, '""')}",${r.medicineId},${r.type},${r.units}`,
    )
    .join("\n");
  const blob = new Blob([header + body], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `medicines-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
