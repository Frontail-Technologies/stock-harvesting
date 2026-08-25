import { AdminDataProvidersPage, AdminShell } from "@/features/admin";
import { createAdminMetadata } from "../admin-metadata";

export const metadata = createAdminMetadata("Data Providers");

export default function AdminDataProvidersRoute() {
  return (
    <AdminShell>
      <AdminDataProvidersPage />
    </AdminShell>
  );
}
