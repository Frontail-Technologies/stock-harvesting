import { AdminShell } from "@/features/admin";
import { AdminMarketCollectionDetailPage } from "@/features/admin/components/collections/AdminMarketCollectionDetailPage";
import { createAdminMetadata } from "../../admin-metadata";

export const metadata = createAdminMetadata("Market Collection");

export default async function AdminMarketCollectionDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <AdminShell>
      <AdminMarketCollectionDetailPage id={id} />
    </AdminShell>
  );
}
