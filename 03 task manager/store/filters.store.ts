import type { SortingState } from "@tanstack/react-table";
import { create } from "zustand";
import type { ProcessCategoryFilter, ProcessStateFilter } from "@/types/filters";

export type ProcessSortId = "pid" | "name" | "cpu" | "memory" | "threads";

interface FiltersState {
  searchQuery: string;
  sorting: SortingState;
  category: ProcessCategoryFilter;
  stateFilters: ProcessStateFilter[];
  setSearchQuery: (query: string) => void;
  clearSearch: () => void;
  setSorting: (sorting: SortingState) => void;
  setCategory: (category: ProcessCategoryFilter) => void;
  toggleStateFilter: (state: ProcessStateFilter) => void;
  clearStateFilters: () => void;
  resetFilters: () => void;
}

export const DEFAULT_PROCESS_SORTING: SortingState = [{ id: "cpu", desc: true }];

export const useFiltersStore = create<FiltersState>((set, get) => ({
  searchQuery: "",
  sorting: DEFAULT_PROCESS_SORTING,
  category: "all",
  stateFilters: [],
  setSearchQuery: (query) => set({ searchQuery: query }),
  clearSearch: () => set({ searchQuery: "" }),
  setSorting: (sorting) => set({ sorting }),
  setCategory: (category) => set({ category }),
  toggleStateFilter: (state) => {
    const current = get().stateFilters;
    set({
      stateFilters: current.includes(state)
        ? current.filter((item) => item !== state)
        : [...current, state],
    });
  },
  clearStateFilters: () => set({ stateFilters: [] }),
  resetFilters: () =>
    set({
      searchQuery: "",
      category: "all",
      stateFilters: [],
    }),
}));
