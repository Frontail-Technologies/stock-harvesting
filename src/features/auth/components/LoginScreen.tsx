"use client";

import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/ui/brand-logo";
import { Spinner } from "@/components/ui/spinner";
import { ApiError } from "@/features/api";
import {
  useGoogleLogin,
  usePasswordLogin,
  useRegistrationRequest,
  useRegistrationResend,
  useRegistrationVerify,
} from "../hooks/use-auth";
import { useAuthFlow } from "../hooks/use-auth-flow";
import { useAuthTurnstile } from "../hooks/use-auth-turnstile";
import type { LoginFormValues } from "../schemas/login.schema";
import type { OtpFormValues } from "../schemas/otp.schema";
import type { RegisterFormValues } from "../schemas/register.schema";
import { AuthLayout } from "./AuthLayout";
import { LoginForm } from "./LoginForm";
import { OtpForm } from "./OtpForm";
import { RegisterForm } from "./RegisterForm";
import { TurnstileChallenge } from "./turnstile";

function readErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) return error.message || fallback;
  return fallback;
}

export function LoginScreen() {
  const router = useRouter();
  const flow = useAuthFlow();
  const {
    ref: turnstileRef,
    action: turnstileAction,
    token: turnstileToken,
    setToken: setTurnstileToken,
    missing: turnstileMissing,
    reset: resetTurnstile,
    activate: activateTurnstile,
    ensureReady: ensureTurnstileReady,
  } = useAuthTurnstile("user-password-login");

  const googleLogin = useGoogleLogin();
  const passwordLogin = usePasswordLogin();
  const registrationRequest = useRegistrationRequest();
  const registrationVerify = useRegistrationVerify();
  const registrationResend = useRegistrationResend();

  const pending =
    googleLogin.isPending ||
    passwordLogin.isPending ||
    registrationRequest.isPending ||
    registrationVerify.isPending ||
    registrationResend.isPending;

  async function handleGoogleClick() {
    flow.clearError();
    const gate = ensureTurnstileReady("user-google-login");
    if (!gate.ready) {
      if (gate.error) flow.reportError(gate.error);
      return;
    }
    try {
      await googleLogin.mutateAsync({ turnstileToken: turnstileToken ?? undefined });
    } catch {
      resetTurnstile();
      flow.reportError("Google login is not available. Please check backend auth setup.");
    }
  }

  async function handleLoginSubmit(values: LoginFormValues) {
    flow.clearError();
    const gate = ensureTurnstileReady("user-password-login");
    if (!gate.ready) {
      if (gate.error) flow.reportError(gate.error);
      return;
    }
    try {
      await passwordLogin.mutateAsync({
        email: values.email,
        password: values.password,
        turnstileToken: turnstileToken ?? undefined,
      });
      router.replace("/dashboard");
    } catch (error) {
      resetTurnstile();
      flow.reportError(readErrorMessage(error, "Invalid email or password."));
    }
  }

  async function handleRegisterSubmit(values: RegisterFormValues) {
    flow.clearError();
    const gate = ensureTurnstileReady("user-register");
    if (!gate.ready) {
      if (gate.error) flow.reportError(gate.error);
      return;
    }
    try {
      const verification = await registrationRequest.mutateAsync({
        name: values.name,
        email: values.email,
        password: values.password,
        turnstileToken: turnstileToken ?? undefined,
      });
      resetTurnstile();
      flow.beginOtpVerification({
        verificationId: verification.verificationId,
        name: values.name,
        email: values.email,
      });
    } catch (error) {
      resetTurnstile();
      flow.reportError(readErrorMessage(error, "Unable to create account. Please try again."));
    }
  }

  async function handleOtpSubmit(values: OtpFormValues) {
    flow.clearError();
    if (!flow.pendingRegistration) return;
    try {
      await registrationVerify.mutateAsync({
        verificationId: flow.pendingRegistration.verificationId,
        code: values.code,
      });
      router.replace("/dashboard");
    } catch (error) {
      flow.reportError(readErrorMessage(error, "Invalid verification code."));
    }
  }

  async function handleResend(): Promise<boolean> {
    if (!flow.pendingRegistration) return false;
    flow.clearError();
    try {
      await registrationResend.mutateAsync({
        verificationId: flow.pendingRegistration.verificationId,
      });
      return true;
    } catch (error) {
      flow.reportError(readErrorMessage(error, "Unable to resend code."));
      return false;
    }
  }

  function handleSwitchToRegister() {
    flow.switchMode("register");
    activateTurnstile("user-register");
  }

  function handleSwitchToLogin() {
    flow.switchMode("login");
    activateTurnstile("user-password-login");
  }

  function activateLoginField() {
    activateTurnstile("user-password-login");
  }

  function activateRegisterField() {
    activateTurnstile("user-register");
  }

  if (flow.status !== "guest") {
    return (
      <div className="grid min-h-dvh place-items-center bg-landing-bg px-4">
        {flow.showChecking && (
          <div className="flex items-center gap-2 rounded-lg border border-landing-border bg-landing-fg/5 px-4 py-3 text-[13px] font-medium text-landing-text-strong">
            <Spinner size="sm" />
            Checking session...
          </div>
        )}
      </div>
    );
  }

  const { mode } = flow;

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
        {mode === "register"
          ? "Create your account"
          : mode === "otp"
            ? "Verify your email"
            : "Welcome back"}
      </h1>
      <p className="mt-1.5 text-[13px] leading-6 text-landing-text-secondary">
        {mode === "otp"
          ? `We've sent a verification code to ${flow.pendingRegistration?.email || "your email"}.`
          : "Continue to your Stock Harvesting workspace."}
      </p>

      {mode !== "otp" && (
        <TurnstileChallenge
          key={turnstileAction}
          ref={turnstileRef}
          action={turnstileAction}
          className="mt-4 max-w-full overflow-hidden"
          onTokenChange={setTurnstileToken}
        />
      )}

      {mode === "login" && (
        <LoginForm
          pending={pending}
          turnstileMissing={turnstileMissing}
          onFieldFocus={activateLoginField}
          onSubmit={handleLoginSubmit}
          isSubmitting={passwordLogin.isPending}
          onGoogleClick={handleGoogleClick}
          isGoogleSubmitting={googleLogin.isPending}
          onSwitchToRegister={handleSwitchToRegister}
        />
      )}

      {mode === "register" && (
        <RegisterForm
          pending={pending}
          turnstileMissing={turnstileMissing}
          onFieldFocus={activateRegisterField}
          onSubmit={handleRegisterSubmit}
          isSubmitting={registrationRequest.isPending}
          onGoogleClick={handleGoogleClick}
          isGoogleSubmitting={googleLogin.isPending}
          onSwitchToLogin={handleSwitchToLogin}
          defaultValues={
            flow.pendingRegistration
              ? { name: flow.pendingRegistration.name, email: flow.pendingRegistration.email }
              : undefined
          }
        />
      )}

      {mode === "otp" && (
        <OtpForm
          pending={pending}
          isSubmitting={registrationVerify.isPending}
          isResending={registrationResend.isPending}
          onSubmit={handleOtpSubmit}
          onResend={handleResend}
        />
      )}

      {flow.error && (
        <p className="mt-4 rounded-lg border border-landing-border bg-landing-fg/5 px-3 py-2 text-center text-[13px] text-landing-text-body">
          {flow.error}
        </p>
      )}

      {mode === "otp" && (
        <button
          type="button"
          className="mt-4 w-full cursor-pointer text-center text-[13px] font-semibold text-landing-text-secondary hover:text-landing-fg"
          onClick={handleSwitchToRegister}
        >
          Change details
        </button>
      )}
    </AuthLayout>
  );
}
