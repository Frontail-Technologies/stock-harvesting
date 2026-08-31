import { redirect } from "next/navigation";
import { AdminShell, AdminUsersPage } from "@/features/admin";
import { getAdminHost } from "@/utils/seo";
import { createAdminMetadata } from "./admin-metadata";

export const metadata = createAdminMetadata("Admin");

export default function AdminPage() {
  if (!getAdminHost()) redirect("/admin/users");

  return (
    <AdminShell>
      <AdminUsersPage />
    </AdminShell>
  );
}
