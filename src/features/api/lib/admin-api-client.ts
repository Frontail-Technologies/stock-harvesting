import { API_ROUTES } from "../constants/api-routes";
import {
  ApiError,
  type ApiDataShape,
  type ApiErrorShape,
  type ApiFetchOptions,
} from "../types";
import { getAdminApiAccessToken, setAdminApiAccessToken } from "./admin-token-store";
import { API_BASE_URL } from "./api-client";

// Strict portal separation - the ADMIN portal's own fetch wrapper, a
// parallel implementation of api-client.ts's apiFetch rather than a shared
// one with a "portal" flag. This is deliberate: it means the ADMIN
// portal's 401-refresh loop can only ever call
// /api/admin-auth/refresh (never /api/auth/refresh), can only ever read/
// write the admin-token-store.ts in-memory token (never token-store.ts's),
// and every admin API wrapper (admin-api.ts, the use-admin-*.ts hooks)
// imports THIS function, never the user-portal apiFetch - so there is no
// runtime branch anywhere that could route an admin request through the
// user portal's session, or vice versa.

function buildUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE_URL}${path}`;
}

function hasBody(init?: RequestInit) {
  return init?.body !== undefined && init.body !== null;
}

async function parseResponseBody(response: Response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function buildApiError(response: Response, body: unknown) {
  const maybeError = body as Partial<ApiErrorShape> | null;
  const error = maybeError?.error;

  return new ApiError({
    code: error?.code ?? "HTTP_ERROR",
    message: error?.message ?? response.statusText ?? "Request failed",
    status: response.status,
    details: error?.details,
  });
}

type RefreshPayload = { accessToken: string } & Record<string, unknown>;

async function performAdminRefresh(): Promise<RefreshPayload> {
  const response = await fetch(buildUrl(API_ROUTES.adminAuth.refresh), {
    method: "POST",
    credentials: "include",
  });
  const body = await parseResponseBody(response);

  if (!response.ok) {
    setAdminApiAccessToken(null);
    throw buildApiError(response, body);
  }

  const payload = body as ApiDataShape<RefreshPayload>;
  setAdminApiAccessToken(payload.data.accessToken);
  return payload.data;
}

// Same single-flight guarding as the user portal's refreshAccessToken -
// the admin refresh token is single-use too, so concurrent 401s must
// collapse into one POST /admin-auth/refresh.
let adminRefreshInFlight: Promise<RefreshPayload> | null = null;

export function refreshAdminAccessToken(): Promise<RefreshPayload> {
  if (!adminRefreshInFlight) {
    adminRefreshInFlight = performAdminRefresh().finally(() => {
      adminRefreshInFlight = null;
    });
  }
  return adminRefreshInFlight;
}

export async function adminApiFetch<T>(
  path: string,
  init: ApiFetchOptions = {}
): Promise<T> {
  const { skipAuthRefresh, headers, ...requestInit } = init;
  const token = getAdminApiAccessToken();
  const requestHeaders = new Headers(headers);

  if (hasBody(requestInit) && !requestHeaders.has("content-type")) {
    requestHeaders.set("content-type", "application/json");
  }

  if (token && !requestHeaders.has("authorization")) {
    requestHeaders.set("authorization", `Bearer ${token}`);
  }

  const response = await fetch(buildUrl(path), {
    cache: "no-store",
    ...requestInit,
    headers: requestHeaders,
    credentials: "include",
  });
  const body = await parseResponseBody(response);

  if (response.status === 401 && !skipAuthRefresh) {
    try {
      const { accessToken: nextToken } = await refreshAdminAccessToken();
      return adminApiFetch<T>(path, {
        ...init,
        headers: {
          ...Object.fromEntries(new Headers(headers)),
          authorization: `Bearer ${nextToken}`,
        },
        skipAuthRefresh: true,
      });
    } catch (refreshError) {
      if (refreshError instanceof Error) {
        console.warn("Admin session refresh failed:", refreshError.message);
      }
      throw buildApiError(response, body);
    }
  }

  if (!response.ok) {
    throw buildApiError(response, body);
  }

  if (body && typeof body === "object" && "data" in body) {
    return (body as ApiDataShape<T>).data;
  }

  return body as T;
}

export {
  clearAdminApiAccessToken,
  getAdminApiAccessToken,
  setAdminApiAccessToken,
} from "./admin-token-store";
