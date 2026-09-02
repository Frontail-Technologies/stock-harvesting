import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Geist, IBM_Plex_Mono, Manrope } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toast";
import { AuthBootstrap } from "@/features/auth";
import { QueryProvider } from "@/features/api";
import { GlobalStockSearchModal } from "@/features/global-search/components/GlobalStockSearchModal";
import { ThemeProvider } from "@/features/theme/components/ThemeProvider";
import { THEME_STORAGE_KEY } from "@/features/theme/constants";
import { PwaProvider } from "@/features/pwa";
import { SITE_DESCRIPTION, SITE_NAME, absoluteUrl, getSiteUrl, getAdminHost } from "@/utils/seo";
import { RESOLVED_PATHNAME_HEADER, normalizeHost, resolveRequestHost } from "@/utils/hostname";
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
    var stored = window.localStorage.getItem(storageKey);
    var theme = stored === "light" || stored === "dark"
      ? stored
      : window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.colorScheme = theme;
  } catch {}
})();
`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  const adminHost = getAdminHost();
  if (adminHost) {
    const headersList = await headers();
    const requestHost = resolveRequestHost(headersList);
    const resolvedPathname = headersList.get(RESOLVED_PATHNAME_HEADER) ?? "";
    if (requestHost === normalizeHost(adminHost) && !resolvedPathname.startsWith("/admin")) {
      redirect("/admin/login");
    }
  }

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

          <AuthBootstrap />

          <ThemeProvider>
            <TooltipProvider>

              <GlobalStockSearchModal />
              {children}
              <Toaster />
            </TooltipProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
