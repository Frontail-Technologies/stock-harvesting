import { redirect } from "next/navigation";
import { adminPath } from "@/utils/seo";
import { createAdminMetadata } from "../admin-metadata";

export const metadata = createAdminMetadata("Data Providers");

// Merged into the single "Data Providers" page - this URL is kept as a
// redirect (rather than deleted) so old bookmarks/links still land
// somewhere. The Zerodha OAuth callback below stays at its own fixed path.
export default function AdminDataProviderRoute() {
  redirect(adminPath("/admin/data-providers"));
}
