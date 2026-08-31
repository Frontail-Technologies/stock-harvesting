"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { clearAdminApiAccessToken, setAdminApiAccessToken } from "@/features/api";
import type { AuthStatus, AuthUser } from "../types";

// Strict portal separation - a genuinely separate store from
// session-store.ts, not a shared one keyed by portal. Origin isolation
// (stockharvesting.com vs admin.stockharvesting.com are different sites)
// already keeps localStorage/zustand state apart in production, but using
// a distinct store name here means the ADMIN and USER "current session"
// concepts are never even the same in-memory object, which also matters
// for local dev (both portals can share one origin there) and for
// anyone auditing this code for cross-portal leakage.
const ADMIN_SESSION_SNAPSHOT_STORAGE_KEY = "stock-harvesting-admin-session-snapshot";

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
      // Same safety contract as the user session snapshot - an optimistic
      // UI hint only, never the access token, never a substitute for a
      // real POST /admin-auth/refresh against the backend session.
      partialize: (state) => ({
        status: state.status === "authenticated" ? "authenticated" : "guest",
        user: state.user,
        verifiedAt: state.verifiedAt,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key === ADMIN_SESSION_SNAPSHOT_STORAGE_KEY) {
      void useAdminSessionStore.persist.rehydrate();
    }
  });
}
