// PR #4 - Basic Canvas with Pan & Zoom
// Zustand store for canvas state
// - Canvas state management
// - Shape CRUD operations (local only initially)
// - Subscribe to Firestore changes (PR #5)
// - Push local changes to Firestore (PR #5)
// - Optimistic updates

import { create } from "zustand";
import { CanvasObject, Viewport } from "@/types/canvas.types";

interface CanvasStore {
  // State
  objects: CanvasObject[];
  viewport: Viewport;
  selectedIds: string[];

  // Viewport actions
  setViewport: (viewport: Viewport) => void;
  updateViewport: (updates: Partial<Viewport>) => void;

  // Object actions (local only for now, will sync to Firestore in PR #5)
  addObject: (object: CanvasObject) => void;
  updateObject: (id: string, updates: Partial<CanvasObject>) => void;
  removeObject: (id: string) => void;
  setObjects: (objects: CanvasObject[]) => void;

  // Selection actions (will be moved to selectionStore in PR #7)
  setSelectedIds: (ids: string[]) => void;
  clearSelection: () => void;
}

export const useCanvasStore = create<CanvasStore>((set) => ({
  // Initial state
  objects: [],
  viewport: {
    x: 0,
    y: 0,
    scale: 1,
  },
  selectedIds: [],

  // Viewport actions
  setViewport: (viewport) => set({ viewport }),
  updateViewport: (updates) =>
    set((state) => ({
      viewport: { ...state.viewport, ...updates },
    })),

  // Object actions
  addObject: (object) =>
    set((state) => ({
      objects: [...state.objects, object],
    })),

  updateObject: (id, updates) =>
    set((state) => ({
      objects: state.objects.map((obj) =>
        obj.id === id ? { ...obj, ...updates } : obj
      ),
    })),

  removeObject: (id) =>
    set((state) => ({
      objects: state.objects.filter((obj) => obj.id !== id),
      selectedIds: state.selectedIds.filter((selectedId) => selectedId !== id),
    })),

  setObjects: (objects) => set({ objects }),

  // Selection actions
  setSelectedIds: (ids) => set({ selectedIds: ids }),
  clearSelection: () => set({ selectedIds: [] }),
}));
