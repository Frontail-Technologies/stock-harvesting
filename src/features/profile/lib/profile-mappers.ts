import type { AuthUser } from "@/features/auth";
import type { UserProfile } from "@/types/user";
import { getAvatarInitials } from "@/utils/api-client";
import type { ProfileResponse } from "../types";

export function mapProfile(profile: ProfileResponse): UserProfile {
  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    role: profile.role,
    plan: profile.plan,
    renewsOn: profile.plan === "pro" ? "Active" : "Free plan",
    avatarInitials: getAvatarInitials(profile.name, profile.email),
  };
}

export function mapAuthUserProfile(user: AuthUser): UserProfile {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    plan: user.plan,
    renewsOn: user.plan === "pro" ? "Active" : "Free plan",
    avatarInitials: getAvatarInitials(user.name, user.email),
  };
}
