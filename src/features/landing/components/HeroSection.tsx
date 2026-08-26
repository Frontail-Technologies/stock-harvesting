import type { CSSProperties } from "react";
import Link from "next/link";
import { HeroWorldMap } from "./HeroWorldMap";
import { HeroWorldMapMobile } from "./HeroWorldMapMobile";
import { LandingOpenWorkspaceLink } from "./LandingOpenWorkspaceLink";

export function HeroSection() {
  return (
    <section
      id="hero"
      className="landing-section relative overflow-hidden"
      aria-labelledby="hero-headline"
    >
      <div className="absolute inset-0 landing-hero-bg" aria-hidden="true" />
      <div
        className="absolute inset-0 landing-hero-dot-grid"
        aria-hidden="true"
      />
      <div className="absolute inset-0 landing-container" aria-hidden="true">
        <div className="landing-frame-line landing-frame-line-left" />
        <div className="landing-frame-line landing-frame-line-right" />
      </div>

      <div className="landing-container relative z-10 flex flex-col items-center text-center">
        <p className="landing-hero-eyebrow landing-reveal">
          Market Analysis &amp; Chart Workspace
        </p>

        <h1
          id="hero-headline"
          className="landing-hero-title landing-reveal max-w-3xl text-balance mt-4"
          style={{ "--landing-reveal-delay": "0.06s" } as CSSProperties}
        >
          Understand a stock in seconds,{" "}
          <span className="landing-gradient-text">not hours.</span>
        </h1>

        <p
          className="landing-reveal max-w-xl text-base md:text-lg text-landing-text-secondary leading-relaxed mt-5"
          style={{ "--landing-reveal-delay": "0.12s" } as CSSProperties}
        >
          Surface relevant market context and review it in one focused
          workspace.
        </p>

        <div
          className="landing-reveal flex flex-wrap items-center justify-center gap-3 mt-8"
          style={{ "--landing-reveal-delay": "0.15s" } as CSSProperties}
        >
          <LandingOpenWorkspaceLink id="hero-cta-primary" />
          <Link
            href="#workflow"
            id="hero-cta-secondary"
            className="landing-btn-ghost landing-btn-lg gap-2 inline-flex items-center"
          >
            See how it works
          </Link>
        </div>
      </div>

      <div className="landing-reveal relative z-10 mt-8 md:mt-10 pb-16 md:pb-24 px-6 md:px-10 flex flex-col items-center">
        <div className="landing-hero-map-wrap relative w-full sm:w-11/12 md:w-3/4 mx-auto">
          <div className="landing-hero-visual-glow" aria-hidden="true" />
          <HeroWorldMap />
          <HeroWorldMapMobile />
        </div>
      </div>
    </section>
  );
}
