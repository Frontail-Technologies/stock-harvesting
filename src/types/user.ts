export type UserPlan = "Free" | "Pro" | "Enterprise";

export type UserProfile = {
  name: string;
  email: string;
  plan: UserPlan;
  renewsOn: string;
  avatarInitials: string;
};

export type UsageStats = {
  dailyScanLimit: number;
  scansUsedToday: number;
  savedSignals: number;
  activeAlerts: number;
  apiAccessEnabled: boolean;
};
