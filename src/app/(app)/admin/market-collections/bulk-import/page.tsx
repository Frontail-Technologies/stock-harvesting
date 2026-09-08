import { AdminShell } from "@/features/admin";
import { AdminBulkImportPage } from "@/features/admin/components/collections/bulk-import/AdminBulkImportPage";
import { createAdminMetadata } from "../../admin-metadata";

export const metadata = createAdminMetadata("Bulk Import");

export default function AdminBulkImportCollectionsRoute() {
  return (
    <AdminShell>
      <AdminBulkImportPage />
    </AdminShell>
  );
}
