"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/ui/brand-logo";
import { AccountMenu } from "@/features/layout/components/AccountMenu";
import { GlobalSearchMobileSheet } from "@/features/global-search/components/GlobalSearchMobileSheet";
import { GlobalSearchNavbarField } from "@/features/global-search/components/GlobalSearchNavbarField";
import { cn } from "@/utils/cn";

const LANDING_NAV_CONTROL_CLASS =
  "border-landing-border bg-landing-fg/6 text-landing-text-strong backdrop-blur-sm hover:border-landing-border-strong hover:bg-landing-fg/10 hover:text-landing-fg";

export type LandingNavLink = { label: string; href: string };

const LANDING_NAV_LINKS: LandingNavLink[] = [
  { label: "Analysis", href: "#scanner-method" },
  { label: "How it Works", href: "#workflow" },
  { label: "Markets", href: "#markets" },
];

type NavbarProps = {
  links?: LandingNavLink[];
  sticky?: boolean;
};

export function Navbar({ links = LANDING_NAV_LINKS, sticky = false }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (sticky) return;
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [sticky]);

  return (
    <header
      data-scrolled={sticky ? true : scrolled}
      className={cn("landing-navbar inset-x-0 z-50", sticky ? "sticky top-0" : "fixed top-0")}
    >
      <div className="landing-container relative flex items-center justify-between md:grid md:grid-cols-[1fr_auto_1fr] h-16 md:h-22">
        <div className="landing-frame-line landing-frame-line-left" aria-hidden="true" />
        <div className="landing-frame-line landing-frame-line-right" aria-hidden="true" />

        <nav className="hidden lg:flex items-center gap-1" aria-label="Main navigation">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="landing-nav-link">
              {link.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/"
          aria-label="Stock Harvesting home"
          className="shrink-0 justify-self-center scale-90 sm:scale-100"
        >
          <BrandLogo size="sm" textClassName="text-base sm:text-3xl" />
        </Link>

        <div className="flex shrink-0 items-center justify-self-end gap-1.5 sm:gap-2">
          <div className="hidden lg:block lg:w-48 xl:w-64">
            <GlobalSearchNavbarField className={LANDING_NAV_CONTROL_CLASS} />
          </div>

          <div className="flex lg:hidden">
            <GlobalSearchMobileSheet className={cn("rounded-md border", LANDING_NAV_CONTROL_CLASS)} />
          </div>

          <div className="hidden lg:flex items-center">
            <AccountMenu className="border border-landing-border" />
          </div>

          <div className="flex lg:hidden items-center">
            <AccountMenu className="border border-landing-border" extraLinks={links} />
          </div>
        </div>
      </div>
    </header>
  );
}
