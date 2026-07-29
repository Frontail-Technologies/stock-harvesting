import { apiFetch, API_ROUTES } from "@/features/api";
import type { ProfileResponse } from "../types";

export function getProfile() {
  return apiFetch<ProfileResponse>(API_ROUTES.users.me);
}
