import { AdminShell, AdminUsersPage } from "@/features/admin";
import { createAdminMetadata } from "../admin-metadata";

export const metadata = createAdminMetadata("Admin Users");

export default function AdminUsersRoute() {
  return (
    <AdminShell>
      <AdminUsersPage />
    </AdminShell>
  );
}
