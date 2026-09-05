"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/utils/cn";
import { isTurnstileEnabled, TURNSTILE_SITE_KEY } from "../../constants/turnstile";

type TurnstileStatus = "idle" | "loading" | "ready" | "verified" | "expired" | "error";

type TurnstileRenderOptions = {
  sitekey: string;
  action?: string;
  theme?: "light" | "dark" | "auto";
  callback: (token: string) => void;
  "expired-callback": () => void;
  "error-callback": () => void;
};

type TurnstileApi = {
  render: (container: HTMLElement, options: TurnstileRenderOptions) => string;
  reset: (widgetId?: string) => void;
  remove: (widgetId?: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
    __stockHarvestingTurnstileScript?: Promise<void>;
  }
}

export type TurnstileChallengeHandle = {
  getToken: () => string | null;
  reset: () => void;
};

type TurnstileChallengeProps = {
  action: string;
  className?: string;
  onTokenChange?: (token: string | null) => void;
};

function loadTurnstileScript() {
  if (window.turnstile) return Promise.resolve();
  if (window.__stockHarvestingTurnstileScript) return window.__stockHarvestingTurnstileScript;

  window.__stockHarvestingTurnstileScript = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById("stock-harvesting-turnstile-script") as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Turnstile script failed to load")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = "stock-harvesting-turnstile-script";
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Turnstile script failed to load"));
    document.head.appendChild(script);
  });

  return window.__stockHarvestingTurnstileScript;
}

export const TurnstileChallenge = forwardRef<TurnstileChallengeHandle, TurnstileChallengeProps>(
  function TurnstileChallenge({ action, className, onTokenChange }, ref) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const widgetIdRef = useRef<string | null>(null);
    const tokenRef = useRef<string | null>(null);
    const [status, setStatus] = useState<TurnstileStatus>(isTurnstileEnabled() ? "loading" : "ready");

    useImperativeHandle(ref, () => ({
      getToken: () => tokenRef.current,
      reset: () => {
        tokenRef.current = null;
        onTokenChange?.(null);
        if (widgetIdRef.current && window.turnstile) {
          window.turnstile.reset(widgetIdRef.current);
          setStatus("ready");
        }
      },
    }), [onTokenChange]);

    useEffect(() => {
      if (!isTurnstileEnabled()) return;
      let cancelled = false;

      setStatus("loading");
      loadTurnstileScript()
        .then(() => {
          if (cancelled || !containerRef.current || !window.turnstile) return;
          if (widgetIdRef.current) return;

          widgetIdRef.current = window.turnstile.render(containerRef.current, {
            sitekey: TURNSTILE_SITE_KEY,
            action,
            theme: "auto",
            callback: (token) => {
              tokenRef.current = token;
              setStatus("verified");
              onTokenChange?.(token);
            },
            "expired-callback": () => {
              tokenRef.current = null;
              setStatus("expired");
              onTokenChange?.(null);
            },
            "error-callback": () => {
              tokenRef.current = null;
              setStatus("error");
              onTokenChange?.(null);
            },
          });
          setStatus((current) => (current === "loading" ? "ready" : current));
        })
        .catch(() => {
          if (!cancelled) setStatus("error");
        });

      return () => {
        cancelled = true;
        if (widgetIdRef.current && window.turnstile) {
          window.turnstile.remove(widgetIdRef.current);
        }
        widgetIdRef.current = null;
        tokenRef.current = null;
      };
    }, [action, onTokenChange]);

    if (!isTurnstileEnabled()) {
      return null;
    }

    return (
      <div className={cn("mt-5 flex flex-col items-center gap-2", className)}>
        <div ref={containerRef} className="max-w-full overflow-hidden" />
        {status === "loading" && <Spinner size="sm" label="Checking browser" />}
        {status === "expired" && (
          <p className="text-xs text-muted-foreground">Verification expired. Please verify again.</p>
        )}
        {status === "error" && (
          <p className="text-xs text-destructive">Verification failed. Please try again.</p>
        )}
      </div>
    );
  }
);
