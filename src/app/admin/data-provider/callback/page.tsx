import { Suspense } from "react";
import {
  AdminDataProviderCallbackPage,
  AdminShell,
} from "@/features/admin";
import { createAdminMetadata } from "../../admin-metadata";

export const metadata = createAdminMetadata("Data Provider Callback");

export default function AdminDataProviderCallbackRoute() {
  return (
    <AdminShell>
      <Suspense fallback={null}>
        <AdminDataProviderCallbackPage />
      </Suspense>
    </AdminShell>
  );
}
