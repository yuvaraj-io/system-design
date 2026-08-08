"use client";

import { useMemo } from "react";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useFiltersStore } from "@/store/filters.store";
import { applyProcessFilters } from "@/utils/filters";
import type { Process } from "@/types/process";

export function useProcessFilters(processes: Process[], currentUser: string) {
  const searchQuery = useFiltersStore((state) => state.searchQuery);
  const category = useFiltersStore((state) => state.category);
  const stateFilters = useFiltersStore((state) => state.stateFilters);
  const debouncedSearch = useDebouncedValue(searchQuery, 200);

  const result = useMemo(
    () =>
      applyProcessFilters(processes, {
        searchQuery: debouncedSearch,
        category,
        stateFilters,
        currentUser,
      }),
    [processes, debouncedSearch, category, stateFilters, currentUser]
  );

  return {
    searchQuery,
    debouncedSearch: result.searchQuery,
    category,
    stateFilters,
    filteredProcesses: result.processes,
    matchedCount: result.matchedCount,
    totalCount: result.totalCount,
    hasActiveFilters: result.hasActiveFilters,
  };
}
