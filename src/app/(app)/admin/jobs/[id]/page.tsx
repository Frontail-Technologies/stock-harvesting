import { AdminShell } from "@/features/admin";
import { AdminMarketDataJobDetailPage } from "@/features/admin/components/market-data/AdminMarketDataJobDetailPage";
import { createAdminMetadata } from "../../admin-metadata";

export const metadata = createAdminMetadata("Market Data Job");

export default async function AdminMarketDataJobRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <AdminShell>
      <AdminMarketDataJobDetailPage jobId={id} />
    </AdminShell>
  );
}
