import type { ReactNode } from "react";
import { AdminAuthBootstrap } from "@/features/auth";

// Scoped to the whole admin route tree (including /admin/login itself) -
// this is what makes the ADMIN portal's session bootstrap portal-aware
// (item 12): it only ever runs here, never from the root layout, and only
// ever talks to /api/admin-auth/refresh. The root layout's own
// AuthBootstrap (USER portal) explicitly skips itself on any "/admin"
// pathname instead, so the two never both fire for the same page load.
export default function AdminRouteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AdminAuthBootstrap />
      {children}
    </>
  );
}
