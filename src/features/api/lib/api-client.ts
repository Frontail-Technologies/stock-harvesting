import { API_ROUTES } from "../constants/api-routes";
import {
  ApiError,
  type ApiDataShape,
  type ApiErrorShape,
  type ApiFetchOptions,
} from "../types";
import { getApiAccessToken, setApiAccessToken } from "./token-store";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

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

async function performRefresh(): Promise<RefreshPayload> {
  const response = await fetch(buildUrl(API_ROUTES.auth.refresh), {
    method: "POST",
    credentials: "include",
  });
  const body = await parseResponseBody(response);

  if (!response.ok) {
    setApiAccessToken(null);
    throw buildApiError(response, body);
  }

  const payload = body as ApiDataShape<RefreshPayload>;
  setApiAccessToken(payload.data.accessToken);
  return payload.data;
}

// Concurrent 401s (or a Strict-Mode double-invoked auth bootstrap) must
// never fire more than one POST /refresh at a time — the backend's refresh
// token is single-use, and a second concurrent request presenting the same
// token gets treated as reuse/theft and revokes the whole session family.
// Every caller in-flight shares this one promise instead of racing.
let refreshInFlight: Promise<RefreshPayload> | null = null;

export function refreshAccessToken(): Promise<RefreshPayload> {
  if (!refreshInFlight) {
    refreshInFlight = performRefresh().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

export async function apiFetch<T>(
  path: string,
  init: ApiFetchOptions = {}
): Promise<T> {
  const { skipAuthRefresh, headers, ...requestInit } = init;
  const token = getApiAccessToken();
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
      const { accessToken: nextToken } = await refreshAccessToken();
      return apiFetch<T>(path, {
        ...init,
        headers: {
          ...Object.fromEntries(new Headers(headers)),
          authorization: `Bearer ${nextToken}`,
        },
        skipAuthRefresh: true,
      });
    } catch (refreshError) {
      if (refreshError instanceof Error) {
        console.warn("Session refresh failed:", refreshError.message);
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
  clearApiAccessToken,
  getApiAccessToken,
  setApiAccessToken,
} from "./token-store";
