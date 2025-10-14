// PR #7 - Shape Selection & Movement
// Selection state management store
// - Track selected shape IDs
// - Single selection logic
// - Support multiple selected IDs (PR #13)
// - Add/remove from selection

import { create } from "zustand";

interface SelectionState {
  selectedIds: string[];
  selectShape: (id: string) => void;
  deselectAll: () => void;
  isSelected: (id: string) => boolean;
  // Future: PR #13 - Multi-select
  toggleSelection: (id: string) => void;
  addToSelection: (id: string) => void;
  removeFromSelection: (id: string) => void;
}

export const useSelectionStore = create<SelectionState>((set, get) => ({
  selectedIds: [],

  // Single selection - replaces current selection
  selectShape: (id: string) => {
    set({ selectedIds: [id] });
  },

  // Clear all selections
  deselectAll: () => {
    set({ selectedIds: [] });
  },

  // Check if a shape is selected
  isSelected: (id: string) => {
    return get().selectedIds.includes(id);
  },

  // Toggle selection (for multi-select in PR #13)
  toggleSelection: (id: string) => {
    const { selectedIds } = get();
    if (selectedIds.includes(id)) {
      set({ selectedIds: selectedIds.filter((sid) => sid !== id) });
    } else {
      set({ selectedIds: [...selectedIds, id] });
    }
  },

  // Add to selection without clearing (for multi-select in PR #13)
  addToSelection: (id: string) => {
    const { selectedIds } = get();
    if (!selectedIds.includes(id)) {
      set({ selectedIds: [...selectedIds, id] });
    }
  },

  // Remove from selection (for multi-select in PR #13)
  removeFromSelection: (id: string) => {
    set({ selectedIds: get().selectedIds.filter((sid) => sid !== id) });
  },
}));
