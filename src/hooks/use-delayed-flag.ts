"use client";

import { useEffect, useState } from "react";

export function useDelayedFlag(active: boolean, delayMs = 200) {
  const [triggered, setTriggered] = useState(false);

  useEffect(() => {
    if (!active) return;

    const timeout = window.setTimeout(() => setTriggered(true), delayMs);
    return () => {
      window.clearTimeout(timeout);
      setTriggered(false);
    };
  }, [active, delayMs]);

  return active && triggered;
}
