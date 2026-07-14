"use client";

import { useMemo, useState } from "react";
import { Send, Sparkles } from "lucide-react";
import type { Stock } from "@/types/market";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { Timeframe } from "../types";

type AiSummaryButtonProps = {
  stock: Stock;
  timeframe: Timeframe;
};

type ChatMessage = {
  id: number;
  role: "user" | "assistant";
  text: string;
};

function buildMockAnswer(question: string, stock: Stock, timeframe: Timeframe) {
  const q = question.toLowerCase();

  if (q.includes("risk") || q.includes("stop")) {
    return `${stock.symbol} should be treated as a momentum setup only while price holds above the latest highlighted zone. Watch failed breakouts and expanding red volume as the first risk warning.`;
  }

  if (q.includes("entry") || q.includes("buy")) {
    return `For ${stock.symbol}, I would wait for a clean close above the recent consolidation high on the ${timeframe} chart. Avoid chasing candles inside the highlighted zone without follow-through.`;
  }

  if (q.includes("volume")) {
    return `Volume confirmation matters here: stronger green volume during the highlighted windows is constructive, while flat volume makes the scan signal weaker.`;
  }

  return `${stock.symbol} is showing scanner-highlighted momentum context on the ${timeframe} chart. The best next check is whether price is consolidating above the highlighted area instead of immediately reversing through it.`;
}

export function AiSummaryButton({ stock, timeframe }: AiSummaryButtonProps) {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const starterPrompts = useMemo(
    () => [
      "Is this setup risky?",
      "Where is a clean entry?",
      "Does volume confirm it?",
    ],
    []
  );

  const askQuestion = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    setMessages((current) => [
      ...current,
      { id: Date.now(), role: "user", text: trimmed },
      {
        id: Date.now() + 1,
        role: "assistant",
        text: buildMockAnswer(trimmed, stock, timeframe),
      },
    ]);
    setQuestion("");
  };

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" />
        }
      >
        <Sparkles className="size-3.5" />
        <span className="hidden sm:inline">AI Summary</span>
      </DialogTrigger>
      <DialogContent className="scanner-portal max-w-lg">
        <DialogHeader>
          <DialogTitle>{stock.symbol} AI Assistant</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm text-foreground">
          <div className="flex flex-wrap gap-2">
            {starterPrompts.map((prompt) => (
              <Button
                key={prompt}
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => askQuestion(prompt)}
              >
                {prompt}
              </Button>
            ))}
          </div>

          <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
            {messages.length === 0 ? (
              <p className="rounded-md border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
                No questions yet.
              </p>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={
                    message.role === "user"
                      ? "ml-8 rounded-md bg-primary px-3 py-2 text-primary-foreground"
                      : "mr-8 rounded-md bg-muted px-3 py-2 text-muted-foreground"
                  }
                >
                  {message.text}
                </div>
              ))
            )}
          </div>

          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              askQuestion(question);
            }}
          >
            <Input
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Ask about this chart..."
              className="h-9 bg-background"
            />
            <Button type="submit" size="sm" className="h-9 gap-1.5">
              <Send className="size-3.5" />
              Ask
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
