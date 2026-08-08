import { create } from "zustand";

export type DashboardView = "table" | "tree";
export type RefreshMode = "polling" | "sse";

interface UiState {
  selectedPid: number | null;
  detailOpen: boolean;
  viewMode: DashboardView;
  refreshMode: RefreshMode;
  expandedPids: Record<number, boolean>;
  setSelectedPid: (pid: number | null) => void;
  setDetailOpen: (open: boolean) => void;
  setViewMode: (mode: DashboardView) => void;
  setRefreshMode: (mode: RefreshMode) => void;
  toggleExpanded: (pid: number) => void;
  setExpanded: (pid: number, expanded: boolean) => void;
  expandRoots: (rootPids: number[]) => void;
  collapseAll: () => void;
}

export const useUiStore = create<UiState>((set, get) => ({
  selectedPid: null,
  detailOpen: false,
  viewMode: "table",
  refreshMode: "polling",
  expandedPids: {},
  setSelectedPid: (pid) => set({ selectedPid: pid }),
  setDetailOpen: (open) => set({ detailOpen: open }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setRefreshMode: (mode) => set({ refreshMode: mode }),
  toggleExpanded: (pid) =>
    set((state) => ({
      expandedPids: {
        ...state.expandedPids,
        [pid]: !state.expandedPids[pid],
      },
    })),
  setExpanded: (pid, expanded) =>
    set((state) => ({
      expandedPids: {
        ...state.expandedPids,
        [pid]: expanded,
      },
    })),
  expandRoots: (rootPids) =>
    set((state) => {
      const next = { ...state.expandedPids };
      for (const pid of rootPids) {
        next[pid] = true;
      }
      return { expandedPids: next };
    }),
  collapseAll: () => set({ expandedPids: {} }),
}));
