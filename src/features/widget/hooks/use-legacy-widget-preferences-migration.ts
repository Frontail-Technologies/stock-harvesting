"use client";

import { useEffect, useRef } from "react";
import type { UseMutationResult } from "@tanstack/react-query";
import {
  hasMigratedLegacyWidgetPreference,
  markLegacyWidgetPreferenceMigrated,
  readLegacyWidgetPreference,
} from "../lib/legacy-widget-preferences";
import type { WidgetPreferencesResponse } from "../api/widget-preferences-api";
import type { WidgetSource } from "../types";

// One-time, best-effort migration of the old localStorage widget selection
// (see legacy-widget-preferences.ts) into the new server-backed preference.
// Fires at most once per browser (guarded by a localStorage sentinel) and
// only once this page already knows the server has no saved preference row
// - server state always wins and is never overwritten. Non-blocking: it
// piggybacks on the same save mutation the page's own Add/Remove/Reorder
// actions use, so a failure here just leaves the sentinel unset for a later
// retry rather than surfacing an error to the user.
export function useLegacyWidgetPreferencesMigration(input: {
  ready: boolean; // preferences + collections + watchlists have all resolved
  hasSavedPreference: boolean;
  saveMutation: UseMutationResult<WidgetPreferencesResponse, unknown, { sources: WidgetSource[] }>;
}) {
  const attempted = useRef(false);
  const { ready, hasSavedPreference, saveMutation } = input;

  useEffect(() => {
    if (!ready || hasSavedPreference || attempted.current) return;
    if (hasMigratedLegacyWidgetPreference()) return;

    const legacySources = readLegacyWidgetPreference();
    if (legacySources === null) {
      markLegacyWidgetPreferenceMigrated();
      return;
    }

    attempted.current = true;
    saveMutation.mutate(
      { sources: legacySources },
      {
        onSuccess: () => markLegacyWidgetPreferenceMigrated(),
        onError: () => {
          attempted.current = false;
        },
      }
    );
  }, [ready, hasSavedPreference, saveMutation]);
}
