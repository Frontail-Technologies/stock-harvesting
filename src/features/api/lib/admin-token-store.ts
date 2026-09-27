let adminAccessToken: string | null = null;
const adminAccessTokenListeners = new Set<(token: string | null) => void>();

export function getAdminApiAccessToken() {
  return adminAccessToken;
}

export function setAdminApiAccessToken(token: string | null) {
  if (adminAccessToken === token) return;
  adminAccessToken = token;
  for (const listener of adminAccessTokenListeners) listener(token);
}

export function clearAdminApiAccessToken() {
  setAdminApiAccessToken(null);
}

export function subscribeAdminApiAccessToken(listener: (token: string | null) => void) {
  adminAccessTokenListeners.add(listener);
  return () => adminAccessTokenListeners.delete(listener);
}
