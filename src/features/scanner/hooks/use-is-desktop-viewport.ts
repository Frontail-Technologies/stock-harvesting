"use client";

import { useEffect, useState } from "react";

// Shared by every scanner surface that swaps a desktop-only layout for a
// mobile sheet (the watchlist widget, the watchlist sidebar) - one
// definition of "desktop" so they can't drift to different breakpoints.
export function useIsDesktopViewport(minWidthPx = 640) {
  const query = `(min-width: ${minWidthPx}px)`;
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== "undefined" && window.matchMedia(query).matches
  );

  useEffect(() => {
    const media = window.matchMedia(query);
    const handleChange = () => setIsDesktop(media.matches);
    handleChange();
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-run only if the caller passes a different breakpoint, not on every render
  }, [minWidthPx]);

  return isDesktop;
}
