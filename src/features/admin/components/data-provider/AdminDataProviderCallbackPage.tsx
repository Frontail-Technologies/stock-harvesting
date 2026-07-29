"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/utils/cn";
import { useConnectAdminDataProvider } from "../../hooks/use-admin-data-provider";

const CONSUMED_TOKEN_STORAGE_PREFIX = "stock-harvesting:zerodha-callback-token:";

export function AdminDataProviderCallbackPage() {
  const searchParams = useSearchParams();
  const connectMutation = useConnectAdminDataProvider();
  const submittedRef = useRef(false);
  const requestToken = searchParams.get("request_token");
  const status = searchParams.get("status");
  // Dev-mode React Strict Mode mounts this component twice (mount, cleanup,
  // mount again) before anything async resolves. A component ref reset on
  // that remount, so both mounts fired the exchange — Kite's request_token
  // is single-use, so the first exchange succeeded and the second (the one
  // actually left on screen) came back rejected, showing a stuck/failed
  // state despite the connection having actually gone through. A
  // sessionStorage flag keyed by the token survives the remount.
  const [alreadyConsumed] = useState(() => {
    if (!requestToken || typeof window === "undefined") return false;
    return window.sessionStorage.getItem(CONSUMED_TOKEN_STORAGE_PREFIX + requestToken) === "done";
  });

  useEffect(() => {
    if (!requestToken || submittedRef.current || alreadyConsumed) return;

    submittedRef.current = true;
    window.sessionStorage.setItem(CONSUMED_TOKEN_STORAGE_PREFIX + requestToken, "done");
    connectMutation.mutate({ requestToken });
  }, [alreadyConsumed, connectMutation, requestToken]);

  if (!requestToken) {
    return (
      <CallbackState
        icon={<XCircle className="size-8 text-danger" />}
        title="Connection cancelled"
        message={
          status
            ? `Kite returned status: ${status}`
            : "No request token was returned from Kite."
        }
      />
    );
  }

  if (alreadyConsumed && connectMutation.isIdle) {
    return (
      <CallbackState
        icon={<CheckCircle2 className="size-8 text-success" />}
        title="Zerodha connected"
        message="NSE market data can now use the encrypted Kite access token."
      />
    );
  }

  if (connectMutation.isSuccess) {
    return (
      <CallbackState
        icon={<CheckCircle2 className="size-8 text-success" />}
        title="Zerodha connected"
        message="NSE market data can now use the encrypted Kite access token."
      />
    );
  }

  if (connectMutation.isError) {
    return (
      <CallbackState
        icon={<XCircle className="size-8 text-danger" />}
        title="Connection failed"
        message="The request token could not be exchanged. Try connecting again."
      />
    );
  }

  return (
    <CallbackState
      icon={<Loader2 className="size-8 animate-spin text-primary" />}
      title="Completing connection"
      message="Saving the Kite session securely..."
    />
  );
}

function CallbackState({
  icon,
  title,
  message,
}: {
  icon: ReactNode;
  title: string;
  message: string;
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <section className="w-full max-w-md rounded-lg border border-border bg-card p-6 text-center shadow-sm">
        <div className="mx-auto flex size-14 items-center justify-center rounded-lg bg-background">
          {icon}
        </div>
        <h1 className="mt-4 text-xl font-semibold text-foreground">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        <div className="mt-5 flex justify-center">
          <Link
            href="/admin/data-provider"
            className={cn(buttonVariants({ variant: "default", size: "default" }))}
          >
            Back to data provider
          </Link>
        </div>
      </section>
    </div>
  );
}
