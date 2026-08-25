"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { ApiError, queryKeys } from "@/features/api";
import {
  getCurrentAuthUser,
  refreshSession,
  startGoogleLogin,
  logout as logoutRequest,
} from "../api/auth-api";
import { useSessionStore } from "../stores/session-store";

// This always runs exactly once per page load, regardless of whether a
// cached session snapshot already restored `status` to "authenticated" -
// the snapshot is an optimistic UI hint, never a substitute for the real
// backend check. What changes with a snapshot present is only that the app
// doesn't have to wait on this call before rendering.
export function useAuthBootstrap() {
  const queryClient = useQueryClient();
  const setSession = useSessionStore((state) => state.setSession);
  const setGuest = useSessionStore((state) => state.setGuest);
  const setRevalidating = useSessionStore((state) => state.setRevalidating);
  const setBootstrapResolved = useSessionStore((state) => state.setBootstrapResolved);
  // Guards against React Strict Mode's dev-only mount→cleanup→mount replay
  // firing this effect twice — without it, both invocations dispatch a real
  // POST /refresh network call (the single-flight guard in refreshSession
  // covers truly concurrent calls, but this avoids relying on that timing).
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    let cancelled = false;
    const hadOptimisticSession = useSessionStore.getState().status === "authenticated";

    async function bootstrap() {
      setRevalidating(true);
      try {
        const session = await refreshSession();
        if (!cancelled) setSession(session);
      } catch (error) {
        if (cancelled) return;

        // Only a clean, explicit 401 means the backend is actually
        // rejecting the session (expired/revoked refresh cookie) - that's
        // the one case that's authoritative enough to log the user out.
        // A 429/5xx (rate limited, temporary server error) is still an
        // ApiError but says nothing about whether the session is valid,
        // and a network-level failure (fetch() itself rejecting - offline,
        // DNS, connection reset) isn't even a response at all. Neither
        // should clear a session that might still be perfectly good.
        const sessionExplicitlyInvalid = error instanceof ApiError && error.status === 401;

        if (sessionExplicitlyInvalid || !hadOptimisticSession) {
          setGuest();
          // A cached snapshot may still be sitting in React Query's
          // in-memory cache from the previous (now-invalid) session -
          // clearing it here (not just on explicit user-initiated logout)
          // closes the same gap for a silently-expired session, so stale
          // watchlist/alert data can't briefly outlive it.
          queryClient.clear();
        } else {
          // Temporary failure (rate limit, server error, or the request
          // never got a response at all) while a cached snapshot exists -
          // logging the user out for this would be worse than staying put.
          // The next real API call (or the next reload) retries naturally
          // through the same single-flight refresh path, so this doesn't
          // need its own retry loop.
          setRevalidating(false);
        }
      } finally {
        if (!cancelled) setBootstrapResolved(true);
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [queryClient, setBootstrapResolved, setGuest, setRevalidating, setSession]);
}

export function useCurrentUser() {
  const queryClient = useQueryClient();
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
    // Same classification as useAuthBootstrap: only a confirmed 401 means
    // this session is actually invalid. A temporary 429/5xx or a
    // network-level failure on this one GET /me call shouldn't log the
    // user out from underneath them - apiFetch's own 401-retry already
    // gives real 401s every reasonable chance to be a stale access token
    // rather than a dead session before this ever fires.
    if (query.error instanceof ApiError && query.error.status === 401) {
      setGuest();
      queryClient.clear();
    }
  }, [query.error, queryClient, setGuest]);

  return query;
}

export function useGoogleLogin() {
  return useMutation({
    mutationFn: (portal?: "admin") => startGoogleLogin(portal),
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
