"use client";

import { create } from "zustand";
import { clearApiAccessToken, setApiAccessToken } from "@/features/api";
import type { AuthStatus, AuthUser } from "../types";

type SessionState = {
  accessToken: string | null;
  user: AuthUser | null;
  status: AuthStatus;
  setSession: (input: { accessToken: string; user: AuthUser }) => void;
  setUser: (user: AuthUser | null) => void;
  setGuest: () => void;
  clearSession: () => void;
};

export const useSessionStore = create<SessionState>((set) => ({
  accessToken: null,
  user: null,
  status: "unknown",
  setSession: ({ accessToken, user }) => {
    setApiAccessToken(accessToken);
    set({ accessToken, user, status: "authenticated" });
  },
  setUser: (user) => {
    set({ user, status: user ? "authenticated" : "guest" });
  },
  setGuest: () => {
    clearApiAccessToken();
    set({ accessToken: null, user: null, status: "guest" });
  },
  clearSession: () => {
    clearApiAccessToken();
    set({ accessToken: null, user: null, status: "guest" });
  },
}));
