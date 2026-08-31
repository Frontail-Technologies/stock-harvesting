export const RESOLVED_PATHNAME_HEADER = "x-resolved-pathname";

export function normalizeHost(value: string): string {
  return value.trim().toLowerCase();
}

export function resolveRequestHost(headersLike: { get(name: string): string | null }): string {
  const forwarded = headersLike.get("x-forwarded-host");
  const raw = forwarded || headersLike.get("host") || "";

  const first = raw.split(",")[0] ?? "";
  return normalizeHost(first);
}
