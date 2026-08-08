"use client";

import { useQuery } from "@tanstack/react-query";
import type { SystemSnapshot } from "@/types/system";

export const systemKeys = {
  snapshot: () => ["system-snapshot"] as const,
};

async function fetchSystemSnapshot(): Promise<SystemSnapshot> {
  const response = await fetch("/api/system");
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || body.error || "Failed to load system metrics");
  }
  return response.json();
}

export function useSystemQuery(refreshIntervalMs = 2_000) {
  return useQuery({
    queryKey: systemKeys.snapshot(),
    queryFn: fetchSystemSnapshot,
    refetchInterval: refreshIntervalMs,
  });
}
