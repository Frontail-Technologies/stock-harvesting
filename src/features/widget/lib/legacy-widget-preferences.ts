import type { WidgetSource } from "../types";

// The old Zustand `persist` store (removed once server-side widget
// preferences shipped) wrote exactly this localStorage key/shape:
//   key:   "stock-harvesting-widget-segments"
//   value: JSON.stringify({ state: { sources: WidgetSource[], hasSeededDefaults: boolean }, version: 1 })
// (zustand's persist middleware's default wire format - {state, version}).
//
// hasSeededDefaults is the signal this migration relies on to tell "never
// configured" apart from "deliberately emptied": the old store's one-time
// seeding effect only ever set hasSeededDefaults=true together with a
// non-empty `sources` array (it bailed out early whenever the Segments
// list hadn't loaded yet), so hasSeededDefaults=true with sources=[] can
// only be reached by a later explicit removeSource call - i.e. the user
// really did empty their selection. The one case this can't distinguish:
// a browser that closed before the Segments list ever finished loading,
// so the seeding effect never ran at all - that's indistinguishable from
// "never configured" under the old shape, and is treated as such (no
// migration), which is the safe default since no real selection was ever
// shown to that user either way.
const LEGACY_STORAGE_KEY = "stock-harvesting-widget-segments";
const LEGACY_MIGRATED_KEY = "stock-harvesting-widget-segments:migrated";

const VALID_SOURCE_TYPES = new Set(["segment", "watchlist"]);

function isValidLegacySource(value: unknown): value is WidgetSource {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    VALID_SOURCE_TYPES.has(candidate.type as string) &&
    typeof candidate.id === "string" &&
    candidate.id.length > 0
  );
}

// Returns null whenever there's nothing reliably migratable: no old key,
// corrupted/unexpected JSON, or the old store never finished seeding. Pure
// and side-effect free - callers decide what to do with the result.
export function readLegacyWidgetPreference(): WidgetSource[] | null {
  try {
    const raw = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as { state?: { sources?: unknown; hasSeededDefaults?: unknown } };
    const state = parsed?.state;
    if (!state || typeof state !== "object") return null;
    if (state.hasSeededDefaults !== true) return null;
    if (!Array.isArray(state.sources) || !state.sources.every(isValidLegacySource)) return null;

    return state.sources;
  } catch {
    return null;
  }
}

export function hasMigratedLegacyWidgetPreference(): boolean {
  try {
    return window.localStorage.getItem(LEGACY_MIGRATED_KEY) === "1";
  } catch {
    // Storage unavailable (private mode, blocked, etc.) - treat as already
    // handled rather than retry every render.
    return true;
  }
}

export function markLegacyWidgetPreferenceMigrated(): void {
  try {
    window.localStorage.setItem(LEGACY_MIGRATED_KEY, "1");
  } catch {
    // Best-effort only - a failed write just means this browser re-checks
    // next visit, which is safe (migration is idempotent either way).
  }
}
