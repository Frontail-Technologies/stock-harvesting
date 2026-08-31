"use client";

import { usePathname } from "next/navigation";
import { useAuthBootstrap } from "../hooks/use-auth";

// Mounted unconditionally in the root layout (src/app/layout.tsx), which
// is shared by BOTH hostnames (the admin subdomain is proxy-rewritten to
// the internal "/admin/**" route tree, not a separate Next.js deployment -
// see proxy.ts) - so this component itself must be portal-aware (item 12).
// On an admin route, the USER portal's bootstrap must not run at all; the
// ADMIN portal's own bootstrap (AdminAuthBootstrap) is mounted separately,
// scoped to the admin route tree by its own layout.
export function AuthBootstrap() {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin") ?? false;
  useAuthBootstrap({ enabled: !isAdminRoute });
  return null;
}
