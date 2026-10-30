export type BillingPlan = {
  code: string;
  name: string;
  intervalMonths: number;
  amountPaise: number;
  currency: string;
  active: boolean;
};

export type BillingSubscription = {
  id: string;
  userId: string;
  planCode: string;
  pendingPlanCode: string | null;
  providerSubscriptionId: string;
  status: string;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  graceEndsAt: string | null;
  cancelAtPeriodEnd: boolean;
};

export type BillingPayment = {
  id: string;
  providerPaymentId: string;
  amountPaise: number;
  currency: string;
  status: string;
  paidAt: string | null;
  createdAt: string;
};

export type BillingOverview = {
  plan: "free" | "pro";
  subscription: { subscription: BillingSubscription; plan: BillingPlan } | null;
  payments: BillingPayment[];
  grants: Array<{ id: string; source: string; reason: string | null; startsAt: string; endsAt: string | null }>;
};

export type CheckoutSession = { subscriptionId: string; providerSubscriptionId: string; keyId: string };
