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
