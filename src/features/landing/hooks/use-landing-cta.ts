"use client";

import { useSessionStore } from "@/features/auth";

export type LandingCtaStatus = "loading" | "authenticated" | "unauthenticated";

export type LandingCta = {
  status: LandingCtaStatus;
  href: string;
  label: string;
};

export function useLandingCta(): LandingCta {
  const status = useSessionStore((state) => state.status);

  if (status === "authenticated") {
    return { status: "authenticated", href: "/charts", label: "Open Charts" };
  }

  if (status === "unknown") {
    return { status: "loading", href: "/login", label: "Open Charts" };
  }

  return { status: "unauthenticated", href: "/login", label: "Open Charts" };
}
