import { apiFetch, API_ROUTES, clearApiAccessToken, refreshAccessToken } from "@/features/api";
import type { AuthUser, RefreshResponse } from "../types";

export async function getGoogleLoginUrl(portal?: "admin") {
  return apiFetch<{ url: string }>(API_ROUTES.auth.googleUrl(portal), {
    skipAuthRefresh: true,
  });
}

export async function startGoogleLogin(portal?: "admin") {
  const { url } = await getGoogleLoginUrl(portal);
  window.location.href = url;
}

// Shares the same single-flight refresh call as apiFetch's 401 handler
// (features/api/lib/api-client.ts) instead of issuing an independent
// request — two concurrent POST /refresh calls presenting the same
// single-use refresh token would otherwise trip the backend's reuse
// detection and revoke the whole session.
export async function refreshSession() {
  const payload = await refreshAccessToken();
  return payload as RefreshResponse;
}

export async function getCurrentAuthUser() {
  const { user } = await apiFetch<{ user: AuthUser }>(API_ROUTES.auth.me);
  return user;
}

export async function logout() {
  try {
    await apiFetch<{ ok: boolean }>(API_ROUTES.auth.logout, {
      method: "POST",
      skipAuthRefresh: true,
    });
  } finally {
    clearApiAccessToken();
  }
}
