import Link from "next/link";
import { BrandLogo } from "@/components/ui/brand-logo";

const PRODUCT_LINKS = [
  { label: "Scanner", href: "#scanner-method" },
  { label: "How It Works", href: "#workflow" },
  { label: "Markets", href: "#markets" },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="landing-footer relative overflow-hidden">
      <p className="landing-footer-wordmark hidden md:block" aria-hidden="true">
        Stock Harvesting
      </p>

      <div className="absolute inset-0 landing-container" aria-hidden="true">
        <div className="landing-frame-line landing-frame-line-left" />
        <div className="landing-frame-line landing-frame-line-right" />
      </div>

      <div className="landing-container relative">
        <div className="landing-footer-main">
          <div className="landing-footer-brand">
            <Link href="/" aria-label="Stock Harvesting home" className="w-fit">
              <BrandLogo size="sm" forceTheme="dark" />
            </Link>
            <p className="landing-footer-description">
              Stock intelligence and chart review workspace built for focused
              market analysis.
            </p>
          </div>

          <div className="landing-footer-links">
            <div className="landing-footer-group">
              <p className="landing-footer-group-label">Product</p>
              <ul className="landing-footer-group-list">
                {PRODUCT_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="landing-footer-link">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="landing-footer-bottom">
          <p className="landing-footer-copyright">
            &copy; {year} Stock Harvesting. All rights reserved.
          </p>
          <p className="landing-footer-status">Stock Harvesting / {year}</p>
        </div>
      </div>
    </footer>
  );
}
