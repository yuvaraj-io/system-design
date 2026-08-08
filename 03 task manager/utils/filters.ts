import type { Process } from "@/types/process";
import type {
  ProcessCategoryFilter,
  ProcessFilterOptions,
  ProcessFilterResult,
  ProcessStateFilter,
} from "@/types/filters";
import { matchesProcessSearch } from "@/utils/search";

const SYSTEM_USERS = new Set(["root", "_windowserver", "_coreaudiod", "_locationd"]);

function isSystemUser(user: string) {
  return user === "root" || user.startsWith("_") || SYSTEM_USERS.has(user);
}

function isBackgroundProcess(process: Process) {
  return (
    process.state === "idle" ||
    (process.state === "sleeping" && process.metrics.cpuPercent < 0.1)
  );
}

function matchesCategory(
  process: Process,
  category: ProcessCategoryFilter,
  currentUser: string
) {
  if (category === "all") return true;
  if (category === "user") return process.user === currentUser;
  return isSystemUser(process.user);
}

function matchesStateFilter(process: Process, stateFilters: ProcessStateFilter[]) {
  if (stateFilters.length === 0) return true;

  return stateFilters.some((filter) => {
    if (filter === "background") return isBackgroundProcess(process);
    return process.state === filter;
  });
}

export function applyProcessFilters(
  processes: Process[],
  options: ProcessFilterOptions
): ProcessFilterResult {
  const searchQuery = options.searchQuery.trim().toLowerCase();
  const totalCount = processes.length;

  const hasActiveFilters =
    searchQuery.length > 0 ||
    options.category !== "all" ||
    options.stateFilters.length > 0;

  const filtered = processes.filter((process) => {
    const searchMatch = !searchQuery || matchesProcessSearch(process, searchQuery);
    const categoryMatch = matchesCategory(process, options.category, options.currentUser);
    const stateMatch = matchesStateFilter(process, options.stateFilters);

    return searchMatch && categoryMatch && stateMatch;
  });

  return {
    processes: filtered,
    searchQuery,
    category: options.category,
    stateFilters: options.stateFilters,
    matchedCount: filtered.length,
    totalCount,
    hasActiveFilters,
  };
}
