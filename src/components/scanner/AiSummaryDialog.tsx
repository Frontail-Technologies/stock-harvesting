"use client";

import { Sparkles } from "lucide-react";
import type { Stock } from "@/types/market";
import { mockMeasurementBoxes, mockWeeklyCandles } from "@/lib/mock-candles";
import {
  changeColorClass,
  formatCompactVolume,
  formatCurrency,
  formatSignedChange,
} from "@/lib/formatters";
import { TIMEFRAME_LABEL, type Timeframe } from "@/components/scanner/TimeframeSelector";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

function zonePercentValue(percent: string): number {
  const match = percent.match(/\(([-\d.]+)%\)/);
  return match ? Number.parseFloat(match[1]) : 0;
}

function buildSummary(stock: Stock, timeframe: Timeframe) {
  const last = mockWeeklyCandles[mockWeeklyCandles.length - 1];
  const prev = mockWeeklyCandles[mockWeeklyCandles.length - 2];
  const change = last.close - prev.close;
  const changePct = (change / prev.close) * 100;
  const { text: changeText, isPositive } = formatSignedChange(change, changePct);

  const trendWord = isPositive ? "bullish" : "bearish";
  const directionWord = isPositive ? "gained" : "declined";

  const strongestZone = [...mockMeasurementBoxes].sort(
    (a, b) => zonePercentValue(b.percent) - zonePercentValue(a.percent)
  )[0];

  const headline = `${stock.symbol} is showing a ${trendWord} structure on the ${TIMEFRAME_LABEL[timeframe]} chart, having ${directionWord} ${changeText} in the latest bar to close at ${formatCurrency(
    last.close
  )}.`;

  const points = [
    `The latest bar ranged between a low of ${formatCurrency(last.low)} and a high of ${formatCurrency(
      last.high
    )}, on volume of ${formatCompactVolume(last.volume)}.`,
    `The scanner flagged ${mockMeasurementBoxes.length} scan zones on this chart — the strongest shows a ${strongestZone.percent} move over ${strongestZone.bars}.`,
    `Multiple rally phases rather than a single spike suggest the move has been broadly sustained rather than a one-off breakout.`,
  ];

  return { headline, points, isPositive, changeText };
}

type AiSummaryDialogProps = {
  stock: Stock;
  timeframe: Timeframe;
};

export function AiSummaryDialog({ stock, timeframe }: AiSummaryDialogProps) {
  const { headline, points, isPositive, changeText } = buildSummary(stock, timeframe);

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 border-primary/40 bg-primary/5 text-primary hover:bg-primary/10"
          />
        }
      >
        <Sparkles className="size-3.5" />
        Summarize with AI
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-full bg-primary/15 text-primary">
              <Sparkles className="size-3.5" />
            </span>
            <DialogTitle>AI Chart Summary</DialogTitle>
          </div>
          <DialogDescription>
            Mock preview generated from chart data — not connected to a live model.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-border text-foreground">
              {stock.symbol}
            </Badge>
            <Badge variant="outline" className="border-border text-muted-foreground">
              {TIMEFRAME_LABEL[timeframe]}
            </Badge>
            <span className={`text-xs font-medium ${changeColorClass(isPositive)}`}>
              {changeText}
            </span>
          </div>

          <p className="text-foreground">{headline}</p>

          <ul className="flex flex-col gap-2">
            {points.map((point) => (
              <li key={point} className="flex gap-2 text-muted-foreground">
                <span className="mt-1.5 size-1 shrink-0 rounded-full bg-primary" />
                {point}
              </li>
            ))}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}
