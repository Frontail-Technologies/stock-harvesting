export const TURNSTILE_SITE_KEY =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? "";

// Bot verification is skipped outside production entirely - mirrors the
// backend's own dev bypass (see verifyTurnstileToken in the backend's
// turnstile service) - so a site key left in a dev/staging env can't
// accidentally force real verification while developing locally.
export function isTurnstileEnabled() {
  return process.env.NODE_ENV === "production" && Boolean(TURNSTILE_SITE_KEY);
}