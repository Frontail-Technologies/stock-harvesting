"use client";

import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/features/api";
import type { MonetizationConfig } from "../types";

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
