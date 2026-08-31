import { AU, CA, GB, IN, JP, SG, US } from "country-flag-icons/string/3x2";
import { cn } from "@/utils/cn";
import { Reveal } from "./Reveal";

const FLAG_SVG: Record<string, string> = { IN, US, JP, GB, AU, CA, SG };
const flagUri = (code: string) =>
  `data:image/svg+xml,${encodeURIComponent(FLAG_SVG[code])}`;

const MARKET_STATUS = [
  { market: "NSE", region: "India", flag: "IN", stocks: "2,300+", status: "Available", active: true },
  { market: "BSE", region: "India", flag: "IN", stocks: "5,000+", status: "Available", active: true },
  { market: "US Markets", region: "United States", flag: "US", stocks: "6,000+", status: "Available", active: true },
  { market: "Japan", region: "Asia", flag: "JP", stocks: "3,800+", status: "Expanding", active: false },
  { market: "United Kingdom", region: "Europe", flag: "GB", stocks: "1,900+", status: "Expanding", active: false },
  { market: "Australia", region: "Oceania", flag: "AU", stocks: "2,000+", status: "Expanding", active: false },
  { market: "Canada", region: "North America", flag: "CA", stocks: "3,300+", status: "Expanding", active: false },
  { market: "Singapore", region: "Asia", flag: "SG", stocks: "600+", status: "Expanding", active: false },
  { market: "Worldwide", region: "Global", flag: null, stocks: "50,000+", status: "Expanding", active: false },
];

export function MarketCoverageSection() {
  return (
    <section
      id="markets"
      className="landing-section relative overflow-hidden border-t border-landing-border"
      aria-labelledby="markets-heading"
    >
      <div className="absolute inset-0 landing-container" aria-hidden="true">
        <div className="landing-frame-line landing-frame-line-left" />
        <div className="landing-frame-line landing-frame-line-right" />
      </div>

      <div className="landing-container relative">
        <Reveal>
          <p className="landing-eyebrow">04 / Market Coverage</p>
        </Reveal>

        <Reveal delay={0.05}>
          <h2
            id="markets-heading"
            className="landing-section-heading mt-4 max-w-2xl text-balance"
          >
            Built for markets beyond borders.
          </h2>
        </Reveal>

        <Reveal delay={0.1}>
          <p className="landing-section-subheading mt-4 max-w-lg">
            Stock Harvesting brings the same focused analysis and chart-review
            experience across supported markets, with broader exchange coverage
            being built over time.
          </p>
        </Reveal>

        <Reveal delay={0.2} className="landing-market-status mt-10 md:mt-12">
          <div className="landing-market-status-row landing-market-status-header">
            <p className="landing-market-status-col">Market</p>
            <p className="landing-market-status-col">Region</p>
            <p className="landing-market-status-col">Stocks</p>
            <p className="landing-market-status-col justify-self-end">Status</p>
          </div>
          {MARKET_STATUS.map((row) => (
            <div key={row.market} className="landing-market-status-row">
              <p className="landing-market-status-col landing-market-name">
                {row.flag ? (
                  // eslint-disable-next-line @next/next/no-img-element -- inline data-URI SVG flag; next/image adds no value and can't optimize a data URI
                  <img
                    src={flagUri(row.flag)}
                    alt=""
                    aria-hidden="true"
                    className="landing-market-flag"
                  />
                ) : (
                  <span className="landing-market-flag-placeholder" aria-hidden="true" />
                )}
                {row.market}
              </p>
              <p className="landing-market-status-col landing-market-region">
                {row.region}
              </p>
              <p className="landing-market-status-col landing-market-stocks">
                {row.stocks}
              </p>
              <p
                className={cn(
                  "landing-market-status-col landing-market-status-value",
                  row.active
                    ? "landing-market-status-value-active"
                    : "landing-market-status-value-expanding",
                )}
              >
                <span
                  className={cn(
                    "landing-market-status-dot",
                    row.active
                      ? "landing-market-status-dot-active"
                      : "landing-market-status-dot-expanding",
                  )}
                />
                {row.status}
              </p>
            </div>
          ))}
        </Reveal>

        <p className="landing-market-note mt-6">
          Market availability varies by exchange and region.
        </p>
      </div>
    </section>
  );
}

