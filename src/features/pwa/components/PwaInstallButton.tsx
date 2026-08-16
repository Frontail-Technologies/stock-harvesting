"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { cn } from "@/utils/cn";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

type PwaInstallButtonProps = {
  compact?: boolean;
  className?: string;
};

function isStandaloneDisplay() {
  return window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in window.navigator && Boolean(window.navigator.standalone));
}

function isIosInstallBrowser() {
  const userAgent = window.navigator.userAgent.toLowerCase();
  const isiOS = /iphone|ipad|ipod/.test(userAgent);
  const isSafari = /safari/.test(userAgent) && !/crios|fxios|edgios/.test(userAgent);
  return isiOS && isSafari;
}

export function PwaInstallButton({ compact = false, className }: PwaInstallButtonProps) {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [manualInstallAvailable, setManualInstallAvailable] = useState(false);

  useEffect(() => {
    if (isStandaloneDisplay()) return;
    const frame = window.requestAnimationFrame(() =>
      setManualInstallAvailable(isIosInstallBrowser())
    );

    const handlePrompt = (event: Event) => {
      event.preventDefault();
      setManualInstallAvailable(false);
      setPromptEvent(event as BeforeInstallPromptEvent);
    };

    const handleInstalled = () => setPromptEvent(null);

    window.addEventListener("beforeinstallprompt", handlePrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("beforeinstallprompt", handlePrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  if (!promptEvent && !manualInstallAvailable) return null;

  return (
    <button
      type="button"
      aria-label="Install app"
      title="Install app"
      onClick={async () => {
        if (!promptEvent) {
          window.alert("To install Stock Harvesting, open Share and choose Add to Home Screen.");
          return;
        }

        await promptEvent.prompt();
        await promptEvent.userChoice.catch(() => null);
        setPromptEvent(null);
      }}
      className={cn(
        "inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-border bg-background px-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        compact && "size-9 px-0",
        className
      )}
    >
      <Download className="size-4" />
      {!compact && <span className="hidden lg:inline">Install</span>}
    </button>
  );
}