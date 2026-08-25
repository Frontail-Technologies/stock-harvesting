"use client";

import { useSessionStore } from "@/features/auth";

export type LandingCtaStatus = "loading" | "authenticated" | "unauthenticated";

export type LandingCta = {
  status: LandingCtaStatus;
  href: string;
  label: string;
};

// The landing page's primary CTA branches on auth state in multiple places
// (navbar, hero, closing CTA). Centralised here so the label/destination
// can't drift apart between them, and so "loading" is a real third state -
// treating an unresolved session as logged-out is exactly what made the
// navbar show "Login" to an already-authenticated visitor.
export function useLandingCta(): LandingCta {
  const status = useSessionStore((state) => state.status);

  if (status === "authenticated") {
    return { status: "authenticated", href: "/scanner", label: "Open Workspace" };
  }

  if (status === "unknown") {
    return { status: "loading", href: "/login", label: "Open Workspace" };
  }

  return { status: "unauthenticated", href: "/login", label: "Login" };
}
