import { create } from "zustand";

interface UiState {
  selectedPid: number | null;
  setSelectedPid: (pid: number | null) => void;
}

export const useUiStore = create<UiState>((set) => ({
  selectedPid: null,
  setSelectedPid: (pid) => set({ selectedPid: pid }),
}));
