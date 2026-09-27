"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  clearAdminApiAccessToken,
  setAdminApiAccessToken,
} from "@/features/api";
import { subscribeAdminApiAccessToken } from "@/features/api/lib/admin-token-store";
import type { AuthStatus, AuthUser } from "../types";

const ADMIN_SESSION_SNAPSHOT_STORAGE_KEY =
  "stock-harvesting-admin-session-snapshot";

type AdminSessionState = {
  accessToken: string | null;
  user: AuthUser | null;
  status: AuthStatus;
  hasHydrated: boolean;
  isRevalidating: boolean;
  bootstrapResolved: boolean;
  verifiedAt: number | null;
  setSession: (input: { accessToken: string; user: AuthUser }) => void;
  setUser: (user: AuthUser | null) => void;
  setGuest: () => void;
  clearSession: () => void;
  setHasHydrated: (value: boolean) => void;
  setRevalidating: (value: boolean) => void;
  setBootstrapResolved: (value: boolean) => void;
};

export const useAdminSessionStore = create<AdminSessionState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      status: "unknown",
      hasHydrated: false,
      isRevalidating: false,
      bootstrapResolved: false,
      verifiedAt: null,
      setSession: ({ accessToken, user }) => {
        setAdminApiAccessToken(accessToken);
        set({
          accessToken,
          user,
          status: "authenticated",
          verifiedAt: Date.now(),
          isRevalidating: false,
        });
      },
      setUser: (user) => {
        set({ user, status: user ? "authenticated" : "guest" });
      },
      setGuest: () => {
        clearAdminApiAccessToken();
        set({
          accessToken: null,
          user: null,
          status: "guest",
          verifiedAt: null,
          isRevalidating: false,
        });
      },
      clearSession: () => {
        clearAdminApiAccessToken();
        set({
          accessToken: null,
          user: null,
          status: "guest",
          verifiedAt: null,
          isRevalidating: false,
        });
      },
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      setRevalidating: (isRevalidating) => set({ isRevalidating }),
      setBootstrapResolved: (bootstrapResolved) => set({ bootstrapResolved }),
    }),
    {
      name: ADMIN_SESSION_SNAPSHOT_STORAGE_KEY,

      partialize: (state) => ({
        status: state.status === "authenticated" ? "authenticated" : "guest",
        user: state.user,
        verifiedAt: state.verifiedAt,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);

// The API client refreshes expired access tokens independently of React. Keep the
// session store in step so gated queries and the admin WebSocket use the new token.
subscribeAdminApiAccessToken((accessToken) => {
  const state = useAdminSessionStore.getState();
  if (state.accessToken === accessToken) return;

  if (!accessToken) {
    useAdminSessionStore.setState({
      accessToken: null,
      user: null,
      status: "guest",
      verifiedAt: null,
      isRevalidating: false,
    });
    return;
  }

  useAdminSessionStore.setState({
    accessToken,
    verifiedAt: Date.now(),
  });
});

if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key === ADMIN_SESSION_SNAPSHOT_STORAGE_KEY) {
      void useAdminSessionStore.persist.rehydrate();
    }
  });
}

// `status` alone goes "authenticated" as soon as the persisted snapshot
// rehydrates, optimistically, before the bearer token (kept in-memory only,
// never persisted - see admin-token-store.ts) is actually restored by
// useAdminAuthBootstrap's refresh call. Any query that needs a real
// Authorization header must gate on this instead of raw status/user, or it
// fires once with a null token (401), then again once the retry-refresh in
// adminApiFetch recovers it.
export function useIsAdminReady() {
  return useAdminSessionStore(
    (state) => state.status === "authenticated" && state.user?.role === "admin" && Boolean(state.accessToken),
  );
}
