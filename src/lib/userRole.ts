/** Normalize role strings from the API (e.g. "Super Admin", "super-admin"). */
export function normalizeRoleKey(role: string | undefined | null): string {
  if (!role?.trim()) return "";
  return role.trim().toLowerCase().replace(/[\s-]+/g, "_");
}

/** Platform super admin — full catalog / hospitals nav. */
export function isSuperAdminRole(role: string | undefined | null): boolean {
  const k = normalizeRoleKey(role);
  return k === "super_admin" || k === "superadmin";
}

/** Hospital administrator — dashboard + hospital-scoped screens. */
export function isHospitalAdminRole(role: string | undefined | null): boolean {
  return normalizeRoleKey(role) === "hospital_admin";
}

/**
 * Mongo id of the hospital doctor profile linked to this user (`GET /api/auth/me` → `user.doctor`).
 * Use for list/search scoping when `role` is doctor.
 */
export function getLinkedDoctorRecordId(
  user: { role?: string | null; doctor?: string | null } | null | undefined,
): string | null {
  if (normalizeRoleKey(user?.role) !== "doctor") return null;
  const id = user?.doctor?.trim();
  return id && id.length > 0 ? id : null;
}

/**
 * Doctor-role scoping for list APIs:
 * - `GET /api/appointments?doctor=…` / `GET /api/patients?doctor=…` — display name (e.g. partial "Patel").
 * - Falls back to `doctorId` (linked Mongo id) when `name` is empty.
 */
export function getDoctorAppointmentsListOptions(user: {
  role?: string | null;
  name?: string | null;
  doctor?: string | null;
} | null | undefined): { doctor?: string; doctorId?: string } {
  if (normalizeRoleKey(user?.role) !== "doctor") return {};
  const name = user?.name?.trim();
  if (name) return { doctor: name };
  const id = getLinkedDoctorRecordId(user);
  return id ? { doctorId: id } : {};
}

/** Same query shape as appointments — `GET /api/patients` optional `doctor` / `doctorId`. */
export const getDoctorPatientsListQuery = getDoctorAppointmentsListOptions;

/** First screen after login or when visiting `/` (aligned with `AppHeader` destinations). */
export function getHomePathForRole(role: string | undefined | null): string {
  if (isSuperAdminRole(role)) return "/hospitals";
  const k = normalizeRoleKey(role);
  if (k === "admin") return "/hospitals";
  if (isHospitalAdminRole(role)) return "/dashboard";
  return "/patients";
}
