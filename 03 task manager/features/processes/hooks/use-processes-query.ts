"use client";

import { useQuery } from "@tanstack/react-query";
import {
  fetchProcesses,
  processKeys,
} from "@/features/processes/queries/processes.query";
import { useProcessesStream } from "@/features/processes/hooks/use-processes-stream";
import { useUiStore } from "@/store/ui.store";

const REFRESH_INTERVAL_MS = 1_000;

export function useProcessesQuery() {
  const refreshMode = useUiStore((state) => state.refreshMode);
  useProcessesStream();

  return useQuery({
    queryKey: processKeys.list(),
    queryFn: fetchProcesses,
    refetchInterval: refreshMode === "polling" ? REFRESH_INTERVAL_MS : false,
  });
}
