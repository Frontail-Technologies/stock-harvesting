"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useLandingCta } from "../hooks/use-landing-cta";
import { Reveal } from "./Reveal";

export function FinalCtaSection() {
  const cta = useLandingCta();

  return (
    <section
      id="cta"
      className="landing-section relative overflow-hidden border-t border-white/8"
      aria-labelledby="cta-heading"
    >
      <div className="absolute inset-0 landing-container" aria-hidden="true">
        <div className="landing-frame-line landing-frame-line-left" />
        <div className="landing-frame-line landing-frame-line-right" />
      </div>

      <div className="landing-container relative">
        <Reveal className="landing-cta-panel">
          <div className="landing-cta-accent" aria-hidden="true">
            <span className="landing-cta-accent-dot" />
            <span className="landing-cta-accent-rule" />
            <span className="landing-cta-accent-dot" />
          </div>

          <p className="landing-eyebrow">Ready to Review?</p>
          <h2 id="cta-heading" className="landing-cta-heading text-balance">
            Start with the scanner
          </h2>
          <p className="landing-cta-copy">
            Search a stock, review what Stock Harvesting surfaces, and
            inspect the result directly in your chart workspace.
          </p>

          <div className="mt-9 flex justify-center">
            <Link href={cta.href} className="landing-btn-primary landing-btn-lg gap-2 inline-flex items-center">
              {cta.label}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
