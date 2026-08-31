"use client";

import { usePathname } from "next/navigation";
import { useAuthBootstrap } from "../hooks/use-auth";

export function AuthBootstrap() {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin") ?? false;
  useAuthBootstrap({ enabled: !isAdminRoute });
  return null;
}
