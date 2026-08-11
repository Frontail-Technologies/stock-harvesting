"use client";

import { useSessionStore } from "@/features/auth";

// The landing page's primary CTA branches on auth state in multiple places
// (navbar, hero, footer, closing CTA). Centralised here so the label and
// destination can't drift apart between them.
export function useLandingCta() {
  const status = useSessionStore((state) => state.status);
  const isAuthenticated = status === "authenticated";

  return {
    isAuthenticated,
    href: isAuthenticated ? "/scanner" : "/login",
    label: isAuthenticated ? "Go to Scanner" : "Open Scanner",
  };
}
