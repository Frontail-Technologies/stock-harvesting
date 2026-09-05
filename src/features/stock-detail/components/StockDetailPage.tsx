import { notFound } from "next/navigation";
import { getCurrencyForExchange } from "@/features/currency/lib/currency-formatters";
import { getMockStockDetail } from "../data/mock-stock-detail";
import {
  fetchPublicDailyCandles,
  fetchPublicExchanges,
  fetchPublicStockIdentity,
} from "../server/stock-detail-server";
import {
  compute52WeekRange,
  computeDayRange,
  computeLatestChange,
} from "../lib/stock-detail-range";
import { buildFullChartHref } from "../lib/stock-detail-links";
import { StockAnalysisUnlock } from "./StockAnalysisUnlock";
import { StockAnalystView } from "./StockAnalystView";
import { StockCompanyOverview } from "./StockCompanyOverview";
import { StockCompanyProfile } from "./StockCompanyProfile";
import { StockDetailHeader } from "./StockDetailHeader";
import { StockFaq } from "./StockFaq";
import { StockFinancialsSection } from "./StockFinancialsSection";
import { StockKeyMetrics } from "./StockKeyMetrics";
import { StockLatestEarnings } from "./StockLatestEarnings";
import { StockMockDataNotice } from "./StockMockDataNotice";
import { StockPeerComparison } from "./StockPeerComparison";
import { StockPublicChart } from "./StockPublicChart";
import { StockRangeSummary } from "./StockRangeSummary";
import { StockStrengthsRisks } from "./StockStrengthsRisks";

type StockDetailPageProps = {
  symbol: string;
  exchange: string;
};

export async function StockDetailPage({ symbol, exchange }: StockDetailPageProps) {
  const [rawIdentity, candles, exchanges] = await Promise.all([
    fetchPublicStockIdentity(symbol, exchange),
    fetchPublicDailyCandles(symbol, exchange),
    fetchPublicExchanges(),
  ]);

  // A search miss can still return a row for the exact query string - the
  // public search endpoint auto-hydrates unknown symbols from the provider
  // on demand, so an unrecognized symbol comes back as a real row with no
  // priced fields rather than no row at all. Only a row with an actual
  // close counts as a genuine identity match for validity purposes.
  const identity = rawIdentity && rawIdentity.close !== undefined ? rawIdentity : null;

  if (!identity && candles.length === 0) {
    notFound();
  }

  const currency = getCurrencyForExchange(exchange, exchanges);
  const companyName = identity?.name ?? "";
  const stock = {
    symbol,
    exchange,
    name: companyName,
    close: identity?.close ?? (candles.length > 0 ? candles[candles.length - 1].close : 0),
    changePct: identity?.changePct ?? null,
    volume: identity?.volume ?? (candles.length > 0 ? candles[candles.length - 1].volume : 0),
    hasMarketData: identity !== null || candles.length > 0,
  };

  const candleChange = computeLatestChange(candles);
  const price = identity?.close ?? candleChange?.price ?? null;
  const changeAbs =
    identity?.close !== undefined && identity?.changePct !== undefined
      ? (identity.close * identity.changePct) / (100 + identity.changePct)
      : (candleChange?.changeAbs ?? null);
  const changePct = identity?.changePct ?? candleChange?.changePct ?? null;

  const dayRange = computeDayRange(candles);
  const fiftyTwoWeekRange = compute52WeekRange(candles);
  const mockDetail = getMockStockDetail(symbol, exchange);
  const fullChartHref = buildFullChartHref(symbol, exchange);
  const displayName = companyName || symbol;

  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-5">
        <StockDetailHeader
          stock={stock}
          companyName={companyName}
          price={price}
          changeAbs={changeAbs}
          changePct={changePct}
          sector={mockDetail.companyProfile.sector}
          industry={mockDetail.companyProfile.industry}
          currency={currency}
        />

        <StockRangeSummary dayRange={dayRange} fiftyTwoWeekRange={fiftyTwoWeekRange} currency={currency} />
      </div>

      <div className="mt-6">
        <StockPublicChart
          symbol={symbol}
          exchange={exchange}
          currency={currency}
          candles={candles}
          fullChartHref={fullChartHref}
        />
      </div>

      <div className="mt-4">
        <StockMockDataNotice />
      </div>

      <div className="[&>section]:py-5 sm:[&>section]:py-7">
        <StockKeyMetrics fundamentals={mockDetail.fundamentals} currency={currency} />

        <StockLatestEarnings quarterly={mockDetail.financials.quarterly} currency={currency} />

        <StockCompanyOverview companyName={displayName} profile={mockDetail.companyProfile} />

        <section className="flex flex-col gap-6">
          <StockStrengthsRisks
            strengths={mockDetail.insights.strengths}
            risks={mockDetail.insights.risks}
          />
          <StockAnalystView analystSummary={mockDetail.insights.analystSummary} currency={currency} />
        </section>

        <StockFinancialsSection financials={mockDetail.financials} currency={currency} />

        <StockPeerComparison
          stock={stock}
          currentPrice={price}
          currentPeRatio={mockDetail.fundamentals.peRatio}
          currentRoce={mockDetail.fundamentals.roce}
          currentMarketCapCr={mockDetail.fundamentals.marketCapCr}
          peers={mockDetail.peerComparison.peers}
          currency={currency}
        />

        <StockCompanyProfile companyName={displayName} profile={mockDetail.companyProfile} />

        <StockFaq items={mockDetail.faq} />
      </div>

      <StockAnalysisUnlock symbol={symbol} />
    </div>
  );
}
