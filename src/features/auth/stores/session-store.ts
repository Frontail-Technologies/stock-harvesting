"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { clearApiAccessToken, setApiAccessToken } from "@/features/api";
import type { AuthStatus, AuthUser } from "../types";

const SESSION_SNAPSHOT_STORAGE_KEY = "stock-harvesting-session-snapshot";

type SessionState = {
  // Never persisted - lives only in memory (see token-store.ts), exactly
  // like before. A cached snapshot can tell the UI what to render; it can
  // never itself authorize an API call.
  accessToken: string | null;
  user: AuthUser | null;
  status: AuthStatus;
  // Flips true once the persisted snapshot (if any) has been read from
  // localStorage. Mostly a diagnostic signal - `status` itself already
  // reflects the restored snapshot by the time this turns true.
  hasHydrated: boolean;
  // True while a background POST /refresh is confirming a session that was
  // either just restored from a cached snapshot or freshly established.
  // Nothing gates rendering on this; AuthGuard/LoginScreen/the landing CTA
  // only ever branch on `status`.
  isRevalidating: boolean;
  // Never persisted - starts false on every fresh page load and flips true
  // once this boot's authoritative refresh has reached a terminal outcome
  // (confirmed authenticated, confirmed guest, or "couldn't confirm, kept
  // the cached snapshot"). Distinguishes "status reflects a snapshot
  // restored from a previous visit" from "status reflects THIS boot's own
  // check" - `status` alone can't tell those apart, since a restored
  // snapshot sets it to "authenticated" immediately, before any network
  // call has actually run this time. Only used to decide when it's safe
  // for a navigation decision (leaving /login) to act on `status`; Scanner
  // and other protected routes intentionally render on the optimistic
  // `status` alone, without waiting on this.
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

export const useSessionStore = create<SessionState>()(
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
        setApiAccessToken(accessToken);
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
        clearApiAccessToken();
        set({
          accessToken: null,
          user: null,
          status: "guest",
          verifiedAt: null,
          isRevalidating: false,
        });
      },
      clearSession: () => {
        clearApiAccessToken();
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
      name: SESSION_SNAPSHOT_STORAGE_KEY,
      // Only a safe, optimistic UI snapshot - never the access token (that
      // stays in the in-memory-only token-store.ts, as before) and never
      // anything derived from the HttpOnly refresh cookie. This can only
      // ever answer "what should we render immediately while validating",
      // never "is this request authorized" - every protected API call
      // still requires a real access token minted by a real POST /refresh
      // against the backend session, independent of this snapshot.
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

// Cross-tab sync: when another tab writes a new snapshot (login/logout),
// the browser's native `storage` event fires here (never in the tab that
// made the change), and re-reading it through zustand's own `rehydrate()`
// applies that change to this tab's live state - e.g. a logout in one tab
// flips this tab's `status` to "guest" too, without a bespoke
// BroadcastChannel/sync layer.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key === SESSION_SNAPSHOT_STORAGE_KEY) {
      void useSessionStore.persist.rehydrate();
    }
  });
}
