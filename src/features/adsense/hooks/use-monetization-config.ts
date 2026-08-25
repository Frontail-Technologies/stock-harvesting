"use client";

import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/features/api";
import type { MonetizationConfig } from "../types";

// Plain fetch, not React Query - the landing page ("/") renders outside the
// (app) route group and has no QueryClientProvider, but the scanner does.
// Using one small shared hook for both (instead of two implementations)
// keeps the "don't duplicate rendering logic per page" rule intact without
// adding a second QueryClientProvider just for this.
//
// Module-level promise so every <AdPlacement>/<AdsenseScript> instance on a
// page shares exactly one network request, and a failed fetch fails closed
// (config stays null -> canRenderAd() returns false everywhere) rather than
// throwing or retrying loudly - ads are optional content.
let inFlightConfig: Promise<MonetizationConfig | null> | null = null;

function fetchPublicMonetizationConfig(): Promise<MonetizationConfig | null> {
  if (!inFlightConfig) {
    inFlightConfig = fetch(`${API_BASE_URL}/api/monetization/config`, { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((body) => (body && typeof body === "object" && "data" in body ? body.data : null))
      .catch(() => null);
  }
  return inFlightConfig;
}

export function useMonetizationConfig() {
  const [config, setConfig] = useState<MonetizationConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchPublicMonetizationConfig().then((result) => {
      if (!active) return;
      setConfig(result);
      setIsLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  return { config, isLoading };
}
