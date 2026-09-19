import { AdminAnalyticsPage, AdminShell } from "@/features/admin";
import { createAdminMetadata } from "../admin-metadata";

export const metadata = createAdminMetadata("Analytics");

export default function AdminAnalyticsRoute() {
  return (
    <AdminShell>
      <AdminAnalyticsPage />
    </AdminShell>
  );
}
