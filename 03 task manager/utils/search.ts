import type { Process } from "@/types/process";

export type ProcessSearchField = "pid" | "name" | "user";

export interface ProcessSearchResult {
  processes: Process[];
  query: string;
  matchedCount: number;
  totalCount: number;
}

/**
 * Client-side filter over an in-memory process snapshot.
 * Complexity: O(n * m) where n = process count, m = query length — fine for ~1k processes.
 */
export function filterProcesses(
  processes: Process[],
  rawQuery: string
): ProcessSearchResult {
  const query = rawQuery.trim().toLowerCase();
  const totalCount = processes.length;

  if (!query) {
    return {
      processes,
      query: "",
      matchedCount: totalCount,
      totalCount,
    };
  }

  const filtered = processes.filter((process) => matchesProcessSearch(process, query));

  return {
    processes: filtered,
    query,
    matchedCount: filtered.length,
    totalCount,
  };
}

export function matchesProcessSearch(process: Process, query: string): boolean {
  const pidMatch = String(process.pid).includes(query);
  const nameMatch = process.name.toLowerCase().includes(query);
  const userMatch = process.user.toLowerCase().includes(query);

  return pidMatch || nameMatch || userMatch;
}

export function getMatchingSearchFields(
  process: Process,
  query: string
): ProcessSearchField[] {
  if (!query) return [];

  const fields: ProcessSearchField[] = [];

  if (String(process.pid).includes(query)) fields.push("pid");
  if (process.name.toLowerCase().includes(query)) fields.push("name");
  if (process.user.toLowerCase().includes(query)) fields.push("user");

  return fields;
}
