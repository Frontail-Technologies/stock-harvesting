import { apiFetch, API_ROUTES } from "@/features/api";
import type { Timeframe } from "../types";

export type AiChatTurn = { role: "user" | "assistant"; text: string };

export function askScannerQuestion(input: {
  symbol: string;
  question: string;
  timeframe: Timeframe;
  exchange: string;
  history: AiChatTurn[];
}) {
  return apiFetch<{ answer: string }>(API_ROUTES.ai.ask(input.symbol), {
    method: "POST",
    body: JSON.stringify({
      question: input.question,
      timeframe: input.timeframe,
      exchange: input.exchange,
      history: input.history,
    }),
  });
}
