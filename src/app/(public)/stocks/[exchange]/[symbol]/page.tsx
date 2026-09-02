import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Footer, Navbar } from "@/features/landing/components";
import { normalizeStockRouteParams, StockDetailPage } from "@/features/stock-detail";

type RouteParams = { exchange: string; symbol: string };

const STOCK_DETAIL_NAV_LINKS = [
  { label: "Charts", href: "/charts" },
  { label: "Analysis", href: "/#scanner-method" },
  { label: "Markets", href: "/#markets" },
];

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { exchange, symbol } = await params;
  const normalized = normalizeStockRouteParams(exchange, symbol);

  if (!normalized) {
    return { title: "Stock Not Found" };
  }

  return {
    title: `${normalized.symbol} (${normalized.exchange}) Share Price & Analysis`,
    description: `View price, charts, and analysis for ${normalized.symbol} on ${normalized.exchange}.`,
    alternates: {
      canonical: `/stocks/${normalized.exchange}/${normalized.symbol}`,
    },
  };
}

export default async function StockDetailRoute({
  params,
}: {
  params: Promise<RouteParams>;
}) {
  const { exchange, symbol } = await params;
  const normalized = normalizeStockRouteParams(exchange, symbol);

  if (!normalized) {
    notFound();
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background font-sans text-foreground">
      <Navbar links={STOCK_DETAIL_NAV_LINKS} sticky />
      <main className="flex-1">
        <div className="landing-container py-8 sm:py-10">
          <StockDetailPage symbol={normalized.symbol} exchange={normalized.exchange} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
