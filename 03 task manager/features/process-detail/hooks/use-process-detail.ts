"use client";

import { useQuery } from "@tanstack/react-query";
import type { ProcessDetail } from "@/types/process-detail";

export function processDetailKeys(pid: number | null) {
  return ["process-detail", pid] as const;
}

async function fetchProcessDetail(pid: number): Promise<ProcessDetail> {
  const response = await fetch(`/api/processes/${pid}`);
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || body.error || "Failed to load process detail");
  }
  return response.json();
}

export function useProcessDetail(pid: number | null, enabled: boolean) {
  return useQuery({
    queryKey: processDetailKeys(pid),
    queryFn: () => fetchProcessDetail(pid!),
    enabled: enabled && pid != null,
    staleTime: 2_000,
  });
}
