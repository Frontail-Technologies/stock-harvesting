import { redirect } from "next/navigation";
import { adminPath } from "@/utils/seo";
import { createAdminMetadata } from "../admin-metadata";

export const metadata = createAdminMetadata("Data Providers");

export default function AdminDataProviderRoute() {
  redirect(adminPath("/admin/data-providers"));
}
