export type ProcessCategoryFilter = "all" | "user" | "system";

export type ProcessStateFilter =
  | "running"
  | "sleeping"
  | "zombie"
  | "background";

export interface ProcessFilterOptions {
  searchQuery: string;
  category: ProcessCategoryFilter;
  stateFilters: ProcessStateFilter[];
  currentUser: string;
}

export interface ProcessFilterResult {
  processes: import("@/types/process").Process[];
  searchQuery: string;
  category: ProcessCategoryFilter;
  stateFilters: ProcessStateFilter[];
  matchedCount: number;
  totalCount: number;
  hasActiveFilters: boolean;
}
