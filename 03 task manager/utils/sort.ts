import type { Process } from "@/types/process";
import type { ProcessSortId } from "@/store/filters.store";

/**
 * Comparison-based sort helpers.
 * TanStack Table uses these semantics internally; O(n log n) for full table sorts.
 */
export function compareNumbers(a: number, b: number) {
  return a === b ? 0 : a < b ? -1 : 1;
}

export function compareStrings(a: string, b: string) {
  return a.localeCompare(b, undefined, { sensitivity: "base" });
}

export function getSortValue(process: Process, sortId: ProcessSortId): number | string {
  switch (sortId) {
    case "pid":
      return process.pid;
    case "name":
      return process.name.toLowerCase();
    case "cpu":
      return process.metrics.cpuPercent;
    case "memory":
      return process.metrics.memoryRssBytes;
    case "threads":
      return process.metrics.threadCount;
    default:
      return process.pid;
  }
}
