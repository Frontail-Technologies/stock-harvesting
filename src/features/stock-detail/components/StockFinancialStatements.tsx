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
  StockBalanceSheetPeriod,
  StockCashFlowPeriod,
  StockFinancialPeriod,
  StockFinancials,
  StockFinancialStatementTab,
} from "../types";

type StockFinancialStatementsProps = {
  financials: StockFinancials;
  currency: string;
};

type FieldConfig<T> = {
  label: string;
  value: (period: T) => string;
};

const TAB_LABEL: Record<StockFinancialStatementTab, string> = {
  quarterly: "Quarterly Results",
  profitLoss: "Profit & Loss",
  balanceSheet: "Balance Sheet",
  cashFlow: "Cash Flow",
};

const TAB_ORDER: StockFinancialStatementTab[] = ["quarterly", "profitLoss", "balanceSheet", "cashFlow"];

// Same field/value definitions drive both the desktop table's columns and
// the mobile stacked record's rows - one source of truth, no duplicated
// formatting or calculations between the two layouts.
function buildPeriodFieldConfigs(money: (value: number) => string, currency: string) {
  const incomeFields: FieldConfig<StockFinancialPeriod>[] = [
    { label: "Total Income", value: (p) => money(p.totalIncomeCr) },
    { label: "EBITDA", value: (p) => money(p.ebitdaCr) },
    { label: "EBITDA Margin", value: (p) => `${p.ebitdaMarginPct}%` },
    { label: "PAT", value: (p) => money(p.patCr) },
    { label: "Net Profit Margin", value: (p) => `${p.netProfitMarginPct}%` },
    { label: "EPS", value: (p) => formatCurrencyValue(p.epsValue, currency) },
    { label: "Operating Margin", value: (p) => `${p.operatingMarginPct}%` },
  ];

  const balanceSheetFields: FieldConfig<StockBalanceSheetPeriod>[] = [
    { label: "Total Assets", value: (p) => money(p.totalAssetsCr) },
    { label: "Total Liabilities", value: (p) => money(p.totalLiabilitiesCr) },
    { label: "Total Equity", value: (p) => money(p.totalEquityCr) },
    { label: "Total Debt", value: (p) => money(p.totalDebtCr) },
    { label: "Reserves", value: (p) => money(p.reservesCr) },
  ];

  const cashFlowFields: FieldConfig<StockCashFlowPeriod>[] = [
    { label: "Operating", value: (p) => money(p.operatingCr) },
    { label: "Investing", value: (p) => money(p.investingCr) },
    { label: "Financing", value: (p) => money(p.financingCr) },
    { label: "Net Cash Flow", value: (p) => money(p.netCashFlowCr) },
  ];

  return { incomeFields, balanceSheetFields, cashFlowFields };
}

function StackedRecords<T extends { label: string }>({
  periods,
  fields,
}: {
  periods: T[];
  fields: FieldConfig<T>[];
}) {
  return (
    <div className="flex flex-col divide-y divide-border">
      {periods.map((period) => (
        <div key={period.label} className="py-3 first:pt-0">
          <p className="text-sm font-semibold text-foreground">{period.label}</p>
          <dl className="mt-1.5 flex flex-col gap-1">
            {fields.map((field) => (
              <div key={field.label} className="flex items-center justify-between gap-3">
                <dt className="text-xs text-muted-foreground">{field.label}</dt>
                <dd className="text-xs font-medium tabular-nums text-foreground">
                  {field.value(period)}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  );
}

export function StockFinancialStatements({ financials, currency }: StockFinancialStatementsProps) {
  const [tab, setTab] = useState<StockFinancialStatementTab>("quarterly");
  const money = (value: number) => `${formatCurrencyValue(value, currency)} Cr`;
  const { incomeFields, balanceSheetFields, cashFlowFields } = buildPeriodFieldConfigs(money, currency);

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

      {/* Desktop/tablet: unchanged full-width table. */}
      <div className="-mx-4 mt-3 hidden overflow-x-auto sm:block sm:-mx-5">
        {(tab === "quarterly" || tab === "profitLoss") && (
          <Table>
            <TableHeader className="bg-foreground/5">
              <TableRow>
                <TableHead>Period</TableHead>
                {incomeFields.map((field) => (
                  <TableHead key={field.label} className="text-right">
                    {field.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {financials[tab].map((period) => (
                <TableRow key={period.label}>
                  <TableCell className="font-medium text-foreground">{period.label}</TableCell>
                  {incomeFields.map((field) => (
                    <TableCell key={field.label} className="text-right tabular-nums">
                      {field.value(period)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {tab === "balanceSheet" && (
          <Table>
            <TableHeader className="bg-foreground/5">
              <TableRow>
                <TableHead>Period</TableHead>
                {balanceSheetFields.map((field) => (
                  <TableHead key={field.label} className="text-right">
                    {field.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {financials.balanceSheet.map((period) => (
                <TableRow key={period.label}>
                  <TableCell className="font-medium text-foreground">{period.label}</TableCell>
                  {balanceSheetFields.map((field) => (
                    <TableCell key={field.label} className="text-right tabular-nums">
                      {field.value(period)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {tab === "cashFlow" && (
          <Table>
            <TableHeader className="bg-foreground/5">
              <TableRow>
                <TableHead>Period</TableHead>
                {cashFlowFields.map((field) => (
                  <TableHead key={field.label} className="text-right">
                    {field.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {financials.cashFlow.map((period) => (
                <TableRow key={period.label}>
                  <TableCell className="font-medium text-foreground">{period.label}</TableCell>
                  {cashFlowFields.map((field) => (
                    <TableCell key={field.label} className="text-right tabular-nums">
                      {field.value(period)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Mobile: stacked per-period records instead of a squeezed table. */}
      <div className="mt-1 sm:hidden">
        {(tab === "quarterly" || tab === "profitLoss") && (
          <StackedRecords periods={financials[tab]} fields={incomeFields} />
        )}
        {tab === "balanceSheet" && (
          <StackedRecords periods={financials.balanceSheet} fields={balanceSheetFields} />
        )}
        {tab === "cashFlow" && (
          <StackedRecords periods={financials.cashFlow} fields={cashFlowFields} />
        )}
      </div>
    </div>
  );
}
