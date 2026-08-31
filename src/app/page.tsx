import type { Metadata } from "next";
import { LandingPage } from "@/features/landing";
import { SITE_NAME, absoluteUrl, getSiteUrl } from "@/utils/seo";

const LANDING_TITLE = "Stock Scanner & Chart Review Workspace";
const LANDING_DESCRIPTION =
  "Stock Harvesting helps investors surface relevant market behaviour, review stocks in a focused chart workspace, save insights, and explore markets across global exchanges.";
const SOCIAL_TITLE = `${LANDING_TITLE} | ${SITE_NAME}`;
const SOCIAL_IMAGE = absoluteUrl("/images/logo.png");

export const metadata: Metadata = {
  title: LANDING_TITLE,
  description: LANDING_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: SOCIAL_TITLE,
    description: LANDING_DESCRIPTION,
    url: "/",
    images: [{ url: SOCIAL_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: SOCIAL_TITLE,
    description: LANDING_DESCRIPTION,
    images: [SOCIAL_IMAGE],
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: SITE_NAME,
      url: getSiteUrl().toString(),
      logo: SOCIAL_IMAGE,
    },
    {
      "@type": "SoftwareApplication",
      name: SITE_NAME,
      applicationCategory: "FinanceApplication",
      operatingSystem: "Web",
      url: getSiteUrl().toString(),
      description: LANDING_DESCRIPTION,
    },
  ],
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <LandingPage />
    </>
  );
}
