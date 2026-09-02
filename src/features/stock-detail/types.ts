export type StockFundamentals = {
  marketCapCr: number;
  peRatio: number;
  pbRatio: number;
  roce: number;
  roe: number;
  eps: number;
  bookValue: number;
  faceValue: number;
  dividendYieldPct: number;
};

export type StockFinancialPeriod = {
  label: string;
  totalIncomeCr: number;
  ebitdaCr: number;
  ebitdaMarginPct: number;
  patCr: number;
  netProfitMarginPct: number;
  epsValue: number;
  operatingMarginPct: number;
};

export type StockBalanceSheetPeriod = {
  label: string;
  totalAssetsCr: number;
  totalLiabilitiesCr: number;
  totalEquityCr: number;
  totalDebtCr: number;
  reservesCr: number;
};

export type StockCashFlowPeriod = {
  label: string;
  operatingCr: number;
  investingCr: number;
  financingCr: number;
  netCashFlowCr: number;
};

export type StockFinancials = {
  quarterly: StockFinancialPeriod[];
  profitLoss: StockFinancialPeriod[];
  balanceSheet: StockBalanceSheetPeriod[];
  cashFlow: StockCashFlowPeriod[];
};

export type StockFinancialStatementTab = "quarterly" | "profitLoss" | "balanceSheet" | "cashFlow";

export type StockPeer = {
  symbol: string;
  name: string;
  price: number;
  peRatio: number;
  roce: number;
  marketCapCr: number;
};

export type StockPeerComparison = {
  peers: StockPeer[];
};

export type StockStrengthRiskItem = {
  id: string;
  text: string;
};

export type StockAnalystRating = "Strong Buy" | "Buy" | "Hold" | "Sell" | "Strong Sell";

export type StockAnalystDistribution = {
  buy: number;
  hold: number;
  sell: number;
};

export type StockAnalystSummary = {
  rating: StockAnalystRating;
  scoreOutOf5: number;
  distribution: StockAnalystDistribution;
  meanTargetPrice: number;
  impliedUpsidePct: number;
  analystCount: number;
};

export type StockInsights = {
  strengths: StockStrengthRiskItem[];
  risks: StockStrengthRiskItem[];
  analystSummary: StockAnalystSummary;
};

export type StockCompanyProfile = {
  description: string;
  industry: string;
  sector: string;
  foundedYear: number;
  headquarters: string;
  employees: string;
  website?: string;
  presence: string[];
  productsServices: string[];
};

export type StockFaqItem = {
  question: string;
  answer: string;
};

export type StockDetailMockData = {
  fundamentals: StockFundamentals;
  financials: StockFinancials;
  peerComparison: StockPeerComparison;
  insights: StockInsights;
  companyProfile: StockCompanyProfile;
  faq: StockFaqItem[];
};
