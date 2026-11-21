import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/utils/seo";

// Only indexable pages belong here. The (app) route group (charts, dashboard, login,
// billing, ...) is noindex, and public stock pages are noindex while they still render
// mock data - see src/app/(public)/stocks/[exchange]/[symbol]/page.tsx.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: absoluteUrl("/"),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
