import type { Stock } from "@/types/market";

export function getScannerShareUrl(stock: Stock) {
  if (typeof window === "undefined") return "";

  const params = new URLSearchParams({ symbol: stock.symbol, exchange: stock.exchange });
  return `${window.location.origin}/charts?${params.toString()}`;
}

export function getScannerShareCaption(stock: Stock) {
  return `${stock.symbol} (${stock.exchange}) on Stock Harvesting`;
}

export function buildWhatsAppShareUrl(text: string, url: string) {
  return `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`;
}

export function buildTelegramShareUrl(text: string, url: string) {
  return `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
}

export function buildTwitterShareUrl(text: string, url: string) {
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
}

export function buildRedditShareUrl(text: string, url: string) {
  return `https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(text)}`;
}
