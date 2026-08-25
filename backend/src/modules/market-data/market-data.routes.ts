import { Router } from "express";

import type { CandleTimeframe } from "../../shared/constants";
import { sendData } from "../../shared/http";
import { asyncHandler, requireAuth, validate } from "../../shared/middleware";
import {
  candleParamsSchema,
  candleQuerySchema,
  historyRangeQuerySchema,
  indexRelativeStrengthQuerySchema,
  stockListQuerySchema,
  type MoveFilter,
} from "./market-data.schemas";
import {
  getChartCandles,
  getChartHistoryRange,
  getIndexRelativeStrength,
  listExchangeRates,
  listStocks,
  listSupportedExchanges,
} from "./market-data.service";

export const marketDataRouter = Router();

// Public: the global stock search (navbar, landing hero, Ctrl+K command
// panel) must work for signed-out visitors on the public marketing site,
// not just inside the authenticated app. This is a pure read of public
// market data (symbol/name/exchange/price) - no user-specific data, no
// mutation - so it's safe to expose without a session. Registered before
// the router-wide requireAuth below so only this one route is public;
// every other market-data route (including the near-identical /stocks
// list) stays authenticated exactly as before.
marketDataRouter.get(
  "/stocks/search",
  validate({ query: stockListQuerySchema }),
  asyncHandler(async (req, res) => {
    const query = req.query as unknown as {
      q?: string;
      page: number;
      limit: number;
      sortBy: "symbol" | "name" | "close" | "changePct" | "volume";
      sortDirection: "asc" | "desc";
      exchange: string;
      moveFilter: MoveFilter;
      minVolume?: number;
      includeUnpriced?: boolean;
    };
    sendData(res, await listStocks(query));
  })
);

marketDataRouter.use(requireAuth);

marketDataRouter.get("/exchanges", asyncHandler(async (_req, res) => {
  sendData(res, { exchanges: await listSupportedExchanges() });
}));

marketDataRouter.get("/exchange-rates", asyncHandler(async (_req, res) => {
  sendData(res, await listExchangeRates());
}));

marketDataRouter.get(
  "/index-relative-strength",
  validate({ query: indexRelativeStrengthQuerySchema }),
  asyncHandler(async (req, res) => {
    const query = req.query as unknown as { limit: number; exchange: string };
    sendData(res, { metrics: await getIndexRelativeStrength(query.limit, query.exchange) });
  })
);

marketDataRouter.get("/stocks", validate({ query: stockListQuerySchema }), asyncHandler(async (req, res) => {
  const query = req.query as unknown as {
    q?: string;
    page: number;
    limit: number;
    sortBy: "symbol" | "name" | "close" | "changePct" | "volume";
    sortDirection: "asc" | "desc";
    exchange: string;
    moveFilter: MoveFilter;
    minVolume?: number;
    includeUnpriced?: boolean;
  };
  sendData(res, await listStocks(query));
}));

marketDataRouter.get(
  "/history-range",
  validate({ query: historyRangeQuerySchema }),
  asyncHandler(async (req, res) => {
    const query = req.query as unknown as {
      symbol: string;
      timeframe: CandleTimeframe;
      exchange: string;
    };

    sendData(res, await getChartHistoryRange(query));
  })
);

marketDataRouter.get(
  "/charts/:symbol/candles",
  validate({ params: candleParamsSchema, query: candleQuerySchema }),
  asyncHandler(async (req, res) => {
    const params = req.params as { symbol: string };
    const query = req.query as unknown as {
      timeframe: CandleTimeframe;
      from?: string;
      to?: string;
      exchange: string;
    };
    const candleRows = await getChartCandles({
      symbol: params.symbol,
      timeframe: query.timeframe,
      from: query.from,
      to: query.to,
      exchange: query.exchange,
    });

    sendData(res, { candles: candleRows });
  })
);
