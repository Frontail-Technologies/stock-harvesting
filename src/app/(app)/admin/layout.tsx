import type { ReactNode } from "react";
import { AdminAuthBootstrap } from "@/features/auth";

export default function AdminRouteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AdminAuthBootstrap />
      {children}
    </>
  );
}
