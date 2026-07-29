import { redirect } from "next/navigation";
import { createAdminMetadata } from "../../admin-metadata";

export const metadata = createAdminMetadata("Market Collection");

export default function AdminMarketCollectionDetailRoute() {
  redirect("/admin/users");
}
