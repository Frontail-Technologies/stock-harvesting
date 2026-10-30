import { API_ROUTES } from "@/features/api/constants/api-routes";
import { apiFetch } from "@/features/api/lib/api-client";
import type { BillingOverview, BillingPlan, CheckoutSession } from "../types";

export const getBillingPlans = () => apiFetch<{ plans: BillingPlan[] }>(API_ROUTES.subscriptions.plans);
export const getBillingOverview = () => apiFetch<BillingOverview>(API_ROUTES.subscriptions.me);
export const createCheckout = (planCode: string) => apiFetch<CheckoutSession>(API_ROUTES.subscriptions.checkout, { method: "POST", body: JSON.stringify({ planCode }) });
export const redeemCoupon = (code: string) => apiFetch<{ plan: "pro"; expiresAt: string }>(API_ROUTES.subscriptions.redeem, { method: "POST", body: JSON.stringify({ code }) });
export const cancelSubscription = (id: string) => apiFetch<BillingOverview>(API_ROUTES.subscriptions.cancel(id), { method: "POST" });
export const changeSubscriptionPlan = (input: { id: string; planCode: string }) => apiFetch<BillingOverview>(API_ROUTES.subscriptions.changePlan(input.id), { method: "POST", body: JSON.stringify({ planCode: input.planCode }) });
