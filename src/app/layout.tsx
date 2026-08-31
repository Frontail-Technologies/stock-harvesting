import type { Metadata, Viewport } from "next";
import { Geist, IBM_Plex_Mono, Manrope } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthBootstrap } from "@/features/auth";
import { QueryProvider } from "@/features/api";
import { GlobalStockSearchModal } from "@/features/global-search/components/GlobalStockSearchModal";
import { ThemeProvider } from "@/features/theme/components/ThemeProvider";
import { THEME_STORAGE_KEY } from "@/features/theme/constants";
import { PwaProvider } from "@/features/pwa";
import { SITE_DESCRIPTION, SITE_NAME, absoluteUrl, getSiteUrl } from "@/utils/seo";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  applicationName: SITE_NAME,
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "stock scanner",
    "stock charting",
    "weekly stock scanner",
    "technical analysis",
    "market scanner",
    "Stock Harvesting",
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  alternates: {
    canonical: "/",
  },
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: "/",
    images: [
      {
        url: absoluteUrl("/images/logo.png"),
        width: 1200,
        height: 630,
        alt: SITE_NAME,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [absoluteUrl("/images/logo.png")],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

// The ONE site-wide safe-area treatment (Charts mobile pass, item 6) -
// `viewportFit: "cover"` is what actually turns on `env(safe-area-inset-*)`
// in the first place; Charts' own bottom toolbar/sheets already reference
// those variables (RangeFilterTabs, ChartToolsBar, ScannerPriceAlertMenu)
// but had no effect on iOS without this, since without `viewport-fit=cover`
// the safe-area env vars resolve to 0 regardless of the device's actual
// notch/home-indicator. No other layout in this app declares its own
// `viewport` export - this is the single source of truth for it.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const themeInitScript = `
(() => {
  try {
    var storageKey = ${JSON.stringify(THEME_STORAGE_KEY)};
    // One theme preference now applies across the whole main site - Landing,
    // Login, Scanner, Watchlists alike - restored here, before first paint,
    // so there's no flash of the opposite theme on any of them. Landing and
    // Login used to force dark unconditionally regardless of what was
    // stored; that's what made the account menu's theme toggle feel
    // Scanner-only, since switching it never visibly affected those routes.
    var stored = window.localStorage.getItem(storageKey);
    var theme = stored === "light" || stored === "dark"
      ? stored
      : window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.colorScheme = theme;
  } catch {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`h-full antialiased ${geist.variable} ${ibmPlexMono.variable} ${manrope.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body
        className="min-h-full flex flex-col bg-background text-foreground"
        suppressHydrationWarning
      >
        <PwaProvider />
        <QueryProvider>
          {/* Runs on every route, including the public landing page - not
              just once a protected (app) route happens to mount - so the
              session is known (or known to be absent) before any
              auth-aware UI (landing navbar/CTA, /login) ever has to
              guess. */}
          <AuthBootstrap />
          {/* Theme and tooltips also need to be live on every route now,
              not just inside the (app) group - the landing navbar's
              account menu reads useTheme() and renders Tooltip-wrapped
              controls, and Login now honors the same shared theme. */}
          <ThemeProvider>
            <TooltipProvider>
              {/* The one canonical global stock search modal - opened by
                  the landing navbar, the app navbar, Ctrl+K/Cmd+K, and the
                  mobile search icon alike (see search-modal-store.ts). One
                  instance, works from the landing page and every app route
                  alike. */}
              <GlobalStockSearchModal />
              {children}
            </TooltipProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
