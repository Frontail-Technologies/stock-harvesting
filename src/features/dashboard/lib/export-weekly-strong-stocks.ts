"use client";

import type { CollectionWeeklyStrongStock } from "@/features/market-collections";
import { downloadBlob } from "@/utils/download-blob";

// Exports exactly the rows currently visible in the table (whatever
// search/sort the user has applied) - never a separate "export all"
// query, so what downloads always matches what's on screen. Columns
// mirror the table's own (Sr. No./Symbol/Stock Name/Close/% Change/
// Return/Volume), plus Exchange - not a table column, but free context
// every row already carries and genuinely useful once the data leaves
// the app (Close's currency/market context isn't otherwise implied).
const EXPORT_HEADERS = [
  "Sr. No.",
  "Symbol",
  "Exchange",
  "Stock Name",
  "Close",
  "% Change",
  "Return",
  "Volume",
] as const;

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

// Raw numbers, not display strings ("+12.84%", "4.25M") - the whole point
// of an export is further sorting/filtering/charting in a spreadsheet,
// which pre-formatted text would defeat. A null Return (no currently-open
// qualifying streak) becomes a genuinely blank cell, not a "—" placeholder
// that would force the column to text.
function toExportRow(item: CollectionWeeklyStrongStock, index: number): Array<string | number> {
  return [
    index + 1,
    item.symbol,
    item.exchange,
    item.name,
    round2(item.close),
    round2(item.changePct),
    typeof item.returnPct === "number" ? round2(item.returnPct) : "",
    item.volume,
  ];
}

function csvEscape(value: string | number): string {
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function exportWeeklyStrongStocksToCsv(
  items: CollectionWeeklyStrongStock[],
  filename: string
): void {
  const lines = [
    EXPORT_HEADERS.map(csvEscape).join(","),
    ...items.map((item, index) => toExportRow(item, index).map(csvEscape).join(",")),
  ];
  // Leading BOM so Excel opens the UTF-8 file (rupee symbol, punctuation in
  // company names, etc.) without mangling it - a plain unmarked UTF-8 CSV
  // is the one common case Excel itself gets wrong.
  const blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, filename);
}

export async function exportWeeklyStrongStocksToXlsx(
  items: CollectionWeeklyStrongStock[],
  filename: string
): Promise<void> {
  const { default: ExcelJS } = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Harvest Results");

  sheet.addRow([...EXPORT_HEADERS]);
  sheet.getRow(1).font = { bold: true };
  items.forEach((item, index) => sheet.addRow(toExportRow(item, index)));
  sheet.columns.forEach((column) => {
    column.width = 16;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  downloadBlob(blob, filename);
}
