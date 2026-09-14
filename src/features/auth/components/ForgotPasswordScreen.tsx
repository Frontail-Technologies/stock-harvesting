"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { BrandLogo } from "@/components/ui/brand-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { ApiError } from "@/features/api";
import { useRequestPasswordReset } from "../hooks/use-auth";
import { useAuthTurnstile } from "../hooks/use-auth-turnstile";
import {
  forgotPasswordFieldRules,
  type ForgotPasswordFormValues,
} from "../schemas/forgot-password.schema";
import { AuthLayout } from "./AuthLayout";
import { TurnstileChallenge } from "./turnstile";

function readErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) return error.message || fallback;
  return fallback;
}

export function ForgotPasswordScreen() {
  const requestPasswordReset = useRequestPasswordReset();
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {
    ref: turnstileRef,
    action: turnstileAction,
    token: turnstileToken,
    setToken: setTurnstileToken,
    missing: turnstileMissing,
    reset: resetTurnstile,
    ensureReady: ensureTurnstileReady,
  } = useAuthTurnstile("user-password-reset-request");
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({ defaultValues: { email: "" } });

  async function onSubmit(values: ForgotPasswordFormValues) {
    setError(null);
    const gate = ensureTurnstileReady("user-password-reset-request");
    if (!gate.ready) {
      if (gate.error) setError(gate.error);
      return;
    }
    try {
      await requestPasswordReset.mutateAsync({
        email: values.email,
        turnstileToken: turnstileToken ?? undefined,
      });
      resetTurnstile();
      setSubmitted(true);
    } catch (submitError) {
      resetTurnstile();
      setError(readErrorMessage(submitError, "Unable to send reset link. Please try again."));
    }
  }

  return (
    <AuthLayout>
      <div className="max-w-full overflow-hidden">
        <BrandLogo
          size="sm"
          className="h-10 gap-1.5 sm:h-12 sm:gap-2"
          markClassName="h-10 sm:h-12"
          textClassName="text-[1.45rem] min-[390px]:text-[1.55rem] min-[430px]:text-[1.8rem] sm:text-2xl"
        />
      </div>

      <h1 className="mt-5 text-xl font-bold tracking-tight text-landing-fg">Reset your password</h1>
      <p className="mt-1.5 text-[13px] leading-6 text-landing-text-secondary">
        Enter the email on your account and we&apos;ll send you a link to reset your password.
      </p>

      {submitted ? (
        <p className="mt-5 rounded-lg border border-landing-border bg-landing-fg/5 px-3 py-2.5 text-center text-[13px] text-landing-text-body">
          If an account exists for this email, a password reset link has been sent.
        </p>
      ) : (
        <form className="mt-5 space-y-2.5" onSubmit={handleSubmit(onSubmit)} noValidate>
          <TurnstileChallenge
            key={turnstileAction}
            ref={turnstileRef}
            action={turnstileAction}
            className="max-w-full overflow-hidden"
            onTokenChange={setTurnstileToken}
          />

          <div>
            <Input
              type="email"
              placeholder="Email"
              autoComplete="email"
              className="h-10 px-3 text-sm"
              {...register("email", forgotPasswordFieldRules.email)}
            />
            {errors.email && (
              <p className="mt-1 text-[11px] text-destructive">{errors.email.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="h-10 w-full cursor-pointer text-[13px] font-bold"
            disabled={requestPasswordReset.isPending || turnstileMissing}
          >
            {requestPasswordReset.isPending ? <Spinner size="sm" /> : null}
            Send reset link
          </Button>
        </form>
      )}

      {error && (
        <p className="mt-4 rounded-lg border border-landing-border bg-landing-fg/5 px-3 py-2 text-center text-[13px] text-landing-text-body">
          {error}
        </p>
      )}

      <p className="mt-4 text-center text-[13px] text-landing-text-secondary">
        <Link
          href="/login"
          className="cursor-pointer font-semibold text-landing-fg underline-offset-4 hover:text-brand-gold hover:underline"
        >
          Back to sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
