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
  const user = useSessionStore((state) => state.user);

  const isBlockedAdminAccount = status === "authenticated" && user?.role === "admin";

  const showSpinner = useDelayedFlag(status !== "authenticated");

  useEffect(() => {
    if (status !== "guest" && !isBlockedAdminAccount) return;

    const currentPath = `${pathname}${window.location.search}`;
    const params = new URLSearchParams();
    params.set("next", currentPath);
    const loginPath = `/login?${params.toString()}`;

    router.replace(loginPath);
  }, [isBlockedAdminAccount, pathname, router, status]);

  if (status !== "authenticated" || isBlockedAdminAccount) {
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
