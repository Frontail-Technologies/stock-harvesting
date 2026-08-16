"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/utils/cn";
import { ADSENSE_CLIENT, hasAdsenseConfig } from "./adsense-config";

type AdsByGoogleQueue = Array<Record<string, unknown>> & {
  push: (config: Record<string, unknown>) => number;
};

declare global {
  interface Window {
    adsbygoogle?: AdsByGoogleQueue;
  }
}

type AdsenseAdProps = {
  slot: string;
  placement: string;
  format?: string;
  responsive?: boolean;
  className?: string;
  variant?: "landing" | "scanner";
};

const isDevelopment = process.env.NODE_ENV !== "production";

export function AdsenseAd({
  slot,
  placement,
  format = "auto",
  responsive = true,
  className,
  variant = "landing",
}: AdsenseAdProps) {
  const pushedRef = useRef(false);
  const configured = hasAdsenseConfig(slot);

  useEffect(() => {
    if (!configured || pushedRef.current) return;

    const timeoutId = window.setTimeout(() => {
      try {
        window.adsbygoogle = window.adsbygoogle ?? ([] as unknown as AdsByGoogleQueue);
        window.adsbygoogle.push({});
        pushedRef.current = true;
      } catch {
      }
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [configured, slot]);

  if (!configured) {
    if (!isDevelopment) return null;

    return (
      <AdFrame className={className} variant={variant} placement={placement}>
        <div className="flex min-h-[100px] items-center justify-center text-center text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          <span>
            Advertisement
            <span className="mt-1 block normal-case tracking-normal">AdSense placement</span>
          </span>
        </div>
      </AdFrame>
    );
  }

  return (
    <AdFrame className={className} variant={variant} placement={placement}>
      <ins
        className="adsbygoogle block min-h-[100px] w-full"
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? "true" : "false"}
      />
    </AdFrame>
  );
}

type AdFrameProps = {
  children: ReactNode;
  className?: string;
  variant: "landing" | "scanner";
  placement: string;
};

function AdFrame({ children, className, variant, placement }: AdFrameProps) {
  return (
    <section
      aria-label="Advertisement"
      data-adsense-placement={placement}
      className={cn(
        "w-full border-y py-6 sm:py-7",
        variant === "landing"
          ? "border-white/10 bg-transparent text-white/45"
          : "border-border bg-background text-muted-foreground",
        className
      )}
    >
      <div
        className={cn(
          "mx-auto w-full px-4 sm:px-6",
          variant === "landing" ? "max-w-6xl" : "max-w-5xl"
        )}
      >
        <p className="mb-3 text-center text-[0.625rem] font-semibold uppercase tracking-[0.22em] opacity-70">
          Advertisement
        </p>
        <div className="mx-auto min-h-[100px] w-full max-w-[970px]">{children}</div>
      </div>
    </section>
  );
}
