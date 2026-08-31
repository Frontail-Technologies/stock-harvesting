"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { BrandLogo } from "@/components/ui/brand-logo";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useDelayedFlag } from "@/hooks/use-delayed-flag";
import { cn } from "@/utils/cn";
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

const SIGNAL_NOISE = Array.from({ length: 42 }, (_, i) => {
  const col = i % 6;
  const row = Math.floor(i / 6);
  return {
    x: 40 + col * 76 + Math.sin(i * 11.3) * 16,
    y: 20 + row * 50 + Math.cos(i * 6.1) * 14,
    size: 2 + ((i * 5) % 3),
    opacity: 0.07 + ((i * 3) % 6) * 0.03,
  };
});

const SIGNAL_PATHS = [
  "M100 40 C 140 160, 160 280, 190 400",
  "M400 50 C 360 170, 330 280, 300 400",
];

const FIELD_STALKS = Array.from({ length: 30 }, (_, i) => {
  const col = i % 6;
  const row = Math.floor(i / 6);
  const groundY = 458 + row * 72 + Math.sin(i * 3.7) * 10;
  const height = 34 + ((i * 7) % 26);
  const x = 56 + col * 76 + Math.cos(i * 2.9) * 10;
  return { x, groundY, topY: groundY - height };
});

const MATURE_STALK_INDEXES = new Set([1, 3, 8, 10, 12]);

const FIELD_ROW_LINES = [458, 530, 602, 674, 746].map(
  (y, i) => `M16 ${y} Q 250 ${y + (i % 2 === 0 ? 7 : -7)} 484 ${y}`,
);

function GrainHead({
  x,
  y,
  mature,
  delay,
}: {
  x: number;
  y: number;
  mature: boolean;
  delay: number;
}) {
  const armLength = mature ? 7 : 5;
  const strokeColor = mature ? "rgb(245 184 0 / 0.55)" : "var(--landing-diagram-secondary)";
  const arms = mature
    ? [
        [x, y, x - armLength, y - armLength * 0.7],
        [x, y, x + armLength, y - armLength * 0.7],
        [x, y, x, y - armLength],
      ]
    : [
        [x, y, x - armLength, y - armLength * 0.6],
        [x, y, x + armLength, y - armLength * 0.6],
      ];

  const content = (
    <g filter={mature ? "url(#signal-grain-glow)" : undefined}>
      {arms.map(([x1, y1, x2, y2], idx) => (
        <line
          key={idx}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={strokeColor}
          strokeWidth={mature ? 1.25 : 1}
        />
      ))}
      <circle cx={x} cy={y} r={mature ? 3 : 2} fill={mature ? "var(--brand-gold)" : "var(--landing-diagram-secondary)"} />
    </g>
  );

  if (!mature) return content;

  return (
    <motion.g
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay }}
      style={{ transformOrigin: `${x}px ${y}px` }}
    >
      {content}
    </motion.g>
  );
}

function SignalHarvestIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 500 900"
      preserveAspectRatio="xMidYMid slice"
      className={cn("absolute inset-0 h-full w-full", className)}
      aria-hidden="true"
    >
      <defs>
        <filter id="signal-grain-glow" x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {SIGNAL_PATHS.map((d, i) => (
        <motion.path
          key={d}
          d={d}
          stroke="var(--landing-diagram-secondary)"
          strokeWidth="1"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2.2, delay: 0.3 + i * 0.3, ease: "easeInOut" }}
        />
      ))}

      {SIGNAL_NOISE.map((p) => (
        <rect
          key={`${p.x}-${p.y}`}
          x={p.x}
          y={p.y}
          width={p.size}
          height={p.size}
          fill={`rgb(var(--landing-fg-rgb) / calc(${p.opacity} * var(--landing-noise-scale)))`}
        />
      ))}

      {FIELD_ROW_LINES.map((d) => (
        <path key={d} d={d} stroke="var(--landing-grid-line)" strokeWidth="1" fill="none" />
      ))}

      {FIELD_STALKS.map((s, i) => {
        const mature = MATURE_STALK_INDEXES.has(i);
        return (
          <g key={`${s.x}-${s.groundY}`}>
            <line
              x1={s.x}
              y1={s.groundY}
              x2={s.x}
              y2={s.topY}
              stroke={mature ? "rgb(245 184 0 / 0.4)" : "var(--landing-diagram-faint)"}
              strokeWidth="1"
            />
            <GrainHead x={s.x} y={s.topY} mature={mature} delay={1.1 + i * 0.05} />
          </g>
        );
      })}
    </svg>
  );
}

const GENERIC_LOGIN_ERROR = "Invalid email or password.";

export function LoginScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const googleLogin = useGoogleLogin();
  const status = useSessionStore((state) => state.status);
  const bootstrapResolved = useSessionStore((state) => state.bootstrapResolved);
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
    const validNext =
      nextPath &&
      nextPath.startsWith("/") &&
      !nextPath.startsWith("//") &&
      !nextPath.startsWith("/login") &&
      !nextPath.startsWith("/admin");
    const target = validNext ? nextPath : "/charts";

    router.replace(target);
  }, [bootstrapResolved, router, status]);

  async function handleGoogleLogin() {
    setHandlerError(null);
    setDismissedQueryReason(true);
    try {
      await googleLogin.mutateAsync(undefined);
    } catch {
      setHandlerError(
        "Google login is not available. Please check backend auth setup.",
      );
    }
  }

  if (status !== "guest") {
    return (
      <div className="grid min-h-dvh place-items-center bg-landing-bg px-4">
        {showChecking && (
          <div className="flex items-center gap-2 rounded-lg border border-landing-border bg-landing-fg/5 px-4 py-3 text-sm font-medium text-landing-text-strong">
            <Spinner size="sm" />
            Checking session...
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="login-split bg-landing-bg">
      <div className="login-visual" aria-hidden="true">
        <div className="login-visual-grid" />
        <SignalHarvestIllustration />
      </div>

      <div className="login-auth">
        <p className="login-meta-label">Auth / Secure Access</p>

        <div className="login-visual-mobile" aria-hidden="true">
          <div className="login-visual-grid" />
          <SignalHarvestIllustration />
        </div>

        <div className="login-auth-surface">
          <BrandLogo size="md" />

          <h1 className="mt-8 text-2xl font-bold tracking-tight text-landing-fg">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-landing-text-secondary">
            Sign in to continue to your Stock Harvesting workspace.
          </p>

          <Button
            variant="outline"
            className="mt-8 h-12 w-full cursor-pointer gap-3 rounded-lg border-landing-border-strong bg-landing-fg/5 text-base font-semibold text-landing-fg shadow-sm hover:border-landing-border-strong hover:bg-landing-fg/10 disabled:cursor-not-allowed"
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
            <p className="mt-4 rounded-lg border border-landing-border bg-landing-fg/5 px-3 py-2 text-center text-sm text-landing-text-body">
              {error}
            </p>
          )}

          <div className="mt-6 border-t border-landing-border pt-4">
            <p className="text-xs text-landing-text-muted">Secure authentication via Google</p>
          </div>
        </div>
      </div>
    </div>
  );
}
