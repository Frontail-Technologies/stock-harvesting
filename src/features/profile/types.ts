import type { UsageStats } from "@/types/user";
import type { UserPlan, UserRole } from "@/features/auth";

export type ProfileResponse = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: UserRole;
  plan: UserPlan;
  usage: UsageStats;
};
