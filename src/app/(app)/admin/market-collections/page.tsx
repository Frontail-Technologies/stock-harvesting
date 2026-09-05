import { AdminShell } from "@/features/admin";
import { AdminMarketCollectionsPage } from "@/features/admin/components/collections/AdminMarketCollectionsPage";
import { createAdminMetadata } from "../admin-metadata";

export const metadata = createAdminMetadata("Segments");

export default function AdminMarketCollectionsRoute() {
  return (
    <AdminShell>
      <AdminMarketCollectionsPage />
    </AdminShell>
  );
}
