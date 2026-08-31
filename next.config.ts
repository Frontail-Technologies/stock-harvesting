import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Scanner -> Charts product rename. A framework-level redirect (not a
  // page-level `redirect()` call) so it's the canonical, permanent (308)
  // migration path: checked before the filesystem/page resolution, works
  // for every old /scanner?... link regardless of how it was reached
  // (bookmark, shared URL, browser history), and - per Next's own
  // documented behavior - automatically forwards every query param not
  // named in `source` (symbol, exchange, watchlist, any future
  // share/tracking param) through to the destination untouched. No
  // application code needs to parse/reconstruct the query string for
  // this to work correctly.
  async redirects() {
    return [
      {
        source: "/scanner",
        destination: "/charts",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
