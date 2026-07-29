import { API_BASE_URL } from "@/features/api";

export function getMarketStreamUrl(token: string) {
  const url = new URL(API_BASE_URL);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = "/ws/market";
  url.search = "";
  url.searchParams.set("token", token);
  return url.toString();
}
