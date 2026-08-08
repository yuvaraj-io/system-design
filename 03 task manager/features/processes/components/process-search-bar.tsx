"use client";

import { Search, X } from "lucide-react";
import { useFiltersStore } from "@/store/filters.store";
import { cn } from "@/utils/cn";

interface ProcessSearchBarProps {
  matchedCount: number;
  totalCount: number;
  isFiltering: boolean;
}

export function ProcessSearchBar({
  matchedCount,
  totalCount,
  isFiltering,
}: ProcessSearchBarProps) {
  const searchQuery = useFiltersStore((state) => state.searchQuery);
  const setSearchQuery = useFiltersStore((state) => state.setSearchQuery);
  const clearSearch = useFiltersStore((state) => state.clearSearch);

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by PID, name, or user..."
            className={cn(
              "w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-10 text-sm",
              "placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            )}
            aria-label="Search processes by PID, name, or user"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <p className="text-sm text-muted whitespace-nowrap">
          {isFiltering ? (
            <>
              Showing <span className="font-medium text-foreground">{matchedCount}</span> of{" "}
              {totalCount}
            </>
          ) : (
            <>Searching across {totalCount} processes</>
          )}
        </p>
      </div>

      <p className="mt-2 text-xs text-muted">
        Tips: type a PID like <code className="text-foreground">1234</code>, a name like{" "}
        <code className="text-foreground">chrome</code>, or a user like{" "}
        <code className="text-foreground">yuvarajs</code>
      </p>
    </div>
  );
}
