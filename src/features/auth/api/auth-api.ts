import { apiFetch, API_ROUTES, clearApiAccessToken, refreshAccessToken } from "@/features/api";
import type { AuthUser, RefreshResponse } from "../types";

type GoogleLoginOptions = {
  portal?: "admin";
  turnstileToken?: string;
};

type PasswordLoginInput = {
  email: string;
  password: string;
  turnstileToken?: string;
};

type RegistrationInput = {
  name: string;
  email: string;
  password: string;
  turnstileToken?: string;
};

type RegistrationVerificationInput = {
  verificationId: string;
  code: string;
};

type RegistrationResendInput = {
  verificationId: string;
};

export type RegistrationChallenge = {
  verificationId: string;
  expiresAt: string;
  resendAvailableAt: string;
};

export async function getGoogleLoginUrl(options: GoogleLoginOptions = {}) {
  return apiFetch<{ url: string }>(API_ROUTES.auth.googleUrl(options.portal), {
    headers: options.turnstileToken
      ? { "x-turnstile-token": options.turnstileToken }
      : undefined,
    skipAuthRefresh: true,
  });
}

export async function startGoogleLogin(options: GoogleLoginOptions = {}) {
  const { url } = await getGoogleLoginUrl(options);
  window.location.href = url;
}

export async function loginWithPassword(input: PasswordLoginInput) {
  return apiFetch<RefreshResponse>(API_ROUTES.auth.login, {
    method: "POST",
    body: JSON.stringify(input),
    skipAuthRefresh: true,
  });
}

export async function requestRegistration(input: RegistrationInput) {
  return apiFetch<RegistrationChallenge>(API_ROUTES.auth.register, {
    method: "POST",
    body: JSON.stringify(input),
    skipAuthRefresh: true,
  });
}

export async function verifyRegistration(input: RegistrationVerificationInput) {
  return apiFetch<RefreshResponse>(API_ROUTES.auth.registerVerify, {
    method: "POST",
    body: JSON.stringify(input),
    skipAuthRefresh: true,
  });
}

export async function resendRegistration(input: RegistrationResendInput) {
  return apiFetch<RegistrationChallenge>(API_ROUTES.auth.registerResend, {
    method: "POST",
    body: JSON.stringify(input),
    skipAuthRefresh: true,
  });
}

export async function refreshSession() {
  const payload = await refreshAccessToken();
  return payload as RefreshResponse;
}

export async function getCurrentAuthUser() {
  const { user } = await apiFetch<{ user: AuthUser }>(API_ROUTES.auth.me);
  return user;
}

export async function logout() {
  try {
    await apiFetch<{ ok: boolean }>(API_ROUTES.auth.logout, {
      method: "POST",
      skipAuthRefresh: true,
    });
  } finally {
    clearApiAccessToken();
  }
}
