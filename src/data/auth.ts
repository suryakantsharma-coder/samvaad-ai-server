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

/**
 * Register a hospital-scoped user (e.g. hospital_admin, doctor) after the hospital exists.
 * Public POST /api/auth/register — does not send the admin Bearer token.
 */
export const registerUserWithHospital = async (params: {
  email: string;
  password: string;
  name: string;
  role: string;
  hospitalId: string;
}): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: params.email.trim(),
      password: params.password,
      name: params.name.trim(),
      role: params.role,
      hospital: params.hospitalId,
      hospitalId: params.hospitalId,
    }),
  });
  const data = (await response.json().catch(() => ({}))) as {
    message?: string;
    error?: string;
    success?: boolean;
  };
  if (!response.ok || data.success === false) {
    throw new Error(
      typeof data.message === "string"
        ? data.message
        : typeof data.error === "string"
          ? data.error
          : "Failed to register hospital member",
    );
  }
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
  const refreshToken = data?.data?.refreshToken;
  if (token) {
    localStorage.setItem("token", token);
  }
  if (refreshToken) {
    localStorage.setItem("refreshToken", refreshToken);
  }
  return data;
};

/**
 * Refreshes the access token using the stored refresh token.
 * Does not use authFetch to avoid circular calls when access token is expired.
 * @returns New access token, or null if refresh failed (e.g. refresh token expired).
 */
export const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) return null;
  const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data?.success) {
    return null;
  }
  const newAccessToken = data?.data?.accessToken;
  const newRefreshToken = data?.data?.refreshToken;
  if (newAccessToken) {
    localStorage.setItem("token", newAccessToken);
  }
  if (newRefreshToken) {
    localStorage.setItem("refreshToken", newRefreshToken);
  }
  return newAccessToken ?? null;
};

export const logout = async () => {
  const accessToken = localStorage.getItem("token");
  const refreshToken = localStorage.getItem("refreshToken");
  const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: refreshToken ? JSON.stringify({ refreshToken }) : undefined,
  });
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
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

export type UpdateProfilePayload = {
  name?: string;
  email?: string;
  /** Digits or formatted as accepted by API (e.g. `9876543210`). */
  phoneNumber?: string;
  /** New password — requires `currentPassword` when provided. */
  password?: string;
  currentPassword?: string;
};

/** Update the logged-in user via PATCH /api/auth/me (partial body). */
export const updateCurrentUserProfile = async (
  payload: UpdateProfilePayload,
) => {
  const body: Record<string, string> = {};
  if (payload.name != null && payload.name !== "") body.name = payload.name;
  if (payload.email != null && payload.email !== "") body.email = payload.email;
  if (payload.phoneNumber != null && payload.phoneNumber !== "") {
    body.phoneNumber = payload.phoneNumber;
  }
  if (payload.password != null && payload.password !== "") {
    body.password = payload.password;
    if (payload.currentPassword != null && payload.currentPassword !== "") {
      body.currentPassword = payload.currentPassword;
    }
  }
  const data = (await authFetch("/api/auth/me", {
    method: "PATCH",
    body,
  })) as {
    success?: boolean;
    message?: string;
    error?: string;
    data?: { user?: unknown };
  };
  if (data.success === true || data.data?.user != null) {
    return data;
  }
  throw new Error(
    String(data.message ?? data.error ?? "Failed to update profile"),
  );
};

/**
 * POST /api/auth/me/profile-picture — multipart field `file` (same as curl).
 */
export const uploadProfilePicture = async (file: File) => {
  const fd = new FormData();
  fd.append("file", file, file.name);
  const data = (await authFetch("/api/auth/me/profile-picture", {
    method: "POST",
    body: fd,
  })) as {
    success?: boolean;
    message?: string;
    error?: string;
    data?: { user?: unknown };
  };
  if (data.success === false) {
    throw new Error(String(data.message ?? data.error ?? "Upload failed"));
  }
  return data;
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
