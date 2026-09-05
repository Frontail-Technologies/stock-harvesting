"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDelayedFlag } from "@/hooks/use-delayed-flag";
import { useSessionStore } from "../stores/session-store";

export type AuthMode = "login" | "register" | "otp";

export type PendingRegistration = {
  verificationId: string;
  name: string;
  email: string;
};

const GENERIC_LOGIN_ERROR = "Invalid email or password.";

function validNextPath(nextPath: string | null) {
  return Boolean(
    nextPath &&
      nextPath.startsWith("/") &&
      !nextPath.startsWith("//") &&
      !nextPath.startsWith("/login") &&
      !nextPath.startsWith("/admin"),
  );
}

/**
 * Cross-step orchestration only: which screen is showing, the registration
 * awaiting OTP verification, the safe post-auth redirect, and the single
 * shared error banner. Individual form fields live in each form's own RHF
 * instance, not here.
 */
export function useAuthFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const status = useSessionStore((state) => state.status);
  const bootstrapResolved = useSessionStore((state) => state.bootstrapResolved);

  const [mode, setMode] = useState<AuthMode>("login");
  const [pendingRegistration, setPendingRegistration] = useState<PendingRegistration | null>(null);
  const [handlerError, setHandlerError] = useState<string | null>(null);
  const [dismissedQueryReason, setDismissedQueryReason] = useState(false);

  const authReason = dismissedQueryReason ? null : searchParams.get("auth");
  const queryError = authReason && authReason !== "success" ? GENERIC_LOGIN_ERROR : null;
  const error = handlerError ?? queryError;
  const showChecking = useDelayedFlag(status !== "guest");

  useEffect(() => {
    if (status !== "authenticated" || !bootstrapResolved) return;

    const params = new URLSearchParams(window.location.search);
    const nextPath = params.get("next");
    const target = validNextPath(nextPath) ? nextPath! : "/dashboard";

    router.replace(target);
  }, [bootstrapResolved, router, status]);

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setHandlerError(null);
    setDismissedQueryReason(true);
  }

  function beginOtpVerification(registration: PendingRegistration) {
    setPendingRegistration(registration);
    setMode("otp");
    setHandlerError(null);
  }

  function reportError(message: string) {
    setHandlerError(message);
    setDismissedQueryReason(true);
  }

  function clearError() {
    setHandlerError(null);
  }

  return {
    status,
    mode,
    switchMode,
    pendingRegistration,
    beginOtpVerification,
    error,
    reportError,
    clearError,
    showChecking,
  };
}
