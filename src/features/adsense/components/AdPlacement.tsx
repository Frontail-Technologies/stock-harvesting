"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/utils/cn";
import { canRenderAd } from "../lib/can-render-ad";
import { useMonetizationConfig } from "../hooks/use-monetization-config";
import type { AdPlacementKey } from "../types";
import { AdFrame } from "./AdFrame";

type AdPlacementProps = {
  placementKey: AdPlacementKey;
  variant: "landing" | "scanner";
  format?: string;
  responsive?: boolean;
  className?: string;
};

export function AdPlacement({
  placementKey,
  variant,
  format = "auto",
  responsive = true,
  className,
}: AdPlacementProps) {
  const { config } = useMonetizationConfig();
  const pushedRef = useRef(false);
  const renderable = canRenderAd(config, placementKey);
  const isLive = renderable && config?.mode === "live";

  useEffect(() => {
    if (!isLive || pushedRef.current) return;

    const timeoutId = window.setTimeout(() => {
      try {
        window.adsbygoogle = window.adsbygoogle ?? ([] as unknown as Window["adsbygoogle"]);
        window.adsbygoogle?.push({});
        pushedRef.current = true;
      } catch {
      }
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [isLive]);

  if (!renderable || !config) return null;
  const placement = config.placements[placementKey];
  if (!placement) return null;

  if (config.mode === "preview") {
    const isScanner = variant === "scanner";
    return (
      <AdFrame className={className} variant={variant} placement={placementKey}>
        <div
          className={cn(
            "flex items-center justify-center text-center font-semibold uppercase tracking-[0.18em] text-muted-foreground",
            isScanner ? "min-h-[50px] text-[0.65rem]" : "min-h-[100px] text-xs"
          )}
        >
          <span>
            Advertisement
            {!isScanner && (
              <span className="mt-1 block normal-case tracking-normal">Preview placement</span>
            )}
          </span>
        </div>
      </AdFrame>
    );
  }

  return (
    <AdFrame className={className} variant={variant} placement={placementKey}>
      <ins
        className={cn(
          "adsbygoogle block w-full",
          variant === "scanner" ? "min-h-[50px]" : "min-h-[100px]"
        )}
        data-ad-client={config.publisherId ?? undefined}
        data-ad-slot={placement.slotId ?? undefined}
        data-ad-format={format}
        data-full-width-responsive={responsive ? "true" : "false"}
      />
    </AdFrame>
  );
}
