"use client";

import { useMemo } from "react";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useFiltersStore } from "@/store/filters.store";
import { filterProcesses } from "@/utils/search";
import type { Process } from "@/types/process";

export function useProcessSearch(processes: Process[]) {
  const searchQuery = useFiltersStore((state) => state.searchQuery);
  const debouncedQuery = useDebouncedValue(searchQuery, 200);

  const result = useMemo(
    () => filterProcesses(processes, debouncedQuery),
    [processes, debouncedQuery]
  );

  return {
    searchQuery,
    debouncedQuery: result.query,
    filteredProcesses: result.processes,
    matchedCount: result.matchedCount,
    totalCount: result.totalCount,
    isFiltering: debouncedQuery.length > 0,
  };
}
