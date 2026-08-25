"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";
import { useDelayedFlag } from "@/hooks/use-delayed-flag";
import { useSessionStore } from "../stores/session-store";

type AuthGuardProps = {
  children: React.ReactNode;
  className?: string;
};

export function AuthGuard({ children, className }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const status = useSessionStore((state) => state.status);
  // With a cached session snapshot (see session-store.ts), `status` starts
  // as "authenticated" immediately on a hard reload instead of "unknown" -
  // this already renders `children` below without waiting on the
  // background POST /refresh that useAuthBootstrap still runs to confirm
  // it. The genuinely-unresolved case (no snapshot, first-ever visit, or a
  // cleared browser) is the only path that reaches this spinner; even then,
  // resolution is usually well under 200ms, so it's only shown once the
  // check has genuinely been running for a moment.
  const showSpinner = useDelayedFlag(status !== "authenticated");

  useEffect(() => {
    if (status !== "guest") return;

    const currentPath = `${pathname}${window.location.search}`;
    const params = new URLSearchParams();
    params.set("next", currentPath);
    const loginPath = `/login?${params.toString()}`;

    // AuthGuard only ever wraps main-app pages (AppShell) - the admin panel
    // has its own guard (AdminShell). "/login" is a real route on this
    // host either way (the main app renders it directly; the admin host's
    // proxy rewrites it to the admin login), so a plain relative
    // navigation is always correct here.
    router.replace(loginPath);
  }, [pathname, router, status]);

  if (status !== "authenticated") {
    return (
      <div
        className={className ?? "grid min-h-dvh place-items-center bg-background"}
        suppressHydrationWarning
      >
        {showSpinner && (
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Spinner size="sm" />
            Checking session...
          </div>
        )}
      </div>
    );
  }

  return <>{children}</>;
}
