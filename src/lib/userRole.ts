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

/** First screen after login or when visiting `/` (aligned with `AppHeader` destinations). */
export function getHomePathForRole(role: string | undefined | null): string {
  if (isSuperAdminRole(role)) return "/hospitals";
  const k = normalizeRoleKey(role);
  if (k === "admin") return "/hospitals";
  if (k === "hospital_admin") return "/dashboard";
  return "/patients";
}
