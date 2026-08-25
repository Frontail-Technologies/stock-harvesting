export const SITE_NAME = "Stock Harvesting";
export const SITE_DESCRIPTION =
  "A market scanner and charting workspace for reviewing stocks, weekly strength, scan signals, and chart annotations.";

export function getSiteUrl() {
  const rawUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!rawUrl) return new URL("http://localhost:3000");

  try {
    return new URL(rawUrl);
  } catch {
    return new URL("http://localhost:3000");
  }
}

export function absoluteUrl(path = "/") {
  return new URL(path, getSiteUrl()).toString();
}

// Host (not URL) that serves the admin panel, e.g. "admin.example.com" — see
// src/proxy.ts. Null when unset, which keeps /admin on the main host.
export function getAdminHost() {
  return process.env.NEXT_PUBLIC_ADMIN_HOST?.trim() || null;
}

export function getAdminOrigin() {
  const adminHost = getAdminHost();
  return adminHost ? `${getSiteUrl().protocol}//${adminHost}` : null;
}

// Maps an internal Next.js route (e.g. "/admin/users") to the URL that
// should actually appear in the browser. When the admin panel is split
// onto its own host, src/proxy.ts rewrites every non-"/admin" path there
// into "/admin/..." internally - the "/admin" prefix must never be
// user-visible, so links/redirects inside the admin app should target the
// stripped form ("/users") and let the rewrite map it back. Without host
// separation configured, "/admin/..." is the real (only) path, so it's
// returned unchanged - this keeps the no-NEXT_PUBLIC_ADMIN_HOST local-dev
// mode working exactly as before.
export function adminPath(internalPath: string): string {
  if (!getAdminHost()) return internalPath;
  if (internalPath === "/admin") return "/";
  if (internalPath.startsWith("/admin/")) return internalPath.slice("/admin".length);
  return internalPath;
}
