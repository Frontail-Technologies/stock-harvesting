"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cancelSubscription, changeSubscriptionPlan, createCheckout, getBillingOverview, getBillingPlans, redeemCoupon } from "../api/billing-api";

export const billingKeys = { plans: ["billing", "plans"] as const, overview: ["billing", "overview"] as const };

export function useBillingPlans() {
  return useQuery({ queryKey: billingKeys.plans, queryFn: getBillingPlans, staleTime: 5 * 60_000 });
}

export function useBillingOverview() {
  return useQuery({ queryKey: billingKeys.overview, queryFn: getBillingOverview, refetchInterval: (query) => query.state.data?.subscription?.subscription.status === "created" ? 4_000 : false });
}

function useBillingMutation<TInput, TOutput>(mutationFn: (input: TInput) => Promise<TOutput>) {
  const client = useQueryClient();
  return useMutation({ mutationFn, onSuccess: () => client.invalidateQueries({ queryKey: billingKeys.overview }) });
}

export const useCreateCheckout = () => useBillingMutation<string, Awaited<ReturnType<typeof createCheckout>>>(createCheckout);
export const useRedeemCoupon = () => useBillingMutation<string, Awaited<ReturnType<typeof redeemCoupon>>>(redeemCoupon);
export const useCancelSubscription = () => useBillingMutation<string, Awaited<ReturnType<typeof cancelSubscription>>>(cancelSubscription);
export const useChangeSubscriptionPlan = () => useBillingMutation<{ id: string; planCode: string }, Awaited<ReturnType<typeof changeSubscriptionPlan>>>(changeSubscriptionPlan);
