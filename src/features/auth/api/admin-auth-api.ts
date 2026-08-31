import { adminApiFetch, API_ROUTES, clearAdminApiAccessToken, refreshAdminAccessToken } from "@/features/api";
import type { AuthUser, RefreshResponse } from "../types";

// Google login itself stays shared (getGoogleLoginUrl/startGoogleLogin in
// auth-api.ts, called with portal="admin") - only what happens AFTER the
// OAuth round-trip (refresh/me/logout) is portal-specific, since those are
// the calls that read/write a session cookie.

// Shares the same single-flight refresh call as adminApiFetch's 401
// handler (features/api/lib/admin-api-client.ts) instead of issuing an
// independent request - two concurrent POST /admin-auth/refresh calls
// presenting the same single-use refresh token would otherwise trip the
// backend's reuse detection and revoke the whole admin session.
export async function refreshAdminSession() {
  const payload = await refreshAdminAccessToken();
  return payload as RefreshResponse;
}

export async function getCurrentAdminUser() {
  const { user } = await adminApiFetch<{ user: AuthUser }>(API_ROUTES.adminAuth.me);
  return user;
}

export async function logoutAdmin() {
  try {
    await adminApiFetch<{ ok: boolean }>(API_ROUTES.adminAuth.logout, {
      method: "POST",
      skipAuthRefresh: true,
    });
  } finally {
    clearAdminApiAccessToken();
  }
}
