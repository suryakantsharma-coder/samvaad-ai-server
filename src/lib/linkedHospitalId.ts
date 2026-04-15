import type { User } from "../types/auth.type";

/**
 * Resolves the hospital Mongo id from `GET /api/auth/me` user payload.
 * Handles `hospital` as a string id or a populated `{ _id }` object.
 */
export function getLinkedHospitalId(user: User | null | undefined): string {
  const h = user?.hospital as unknown;
  if (h == null) return "";
  if (typeof h === "string") return h.trim();
  if (typeof h === "object" && h !== null && "_id" in h) {
    const id = (h as { _id: unknown })._id;
    if (typeof id === "string") return id.trim();
  }
  return "";
}
