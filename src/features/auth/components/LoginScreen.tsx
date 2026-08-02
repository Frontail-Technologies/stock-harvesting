"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { DotGridBackground } from "@/components/ui/dot-grid-background";
import { BrandLogo } from "@/components/ui/brand-logo";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useGoogleLogin } from "../hooks/use-auth";
import { useSessionStore } from "../stores/session-store";

function GoogleIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20.4H24v7.2h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.1-5.1C34.5 6.2 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l5.9 4.3C13.9 15.4 18.6 12 24 12c3.1 0 5.9 1.2 8 3.1l5.1-5.1C34.5 6.2 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.4 0 10.3-2.1 14-5.5l-6.5-5.5c-2 1.4-4.6 2.3-7.5 2.3-5.3 0-9.7-3.4-11.3-8.1l-6.1 4.7C9.6 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20.4H24v7.2h11.3c-.8 2.3-2.2 4.3-4.1 5.7l6.5 5.5C41.5 36 44 30.5 44 24c0-1.3-.1-2.7-.4-3.5z"
      />
    </svg>
  );
}

export function LoginScreen() {
  const router = useRouter();
  const googleLogin = useGoogleLogin();
  const status = useSessionStore((state) => state.status);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated") {
      const params = new URLSearchParams(window.location.search);
      const nextPath = params.get("next") || "/scanner";
      const target =
        nextPath.startsWith("/") &&
        !nextPath.startsWith("//") &&
        !nextPath.startsWith("/login")
          ? nextPath
          : "/scanner";
      router.replace(target);
    }
  }, [router, status]);

  async function handleGoogleLogin() {
    setError(null);
    try {
      await googleLogin.mutateAsync();
    } catch {
      setError(
        "Google login is not available. Please check backend auth setup.",
      );
    }
  }

  if (status !== "guest") {
    return (
      <DotGridBackground
        className="grid min-h-[100dvh] place-items-center bg-[#f4f5fb] px-4 py-6 dark:bg-background"
        dotSize={1}
        gap={22}
        glowRadius={260}
      >
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm font-medium text-card-foreground shadow-sm">
          <Spinner size="sm" />
          Checking session...
        </div>
      </DotGridBackground>
    );
  }

  return (
    <DotGridBackground
      className="flex min-h-[100dvh] items-center justify-center bg-[#f4f5fb] px-4 py-6 dark:bg-background"
      dotSize={1}
      gap={22}
      glowRadius={260}
    >
      <div className="grid w-full overflow-hidden rounded-3xl border border-white/80 bg-white/90 p-2 shadow-2xl shadow-slate-200/80 backdrop-blur md:h-[min(720px,calc(100dvh-48px))] md:w-[min(1120px,calc(100vw-48px))] md:grid-cols-[1.08fr_0.92fr] dark:border-border dark:bg-card dark:shadow-black/30">
        <div className="relative hidden h-full w-full overflow-hidden rounded-2xl md:block">
          <Image
            src="/images/login/left.png"
            alt=""
            fill
            loading="eager"
            sizes="(min-width: 768px) 52vw, 0vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/45" />

          <div className="absolute left-6 right-6 top-6 flex items-center justify-between gap-4 text-white">
            <span className="text-sm font-semibold">Featured Markets</span>
            <span className="rounded-full border border-white/35 bg-white/10 px-4 py-2 text-xs font-semibold backdrop-blur">
              AI Scanner
            </span>
          </div>

          <div className="absolute bottom-6 left-6 right-6 rounded-2xl border border-white/15 bg-black/30 p-4 text-white shadow-2xl backdrop-blur-md">
            <div className="text-sm font-semibold">Market-ready insights</div>
            <p className="mt-1 max-w-sm text-xs leading-5 text-white/75">
              Scan global stocks, inspect weekly strength, and continue your
              chart review in one workspace.
            </p>
          </div>
        </div>

        <div className="flex min-h-[560px] flex-col justify-center px-6 py-10 md:min-h-0 sm:px-12 lg:px-16">
          <div className="mx-auto w-full max-w-sm">
            <div className="flex justify-center">
              <BrandLogo size="lg" />
            </div>

            <div className="mt-9 text-center">
              <h1 className="text-4xl font-bold tracking-tight text-brand-navy dark:text-foreground">
                Hi Trader
              </h1>
              <p className="mt-3 text-sm text-muted-foreground">
                Welcome to Stock Harvesting
              </p>
            </div>

            <Button
              variant="outline"
              className="mt-8 h-12 w-full cursor-pointer gap-3 rounded-lg border-slate-200 bg-white text-base font-semibold text-slate-900 shadow-sm hover:bg-slate-50 hover:text-slate-950 disabled:cursor-not-allowed dark:border-slate-200 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-50"
              onClick={handleGoogleLogin}
              disabled={googleLogin.isPending}
            >
              {googleLogin.isPending ? (
                <Spinner size="sm" />
              ) : (
                <GoogleIcon className="size-5" />
              )}
              {googleLogin.isPending ? "Connecting..." : "Continue with Google"}
            </Button>

            {error && (
              <p className="mt-4 rounded-lg border border-border bg-muted/45 px-3 py-2 text-center text-sm text-muted-foreground">
                {error}
              </p>
            )}

            <p className="mt-6 text-center text-xs leading-5 text-muted-foreground">
              Secure Google sign-in for your Stock Harvesting account.
            </p>
          </div>
        </div>
      </div>
    </DotGridBackground>
  );
}
