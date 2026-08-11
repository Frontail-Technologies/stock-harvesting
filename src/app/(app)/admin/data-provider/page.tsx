import { AdminDataProviderPage, AdminShell } from "@/features/admin";
import { createAdminMetadata } from "../admin-metadata";

export const metadata = createAdminMetadata("Data Provider");

export default function AdminDataProviderRoute() {
  return (
    <AdminShell>
      <AdminDataProviderPage />
    </AdminShell>
  );
}
