"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { BrandLogo } from "@/components/ui/brand-logo";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ApiError } from "@/features/api";
import { useConfirmPasswordReset } from "../hooks/use-auth";
import {
  resetPasswordFieldRules,
  type ResetPasswordFormValues,
} from "../schemas/reset-password.schema";
import { AuthLayout } from "./AuthLayout";
import { PasswordField } from "./PasswordField";

function readErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) return error.message || fallback;
  return fallback;
}

export function ResetPasswordScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const confirmPasswordReset = useConfirmPasswordReset();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({ defaultValues: { password: "", confirmPassword: "" } });

  async function onSubmit(values: ResetPasswordFormValues) {
    setError(null);
    if (values.password !== values.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!token) {
      setError("This reset link is invalid or has expired.");
      return;
    }
    try {
      await confirmPasswordReset.mutateAsync({ token, password: values.password });
      setDone(true);
    } catch (submitError) {
      setError(readErrorMessage(submitError, "This reset link is invalid or has expired."));
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

      <h1 className="mt-5 text-xl font-bold tracking-tight text-landing-fg">
        {done ? "Password reset" : "Set a new password"}
      </h1>

      {done ? (
        <>
          <p className="mt-1.5 text-[13px] leading-6 text-landing-text-secondary">
            Your password has been reset. You can now sign in with your new password.
          </p>
          <Button
            type="button"
            className="mt-5 h-10 w-full cursor-pointer text-[13px] font-bold"
            onClick={() => router.replace("/login")}
          >
            Back to sign in
          </Button>
        </>
      ) : !token ? (
        <p className="mt-4 rounded-lg border border-landing-border bg-landing-fg/5 px-3 py-2.5 text-center text-[13px] text-landing-text-body">
          This reset link is invalid or has expired.
        </p>
      ) : (
        <form className="mt-5 space-y-2.5" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div>
            <PasswordField
              placeholder="New password"
              autoComplete="new-password"
              className="h-10 px-3 text-sm"
              toggleClassName="text-landing-text-secondary hover:bg-landing-fg/10 hover:text-landing-fg"
              {...register("password", resetPasswordFieldRules.password)}
            />
            {errors.password && (
              <p className="mt-1 text-[11px] text-destructive">{errors.password.message}</p>
            )}
          </div>

          <div>
            <PasswordField
              placeholder="Confirm new password"
              autoComplete="new-password"
              className="h-10 px-3 text-sm"
              toggleClassName="text-landing-text-secondary hover:bg-landing-fg/10 hover:text-landing-fg"
              {...register("confirmPassword", resetPasswordFieldRules.confirmPassword)}
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-[11px] text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="h-10 w-full cursor-pointer text-[13px] font-bold"
            disabled={confirmPasswordReset.isPending}
          >
            {confirmPasswordReset.isPending ? <Spinner size="sm" /> : null}
            Reset password
          </Button>
        </form>
      )}

      {error && (
        <p className="mt-4 rounded-lg border border-landing-border bg-landing-fg/5 px-3 py-2 text-center text-[13px] text-landing-text-body">
          {error}
        </p>
      )}

      {!done && (
        <p className="mt-4 text-center text-[13px] text-landing-text-secondary">
          <Link
            href="/login"
            className="cursor-pointer font-semibold text-landing-fg underline-offset-4 hover:text-brand-gold hover:underline"
          >
            Back to sign in
          </Link>
        </p>
      )}
    </AuthLayout>
  );
}
