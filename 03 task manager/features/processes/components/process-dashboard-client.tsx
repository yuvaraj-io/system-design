"use client";

import { LoaderCircle, RefreshCw } from "lucide-react";
import { ProcessSearchBar } from "@/features/processes/components/process-search-bar";
import { ProcessTable } from "@/features/processes/components/process-table";
import { useProcessesQuery } from "@/features/processes/hooks/use-processes-query";
import { useProcessSearch } from "@/features/processes/hooks/use-process-search";
import { formatNumber } from "@/utils/format";

export function ProcessDashboardClient() {
  const { data, isLoading, isError, error, isFetching, dataUpdatedAt } =
    useProcessesQuery();

  const {
    debouncedQuery,
    filteredProcesses,
    matchedCount,
    totalCount,
    isFiltering,
  } = useProcessSearch(data?.processes ?? []);

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-6 text-muted">
        <LoaderCircle className="h-5 w-5 animate-spin" />
        Loading processes from the OS...
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-rose-200">
        {error instanceof Error ? error.message : "Failed to load processes"}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
        <span className="rounded-full border border-border px-3 py-1">
          Host: {data.host}
        </span>
        <span className="rounded-full border border-border px-3 py-1">
          Platform: {data.platform}
        </span>
        <span className="rounded-full border border-border px-3 py-1">
          Processes: {formatNumber(data.processes.length)}
        </span>
        <span className="rounded-full border border-border px-3 py-1">
          Refresh: every {data.sampleIntervalMs / 1000}s
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1">
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          Updated {new Date(dataUpdatedAt).toLocaleTimeString()}
        </span>
      </div>

      <ProcessSearchBar
        matchedCount={matchedCount}
        totalCount={totalCount}
        isFiltering={isFiltering}
      />

      <ProcessTable
        processes={filteredProcesses}
        searchQuery={debouncedQuery}
        isFiltering={isFiltering}
      />
    </div>
  );
}
