"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { formatCurrencyValue } from "@/features/currency/lib/currency-formatters";
import type {
  StockFinancials,
  StockFinancialStatementTab,
} from "../types";

type StockFinancialStatementsProps = {
  financials: StockFinancials;
  currency: string;
};

const TAB_LABEL: Record<StockFinancialStatementTab, string> = {
  quarterly: "Quarterly Results",
  profitLoss: "Profit & Loss",
  balanceSheet: "Balance Sheet",
  cashFlow: "Cash Flow",
};

const TAB_ORDER: StockFinancialStatementTab[] = ["quarterly", "profitLoss", "balanceSheet", "cashFlow"];

export function StockFinancialStatements({ financials, currency }: StockFinancialStatementsProps) {
  const [tab, setTab] = useState<StockFinancialStatementTab>("quarterly");
  const money = (value: number) => `${formatCurrencyValue(value, currency)} Cr`;

  return (
    <div>
      <div className="flex items-center gap-2 overflow-x-auto border-b border-border pb-3">
        <ToggleGroup
          value={[tab]}
          onValueChange={(values) => {
            const next = values[0] as StockFinancialStatementTab | undefined;
            if (next) setTab(next);
          }}
          className="flex items-center gap-0.5"
        >
          {TAB_ORDER.map((option) => (
            <ToggleGroupItem
              key={option}
              value={option}
              className="h-7 shrink-0 cursor-pointer rounded px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:hover:bg-primary data-[state=on]:hover:text-primary-foreground"
            >
              {TAB_LABEL[option]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <div className="mt-3 overflow-x-auto">
        {(tab === "quarterly" || tab === "profitLoss") && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead className="text-right">Total Income</TableHead>
                <TableHead className="text-right">EBITDA</TableHead>
                <TableHead className="text-right">EBITDA Margin</TableHead>
                <TableHead className="text-right">PAT</TableHead>
                <TableHead className="text-right">Net Profit Margin</TableHead>
                <TableHead className="text-right">EPS</TableHead>
                <TableHead className="text-right">Operating Margin</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {financials[tab].map((period) => (
                <TableRow key={period.label}>
                  <TableCell className="font-medium text-foreground">{period.label}</TableCell>
                  <TableCell className="text-right tabular-nums">{money(period.totalIncomeCr)}</TableCell>
                  <TableCell className="text-right tabular-nums">{money(period.ebitdaCr)}</TableCell>
                  <TableCell className="text-right tabular-nums">{period.ebitdaMarginPct}%</TableCell>
                  <TableCell className="text-right tabular-nums">{money(period.patCr)}</TableCell>
                  <TableCell className="text-right tabular-nums">{period.netProfitMarginPct}%</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrencyValue(period.epsValue, currency)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{period.operatingMarginPct}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {tab === "balanceSheet" && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead className="text-right">Total Assets</TableHead>
                <TableHead className="text-right">Total Liabilities</TableHead>
                <TableHead className="text-right">Total Equity</TableHead>
                <TableHead className="text-right">Total Debt</TableHead>
                <TableHead className="text-right">Reserves</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {financials.balanceSheet.map((period) => (
                <TableRow key={period.label}>
                  <TableCell className="font-medium text-foreground">{period.label}</TableCell>
                  <TableCell className="text-right tabular-nums">{money(period.totalAssetsCr)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {money(period.totalLiabilitiesCr)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{money(period.totalEquityCr)}</TableCell>
                  <TableCell className="text-right tabular-nums">{money(period.totalDebtCr)}</TableCell>
                  <TableCell className="text-right tabular-nums">{money(period.reservesCr)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {tab === "cashFlow" && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead className="text-right">Operating</TableHead>
                <TableHead className="text-right">Investing</TableHead>
                <TableHead className="text-right">Financing</TableHead>
                <TableHead className="text-right">Net Cash Flow</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {financials.cashFlow.map((period) => (
                <TableRow key={period.label}>
                  <TableCell className="font-medium text-foreground">{period.label}</TableCell>
                  <TableCell className="text-right tabular-nums">{money(period.operatingCr)}</TableCell>
                  <TableCell className="text-right tabular-nums">{money(period.investingCr)}</TableCell>
                  <TableCell className="text-right tabular-nums">{money(period.financingCr)}</TableCell>
                  <TableCell className="text-right font-medium tabular-nums text-foreground">
                    {money(period.netCashFlowCr)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
