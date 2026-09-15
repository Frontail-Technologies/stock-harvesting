import { API_ROUTES, apiFetch } from "@/features/api";
import type { WidgetSource } from "../types";

export type WidgetPreferencesResponse =
  | { hasSavedPreference: true; sources: WidgetSource[] }
  | { hasSavedPreference: false; sources: [] };

export function getWidgetPreferences() {
  return apiFetch<WidgetPreferencesResponse>(API_ROUTES.widgetPreferences.root);
}

export function saveWidgetPreferences(input: { sources: WidgetSource[] }) {
  return apiFetch<WidgetPreferencesResponse>(API_ROUTES.widgetPreferences.root, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function clearWidgetPreferences() {
  return apiFetch<{ ok: true }>(API_ROUTES.widgetPreferences.root, {
    method: "DELETE",
  });
}
