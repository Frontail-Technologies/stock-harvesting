"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/features/api";
import { useSessionStore } from "@/features/auth";
import {
  clearWidgetPreferences,
  getWidgetPreferences,
  saveWidgetPreferences,
  type WidgetPreferencesResponse,
} from "../api/widget-preferences-api";

const WIDGET_PREFERENCES_STALE_TIME_MS = 60_000;

export function useWidgetPreferences() {
  const authStatus = useSessionStore((state) => state.status);
  const query = useQuery({
    queryKey: queryKeys.widgetPreferences.current,
    queryFn: getWidgetPreferences,
    enabled: authStatus === "authenticated",
    staleTime: WIDGET_PREFERENCES_STALE_TIME_MS,
    gcTime: 15 * 60_000,
  });

  return {
    ...query,
    hasSavedPreference: query.data?.hasSavedPreference ?? false,
    sources: query.data?.sources ?? [],
  };
}

export function useSaveWidgetPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveWidgetPreferences,
    onSuccess: (data) => {
      queryClient.setQueryData<WidgetPreferencesResponse>(queryKeys.widgetPreferences.current, data);
    },
  });
}

export function useClearWidgetPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: clearWidgetPreferences,
    onSuccess: () => {
      queryClient.setQueryData<WidgetPreferencesResponse>(queryKeys.widgetPreferences.current, {
        hasSavedPreference: false,
        sources: [],
      });
    },
  });
}
