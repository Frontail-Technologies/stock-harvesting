"use client";

import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { loginFieldRules, type LoginFormValues } from "../schemas/login.schema";
import { GoogleAuthButton } from "./GoogleAuthButton";
import { PasswordField } from "./PasswordField";

type LoginFormProps = {
  pending: boolean;
  turnstileMissing: boolean;
  onFieldFocus: () => void;
  onSubmit: (values: LoginFormValues) => void | Promise<void>;
  isSubmitting: boolean;
  onGoogleClick: () => void | Promise<void>;
  isGoogleSubmitting: boolean;
  onSwitchToRegister: () => void;
};

export function LoginForm({
  pending,
  turnstileMissing,
  onFieldFocus,
  onSubmit,
  isSubmitting,
  onGoogleClick,
  isGoogleSubmitting,
  onSwitchToRegister,
}: LoginFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({ defaultValues: { email: "", password: "" } });

  return (
    <>
      <form className="mt-4 space-y-2.5" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div>
          <Input
            type="email"
            placeholder="Email"
            autoComplete="email"
            className="h-10 px-3 text-sm"
            {...register("email", loginFieldRules.email)}
            onFocus={onFieldFocus}
          />
          {errors.email && (
            <p className="mt-1 text-[11px] text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div>
          <PasswordField
            placeholder="Password"
            autoComplete="current-password"
            className="h-10 px-3 text-sm"
            toggleClassName="text-landing-text-secondary hover:bg-landing-fg/10 hover:text-landing-fg"
            {...register("password", loginFieldRules.password)}
            onFocus={onFieldFocus}
          />
          {errors.password && (
            <p className="mt-1 text-[11px] text-destructive">{errors.password.message}</p>
          )}
        </div>

        <Button
          type="submit"
          className="h-10 w-full cursor-pointer text-[13px] font-bold"
          disabled={pending || turnstileMissing}
        >
          {isSubmitting ? <Spinner size="sm" /> : null}
          Login
        </Button>
      </form>

      <GoogleAuthButton
        pending={isGoogleSubmitting}
        disabled={pending || turnstileMissing}
        onClick={onGoogleClick}
      />

      <p className="mt-4 text-center text-[13px] text-landing-text-secondary">
        Don&apos;t have an account yet?{" "}
        <button
          type="button"
          className="cursor-pointer font-semibold text-landing-fg underline-offset-4 hover:text-brand-gold hover:underline"
          onClick={onSwitchToRegister}
        >
          Create one
        </button>
      </p>
    </>
  );
}
