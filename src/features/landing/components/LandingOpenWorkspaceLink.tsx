"use client";

import Link from "next/link";
import { useLandingCta } from "../hooks/use-landing-cta";

type LandingOpenWorkspaceLinkProps = {
  id?: string;
  className?: string;
};

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
