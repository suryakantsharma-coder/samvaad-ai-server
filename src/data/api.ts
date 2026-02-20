import { API_BASE_URL } from "../config";

const ACCESS_TOKEN_EXPIRED = "Access token expired";

/**
 * Clears auth storage and redirects to login when the API returns "Access token expired".
 * Call this when any authenticated API response indicates the token has expired.
 */
export const handleAccessTokenExpired = (): void => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/login";
};

export const isAccessTokenExpiredMessage = (message: unknown): boolean => {
  if (typeof message !== "string") return false;
  return message === ACCESS_TOKEN_EXPIRED || message.includes(ACCESS_TOKEN_EXPIRED);
};

/**
 * Parses JSON response and if the message indicates access token expired,
 * logs out and redirects to login, then throws.
 */
export const checkTokenExpiredAndRedirect = (data: {
  message?: unknown;
  error?: unknown;
}): void => {
  const msg = data?.message ?? data?.error;
  if (isAccessTokenExpiredMessage(msg)) {
    handleAccessTokenExpired();
    throw new Error(typeof msg === "string" ? msg : ACCESS_TOKEN_EXPIRED);
  }
};

export const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("Not authenticated. Please log in and try again.");
  }
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};


/** Options for authFetch; body can be any JSON-serializable value (objects are stringified). */
export interface AuthFetchInit {
  method?: string;
  headers?: HeadersInit;
  body?: unknown;
  signal?: AbortSignal;
  cache?: RequestCache;
  credentials?: RequestCredentials;
  mode?: RequestMode;
  redirect?: RequestRedirect;
  referrer?: string;
  referrerPolicy?: ReferrerPolicy;
  keepalive?: boolean;
  integrity?: string;
}

/**
 * Authenticated fetch: adds Bearer token, parses JSON, and on "Access token expired"
 * clears storage and redirects to /login.
 */
export const authFetch = async (
  path: string,
  init: AuthFetchInit = {},
): Promise<unknown> => {
  const { body, ...rest } = init;
  const headers: HeadersInit = {
    ...getAuthHeaders(),
    ...(init.headers as HeadersInit),
  };
  const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
  const fetchBody: BodyInit | undefined =
    body === undefined || body === null
      ? undefined
      : typeof body === "object" && !(body instanceof FormData)
        ? JSON.stringify(body)
        : (body as BodyInit);

  const response = await fetch(url, {
    ...rest,
    headers,
    body: fetchBody,
  });
  const data = await response.json().catch(() => ({}));
  checkTokenExpiredAndRedirect(data);
  return data;
};
