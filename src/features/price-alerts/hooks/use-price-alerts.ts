"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/features/api";
import { useSessionStore } from "@/features/auth";
import {
  deletePriceAlert,
  listPriceAlerts,
  type PriceAlertStatus,
} from "../api/price-alerts-api";

export function usePriceAlerts(input: {
  exchange?: string;
  symbol?: string;
  status?: PriceAlertStatus;
}) {
  const status = useSessionStore((state) => state.status);

  return useQuery({
    queryKey: queryKeys.priceAlerts.list(input),
    queryFn: () => listPriceAlerts(input),
    enabled: status === "authenticated" && Boolean(input.exchange && input.symbol),
  });
}

export function useDeletePriceAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePriceAlert,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["price-alerts"] });
    },
  });
}
