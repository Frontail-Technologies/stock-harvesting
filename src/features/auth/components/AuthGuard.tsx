"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";
import { useDelayedFlag } from "@/hooks/use-delayed-flag";
import { getAdminHost, getSiteUrl } from "@/utils/seo";
import { useSessionStore } from "../stores/session-store";

const ADMIN_HOST = getAdminHost();

type AuthGuardProps = {
  children: React.ReactNode;
  className?: string;
};

export function AuthGuard({ children, className }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const status = useSessionStore((state) => state.status);
  // Session checks usually resolve in well under 200ms — flashing a spinner
  // for that is more jarring than showing nothing, so only reveal it once
  // the check has genuinely been running for a moment.
  const showSpinner = useDelayedFlag(status !== "authenticated");

  useEffect(() => {
    if (status !== "guest") return;

    const currentPath = `${pathname}${window.location.search}`;
    const params = new URLSearchParams();
    params.set("next", currentPath);
    const loginPath = `/login?${params.toString()}`;

    // There's exactly one login page, on the main host. On the admin
    // subdomain, a relative router navigation would try to render /login
    // locally — that page doesn't exist there, so this has to be a real
    // cross-origin navigation instead of a client-side route transition.
    if (ADMIN_HOST && window.location.host === ADMIN_HOST) {
      window.location.href = `${getSiteUrl().origin}${loginPath}`;
      return;
    }

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
