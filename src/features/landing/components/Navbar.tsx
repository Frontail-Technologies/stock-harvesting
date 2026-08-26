"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/ui/brand-logo";
import { AccountMenu } from "@/features/layout/components/AccountMenu";
import { GlobalSearchMobileSheet } from "@/features/global-search/components/GlobalSearchMobileSheet";
import { GlobalSearchNavbarField } from "@/features/global-search/components/GlobalSearchNavbarField";
import { cn } from "@/utils/cn";

// Landing's own navbar chrome for the search trigger/account menu - both
// default to the regular app's neutral bg-background/border-input tokens,
// which would look like a mismatched control sitting on landing's own
// themed bar. Built from the landing-fg token so it inverts correctly
// alongside the rest of the navbar in light mode. Kept intentionally
// small (just these two spots) rather than reskinning the shared
// components.
const LANDING_NAV_CONTROL_CLASS =
  "border-landing-border bg-landing-fg/6 text-landing-text-strong backdrop-blur-sm hover:border-landing-border-strong hover:bg-landing-fg/10 hover:text-landing-fg";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

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
          <BrandLogo size="sm" />
        </Link>

        <div className="flex items-center justify-self-end gap-2.5">
          <div className="hidden lg:block lg:w-56 xl:w-64">
            <GlobalSearchNavbarField className={LANDING_NAV_CONTROL_CLASS} />
          </div>

          <div className="hidden md:flex lg:hidden">
            <GlobalSearchMobileSheet className={cn("rounded-md border", LANDING_NAV_CONTROL_CLASS)} />
          </div>

          <div className="hidden md:flex items-center gap-2.5">
            <AccountMenu className="border border-landing-border" />
          </div>

          <div className="flex md:hidden items-center gap-1.5">
            <GlobalSearchMobileSheet className={cn("rounded-md border", LANDING_NAV_CONTROL_CLASS)} />
            <AccountMenu className="border border-landing-border" />
          </div>

          <button
            id="landing-mobile-menu-toggle"
            className="md:hidden flex flex-col gap-1.5 p-2 rounded-md hover:bg-landing-fg/8 transition-colors cursor-pointer"
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
        <div className="md:hidden bg-landing-bg border-t border-landing-border px-6 py-4 flex flex-col gap-3">
          <Link href="#scanner-method" className="landing-nav-link py-2" onClick={() => setMobileOpen(false)}>
            Analysis
          </Link>
          <Link href="#workflow" className="landing-nav-link py-2" onClick={() => setMobileOpen(false)}>
            How it Works
          </Link>
          <Link href="#markets" className="landing-nav-link py-2" onClick={() => setMobileOpen(false)}>
            Markets
          </Link>
        </div>
      ) : null}
    </header>
  );
}
