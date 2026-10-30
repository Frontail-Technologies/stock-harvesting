"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "../api/admin-subscriptions-api";

const root = ["admin", "subscriptions"] as const;
export function useAdminSubscriptions() { return useQuery({ queryKey: [...root, "list"], queryFn: api.getAdminSubscriptions }); }
export function useAdminSubscriptionPayments() { return useQuery({ queryKey: [...root, "payments"], queryFn: api.getAdminSubscriptionPayments }); }
export function useAdminSubscriptionEvents() { return useQuery({ queryKey: [...root, "events"], queryFn: api.getAdminSubscriptionEvents }); }
export function useAdminCoupons() { return useQuery({ queryKey: [...root, "coupons"], queryFn: api.getAdminCoupons }); }
export function useAdminGrants() { return useQuery({ queryKey: [...root, "grants"], queryFn: api.getAdminGrants }); }
function useAdminMutation<T, R>(fn: (input: T) => Promise<R>) { const client = useQueryClient(); return useMutation({ mutationFn: fn, onSuccess: () => client.invalidateQueries({ queryKey: root }) }); }
export const useCreateAdminCoupon = () => useAdminMutation(api.createAdminCoupon);
export const useDisableAdminCoupon = () => useAdminMutation(api.disableAdminCoupon);
export const useCreateAdminGrant = () => useAdminMutation(api.createAdminGrant);
export const useRevokeAdminGrant = () => useAdminMutation(api.revokeAdminGrant);
export const useReconcileAdminSubscription = () => useAdminMutation(api.reconcileAdminSubscription);
export const useCancelAdminSubscription = () => useAdminMutation(api.cancelAdminSubscription);
