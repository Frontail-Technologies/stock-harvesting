"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { queryKeys } from "@/features/api";
import {
  getCurrentAuthUser,
  refreshSession,
  startGoogleLogin,
  logout as logoutRequest,
} from "../api/auth-api";
import { useSessionStore } from "../stores/session-store";

export function useAuthBootstrap() {
  const setSession = useSessionStore((state) => state.setSession);
  const setGuest = useSessionStore((state) => state.setGuest);
  const status = useSessionStore((state) => state.status);
  // Guards against React Strict Mode's dev-only mount→cleanup→mount replay
  // firing this effect twice — without it, both invocations dispatch a real
  // POST /refresh network call (the single-flight guard in refreshSession
  // covers truly concurrent calls, but this avoids relying on that timing).
  const startedRef = useRef(false);

  useEffect(() => {
    if (status !== "unknown") return;
    if (startedRef.current) return;
    startedRef.current = true;

    let cancelled = false;

    async function bootstrap() {
      try {
        const session = await refreshSession();
        if (!cancelled) setSession(session);
      } catch {
        if (!cancelled) setGuest();
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [setGuest, setSession, status]);
}

export function useCurrentUser() {
  const status = useSessionStore((state) => state.status);
  const setUser = useSessionStore((state) => state.setUser);
  const setGuest = useSessionStore((state) => state.setGuest);
  const query = useQuery({
    queryKey: queryKeys.auth.currentUser,
    queryFn: getCurrentAuthUser,
    enabled: status === "authenticated",
  });

  useEffect(() => {
    if (query.data) setUser(query.data);
  }, [query.data, setUser]);

  useEffect(() => {
    if (query.error) setGuest();
  }, [query.error, setGuest]);

  return query;
}

export function useGoogleLogin() {
  return useMutation({
    mutationFn: startGoogleLogin,
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const clearSession = useSessionStore((state) => state.clearSession);

  return useMutation({
    mutationFn: logoutRequest,
    onSettled: () => {
      clearSession();
      queryClient.clear();
    },
  });
}
