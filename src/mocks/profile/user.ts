import type { UsageStats, UserProfile } from "@/types/user";

export const mockUser: UserProfile = {
  name: "Rahul Sharma",
  email: "rahul.sharma@example.com",
  plan: "pro",
  renewsOn: "24 Aug 2026",
  avatarInitials: "RS",
};

export const mockUsage: UsageStats = {
  dailyScanLimit: 200,
  scansUsedToday: 68,
  savedSignals: 128,
  activeAlerts: 12,
  apiAccessEnabled: true,
};
