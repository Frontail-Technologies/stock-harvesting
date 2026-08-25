import { AdminLoginScreen } from "@/features/auth";
import { createAdminMetadata } from "../admin-metadata";

export const metadata = createAdminMetadata("Admin Login");

export default function AdminLoginRoute() {
  return <AdminLoginScreen />;
}
