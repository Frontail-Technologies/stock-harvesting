import { redirect } from "next/navigation";
import { AdminAnalyticsPage, AdminShell } from "@/features/admin";
import { getAdminHost } from "@/utils/seo";
import { createAdminMetadata } from "./admin-metadata";

export const metadata = createAdminMetadata("Admin");

export default function AdminPage() {
  if (!getAdminHost()) redirect("/admin/analytics");

  return (
    <AdminShell>
      <AdminAnalyticsPage />
    </AdminShell>
  );
}
