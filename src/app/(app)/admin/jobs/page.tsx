import { redirect } from "next/navigation";
import { createAdminMetadata } from "../admin-metadata";

export const metadata = createAdminMetadata("Admin Jobs");

export default function AdminJobsRoute() {
  redirect("/admin/users");
}
