// Shared between src/proxy.ts (edge runtime) and src/app/layout.tsx (RSC) so
// both agree on exactly one definition of "what host did this request
// arrive on." Kept dependency-free (no next/server, no next/headers types)
// so it works unchanged in both runtimes.

// A response header the proxy sets to the pathname it actually resolved a
// request to (after any admin-host rewrite). Root layout reads this back to
// verify hostname routing actually ran, rather than trusting that it did.
export const RESOLVED_PATHNAME_HEADER = "x-resolved-pathname";

// Lowercase + trim only. Deliberately does NOT strip the port: dev relies on
// the port to distinguish "admin.localhost:3000" from "admin.localhost:3001",
// and production hostnames don't carry one, so stripping would only hide a
// real mismatch rather than fix one.
export function normalizeHost(value: string): string {
  return value.trim().toLowerCase();
}

// A reverse proxy terminating TLS in front of this app (see
// docs/DEPLOYMENT.md — no reverse-proxy config is checked into this repo,
// so its exact behavior can't be verified here) commonly forwards the
// original client-facing hostname via X-Forwarded-Host while the raw Host
// header it sends to this process is its own internal address. Prefer
// X-Forwarded-Host when present so hostname routing still works behind that
// kind of proxy instead of silently comparing against the wrong value.
export function resolveRequestHost(headersLike: { get(name: string): string | null }): string {
  const forwarded = headersLike.get("x-forwarded-host");
  const raw = forwarded || headersLike.get("host") || "";
  // X-Forwarded-Host can be a comma-separated list when multiple proxies
  // are chained — the original client-facing host is always the first.
  const first = raw.split(",")[0] ?? "";
  return normalizeHost(first);
}
