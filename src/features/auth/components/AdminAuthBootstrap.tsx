"use client";

import { useAdminAuthBootstrap } from "../hooks/use-auth";

// The ADMIN portal's own session bootstrap - mounted in the admin route's
// own layout (src/app/(app)/admin/layout.tsx), never in the root layout,
// so it only ever runs within the admin route tree and only ever talks to
// /api/admin-auth/refresh (see use-admin-auth.ts / admin-api-client.ts).
export function AdminAuthBootstrap() {
  useAdminAuthBootstrap();
  return null;
}
