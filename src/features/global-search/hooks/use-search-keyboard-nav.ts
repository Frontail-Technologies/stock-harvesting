"use client";

import { useState, type KeyboardEvent } from "react";
import type { Stock } from "@/types/market";

export function useSearchKeyboardNav(
  results: Stock[],
  onSelect: (stock: Stock) => void,
  onClose: () => void
) {
  const [highlightedIndex, setHighlightedIndex] = useState(0);

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
