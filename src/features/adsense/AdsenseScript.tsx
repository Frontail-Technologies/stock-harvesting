"use client";

import Script from "next/script";
import { ADSENSE_CLIENT, hasAdsenseConfig } from "./adsense-config";

type AdsenseScriptProps = {
  slots?: string[];
};

export function AdsenseScript({ slots = [] }: AdsenseScriptProps) {
  const shouldLoad = slots.some((slot) => hasAdsenseConfig(slot));

  if (!shouldLoad) return null;

  return (
    <Script
      id="stock-harvesting-adsense"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
      strategy="lazyOnload"
      async
      crossOrigin="anonymous"
    />
  );
}
