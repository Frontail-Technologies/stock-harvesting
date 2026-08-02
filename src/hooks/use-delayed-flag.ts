"use client";

import { useEffect, useState } from "react";

// Only reports true once `active` has stayed true continuously for
// `delayMs` — avoids flashing a loading spinner for operations that resolve
// almost instantly, which reads as more jarring than showing nothing.
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
