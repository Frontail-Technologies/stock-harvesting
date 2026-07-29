"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/features/api";
import { useSessionStore } from "@/features/auth";
import { getProfile } from "../api/profile-api";
import { mapAuthUserProfile, mapProfile } from "../lib/profile-mappers";

export function useProfile() {
  const authStatus = useSessionStore((state) => state.status);
  const sessionUser = useSessionStore((state) => state.user);
  const query = useQuery({
    queryKey: queryKeys.profile.current,
    queryFn: getProfile,
    enabled: authStatus === "authenticated",
    retry: false,
  });
  const user = query.data
    ? mapProfile(query.data)
    : sessionUser
    ? mapAuthUserProfile(sessionUser)
    : null;

  return {
    ...query,
    user,
    usage: query.data?.usage ?? null,
    usingSessionFallback: !query.data && Boolean(sessionUser),
  };
}
