import { API_ROUTES } from "@/features/api/constants/api-routes";
import { adminApiFetch } from "@/features/api/lib/admin-api-client";
import type { BillingPayment, BillingPlan, BillingSubscription } from "../types";

export type AdminSubscriptionRow = { subscription: BillingSubscription; plan: BillingPlan; user: { id: string; name: string; email: string; plan: string } };
export type AdminCoupon = { id: string; name: string; codePrefix: string; durationMonths: number; maxRedemptions: number; redemptionCount: number; enabled: boolean; expiresAt: string | null; createdAt: string };
export type AdminGrant = { grant: { id: string; source: string; reason: string | null; startsAt: string; endsAt: string | null; revokedAt: string | null }; user: { id: string; name: string; email: string } };
export type AdminEvent = { id: string; providerEventId: string; eventType: string; status: string; errorMessage: string | null; createdAt: string; processedAt: string | null };

export const getAdminSubscriptions = () => adminApiFetch<{ items: AdminSubscriptionRow[]; total: number }>(API_ROUTES.subscriptions.admin);
export const getAdminSubscriptionPayments = () => adminApiFetch<{ items: Array<{ payment: BillingPayment; user: { id: string; email: string; name: string } }> }>(API_ROUTES.subscriptions.adminPayments);
export const getAdminSubscriptionEvents = () => adminApiFetch<{ items: AdminEvent[] }>(API_ROUTES.subscriptions.adminEvents);
export const getAdminCoupons = () => adminApiFetch<{ items: AdminCoupon[] }>(API_ROUTES.subscriptions.adminCoupons);
export const getAdminGrants = () => adminApiFetch<{ items: AdminGrant[] }>(API_ROUTES.subscriptions.adminGrants);
export const createAdminCoupon = (input: { name: string; durationMonths: number; maxRedemptions: number; expiresAt?: string | null }) => adminApiFetch<{ coupon: AdminCoupon; code: string }>(API_ROUTES.subscriptions.adminCoupons, { method: "POST", body: JSON.stringify(input) });
export const disableAdminCoupon = (id: string) => adminApiFetch<{ coupon: AdminCoupon }>(API_ROUTES.subscriptions.adminDisableCoupon(id), { method: "POST" });
export const createAdminGrant = (input: { userId: string; durationMonths: number | null; reason: string }) => adminApiFetch<{ grant: AdminGrant["grant"] }>(API_ROUTES.subscriptions.adminGrants, { method: "POST", body: JSON.stringify(input) });
export const revokeAdminGrant = (id: string) => adminApiFetch<{ grant: AdminGrant["grant"] }>(API_ROUTES.subscriptions.adminRevokeGrant(id), { method: "POST" });
export const reconcileAdminSubscription = (id: string) => adminApiFetch(API_ROUTES.subscriptions.adminReconcile(id), { method: "POST" });
export const cancelAdminSubscription = (id: string) => adminApiFetch(API_ROUTES.subscriptions.adminCancel(id), { method: "POST" });
