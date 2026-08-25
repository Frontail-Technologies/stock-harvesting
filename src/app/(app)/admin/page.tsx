import { redirect } from "next/navigation";
import { AdminShell, AdminUsersPage } from "@/features/admin";
import { getAdminHost } from "@/utils/seo";
import { createAdminMetadata } from "./admin-metadata";

export const metadata = createAdminMetadata("Admin");

// On the admin host, this is the dashboard root - a successful admin login
// lands here at the bare origin, and it must stay there (not hop to
// /users) so the browser URL is exactly https://admin.<host>, not
// .../admin or .../users. Without host separation configured, "/admin" is
// just a path within the main app, so the old redirect-to-Users behavior
// is unchanged there.
export default function AdminPage() {
  if (!getAdminHost()) redirect("/admin/users");

  return (
    <AdminShell>
      <AdminUsersPage />
    </AdminShell>
  );
}
