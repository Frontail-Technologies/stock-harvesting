import { AdminShell } from "@/features/admin";
import { AdminMarketDataPage } from "@/features/admin/components/market-data/AdminMarketDataPage";
import { createAdminMetadata } from "../admin-metadata";

export const metadata = createAdminMetadata("Market Data");

export default function AdminJobsRoute() {
  return (
    <AdminShell>
      <AdminMarketDataPage />
    </AdminShell>
  );
}
