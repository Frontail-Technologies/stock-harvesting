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
