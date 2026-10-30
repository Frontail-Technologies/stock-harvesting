"use client";

import { useState } from "react";
import { Check, CreditCard, Gift, Loader2, RefreshCw, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { refreshSession } from "@/features/auth/api/auth-api";
import { useCurrentUser, useSessionStore } from "@/features/auth";
import { useBillingOverview, useBillingPlans, useCancelSubscription, useChangeSubscriptionPlan, useCreateCheckout, useRedeemCoupon } from "../hooks/use-billing";
import { openRazorpaySubscription } from "../lib/razorpay-checkout";

function money(paise: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(paise / 100);
}

function date(value: string | null | undefined) {
  return value ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(value)) : "-";
}

export function BillingPage() {
  const user = useCurrentUser().data;
  const setSession = useSessionStore((state) => state.setSession);
  const plans = useBillingPlans();
  const overview = useBillingOverview();
  const checkout = useCreateCheckout();
  const redeem = useRedeemCoupon();
  const cancel = useCancelSubscription();
  const changePlan = useChangeSubscriptionPlan();
  const [coupon, setCoupon] = useState("");

  const refreshIdentity = async () => {
    const session = await refreshSession();
    setSession(session);
    await overview.refetch();
  };

  const startCheckout = async (planCode: string, name: string) => {
    try {
      const session = await checkout.mutateAsync(planCode);
      await openRazorpaySubscription({
        keyId: session.keyId,
        subscriptionId: session.providerSubscriptionId,
        name,
        email: user?.email,
        onSuccess: () => {
          toast.success("Mandate approved. Activating your subscription...");
          window.setTimeout(() => void refreshIdentity(), 2_500);
        },
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to start checkout");
    }
  };

  const redeemCode = async () => {
    try {
      await redeem.mutateAsync(coupon);
      setCoupon("");
      await refreshIdentity();
      toast.success("Coupon redeemed. Pro access is active.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Coupon could not be redeemed");
    }
  };

  const current = overview.data?.subscription;
  const isPro = overview.data?.plan === "pro";

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Billing</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your Pro subscription, billing cycle, and access.</p>
        </div>
        <Badge variant={isPro ? "default" : "secondary"} className="w-fit">{isPro ? "Pro active" : "Free plan"}</Badge>
      </header>

      {current && (
        <section className="border-y border-border py-5">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div><p className="text-xs font-medium uppercase text-muted-foreground">Status</p><p className="mt-1 font-semibold capitalize">{current.subscription.status.replaceAll("_", " ")}</p></div>
            <div><p className="text-xs font-medium uppercase text-muted-foreground">Current cycle</p><p className="mt-1 font-semibold">{current.plan.name}</p></div>
            <div><p className="text-xs font-medium uppercase text-muted-foreground">Access through</p><p className="mt-1 font-semibold">{date(current.subscription.currentPeriodEnd ?? current.subscription.graceEndsAt)}</p></div>
            <div><p className="text-xs font-medium uppercase text-muted-foreground">Renewal</p><p className="mt-1 font-semibold">{current.subscription.cancelAtPeriodEnd ? "Cancels at period end" : "Automatic"}</p></div>
          </div>
          {!current.subscription.cancelAtPeriodEnd && (
            <Button variant="outline" className="mt-5" disabled={cancel.isPending} onClick={() => void cancel.mutateAsync(current.subscription.id).then(() => toast.success("Renewal cancelled; Pro remains active through the paid period.")).catch((error) => toast.error(error.message))}>
              {cancel.isPending ? <Loader2 className="animate-spin" /> : <CreditCard />} Cancel renewal
            </Button>
          )}
        </section>
      )}

      <section>
        <div className="mb-4 flex items-center gap-2"><ShieldCheck className="size-5 text-primary" /><h2 className="text-lg font-semibold">Choose your billing cycle</h2></div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {plans.data?.plans.map((plan) => {
            const active = current?.subscription.planCode === plan.code;
            return (
              <article key={plan.code} className={`flex min-h-56 flex-col border p-5 ${active ? "border-primary bg-primary/5" : "border-border"}`}>
                <div className="flex items-start justify-between gap-3"><h3 className="font-semibold">{plan.name.replace("Pro ", "")}</h3>{active && <Check className="size-5 text-primary" />}</div>
                <p className="mt-5 text-3xl font-semibold">{money(plan.amountPaise)}</p>
                <p className="mt-1 text-sm text-muted-foreground">GST included · every {plan.intervalMonths === 1 ? "month" : `${plan.intervalMonths} months`}</p>
                <p className="mt-3 text-sm text-muted-foreground">{money(Math.round(plan.amountPaise / plan.intervalMonths))}/month effective</p>
                <Button className="mt-auto w-full" variant={active ? "outline" : "default"} disabled={active || checkout.isPending || changePlan.isPending} onClick={() => current ? void changePlan.mutateAsync({ id: current.subscription.id, planCode: plan.code }).then(() => toast.success("Billing cycle will change at the next renewal.")).catch((error) => toast.error(error.message)) : void startCheckout(plan.code, plan.name)}>
                  {active ? "Current cycle" : current ? "Change next renewal" : "Subscribe"}
                </Button>
              </article>
            );
          })}
        </div>
      </section>

      <section className="grid gap-6 border-t border-border pt-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.55fr)]">
        <div>
          <h2 className="text-lg font-semibold">Payment history</h2>
          <div className="mt-3 divide-y divide-border border-y border-border">
            {overview.data?.payments.length ? overview.data.payments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between gap-4 py-3 text-sm"><div><p className="font-medium">{money(payment.amountPaise)}</p><p className="text-muted-foreground">{date(payment.paidAt ?? payment.createdAt)}</p></div><Badge variant="secondary" className="capitalize">{payment.status}</Badge></div>
            )) : <p className="py-6 text-sm text-muted-foreground">No subscription payments yet.</p>}
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2"><Gift className="size-5 text-primary" /><h2 className="text-lg font-semibold">Redeem coupon</h2></div>
          <p className="mt-1 text-sm text-muted-foreground">Coupons cannot be stacked with active Pro access.</p>
          <div className="mt-3 flex gap-2"><Input value={coupon} onChange={(event) => setCoupon(event.target.value.toUpperCase())} placeholder="SH-XXXXXXXX" disabled={isPro || redeem.isPending} /><Button size="icon" title="Redeem coupon" disabled={isPro || !coupon.trim() || redeem.isPending} onClick={() => void redeemCode()}>{redeem.isPending ? <Loader2 className="animate-spin" /> : <Gift />}</Button></div>
          {overview.data?.grants.map((grant) => <p key={grant.id} className="mt-3 text-sm text-muted-foreground">{grant.reason ?? "Pro grant"} · {grant.endsAt ? `through ${date(grant.endsAt)}` : "no expiry"}</p>)}
        </div>
      </section>

      {overview.isError && <Button variant="outline" onClick={() => void overview.refetch()}><RefreshCw /> Retry billing status</Button>}
    </div>
  );
}
