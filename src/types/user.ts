export type UserPlan = "free" | "pro";

export type UserProfile = {
  id?: string;
  name: string;
  email: string;
  plan: UserPlan;
  role?: "user" | "admin";
  renewsOn?: string;
  avatarInitials: string;
};

export type UsageStats = {
  dailyScanLimit: number;
  scansUsedToday: number;
  savedSignals: number;
  activeAlerts: number;
  apiAccessEnabled: boolean;
};
