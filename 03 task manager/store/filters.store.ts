import type { SortingState } from "@tanstack/react-table";
import { create } from "zustand";

export type ProcessSortId = "pid" | "name" | "cpu" | "memory" | "threads";

interface FiltersState {
  searchQuery: string;
  sorting: SortingState;
  setSearchQuery: (query: string) => void;
  clearSearch: () => void;
  setSorting: (sorting: SortingState) => void;
}

export const DEFAULT_PROCESS_SORTING: SortingState = [{ id: "cpu", desc: true }];

export const useFiltersStore = create<FiltersState>((set) => ({
  searchQuery: "",
  sorting: DEFAULT_PROCESS_SORTING,
  setSearchQuery: (query) => set({ searchQuery: query }),
  clearSearch: () => set({ searchQuery: "" }),
  setSorting: (sorting) => set({ sorting }),
}));
