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
