"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";
import { useSessionStore } from "../stores/session-store";

type AuthGuardProps = {
  children: React.ReactNode;
  className?: string;
};

export function AuthGuard({ children, className }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const status = useSessionStore((state) => state.status);

  useEffect(() => {
    if (status !== "guest") return;

    const currentPath = `${pathname}${window.location.search}`;
    const params = new URLSearchParams();
    params.set("next", currentPath);
    router.replace(`/login?${params.toString()}`);
  }, [pathname, router, status]);

  if (status !== "authenticated") {
    return (
      <div className={className ?? "grid min-h-dvh place-items-center bg-background"}>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm font-medium text-card-foreground shadow-sm">
          <Spinner size="sm" />
          Checking session...
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
