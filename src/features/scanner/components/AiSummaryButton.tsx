"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Send, Sparkles } from "lucide-react";
import type { Stock } from "@/types/market";
import { ApiError } from "@/features/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { AiChatTurn } from "../api/ai-api";
import { useAskScannerQuestion } from "../hooks/use-ai-summary";
import type { Timeframe } from "../types";
import { MarkdownPreview } from "./MarkdownPreview";

type AiSummaryButtonProps = {
  stock: Stock;
  timeframe: Timeframe;
  compact?: boolean;
  className?: string;
};

type ChatMessage = {
  id: number;
  role: "user" | "assistant" | "error";
  text: string;
};

const LOADING_STEPS = ["Reading chart data", "Processing candles", "Answering"];

export function AiSummaryButton({ stock, timeframe, compact = false, className }: AiSummaryButtonProps) {
  const storageKey = `stock-harvesting:scanner-ai-chat:${stock.exchange}:${stock.symbol}:${timeframe}`;

  return (
    <AiSummaryDialog
      key={storageKey}
      stock={stock}
      timeframe={timeframe}
      storageKey={storageKey}
      compact={compact}
      className={className}
    />
  );
}

function AiSummaryDialog({
  stock,
  timeframe,
  storageKey,
  compact = false,
  className,
}: AiSummaryButtonProps & { storageKey: string }) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [loadingStep, setLoadingStep] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    readStoredMessages(storageKey)
  );
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const messagesContentRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);
  const askQuestionMutation = useAskScannerQuestion();

  const setMessagesScrollNode = useCallback(
    (node: HTMLDivElement | null) => {
      messagesScrollRef.current = node;
      if (!node || !open) return;

      shouldAutoScrollRef.current = true;
      scrollChatToBottom(node, "auto");
    },
    [open]
  );

  const starterPrompts = useMemo(
    () => [
      "Summarize this stock",
      "Show key support and resistance",
      "Explain trend and volume",
      "What risks stand out?",
    ],
    []
  );

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(messages));
  }, [messages, storageKey]);

  const scrollSignature = `${messages.length}:${
    messages[messages.length - 1]?.id ?? "empty"
  }:${messages[messages.length - 1]?.text.length ?? 0}:${
    askQuestionMutation.isPending ? "pending" : "done"
  }`;

  useLayoutEffect(() => {
    if (!open || !shouldAutoScrollRef.current) return;
    return scrollChatToBottom(messagesScrollRef.current);
  }, [open, scrollSignature]);

  useEffect(() => {
    if (!open) return;

    shouldAutoScrollRef.current = true;
    return scheduleOpenScroll(messagesScrollRef);
  }, [open]);

  useEffect(() => {
    if (!open || !shouldAutoScrollRef.current) return;

    const content = messagesContentRef.current;
    const container = messagesScrollRef.current;
    if (!content || !container) return;

    const observer = new ResizeObserver(() => {
      if (shouldAutoScrollRef.current) scrollChatToBottom(container);
    });

    observer.observe(content);
    return () => observer.disconnect();
  }, [open, scrollSignature]);

  useEffect(() => {
    if (!askQuestionMutation.isPending) return;

    const intervalId = window.setInterval(() => {
      setLoadingStep((current) => (current + 1) % LOADING_STEPS.length);
    }, 900);

    return () => window.clearInterval(intervalId);
  }, [askQuestionMutation.isPending]);

  const askQuestion = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || askQuestionMutation.isPending) return;

    const history: AiChatTurn[] = messages
      .filter(
        (message): message is ChatMessage & { role: "user" | "assistant" } =>
          message.role !== "error"
      )
      .map((message) => ({ role: message.role, text: message.text }));

    setMessages((current) => [
      ...current,
      { id: Date.now(), role: "user", text: trimmed },
    ]);
    shouldAutoScrollRef.current = true;
    setQuestion("");

    try {
      const result = await askQuestionMutation.mutateAsync({
        symbol: stock.symbol,
        question: trimmed,
        timeframe,
        exchange: stock.exchange,
        history,
      });
      setMessages((current) => [
        ...current,
        { id: Date.now() + 1, role: "assistant", text: result.answer },
      ]);
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Couldn't reach the AI assistant. Try again.";
      setMessages((current) => [
        ...current,
        { id: Date.now() + 1, role: "error", text: message },
      ]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size={compact ? "icon" : "sm"}
            className={compact ? className : `gap-1.5 text-muted-foreground ${className ?? ""}`}
          />
        }
      >
        <Sparkles className="size-3.5" />
        {!compact && <span className="hidden sm:inline">AI Summary</span>}
      </DialogTrigger>
      <DialogContent className="scanner-portal flex h-[min(820px,90dvh)] w-[min(1440px,96vw)] max-w-none flex-col sm:max-w-none lg:w-[88vw] xl:w-[82vw] 2xl:w-[1440px]">
        <DialogHeader>
          <DialogTitle>{stock.symbol} AI Assistant</DialogTitle>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-4 text-sm text-foreground">
          <div className="flex flex-wrap gap-2">
            {starterPrompts.map((prompt) => (
              <Button
                key={prompt}
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                disabled={askQuestionMutation.isPending}
                onClick={() => void askQuestion(prompt)}
              >
                {prompt}
              </Button>
            ))}
          </div>

          <div
            ref={setMessagesScrollNode}
            className="min-h-0 flex-1 overflow-y-auto pr-1"
            style={{ overflowAnchor: "none" }}
            onScroll={(event) => {
              shouldAutoScrollRef.current = isNearBottom(event.currentTarget);
            }}
          >
            <div ref={messagesContentRef} className="space-y-4">
              {messages.length === 0 ? (
                <div className="flex min-h-60 items-center justify-center rounded-md border border-dashed border-border px-3 py-10 text-center text-xs text-muted-foreground">
                  Ask for a stock summary, trend read, levels, or risk review.
                </div>
              ) : (
                messages.map((message) => (
                  <ChatMessageItem key={message.id} message={message} />
                ))
              )}
              {askQuestionMutation.isPending ? (
                <AssistantThinking step={LOADING_STEPS[loadingStep] ?? LOADING_STEPS[0]} />
              ) : null}
              <div ref={messagesEndRef} className="h-px" />
            </div>
          </div>

          <form
            className="flex gap-2 border-t border-border pt-3"
            onSubmit={(event) => {
              event.preventDefault();
              void askQuestion(question);
            }}
          >
            <Input
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Ask about this chart..."
              className="h-10 bg-background"
              disabled={askQuestionMutation.isPending}
            />
            <Button
              type="submit"
              size="lg"
              className="h-10 gap-1.5"
              disabled={askQuestionMutation.isPending}
            >
              <Send className="size-3.5" />
              Ask
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function isNearBottom(container: HTMLDivElement) {
  const distanceFromBottom =
    container.scrollHeight - container.scrollTop - container.clientHeight;
  return distanceFromBottom < 80;
}

function scheduleOpenScroll(containerRef: { current: HTMLDivElement | null }) {
  let cancelled = false;
  let frameId = 0;
  const timeoutIds: number[] = [];

  const scroll = () => {
    if (cancelled) return;
    scrollChatToBottom(containerRef.current, "auto");
  };

  scroll();
  frameId = window.requestAnimationFrame(scroll);
  [0, 60, 160, 320, 650, 1000].forEach((delay) => {
    timeoutIds.push(window.setTimeout(scroll, delay));
  });

  return () => {
    cancelled = true;
    window.cancelAnimationFrame(frameId);
    timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
  };
}

function scrollChatToBottom(container: HTMLDivElement | null, behavior: ScrollBehavior = "auto") {
  if (!container) return;

  let frameId = 0;
  const timeoutIds: number[] = [];

  const scroll = () => {
    container.scrollTo({
      top: Math.max(0, container.scrollHeight - container.clientHeight),
      behavior,
    });
  };

  scroll();
  frameId = window.requestAnimationFrame(scroll);
  timeoutIds.push(window.setTimeout(scroll, 80));
  timeoutIds.push(window.setTimeout(scroll, 220));
  timeoutIds.push(window.setTimeout(scroll, 500));

  return () => {
    window.cancelAnimationFrame(frameId);
    timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
  };
}

function ChatMessageItem({ message }: { message: ChatMessage }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[72%] rounded-lg bg-primary px-3 py-2 text-primary-foreground">
          {message.text}
        </div>
      </div>
    );
  }

  if (message.role === "error") {
    return (
      <div className="max-w-[78%] rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-danger">
        {message.text}
      </div>
    );
  }

  return (
    <div className="flex max-w-[92%] gap-3">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Sparkles className="size-4" />
      </div>
      <div className="min-w-0 flex-1 rounded-lg border border-border bg-background/60 px-4 py-3">
        <MarkdownPreview content={message.text} />
      </div>
    </div>
  );
}

function AssistantThinking({ step }: { step: string }) {
  return (
    <div className="flex max-w-[92%] gap-3">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Sparkles className="size-4" />
      </div>
      <div className="rounded-lg border border-border bg-background/60 px-4 py-3 text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="flex gap-1">
            <span className="size-1.5 animate-pulse rounded-full bg-primary" />
            <span className="size-1.5 animate-pulse rounded-full bg-primary [animation-delay:150ms]" />
            <span className="size-1.5 animate-pulse rounded-full bg-primary [animation-delay:300ms]" />
          </span>
          <span>{step}...</span>
        </div>
      </div>
    </div>
  );
}

function readStoredMessages(storageKey: string): ChatMessage[] {
  if (typeof window === "undefined") return [];

  try {
    const storedValue = window.localStorage.getItem(storageKey);
    if (!storedValue) return [];
    const parsed = JSON.parse(storedValue) as ChatMessage[];
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (message) =>
        typeof message.id === "number" &&
        typeof message.text === "string" &&
        ["user", "assistant", "error"].includes(message.role)
    );
  } catch {
    return [];
  }
}
