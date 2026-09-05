"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";
import { BrandLogo } from "@/components/ui/brand-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { ApiError } from "@/features/api";
import { AdminForbiddenState } from "@/features/admin/components/shell/AdminAccessState";
import { getAdminHost } from "@/utils/seo";
import { loginFieldRules, type LoginFormValues } from "../schemas/login.schema";
import { isTurnstileEnabled } from "../constants/turnstile";
import { useAdminPasswordLogin } from "../hooks/use-auth";
import { useAdminSessionStore } from "../stores/admin-session-store";
import { PasswordField } from "./PasswordField";
import { TurnstileChallenge, type TurnstileChallengeHandle } from "./turnstile";

const GENERIC_LOGIN_ERROR = "Invalid email or password.";

function readErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) return error.message || fallback;
  return fallback;
}

export function AdminLoginScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const adminLogin = useAdminPasswordLogin();
  const status = useAdminSessionStore((state) => state.status);
  const user = useAdminSessionStore((state) => state.user);
  const turnstileRef = useRef<TurnstileChallengeHandle | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [handlerError, setHandlerError] = useState<string | null>(null);
  const [dismissedQueryReason, setDismissedQueryReason] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({ defaultValues: { email: "", password: "" } });

  const authReason = dismissedQueryReason ? null : searchParams.get("auth");
  const queryError = authReason && authReason !== "success" ? GENERIC_LOGIN_ERROR : null;
  const error = handlerError ?? queryError;
  const turnstileMissing = Boolean(isTurnstileEnabled() && !turnstileToken);
  const adminHome = getAdminHost() ? "/" : "/admin";

  useEffect(() => {
    if (status !== "authenticated") return;
    if (user?.role !== "admin") return;

    const params = new URLSearchParams(window.location.search);
    const nextPath = params.get("next");
    const validNext =
      nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//") && nextPath !== "/login";

    router.replace(validNext ? nextPath : adminHome);
  }, [adminHome, router, status, user]);

  async function handleLogin(values: LoginFormValues) {
    setHandlerError(null);
    setDismissedQueryReason(true);
    try {
      if (turnstileMissing) {
        setHandlerError("Please complete browser verification first.");
        return;
      }
      await adminLogin.mutateAsync({
        email: values.email,
        password: values.password,
        turnstileToken: turnstileToken ?? undefined,
      });
      router.replace(adminHome);
    } catch (error) {
      turnstileRef.current?.reset();
      setHandlerError(readErrorMessage(error, GENERIC_LOGIN_ERROR));
    }
  }

  if (status === "unknown") {
    return (
      <div className="grid min-h-dvh place-items-center bg-background px-4">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm font-medium text-muted-foreground">
          <Spinner size="sm" />
          Checking session...
        </div>
      </div>
    );
  }

  if (status === "authenticated" && user?.role !== "admin") {
    return <AdminForbiddenState />;
  }

  return (
    <div className="grid min-h-dvh min-w-0 place-items-center overflow-x-clip bg-background px-4 py-8">
      <form
        className="w-full max-w-sm rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm sm:p-8"
        onSubmit={(event) => {
          void handleSubmit(handleLogin)(event);
        }}
        noValidate
      >
        <div className="mx-auto max-w-full overflow-hidden">
          <BrandLogo size="sm" className="mx-auto" />
        </div>

        <p className="mt-6 text-center text-sm font-medium text-muted-foreground">Login to continue</p>

        <div className="mt-6 space-y-3">
          <div>
            <Input
              type="email"
              placeholder="Email"
              autoComplete="email"
              className="h-11 px-3"
              {...register("email", loginFieldRules.email)}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>
          <div>
            <PasswordField
              placeholder="Password"
              autoComplete="current-password"
              className="h-11 px-3"
              toggleClassName="text-muted-foreground hover:bg-muted hover:text-foreground"
              {...register("password", loginFieldRules.password)}
            />
            {errors.password && (
              <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>
        </div>

        <TurnstileChallenge
          ref={turnstileRef}
          action="admin-password-login"
          className="mt-5 max-w-full overflow-hidden"
          onTokenChange={setTurnstileToken}
        />

        <Button
          type="submit"
          className="mt-6 h-11 w-full cursor-pointer"
          disabled={adminLogin.isPending || status !== "guest" || turnstileMissing}
        >
          {adminLogin.isPending ? <Spinner size="sm" /> : null}
          Login
        </Button>

        {error && (
          <p className="mt-4 rounded-lg border border-border bg-background px-3 py-2 text-center text-sm text-muted-foreground">
            {error}
          </p>
        )}
      </form>
    </div>
  );
}
