"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { processKeys } from "@/features/processes/queries/processes.query";
import { useUiStore } from "@/store/ui.store";
import type { ProcessListSnapshot } from "@/types/process";

export function useProcessesStream() {
  const refreshMode = useUiStore((state) => state.refreshMode);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (refreshMode !== "sse") return;

    const source = new EventSource("/api/processes/stream");

    source.addEventListener("snapshot", (event) => {
      const snapshot = JSON.parse((event as MessageEvent<string>).data) as ProcessListSnapshot;
      queryClient.setQueryData(processKeys.list(), snapshot);
    });

    source.addEventListener("error", () => {
      source.close();
    });

    return () => {
      source.close();
    };
  }, [refreshMode, queryClient]);
}
