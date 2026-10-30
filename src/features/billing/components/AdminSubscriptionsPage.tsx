"use client";

import { useState } from "react";
import { Ban, Copy, RefreshCw, Ticket, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { useAdminCoupons, useAdminGrants, useAdminSubscriptionEvents, useAdminSubscriptionPayments, useAdminSubscriptions, useCancelAdminSubscription, useCreateAdminCoupon, useCreateAdminGrant, useDisableAdminCoupon, useReconcileAdminSubscription, useRevokeAdminGrant } from "../hooks/use-admin-subscriptions";

type Tab = "subscriptions" | "coupons" | "grants" | "payments" | "events";
const tabs: Array<{ key: Tab; label: string }> = [{ key: "subscriptions", label: "Subscriptions" }, { key: "coupons", label: "Coupons" }, { key: "grants", label: "Grants" }, { key: "payments", label: "Payments" }, { key: "events", label: "Events" }];
const fmt = (value: string | null | undefined) => value ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "-";
const money = (paise: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(paise / 100);

export function AdminSubscriptionsPage() {
  const [tab, setTab] = useState<Tab>("subscriptions");
  const subscriptions = useAdminSubscriptions();
  const coupons = useAdminCoupons();
  const grants = useAdminGrants();
  const payments = useAdminSubscriptionPayments();
  const events = useAdminSubscriptionEvents();
  const reconcile = useReconcileAdminSubscription();
  const cancel = useCancelAdminSubscription();
  const disableCoupon = useDisableAdminCoupon();
  const revokeGrant = useRevokeAdminGrant();
  const createCoupon = useCreateAdminCoupon();
  const createGrant = useCreateAdminGrant();
  const [couponForm, setCouponForm] = useState({ name: "", durationMonths: "6", maxRedemptions: "1", expiresAt: "" });
  const [grantForm, setGrantForm] = useState({ userId: "", durationMonths: "6", reason: "Promotional Pro access" });
  const [issuedCode, setIssuedCode] = useState<string | null>(null);

  const submitCoupon = async () => {
    try {
      const result = await createCoupon.mutateAsync({ name: couponForm.name, durationMonths: Number(couponForm.durationMonths), maxRedemptions: Number(couponForm.maxRedemptions), expiresAt: couponForm.expiresAt ? new Date(couponForm.expiresAt).toISOString() : null });
      setIssuedCode(result.code);
      setCouponForm({ name: "", durationMonths: "6", maxRedemptions: "1", expiresAt: "" });
      toast.success("Coupon created. The full code is shown once.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to create coupon"); }
  };
  const submitGrant = async () => {
    try { await createGrant.mutateAsync({ userId: grantForm.userId, durationMonths: grantForm.durationMonths ? Number(grantForm.durationMonths) : null, reason: grantForm.reason }); toast.success("Pro grant created"); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Unable to create grant"); }
  };

  return <div className="space-y-6">
    <header><h1 className="text-2xl font-semibold">Subscriptions</h1><p className="mt-1 text-sm text-muted-foreground">Razorpay billing, free access grants, and webhook operations.</p></header>
    <div className="flex max-w-full gap-1 overflow-x-auto border-b border-border" role="tablist">{tabs.map((item) => <Button key={item.key} variant="ghost" className={`shrink-0 rounded-none border-b-2 ${tab === item.key ? "border-primary text-foreground" : "border-transparent text-muted-foreground"}`} onClick={() => setTab(item.key)}>{item.label}</Button>)}</div>

    {tab === "subscriptions" && <div className="space-y-3">{subscriptions.data?.items.map((row) => <div key={row.subscription.id} className="grid gap-3 border-b border-border py-4 md:grid-cols-[minmax(180px,1.3fr)_1fr_1fr_auto] md:items-center"><div><p className="font-medium">{row.user.name}</p><p className="text-sm text-muted-foreground">{row.user.email}</p></div><div><p className="text-sm font-medium">{row.plan.name}</p><p className="text-xs text-muted-foreground">Through {fmt(row.subscription.currentPeriodEnd)}</p></div><Badge className="w-fit capitalize" variant="secondary">{row.subscription.status}</Badge><div className="flex gap-2"><Button size="icon" variant="outline" title="Reconcile with Razorpay" onClick={() => void reconcile.mutateAsync(row.subscription.id).then(() => toast.success("Subscription reconciled")).catch((e) => toast.error(e.message))}><RefreshCw /></Button><Button size="icon" variant="outline" title="Cancel at period end" onClick={() => void cancel.mutateAsync(row.subscription.id).then(() => toast.success("Cancellation scheduled")).catch((e) => toast.error(e.message))}><Ban /></Button></div></div>)}{!subscriptions.data?.items.length && <p className="py-8 text-sm text-muted-foreground">No subscriptions yet.</p>}</div>}

    {tab === "coupons" && <div className="space-y-6"><section className="grid gap-3 border-b border-border pb-5 sm:grid-cols-2 lg:grid-cols-5"><Input placeholder="Campaign name" value={couponForm.name} onChange={(e) => setCouponForm({ ...couponForm, name: e.target.value })}/><Input type="number" min="1" placeholder="Months" value={couponForm.durationMonths} onChange={(e) => setCouponForm({ ...couponForm, durationMonths: e.target.value })}/><Input type="number" min="1" placeholder="Redemptions" value={couponForm.maxRedemptions} onChange={(e) => setCouponForm({ ...couponForm, maxRedemptions: e.target.value })}/><Input type="datetime-local" value={couponForm.expiresAt} onChange={(e) => setCouponForm({ ...couponForm, expiresAt: e.target.value })}/><Button disabled={!couponForm.name || createCoupon.isPending} onClick={() => void submitCoupon()}><Ticket /> Create</Button></section>{issuedCode && <div className="flex items-center justify-between gap-3 border border-primary/40 bg-primary/5 p-3"><code className="break-all font-semibold">{issuedCode}</code><Button size="icon" variant="ghost" title="Copy coupon code" onClick={() => void navigator.clipboard.writeText(issuedCode).then(() => toast.success("Copied"))}><Copy /></Button></div>}{coupons.data?.items.map((coupon) => <div key={coupon.id} className="flex flex-col gap-3 border-b border-border py-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium">{coupon.name} <span className="font-mono text-xs text-muted-foreground">{coupon.codePrefix}...</span></p><p className="text-sm text-muted-foreground">{coupon.durationMonths} months · {coupon.redemptionCount}/{coupon.maxRedemptions} used · expires {fmt(coupon.expiresAt)}</p></div><Button size="sm" variant="outline" disabled={!coupon.enabled} onClick={() => void disableCoupon.mutateAsync(coupon.id)}>{coupon.enabled ? "Disable" : "Disabled"}</Button></div>)}</div>}

    {tab === "grants" && <div className="space-y-6"><section className="grid gap-3 border-b border-border pb-5 md:grid-cols-[1fr_140px_1fr_auto]"><Input placeholder="User UUID" value={grantForm.userId} onChange={(e) => setGrantForm({ ...grantForm, userId: e.target.value })}/><Input type="number" min="1" placeholder="Months" value={grantForm.durationMonths} onChange={(e) => setGrantForm({ ...grantForm, durationMonths: e.target.value })}/><Input placeholder="Reason" value={grantForm.reason} onChange={(e) => setGrantForm({ ...grantForm, reason: e.target.value })}/><Button onClick={() => void submitGrant()} disabled={!grantForm.userId || !grantForm.reason}><UserPlus /> Grant</Button></section>{grants.data?.items.map((row) => <div key={row.grant.id} className="flex flex-col gap-3 border-b border-border py-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium">{row.user.name} · {row.grant.source}</p><p className="text-sm text-muted-foreground">{row.user.email} · {row.grant.reason} · through {fmt(row.grant.endsAt)}</p></div><Button size="sm" variant="outline" disabled={Boolean(row.grant.revokedAt)} onClick={() => void revokeGrant.mutateAsync(row.grant.id)}>{row.grant.revokedAt ? "Revoked" : "Revoke"}</Button></div>)}</div>}

    {tab === "payments" && <div className="divide-y divide-border border-y border-border">{payments.data?.items.map(({ payment, user }) => <div key={payment.id} className="grid gap-1 py-3 text-sm sm:grid-cols-[1fr_1fr_auto]"><div><p className="font-medium">{user.name}</p><p className="text-muted-foreground">{user.email}</p></div><div><p>{money(payment.amountPaise)}</p><p className="text-muted-foreground">{fmt(payment.paidAt)}</p></div><Badge variant="secondary" className="w-fit capitalize">{payment.status}</Badge></div>)}</div>}

    {tab === "events" && <div className="divide-y divide-border border-y border-border">{events.data?.items.map((event) => <div key={event.id} className="grid gap-1 py-3 text-sm md:grid-cols-[1fr_160px_180px]"><div className="min-w-0"><p className="font-medium">{event.eventType}</p><p className="truncate font-mono text-xs text-muted-foreground">{event.providerEventId}</p>{event.errorMessage && <p className="mt-1 text-destructive">{event.errorMessage}</p>}</div><Badge className="w-fit capitalize" variant={event.status === "processed" ? "secondary" : "destructive"}>{event.status}</Badge><p className="text-muted-foreground">{fmt(event.createdAt)}</p></div>)}</div>}
  </div>;
}
