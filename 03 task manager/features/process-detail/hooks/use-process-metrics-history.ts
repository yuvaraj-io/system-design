"use client";

import { useEffect, useState } from "react";
import type { Process } from "@/types/process";

export interface MetricsHistoryPoint {
  timestamp: string;
  cpuPercent: number;
  memoryRssBytes: number;
}

const MAX_POINTS = 30;

export function useProcessMetricsHistory(
  pid: number | null,
  processes: Process[],
  enabled: boolean
) {
  const [history, setHistory] = useState<MetricsHistoryPoint[]>([]);

  useEffect(() => {
    if (!enabled || pid == null) {
      setHistory([]);
      return;
    }

    const process = processes.find((item) => item.pid === pid);
    if (!process) return;

    setHistory((current) => {
      const nextPoint: MetricsHistoryPoint = {
        timestamp: new Date().toISOString(),
        cpuPercent: process.metrics.cpuPercent,
        memoryRssBytes: process.metrics.memoryRssBytes,
      };
      const next = [...current, nextPoint];
      return next.length > MAX_POINTS ? next.slice(next.length - MAX_POINTS) : next;
    });
  }, [pid, processes, enabled]);

  return history;
}
