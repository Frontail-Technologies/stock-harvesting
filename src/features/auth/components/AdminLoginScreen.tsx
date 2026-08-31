"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { AdminForbiddenState } from "@/features/admin/components/shell/AdminAccessState";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { getSiteUrl } from "@/utils/seo";
import { useGoogleLogin } from "../hooks/use-auth";
import { useAdminSessionStore } from "../stores/admin-session-store";

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

// A distinct visual identity from the main LoginScreen (no marketing
// illustration, no onboarding copy) - this is a console entry point, not a
// product landing page. Role authorization is re-verified from the
// real session after auth completes; nothing here decides admin access on
// its own.
// Reason codes the backend's Google callback can redirect back here with
// (see auth.service.ts's evaluatePortalAccess / auth.routes.ts's
// redirectToLogin) - "not-admin-on-admin-portal" is the important one
// (item 5): the backend already rejected the login and created NO admin
// session at all, so this is purely a message to show, not something the
// frontend re-derives from session state.
const REJECTION_MESSAGES: Record<string, string> = {
  "not-admin-on-admin-portal": "You do not have access to the Admin Portal.",
  failed: "Google login is not available. Please try again.",
  "state-mismatch": "Your login attempt expired. Please try again.",
};

export function AdminLoginScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const googleLogin = useGoogleLogin();
  const status = useAdminSessionStore((state) => state.status);
  const user = useAdminSessionStore((state) => state.user);
  const [handlerError, setHandlerError] = useState<string | null>(null);
  const [dismissedQueryReason, setDismissedQueryReason] = useState(false);

  // Read directly from the URL on every render (via next/navigation's
  // useSearchParams) rather than copying it into state inside an effect -
  // a rejected login (item 5) means the backend already created no admin
  // session at all, it just redirected back here with a reason code.
  const authReason = dismissedQueryReason ? null : searchParams.get("auth");
  const queryError =
    authReason && authReason !== "success"
      ? (REJECTION_MESSAGES[authReason] ?? "Sign-in was not completed. Please try again.")
      : null;
  const error = handlerError ?? queryError;

  useEffect(() => {
    if (status !== "authenticated") return;
    if (user?.role !== "admin") return;

    const params = new URLSearchParams(window.location.search);
    const nextPath = params.get("next");
    const validNext =
      nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//") && nextPath !== "/login";
    // No preserved deep link: the clean root on the admin host -
    // src/proxy.ts rewrites "/" to the internal admin route tree, and the
    // admin root page renders the dashboard directly (no further
    // redirect) so the browser URL stays at the bare admin origin.
    router.replace(validNext ? nextPath : "/");
  }, [router, status, user]);

  async function handleGoogleLogin() {
    setHandlerError(null);
    setDismissedQueryReason(true);
    try {
      await googleLogin.mutateAsync("admin");
    } catch {
      setHandlerError("Google login is not available. Please check backend auth setup.");
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

  // Defense in depth only - the backend now rejects a non-admin login
  // outright (no admin session is ever created for one), so this branch
  // shouldn't be reachable in practice. Kept in case a legacy session
  // predates that enforcement.
  if (status === "authenticated" && user?.role !== "admin") {
    return <AdminForbiddenState />;
  }

  return (
    <div className="grid min-h-dvh place-items-center bg-background px-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-8 text-card-foreground shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-md border border-primary/25 bg-primary/10 text-primary">
            <ShieldCheck className="size-4.5" />
          </div>
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">
              Stock Harvesting
            </p>
            <p className="text-sm font-semibold text-foreground">Admin</p>
          </div>
        </div>

        <h1 className="mt-6 text-xl font-bold tracking-tight text-foreground">
          Administrator access
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in with an administrator account to open the console.
        </p>

        <Button
          variant="outline"
          className="mt-6 h-11 w-full cursor-pointer gap-3 rounded-lg text-sm font-semibold disabled:cursor-not-allowed"
          onClick={handleGoogleLogin}
          disabled={googleLogin.isPending || status !== "guest"}
        >
          {googleLogin.isPending ? <Spinner size="sm" /> : <GoogleIcon className="size-4.5" />}
          {googleLogin.isPending ? "Connecting..." : "Continue with Google"}
        </Button>

        {error && (
          <p className="mt-4 rounded-lg border border-border bg-background px-3 py-2 text-center text-sm text-muted-foreground">
            {error}
          </p>
        )}

        <p className="mt-6 border-t border-border pt-4 text-center text-xs text-muted-foreground">
          Not an administrator?{" "}
          <a
            href={`${getSiteUrl().origin}/login`}
            className="font-medium text-primary hover:underline"
          >
            Go to Stock Harvesting
          </a>
        </p>
      </div>
    </div>
  );
}
