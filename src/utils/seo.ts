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

export function getAdminHost() {
  return process.env.NEXT_PUBLIC_ADMIN_HOST?.trim() || null;
}

export function getAdminOrigin() {
  const adminHost = getAdminHost();
  return adminHost ? `${getSiteUrl().protocol}//${adminHost}` : null;
}

export function adminPath(internalPath: string): string {
  if (!getAdminHost()) return internalPath;
  if (internalPath === "/admin") return "/";
  if (internalPath.startsWith("/admin/")) return internalPath.slice("/admin".length);
  return internalPath;
}
