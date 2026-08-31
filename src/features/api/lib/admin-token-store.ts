// Strict portal separation - a completely separate in-memory slot from
// token-store.ts's user-portal access token. Kept as its own tiny module
// (not a parameter on the shared store) so the ADMIN portal's access
// token can never be read or overwritten by USER-portal code, and vice
// versa, even though both run from the same JS bundle.
let adminAccessToken: string | null = null;

export function getAdminApiAccessToken() {
  return adminAccessToken;
}

export function setAdminApiAccessToken(token: string | null) {
  adminAccessToken = token;
}

export function clearAdminApiAccessToken() {
  adminAccessToken = null;
}
