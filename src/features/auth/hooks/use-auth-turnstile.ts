"use client";

import { useCallback, useRef, useState } from "react";
import { TURNSTILE_SITE_KEY } from "../constants/turnstile";
import type { TurnstileChallengeHandle } from "../components/turnstile";

export type AuthTurnstileAction =
  | "user-password-login"
  | "user-google-login"
  | "user-register"
  | "admin-password-login";

const VERIFY_FIRST_MESSAGE = "Please complete browser verification first.";

type TurnstileGateResult = { ready: boolean; error: string | null };

/**
 * Owns the single Turnstile widget shared across the login/register/google
 * flows: which action it's currently bound to, its token, and the reset
 * behavior needed whenever the caller's intended action doesn't match what
 * the widget last verified. Forms consume this only through `ensureReady`/
 * `activate` and never see the Cloudflare widget or its ref directly.
 */
export function useAuthTurnstile(initialAction: AuthTurnstileAction) {
  const ref = useRef<TurnstileChallengeHandle | null>(null);
  const [action, setAction] = useState<AuthTurnstileAction>(initialAction);
  const [token, setToken] = useState<string | null>(null);
  const required = Boolean(TURNSTILE_SITE_KEY);
  const missing = required && !token;

  const reset = useCallback((nextAction?: AuthTurnstileAction) => {
    if (nextAction) setAction(nextAction);
    setToken(null);
    ref.current?.reset();
  }, []);

  const activate = useCallback(
    (nextAction: AuthTurnstileAction) => {
      if (action === nextAction) return;
      setToken(null);
      ref.current?.reset();
      setAction(nextAction);
    },
    [action],
  );

  const ensureReady = useCallback(
    (nextAction: AuthTurnstileAction): TurnstileGateResult => {
      if (action !== nextAction) {
        activate(nextAction);
        return { ready: false, error: VERIFY_FIRST_MESSAGE };
      }
      if (missing) {
        return { ready: false, error: VERIFY_FIRST_MESSAGE };
      }
      return { ready: true, error: null };
    },
    [action, missing, activate],
  );

  return { ref, action, token, setToken, missing, reset, activate, ensureReady };
}
