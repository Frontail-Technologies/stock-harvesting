import { AdminMonetizationPage, AdminShell } from "@/features/admin";
import { createAdminMetadata } from "../admin-metadata";

export const metadata = createAdminMetadata("Ads");

export default function AdminAdsRoute() {
  return (
    <AdminShell>
      <AdminMonetizationPage />
    </AdminShell>
  );
}
