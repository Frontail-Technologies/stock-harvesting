"use client";

import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

type MarkdownPreviewProps = {
  content: string;
  className?: string;
};

type TableBlock = {
  type: "table";
  headers: string[];
  rows: string[][];
};

type ListBlock = {
  type: "list";
  ordered: boolean;
  items: string[];
};

type TextBlock = {
  type: "heading" | "paragraph" | "code" | "quote";
  text: string;
  level?: number;
};

type MarkdownBlock = TableBlock | ListBlock | TextBlock;

export function MarkdownPreview({ content, className }: MarkdownPreviewProps) {
  return (
    <div className={cn("space-y-3 text-sm leading-6", className)}>
      {parseMarkdownBlocks(content).map((block, index) => (
        <MarkdownBlockView key={index} block={block} />
      ))}
    </div>
  );
}

function MarkdownBlockView({ block }: { block: MarkdownBlock }) {
  if (block.type === "heading") {
    const Tag = block.level === 3 ? "h3" : block.level === 2 ? "h2" : "h4";

    return (
      <Tag className="text-sm font-semibold text-foreground">
        <InlineMarkdown text={block.text} />
      </Tag>
    );
  }

  if (block.type === "list") {
    const ListTag = block.ordered ? "ol" : "ul";

    return (
      <ListTag
        className={cn(
          "space-y-1 pl-5",
          block.ordered ? "list-decimal" : "list-disc"
        )}
      >
        {block.items.map((item, index) => (
          <li key={index}>
            <InlineMarkdown text={item} />
          </li>
        ))}
      </ListTag>
    );
  }

  if (block.type === "table") {
    return (
      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full min-w-96 border-collapse text-xs">
          <thead className="bg-background/80 text-foreground">
            <tr>
              {block.headers.map((header, index) => (
                <th
                  key={index}
                  className="border-b border-r border-border px-2 py-1.5 text-left font-semibold last:border-r-0"
                >
                  <InlineMarkdown text={header} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="odd:bg-background/30">
                {block.headers.map((_, cellIndex) => (
                  <td
                    key={cellIndex}
                    className="border-b border-r border-border px-2 py-1.5 last:border-r-0"
                  >
                    <InlineMarkdown text={row[cellIndex] ?? ""} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (block.type === "code") {
    return (
      <pre className="overflow-x-auto rounded-md bg-background/80 p-3 text-xs text-foreground">
        <code>{block.text}</code>
      </pre>
    );
  }

  if (block.type === "quote") {
    return (
      <blockquote className="border-l-2 border-primary/70 pl-3 text-muted-foreground">
        <InlineMarkdown text={block.text} />
      </blockquote>
    );
  }

  return (
    <p className="text-foreground/90">
      <InlineMarkdown text={block.text} />
    </p>
  );
}

function InlineMarkdown({ text }: { text: string }) {
  return <>{parseInlineMarkdown(text)}</>;
}

function parseInlineMarkdown(text: string) {
  const segments: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push(text.slice(lastIndex, match.index));
    }

    const value = match[0];
    if (value.startsWith("**")) {
      segments.push(
        <strong key={match.index} className="font-semibold text-foreground">
          {value.slice(2, -2)}
        </strong>
      );
    } else {
      segments.push(
        <code
          key={match.index}
          className="rounded bg-background px-1 py-0.5 text-[0.8em] text-foreground"
        >
          {value.slice(1, -1)}
        </code>
      );
    }

    lastIndex = match.index + value.length;
  }

  if (lastIndex < text.length) segments.push(text.slice(lastIndex));
  return segments;
}

function parseMarkdownBlocks(content: string): MarkdownBlock[] {
  const lines = content.replace(/\r\n/g, "\n").replace(/\u2022/g, "-").split("\n");
  const blocks: MarkdownBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index]?.trim() ?? "";
    if (!line) {
      index += 1;
      continue;
    }

    if (line.startsWith("```")) {
      const codeLines: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index]?.trim().startsWith("```")) {
        codeLines.push(lines[index] ?? "");
        index += 1;
      }
      blocks.push({ type: "code", text: codeLines.join("\n") });
      index += 1;
      continue;
    }

    if (isTableStart(lines, index)) {
      const headers = splitTableRow(lines[index] ?? "");
      index += 2;
      const rows: string[][] = [];
      while (index < lines.length && isTableRow(lines[index] ?? "")) {
        rows.push(splitTableRow(lines[index] ?? ""));
        index += 1;
      }
      blocks.push({ type: "table", headers, rows });
      continue;
    }

    const quoteMatch = line.match(/^>\s+(.+)$/);
    if (quoteMatch) {
      const quoteLines = [quoteMatch[1] ?? ""];
      index += 1;
      while (index < lines.length) {
        const nextQuoteMatch = lines[index]?.trim().match(/^>\s+(.+)$/);
        if (!nextQuoteMatch) break;
        quoteLines.push(nextQuoteMatch[1] ?? "");
        index += 1;
      }
      blocks.push({ type: "quote", text: quoteLines.join(" ") });
      continue;
    }

    const listMatch = line.match(/^(\d+[.)]|[-*+])\s+(.+)$/);
    if (listMatch) {
      const ordered = /^\d+[.)]/.test(listMatch[1] ?? "");
      const items: string[] = [];
      while (index < lines.length) {
        const itemMatch = lines[index]?.trim().match(/^(\d+[.)]|[-*+])\s+(.+)$/);
        if (!itemMatch || /^\d+[.)]/.test(itemMatch[1] ?? "") !== ordered) break;
        items.push(itemMatch[2] ?? "");
        index += 1;
      }
      blocks.push({ type: "list", ordered, items });
      continue;
    }

    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      blocks.push({
        type: "heading",
        level: headingMatch[1]?.length ?? 3,
        text: headingMatch[2] ?? "",
      });
      index += 1;
      continue;
    }

    const paragraphLines = [line];
    index += 1;
    while (
      index < lines.length &&
      lines[index]?.trim() &&
      !isTableStart(lines, index) &&
      !lines[index]?.trim().match(/^(\d+[.)]|[-*+])\s+(.+)$/) &&
      !lines[index]?.trim().match(/^>\s+(.+)$/) &&
      !lines[index]?.trim().match(/^(#{1,3})\s+(.+)$/) &&
      !lines[index]?.trim().startsWith("```")
    ) {
      paragraphLines.push(lines[index]?.trim() ?? "");
      index += 1;
    }

    blocks.push({ type: "paragraph", text: paragraphLines.join(" ") });
  }

  return blocks.length ? blocks : [{ type: "paragraph", text: content }];
}

function isTableStart(lines: string[], index: number) {
  return isTableRow(lines[index] ?? "") && isTableSeparator(lines[index + 1] ?? "");
}

function isTableRow(line: string) {
  const trimmed = line.trim();
  return trimmed.includes("|") && splitTableRow(trimmed).length > 1;
}

function isTableSeparator(line: string) {
  return /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(line.trim());
}

function splitTableRow(line: string) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}
