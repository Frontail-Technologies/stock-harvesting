export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
export const REFRESH_TOKEN_TTL_DAYS = 30;
export const OAUTH_STATE_TTL_MINUTES = 10;

export const REFRESH_COOKIE_NAME = "sh_refresh";
export const OAUTH_STATE_COOKIE_NAME = "sh_oauth_state";
// Carries which portal (main site vs admin panel) started the Google OAuth
// round-trip, since Google's own "state" param already carries the CSRF
// token and mixing concerns into it would require parsing/splitting it back
// apart. Same lifetime/handling as the state cookie - set and cleared
// together, never trusted for anything security-sensitive by itself (it
// only ever picks which frontend origin to bounce back to; role
// authorization is still decided from the verified session afterward).
export const OAUTH_PORTAL_COOKIE_NAME = "sh_oauth_portal";

export const ENCRYPTION_ALGORITHM = "aes-256-gcm";
export const ENCRYPTION_IV_BYTES = 12;
