import { AdminAiSettingsPage, AdminShell } from "@/features/admin";
import { createAdminMetadata } from "../admin-metadata";

export const metadata = createAdminMetadata("AI Settings");

export default function AdminAiSettingsRoute() {
  return (
    <AdminShell>
      <AdminAiSettingsPage />
    </AdminShell>
  );
}
