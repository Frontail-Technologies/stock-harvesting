import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/utils/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    {
      url: absoluteUrl("/"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: absoluteUrl("/charts"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: absoluteUrl("/login"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.4,
    },
  ];
}
