"use client";

import Script from "next/script";
import { canRenderAd } from "../lib/can-render-ad";
import { useMonetizationConfig } from "../hooks/use-monetization-config";
import type { AdPlacementKey } from "../types";

type AdsenseScriptProps = {
  placementKeys: AdPlacementKey[];
};

// Loads the real Google AdSense script only when mode is LIVE and at least
// one of this route's placements can actually render - never speculatively.
// Next.js's <Script> dedupes by `id` across re-renders/navigations on its
// own, so this doesn't need its own duplicate-injection guard.
export function AdsenseScript({ placementKeys }: AdsenseScriptProps) {
  const { config } = useMonetizationConfig();

  const shouldLoad =
    config?.mode === "live" && placementKeys.some((key) => canRenderAd(config, key));

  if (!shouldLoad || !config?.publisherId) return null;

  return (
    <Script
      id="stock-harvesting-adsense"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${config.publisherId}`}
      strategy="lazyOnload"
      async
      crossOrigin="anonymous"
    />
  );
}
