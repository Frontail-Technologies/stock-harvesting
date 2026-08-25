import { redirect } from "next/navigation";
import { adminPath } from "@/utils/seo";
import { createAdminMetadata } from "../admin-metadata";

export const metadata = createAdminMetadata("Admin Jobs");

export default function AdminJobsRoute() {
  redirect(adminPath("/admin/users"));
}
