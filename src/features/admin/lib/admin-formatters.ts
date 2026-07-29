import type { UserPlan, UserRole } from "@/features/auth";

export function formatAdminDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatUserRole(role: UserRole) {
  return role === "admin" ? "Admin" : "User";
}

export function formatUserPlan(plan: UserPlan) {
  return plan === "pro" ? "Pro" : "Free";
}
