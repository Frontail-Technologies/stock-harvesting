"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { ApiError, queryKeys } from "@/features/api";
import {
  getCurrentAdminUser,
  logoutAdmin,
  refreshAdminSession,
} from "../api/admin-auth-api";
import {
  getCurrentAuthUser,
  refreshSession,
  startGoogleLogin,
  logout as logoutRequest,
} from "../api/auth-api";
import { useAdminSessionStore } from "../stores/admin-session-store";
import { useSessionStore } from "../stores/session-store";

export function useAuthBootstrap(options: { enabled?: boolean } = {}) {
  const { enabled = true } = options;
  const queryClient = useQueryClient();
  const setSession = useSessionStore((state) => state.setSession);
  const setGuest = useSessionStore((state) => state.setGuest);
  const setRevalidating = useSessionStore((state) => state.setRevalidating);
  const setBootstrapResolved = useSessionStore((state) => state.setBootstrapResolved);

  const startedRef = useRef(false);

  useEffect(() => {

    if (!enabled) return;
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

        const sessionExplicitlyInvalid = error instanceof ApiError && error.status === 401;

        if (sessionExplicitlyInvalid || !hadOptimisticSession) {
          setGuest();

          queryClient.clear();
        } else {

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
  }, [enabled, queryClient, setBootstrapResolved, setGuest, setRevalidating, setSession]);
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

export function useAdminAuthBootstrap() {
  const queryClient = useQueryClient();
  const setSession = useAdminSessionStore((state) => state.setSession);
  const setGuest = useAdminSessionStore((state) => state.setGuest);
  const setRevalidating = useAdminSessionStore((state) => state.setRevalidating);
  const setBootstrapResolved = useAdminSessionStore((state) => state.setBootstrapResolved);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    let cancelled = false;
    const hadOptimisticSession = useAdminSessionStore.getState().status === "authenticated";

    async function bootstrap() {
      setRevalidating(true);
      try {
        const session = await refreshAdminSession();
        if (!cancelled) setSession(session);
      } catch (error) {
        if (cancelled) return;

        const sessionExplicitlyInvalid = error instanceof ApiError && error.status === 401;

        if (sessionExplicitlyInvalid || !hadOptimisticSession) {
          setGuest();
          queryClient.clear();
        } else {
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

export function useAdminCurrentUser() {
  const queryClient = useQueryClient();
  const status = useAdminSessionStore((state) => state.status);
  const setUser = useAdminSessionStore((state) => state.setUser);
  const setGuest = useAdminSessionStore((state) => state.setGuest);
  const query = useQuery({
    queryKey: queryKeys.auth.adminCurrentUser,
    queryFn: getCurrentAdminUser,
    enabled: status === "authenticated",
  });

  useEffect(() => {
    if (query.data) setUser(query.data);
  }, [query.data, setUser]);

  useEffect(() => {
    if (query.error instanceof ApiError && query.error.status === 401) {
      setGuest();
      queryClient.clear();
    }
  }, [query.error, queryClient, setGuest]);

  return query;
}

export function useAdminLogout() {
  const queryClient = useQueryClient();
  const clearSession = useAdminSessionStore((state) => state.clearSession);

  return useMutation({
    mutationFn: logoutAdmin,
    onSettled: () => {
      clearSession();
      queryClient.clear();
    },
  });
}
