import { API_ROUTES } from "@/features/api/constants/api-routes";
import { apiFetch } from "@/features/api/lib/api-client";

export type PriceAlertCondition = "ABOVE" | "BELOW";
export type PriceAlertStatus = "ACTIVE" | "TRIGGERED" | "DISABLED";

export type PriceAlert = {
  id: string;
  exchange: string;
  symbol: string;
  condition: PriceAlertCondition;
  targetPrice: number;
  status: PriceAlertStatus;
  triggeredAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function getPushPublicKey() {
  return apiFetch<{ publicKey: string | null; configured: boolean }>(
    API_ROUTES.pushSubscriptions.publicKey
  );
}

export async function savePushSubscription(subscription: PushSubscription) {
  return apiFetch<{ subscription: { id: string; endpoint: string } }>(
    API_ROUTES.pushSubscriptions.root,
    {
      method: "POST",
      body: JSON.stringify({ subscription: subscription.toJSON() }),
    }
  );
}

export async function createPriceAlert(input: {
  exchange: string;
  symbol: string;
  condition: PriceAlertCondition;
  targetPrice: number;
  currentPrice?: number;
}) {
  return apiFetch<{ alert: PriceAlert }>(API_ROUTES.priceAlerts.root, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function listPriceAlerts(input: {
  exchange?: string;
  symbol?: string;
  status?: PriceAlertStatus;
}) {
  const params = new URLSearchParams();
  if (input.exchange) params.set("exchange", input.exchange);
  if (input.symbol) params.set("symbol", input.symbol);
  if (input.status) params.set("status", input.status);
  const query = params.toString();
  return apiFetch<{ alerts: PriceAlert[] }>(
    `${API_ROUTES.priceAlerts.root}${query ? `?${query}` : ""}`
  );
}

export async function deletePriceAlert(id: string) {
  return apiFetch<{ ok: boolean }>(API_ROUTES.priceAlerts.byId(id), {
    method: "DELETE",
  });
}
