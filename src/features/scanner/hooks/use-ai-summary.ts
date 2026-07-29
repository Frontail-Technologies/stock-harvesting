"use client";

import { useMutation } from "@tanstack/react-query";
import { askScannerQuestion } from "../api/ai-api";

export function useAskScannerQuestion() {
  return useMutation({
    mutationFn: askScannerQuestion,
  });
}
