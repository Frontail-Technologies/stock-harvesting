"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/ui/brand-logo";
import { cn } from "@/utils/cn";
import { useLandingCta } from "../hooks/use-landing-cta";

export function Navbar() {
  const cta = useLandingCta();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header data-scrolled={scrolled} className="landing-navbar fixed top-0 inset-x-0 z-50">
      {/* Mobile: plain logo-left/hamburger-right row (nav+CTA are hidden,
          so a 3-col grid degenerates unpredictably with one empty side).
          Desktop: left/center/right as equal 1fr side-columns around an
          auto-width centerpiece — the logo sits at the true viewport
          center this way, not just centered in leftover flex space. */}
      <div className="landing-container relative flex items-center justify-between md:grid md:grid-cols-[1fr_auto_1fr] h-16 md:h-22">
        <div className="landing-frame-line landing-frame-line-left" aria-hidden="true" />
        <div className="landing-frame-line landing-frame-line-right" aria-hidden="true" />

        <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
          <Link href="#scanner-method" className="landing-nav-link">
            Scanner
          </Link>
          <Link href="#workflow" className="landing-nav-link">
            How it Works
          </Link>
          <Link href="#markets" className="landing-nav-link">
            Markets
          </Link>
        </nav>

        <Link href="/" aria-label="Stock Harvesting home" className="justify-self-center shrink-0">
          <BrandLogo size="sm" forceTheme="dark" />
        </Link>

        <div className="flex items-center justify-self-end gap-3">
          <div className="hidden md:flex items-center gap-3">
            {!cta.isAuthenticated ? (
              <>
                <Link href="/login" className="landing-nav-link">
                  Login
                </Link>
                <span className="landing-nav-divider" aria-hidden="true" />
              </>
            ) : null}
            <Link href={cta.href} className="landing-btn-primary">
              {cta.label}
            </Link>
          </div>

          <button
            id="landing-mobile-menu-toggle"
            className="md:hidden flex flex-col gap-1.5 p-2 rounded-md hover:bg-white/8 transition-colors"
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((prev) => !prev)}
          >
            <span
              className={cn("landing-hamburger-bar", mobileOpen && "rotate-45 translate-y-2")}
            />
            <span className={cn("landing-hamburger-bar", mobileOpen && "opacity-0")} />
            <span
              className={cn("landing-hamburger-bar", mobileOpen && "-rotate-45 -translate-y-2")}
            />
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <div className="md:hidden bg-brand-charcoal border-t border-white/8 px-6 py-4 flex flex-col gap-3">
          <Link
            href="#scanner-method"
            className="landing-nav-link py-2"
            onClick={() => setMobileOpen(false)}
          >
            Scanner
          </Link>
          <Link
            href="#workflow"
            className="landing-nav-link py-2"
            onClick={() => setMobileOpen(false)}
          >
            How it Works
          </Link>
          <Link
            href="#markets"
            className="landing-nav-link py-2"
            onClick={() => setMobileOpen(false)}
          >
            Markets
          </Link>
          <div className="border-t border-white/8 pt-3 flex flex-col gap-2">
            {!cta.isAuthenticated ? (
              <Link
                href="/login"
                className="landing-nav-link py-2"
                onClick={() => setMobileOpen(false)}
              >
                Login
              </Link>
            ) : null}
            <Link
              href={cta.href}
              className="landing-btn-primary text-center"
              onClick={() => setMobileOpen(false)}
            >
              {cta.label}
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
