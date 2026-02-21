import { API_BASE_URL } from "../config";

const ACCESS_TOKEN_EXPIRED = "Access token expired";

/** Thrown when the API response indicates access token expired (used to trigger refresh + retry). */
export class AccessTokenExpiredError extends Error {
  constructor() {
    super(ACCESS_TOKEN_EXPIRED);
    this.name = "AccessTokenExpiredError";
  }
}

/**
 * Clears auth storage and redirects to login. Used when refresh token is also expired.
 */
export const handleAccessTokenExpired = (): void => {
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
  window.location.href = "/login";
};

export const isAccessTokenExpiredMessage = (message: unknown): boolean => {
  if (typeof message !== "string") return false;
  return message === ACCESS_TOKEN_EXPIRED || message.includes(ACCESS_TOKEN_EXPIRED);
};

/**
 * Parses JSON response and if the message indicates access token expired,
 * logs out and redirects to login, then throws. Use when not using authFetch (e.g. no refresh).
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

/** Single refresh-in-progress promise so concurrent requests share one refresh. */
let refreshPromise: Promise<string | null> | null = null;

function getOrRunRefresh(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const { refreshAccessToken } = await import("./auth");
      return refreshAccessToken();
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

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

/** In-flight request cache: same key returns the same promise so each API is called only once. */
const inFlight = new Map<string, Promise<unknown>>();

function requestKey(method: string, url: string, body: BodyInit | undefined): string {
  if (!body) return `${method}:${url}`;
  return `${method}:${url}:${typeof body === "string" ? body : "[object]"}`;
}

/**
 * Authenticated fetch: adds Bearer token, parses JSON. On "Access token expired"
 * tries to refresh the token and retries once; redirects to /login only if refresh fails.
 * Deduplicates in-flight requests: identical method+url+body reuse the same promise.
 */
export const authFetch = async (
  path: string,
  init: AuthFetchInit = {},
): Promise<unknown> => {
  const method = (init.method ?? "GET").toUpperCase();
  const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
  const { body, ...rest } = init;
  const fetchBody: BodyInit | undefined =
    body === undefined || body === null
      ? undefined
      : typeof body === "object" && !(body instanceof FormData)
        ? JSON.stringify(body)
        : (body as BodyInit);

  const key = requestKey(method, url, fetchBody);

  const run = async (): Promise<unknown> => {
    const headers: HeadersInit = {
      ...getAuthHeaders(),
      ...(init.headers as HeadersInit),
    };
    const response = await fetch(url, {
      ...rest,
      method,
      headers,
      body: fetchBody,
    });
    const data = await response.json().catch(() => ({}));
    const msg = data?.message ?? data?.error;
    if (isAccessTokenExpiredMessage(msg)) {
      throw new AccessTokenExpiredError();
    }
    return data;
  };

  const execute = async (): Promise<unknown> => {
    try {
      return await run();
    } catch (err) {
      if (err instanceof AccessTokenExpiredError) {
        const newToken = await getOrRunRefresh();
        if (newToken) return run();
        handleAccessTokenExpired();
      }
      throw err;
    }
  };

  let promise = inFlight.get(key);
  if (promise) return promise;
  promise = execute().finally(() => {
    inFlight.delete(key);
  });
  inFlight.set(key, promise);
  return promise;
};
