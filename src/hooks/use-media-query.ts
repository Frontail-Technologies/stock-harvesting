"use client";

import { useSyncExternalStore } from "react";

function subscribe(query: string, onChange: () => void) {
  const mediaQueryList = window.matchMedia(query);
  mediaQueryList.addEventListener("change", onChange);
  return () => mediaQueryList.removeEventListener("change", onChange);
}

// useSyncExternalStore (not useState+useEffect) so this is the one hook
// allowed to read a browser-only API during render without tripping the
// "no setState in an effect" lint rule - it's built for exactly this:
// subscribing to an external, non-React value (matchMedia) safely across
// server and client snapshots.
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => subscribe(query, onChange),
    () => window.matchMedia(query).matches,
    () => false
  );
}
