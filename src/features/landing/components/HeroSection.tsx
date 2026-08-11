"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useLandingCta } from "../hooks/use-landing-cta";
import { HeroWorldMap } from "./HeroWorldMap";

export function HeroSection() {
  const cta = useLandingCta();
  const reduceMotion = useReducedMotion();

  // Very subtle scroll-linked parallax on the globe — it drifts ~40px as the
  // hero scrolls out, no spin or scale. Disabled under reduced motion.
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const globeY = useTransform(scrollYProgress, [0, 1], [0, reduceMotion ? 0 : 40]);

  const rise = (delay: number) => ({
    initial: reduceMotion ? { opacity: 0 } : { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: reduceMotion ? 0.3 : 0.55,
      delay: reduceMotion ? 0 : delay,
      ease: [0.21, 0.47, 0.32, 0.98] as const,
    },
  });

  return (
    <section
      ref={heroRef}
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
        <motion.p {...rise(0)} className="landing-hero-eyebrow">
          Stock Scanner &amp; Chart Workspace
        </motion.p>

        <motion.h1
          {...rise(0.06)}
          id="hero-headline"
          className="landing-hero-title max-w-3xl text-balance mt-4"
        >
          Understand a stock in seconds,{" "}
          <span className="landing-gradient-text">not hours.</span>
        </motion.h1>

        <motion.p
          {...rise(0.12)}
          className="max-w-xl text-base md:text-lg text-white/65 leading-relaxed mt-5"
        >
          Stock Harvesting surfaces relevant market behaviour and brings it into
          one focused chart workspace, so you can spend less time searching and
          more time reviewing.
        </motion.p>

        <motion.div
          {...rise(0.18)}
          className="flex flex-wrap items-center justify-center gap-3 mt-7"
        >
          <Link
            href={cta.href}
            id="hero-cta-primary"
            className="landing-btn-primary landing-btn-lg gap-2 inline-flex items-center"
          >
            {cta.label}
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="#workflow"
            id="hero-cta-secondary"
            className="landing-btn-ghost landing-btn-lg gap-2 inline-flex items-center"
          >
            See how it works
          </Link>
        </motion.div>
      </div>

      <motion.div
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: reduceMotion ? 0.3 : 0.6,
          delay: reduceMotion ? 0 : 0.3,
          ease: [0.21, 0.47, 0.32, 0.98],
        }}
        className="relative z-10 mt-8 md:mt-10 pb-16 md:pb-24 px-6 md:px-10 flex flex-col items-center"
      >
        <motion.div style={{ y: globeY }} className="relative w-full sm:w-11/12 md:w-3/4 mx-auto">
          <div className="landing-hero-visual-glow" aria-hidden="true" />
          <HeroWorldMap />
        </motion.div>
      </motion.div>
    </section>
  );
}
