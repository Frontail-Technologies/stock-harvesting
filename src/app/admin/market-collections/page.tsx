import { redirect } from "next/navigation";
import { createAdminMetadata } from "../admin-metadata";

export const metadata = createAdminMetadata("Market Collections");

export default function AdminMarketCollectionsRoute() {
  redirect("/admin/users");
}
