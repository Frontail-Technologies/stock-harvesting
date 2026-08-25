"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/utils/cn";
import { useLandingCta } from "../hooks/use-landing-cta";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const cta = useLandingCta();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header data-scrolled={scrolled} className="landing-navbar fixed top-0 inset-x-0 z-50">
      <div className="landing-container relative flex items-center justify-between md:grid md:grid-cols-[1fr_auto_1fr] h-16 md:h-22">
        <div className="landing-frame-line landing-frame-line-left" aria-hidden="true" />
        <div className="landing-frame-line landing-frame-line-right" aria-hidden="true" />

        <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
          <Link href="#scanner-method" className="landing-nav-link">
            Analysis
          </Link>
          <Link href="#workflow" className="landing-nav-link">
            How it Works
          </Link>
          <Link href="#markets" className="landing-nav-link">
            Markets
          </Link>
        </nav>

        <Link href="/" aria-label="Stock Harvesting home" className="justify-self-center shrink-0">
          <Image src="/images/logo-dark-cropped.png" alt="Stock Harvesting" width={210} height={80} priority className="h-10 w-auto" />
        </Link>

        <div className="flex items-center justify-self-end gap-3">
          <div className="hidden md:flex items-center gap-3">
            {cta.status === "loading" ? (
              // Same footprint as the resolved states so nothing shifts
              // once the session resolves - just no label committed to
              // either "Login" or "Open Workspace" while status is unknown.
              <span
                className="landing-btn-primary invisible"
                aria-hidden="true"
              >
                Open Workspace
              </span>
            ) : cta.status === "authenticated" ? (
              <Link href={cta.href} className="landing-btn-primary">
                {cta.label}
              </Link>
            ) : (
              <>
                <Link href="/login" className="landing-nav-link">
                  Login
                </Link>
                <span className="landing-nav-divider" aria-hidden="true" />
                <Link href={cta.href} className="landing-btn-primary">
                  {cta.label}
                </Link>
              </>
            )}
          </div>

          <button
            id="landing-mobile-menu-toggle"
            className="md:hidden flex flex-col gap-1.5 p-2 rounded-md hover:bg-white/8 transition-colors cursor-pointer"
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((prev) => !prev)}
          >
            <span className={cn("landing-hamburger-bar", mobileOpen && "rotate-45 translate-y-2")} />
            <span className={cn("landing-hamburger-bar", mobileOpen && "opacity-0")} />
            <span className={cn("landing-hamburger-bar", mobileOpen && "-rotate-45 -translate-y-2")} />
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <div className="md:hidden bg-brand-charcoal border-t border-white/8 px-6 py-4 flex flex-col gap-3">
          <Link href="#scanner-method" className="landing-nav-link py-2" onClick={() => setMobileOpen(false)}>
            Analysis
          </Link>
          <Link href="#workflow" className="landing-nav-link py-2" onClick={() => setMobileOpen(false)}>
            How it Works
          </Link>
          <Link href="#markets" className="landing-nav-link py-2" onClick={() => setMobileOpen(false)}>
            Markets
          </Link>
          <div className="border-t border-white/8 pt-3 flex flex-col gap-2">
            {cta.status === "loading" ? null : cta.status === "authenticated" ? (
              <Link
                href={cta.href}
                className="landing-btn-primary text-center"
                onClick={() => setMobileOpen(false)}
              >
                {cta.label}
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="landing-nav-link py-2"
                  onClick={() => setMobileOpen(false)}
                >
                  Login
                </Link>
                <Link
                  href={cta.href}
                  className="landing-btn-primary text-center"
                  onClick={() => setMobileOpen(false)}
                >
                  {cta.label}
                </Link>
              </>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}

