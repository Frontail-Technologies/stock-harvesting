import type {
  StockAnalystRating,
  StockDetailMockData,
  StockFinancialPeriod,
} from "../types";

function hashSymbol(symbol: string): number {
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) {
    hash = (hash * 31 + symbol.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function seededRange(seed: number, min: number, max: number): number {
  const normalized = (seed % 1000) / 1000;
  return min + normalized * (max - min);
}

function buildQuarterlyLabels(): string[] {
  return ["Q1 FY24", "Q2 FY24", "Q3 FY24", "Q4 FY24"];
}

function buildAnnualLabels(): string[] {
  return ["FY21", "FY22", "FY23", "FY24"];
}

function buildFinancialSeries(seed: number, labels: string[], baseIncomeCr: number): StockFinancialPeriod[] {
  return labels.map((label, index) => {
    const growth = 1 + index * seededRange(seed + index, 0.04, 0.09);
    const totalIncomeCr = Math.round(baseIncomeCr * growth);
    const ebitdaMarginPct = seededRange(seed + index * 3, 18, 32);
    const netProfitMarginPct = seededRange(seed + index * 5, 10, 22);
    const ebitdaCr = Math.round((totalIncomeCr * ebitdaMarginPct) / 100);
    const patCr = Math.round((totalIncomeCr * netProfitMarginPct) / 100);

    return {
      label,
      totalIncomeCr,
      ebitdaCr,
      ebitdaMarginPct: Math.round(ebitdaMarginPct * 10) / 10,
      patCr,
      netProfitMarginPct: Math.round(netProfitMarginPct * 10) / 10,
      epsValue: Math.round((patCr / seededRange(seed, 350, 620)) * 100) / 100,
      operatingMarginPct: Math.round(seededRange(seed + index * 7, 14, 28) * 10) / 10,
    };
  });
}

function buildGenericMockDetail(symbol: string, exchange: string): StockDetailMockData {
  const seed = hashSymbol(`${exchange}:${symbol}`);
  const quarterly = buildFinancialSeries(seed, buildQuarterlyLabels(), seededRange(seed, 4000, 18000));
  const profitLoss = buildFinancialSeries(seed + 101, buildAnnualLabels(), seededRange(seed, 16000, 72000));
  const marketCapCr = Math.round(seededRange(seed, 8000, 480000));
  const ratingPool: StockAnalystRating[] = ["Buy", "Hold", "Buy", "Strong Buy", "Hold"];
  const rating = ratingPool[seed % ratingPool.length];

  return {
    fundamentals: {
      marketCapCr,
      peRatio: Math.round(seededRange(seed, 14, 42) * 10) / 10,
      pbRatio: Math.round(seededRange(seed + 1, 1.5, 9) * 10) / 10,
      roce: Math.round(seededRange(seed + 2, 8, 28) * 10) / 10,
      roe: Math.round(seededRange(seed + 3, 8, 26) * 10) / 10,
      eps: Math.round(seededRange(seed + 4, 12, 95) * 100) / 100,
      bookValue: Math.round(seededRange(seed + 5, 80, 620) * 100) / 100,
      faceValue: [1, 2, 5, 10][seed % 4],
      dividendYieldPct: Math.round(seededRange(seed + 6, 0.2, 3.4) * 100) / 100,
    },
    financials: {
      quarterly,
      profitLoss,
      balanceSheet: buildAnnualLabels().map((label, index) => {
        const totalAssetsCr = Math.round(seededRange(seed + index * 9, 20000, 160000));
        const totalDebtCr = Math.round(totalAssetsCr * seededRange(seed + index, 0.08, 0.32));
        const totalEquityCr = Math.round(totalAssetsCr * seededRange(seed + index * 2, 0.45, 0.7));
        return {
          label,
          totalAssetsCr,
          totalLiabilitiesCr: totalAssetsCr - totalEquityCr,
          totalEquityCr,
          totalDebtCr,
          reservesCr: Math.round(totalEquityCr * seededRange(seed + index * 4, 0.6, 0.9)),
        };
      }),
      cashFlow: buildAnnualLabels().map((label, index) => {
        const operatingCr = Math.round(seededRange(seed + index * 6, 3000, 24000));
        const investingCr = -Math.round(seededRange(seed + index * 8, 1000, 12000));
        const financingCr = -Math.round(seededRange(seed + index * 10, 500, 9000));
        return {
          label,
          operatingCr,
          investingCr,
          financingCr,
          netCashFlowCr: operatingCr + investingCr + financingCr,
        };
      }),
    },
    peerComparison: {
      peers: [
        { symbol: "PEER1", name: "Peer Industries Ltd", price: Math.round(seededRange(seed + 11, 200, 3800)), peRatio: Math.round(seededRange(seed + 12, 12, 38) * 10) / 10, roce: Math.round(seededRange(seed + 13, 9, 24) * 10) / 10, marketCapCr: Math.round(seededRange(seed + 14, 5000, 300000)) },
        { symbol: "PEER2", name: "Peer Enterprises Ltd", price: Math.round(seededRange(seed + 15, 200, 3800)), peRatio: Math.round(seededRange(seed + 16, 12, 38) * 10) / 10, roce: Math.round(seededRange(seed + 17, 9, 24) * 10) / 10, marketCapCr: Math.round(seededRange(seed + 18, 5000, 300000)) },
        { symbol: "PEER3", name: "Peer Group Ltd", price: Math.round(seededRange(seed + 19, 200, 3800)), peRatio: Math.round(seededRange(seed + 20, 12, 38) * 10) / 10, roce: Math.round(seededRange(seed + 21, 9, 24) * 10) / 10, marketCapCr: Math.round(seededRange(seed + 22, 5000, 300000)) },
      ],
    },
    insights: {
      strengths: [
        { id: "s1", text: "Consistent revenue growth over the last several reporting periods." },
        { id: "s2", text: "Healthy return ratios relative to sector peers." },
        { id: "s3", text: "Manageable debt levels on the balance sheet." },
      ],
      risks: [
        { id: "r1", text: "Exposure to input-cost and margin volatility." },
        { id: "r2", text: "Sensitive to broader sector and macro cycles." },
        { id: "r3", text: "Competitive pressure within its industry." },
      ],
      analystSummary: {
        rating,
        scoreOutOf5: Math.round(seededRange(seed + 30, 2.6, 4.6) * 10) / 10,
        distribution: {
          buy: Math.round(seededRange(seed + 31, 35, 70)),
          hold: Math.round(seededRange(seed + 32, 15, 40)),
          sell: Math.round(seededRange(seed + 33, 3, 20)),
        },
        meanTargetPrice: Math.round(seededRange(seed + 34, 200, 4200)),
        impliedUpsidePct: Math.round(seededRange(seed + 35, -8, 22) * 10) / 10,
        analystCount: Math.round(seededRange(seed + 36, 6, 34)),
      },
    },
    companyProfile: {
      description: `${symbol} operates in its listed sector on ${exchange}, with operations spanning multiple business lines. This overview uses placeholder company information pending real company-profile data.`,
      industry: "Diversified",
      sector: "General",
      foundedYear: 1970 + (seed % 45),
      headquarters: "India",
      employees: `${Math.round(seededRange(seed + 40, 500, 180000)).toLocaleString("en-IN")}+`,
      presence: ["India", "Select international markets"],
      productsServices: ["Core products", "Ancillary services"],
    },
    faq: [
      {
        question: `What does ${symbol} do?`,
        answer: `${symbol} is a company listed on ${exchange}. Company profile details shown here are placeholder content pending real data.`,
      },
      {
        question: "Is this stock suitable for long-term investors?",
        answer:
          "Suitability depends on individual investment goals and risk tolerance. Review the fundamentals, financials, and risk factors above before deciding.",
      },
      {
        question: "How is the company performing financially?",
        answer:
          "See the Financial Statements section above for quarterly and annual trends across income, profitability, and margins.",
      },
      {
        question: "What are the major risks?",
        answer: "See the Risks section above for a summary of the key factors to be aware of.",
      },
      {
        question: "How does it compare with peers?",
        answer: "See the Peer Comparison table above for a side-by-side view against similar companies.",
      },
    ],
  };
}

const NAMED_MOCK_ENTRIES: Record<string, () => StockDetailMockData> = {
  TCS: () => ({
    ...buildGenericMockDetail("TCS", "BSE"),
    companyProfile: {
      description:
        "Tata Consultancy Services is a global IT services, consulting, and business solutions organization, part of the Tata Group. It partners with clients across industries on technology-led transformation.",
      industry: "IT Services & Consulting",
      sector: "Information Technology",
      foundedYear: 1968,
      headquarters: "Mumbai, India",
      employees: "600,000+",
      website: "https://www.tcs.com",
      presence: ["India", "North America", "Europe", "Asia Pacific"],
      productsServices: ["IT consulting", "Cloud & digital services", "Enterprise application services", "BPO services"],
    },
  }),
  RELIANCE: () => ({
    ...buildGenericMockDetail("RELIANCE", "BSE"),
    companyProfile: {
      description:
        "Reliance Industries is a diversified conglomerate with operations spanning energy, petrochemicals, retail, and digital services through Jio and Reliance Retail.",
      industry: "Conglomerate",
      sector: "Energy & Retail",
      foundedYear: 1966,
      headquarters: "Mumbai, India",
      employees: "195,000+",
      website: "https://www.ril.com",
      presence: ["India", "Middle East", "Global energy markets"],
      productsServices: ["Petrochemicals & refining", "Digital services (Jio)", "Retail", "New energy"],
    },
  }),
  INFY: () => ({
    ...buildGenericMockDetail("INFY", "BSE"),
    companyProfile: {
      description:
        "Infosys is a global leader in next-generation digital services and consulting, helping clients navigate their digital transformation across industries and geographies.",
      industry: "IT Services & Consulting",
      sector: "Information Technology",
      foundedYear: 1981,
      headquarters: "Bengaluru, India",
      employees: "315,000+",
      website: "https://www.infosys.com",
      presence: ["India", "North America", "Europe", "Asia Pacific"],
      productsServices: ["Digital & cloud consulting", "Enterprise application services", "Engineering services", "BPM services"],
    },
  }),
};

export function getMockStockDetail(symbol: string, exchange: string): StockDetailMockData {
  const normalizedSymbol = symbol.trim().toUpperCase();
  const named = NAMED_MOCK_ENTRIES[normalizedSymbol];
  if (named) return named();

  return buildGenericMockDetail(normalizedSymbol, exchange.trim().toUpperCase());
}
