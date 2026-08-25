"use client";

import { useState, type KeyboardEvent } from "react";
import type { Stock } from "@/types/market";

// Shared ↑/↓/Enter/Escape handling for every search presentation (navbar
// field, landing hero field, command dialog) - one implementation instead
// of three, all driven by the same result list shape.
export function useSearchKeyboardNav(
  results: Stock[],
  onSelect: (stock: Stock) => void,
  onClose: () => void
) {
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  // Reset to the top whenever the result set itself changes (new query
  // resolved) - React's own "adjust state when a prop changes" pattern:
  // track the previous value in state (not a ref - refs can't be read or
  // written during render), compare during render, and call setState
  // conditionally. React applies this before the render commits, so
  // there's no extra render pass or flash of the stale index.
  const [previousResults, setPreviousResults] = useState(results);
  if (previousResults !== results) {
    setPreviousResults(results);
    if (highlightedIndex !== 0) setHighlightedIndex(0);
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (results.length === 0) return;
      setHighlightedIndex((current) => (current + 1) % results.length);
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (results.length === 0) return;
      setHighlightedIndex((current) => (current - 1 + results.length) % results.length);
      return;
    }
    if (event.key === "Enter") {
      const stock = results[highlightedIndex];
      if (!stock) return;
      event.preventDefault();
      onSelect(stock);
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
    }
  };

  return { highlightedIndex, setHighlightedIndex, handleKeyDown };
}
