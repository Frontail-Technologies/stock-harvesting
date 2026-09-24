import { API_BASE_URL } from "@/features/api";

export function getMarketStreamUrl() {
  const url = new URL(API_BASE_URL);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = "/ws/market";
  url.search = "";
  return url.toString();
}

export function getMarketStreamProtocols(token: string) {
  return ["bearer", token];
}
