import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/utils/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        // Private pages that aren't disallowed here (e.g. /login, /charts) are kept out
        // of search with a `noindex` meta tag instead - a disallow would stop crawlers
        // from ever seeing that tag.
        allow: ["/"],
        disallow: ["/admin", "/admin/", "/dashboard", "/dashboard/", "/api/"],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
