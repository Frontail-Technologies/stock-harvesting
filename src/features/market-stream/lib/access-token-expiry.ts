const REFRESH_SKEW_MS = 30_000;

export function isAccessTokenExpiring(
  token: string,
  now = Date.now(),
  skewMs = REFRESH_SKEW_MS
) {
  try {
    const payloadPart = token.split(".")[1];
    if (!payloadPart) return true;

    const base64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const payload = JSON.parse(atob(padded)) as { exp?: unknown };

    return typeof payload.exp !== "number" || payload.exp * 1000 <= now + skewMs;
  } catch {
    return true;
  }
}
