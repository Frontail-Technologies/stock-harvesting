"use client";

import Link from "next/link";
import { useLandingCta } from "../hooks/use-landing-cta";

type LandingOpenWorkspaceLinkProps = {
  id?: string;
  className?: string;
};

// Shared by HeroSection and FinalCtaSection (both server components) - the
// one small client "island" each mounts so this primary CTA resolves to
// /charts for an already-authenticated visitor instead of always bouncing
// through /login. The label stays "Open Charts" in either resolved
// state, matching what these two sections already showed logged-out
// visitors; only the destination changes.
export function LandingOpenWorkspaceLink({ id, className }: LandingOpenWorkspaceLinkProps) {
  const cta = useLandingCta();

  return (
    <Link
      href={cta.href}
      id={id}
      className={className ?? "landing-btn-primary landing-btn-lg gap-2 inline-flex items-center"}
    >
      {cta.label}
      <span aria-hidden="true">-&gt;</span>
    </Link>
  );
}
