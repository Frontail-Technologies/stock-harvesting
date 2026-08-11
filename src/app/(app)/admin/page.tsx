import { redirect } from "next/navigation";
import { createAdminMetadata } from "./admin-metadata";

export const metadata = createAdminMetadata("Admin");

export default function AdminPage() {
  redirect("/admin/users");
}
