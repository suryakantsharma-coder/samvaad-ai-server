import { API_BASE_URL } from "../config";
import { authFetch } from "./api";

export const register = async (
  email: string,
  password: string,
  name: string,
  role: string,
  hospitalId: string,
) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password, name, role, hospital: hospitalId }),
  });
  return response.json();
};

export const login = async (email: string, password: string) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || data?.error || "Login failed");
  }
  const token = data?.data?.accessToken;
  if (token) {
    localStorage.setItem("token", token);
  }
  return data;
};

export const logout = async () => {
  const accessToken = localStorage.getItem("token");
  const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });
  localStorage.removeItem("token");
  return response.json();
};

// get user profile
export const getUserProfile = async () => {
  const data = (await authFetch("/api/auth/me", { method: "GET" })) as {
    success?: boolean;
    message?: string;
  };
  if (data.success === true) {
    return data;
  }
  throw new Error(data.message ?? "Failed to get profile");
};

/**
 * Create a new user (for hospital_admin). Uses Bearer token.
 */
export const createUserAsAdmin = async (
  email: string,
  password: string,
  name: string,
  role: string,
) => {
  const data = (await authFetch("/api/users", {
    method: "POST",
    body: { email, password, name, role } as object,
  })) as { success?: boolean; message?: string; error?: string };
  if (data?.message && data.success !== true) {
    throw new Error(data.message ?? data?.error ?? "Failed to create user");
  }
  return data;
};

/** Get all users for the current hospital (hospital_admin only). */
export const getHospitalUsers = async (hospitalId: string) => {
  return authFetch(`/api/admin/users?hospitalId=${hospitalId}`, {
    method: "GET",
  });
};

/** Update a user's role (hospital_admin only). */
export const updateUserRole = async (userId: string, role: string) => {
  const data = (await authFetch(`/api/users/${userId}/role`, {
    method: "PATCH",
    body: { role } as object,
  })) as { success?: boolean; message?: string; error?: string };
  if (data?.message && data.success !== true) {
    throw new Error(data.message ?? data?.error ?? "Failed to update role");
  }
  return data;
};

// # All users (scoped by role as above)
// curl -X GET "http://localhost:3000/api/admin/users" \
//   -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

// # Only users for a specific hospital (admin; use in UI)
// curl -X GET "http://localhost:3000/api/admin/users?hospitalId=698db7d0747cdef3ecafbf2e" \
//   -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

export const getHospitalUsersByHospitalId = async (hospitalId: string) => {
  return authFetch(`/api/admin/users?hospitalId=${hospitalId}`, {
    method: "GET",
  });
};

// curl -X PATCH "http://localhost:3000/api/admin/users/USER_ID" \
//   -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
//   -H "Content-Type: application/json" \
//   -d '{"role":"doctor","hospitalId":"HOSPITAL_OBJECT_ID"}'

export const updateUserRoleByHospitalId = async (
  userId: string,
  role: string,
  hospitalId: string,
) => {
  return authFetch(`/api/admin/users/${userId}`, {
    method: "PATCH",
    body: { role, hospitalId } as object,
  });
};
