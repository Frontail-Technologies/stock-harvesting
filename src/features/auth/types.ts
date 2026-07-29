export type UserRole = "user" | "admin";
export type UserPlan = "free" | "pro";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  role: UserRole;
  plan: UserPlan;
};

export type RefreshResponse = {
  accessToken: string;
  user: AuthUser;
};

export type AuthStatus = "unknown" | "authenticated" | "guest";
