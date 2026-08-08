"use client";

import { useQuery } from "@tanstack/react-query";
import {
  fetchProcesses,
  processKeys,
} from "@/features/processes/queries/processes.query";

const REFRESH_INTERVAL_MS = 1_000;

export function useProcessesQuery() {
  return useQuery({
    queryKey: processKeys.list(),
    queryFn: fetchProcesses,
    refetchInterval: REFRESH_INTERVAL_MS,
  });
}
