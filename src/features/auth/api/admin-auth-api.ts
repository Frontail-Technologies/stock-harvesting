import { adminApiFetch, API_ROUTES, clearAdminApiAccessToken, refreshAdminAccessToken } from "@/features/api";
import type { AuthUser, RefreshResponse } from "../types";

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
