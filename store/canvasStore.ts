// PR #4 - Basic Canvas with Pan & Zoom
// PR #5 - Firestore Sync Infrastructure
// Zustand store for canvas state
// - Canvas state management
// - Shape CRUD operations (local only initially)
// - Subscribe to Firestore changes (PR #5) ✓
// - Push local changes to Firestore (PR #5) ✓
// - Optimistic updates ✓

import { create } from "zustand";
import { CanvasObject, Viewport } from "@/types/canvas.types";

interface CanvasStore {
  // State
  objects: CanvasObject[];
  viewport: Viewport;
  selectedIds: string[];

  // Sync state
  isSyncing: boolean;
  lastSyncError: Error | null;

  // Viewport actions
  setViewport: (viewport: Viewport) => void;
  updateViewport: (updates: Partial<Viewport>) => void;

  // Object actions - these are for local updates (used by Firestore sync)
  // For creating/updating/deleting with Firestore sync, use useFirestoreSync hook
  addObject: (object: CanvasObject) => void;
  updateObject: (id: string, updates: Partial<CanvasObject>) => void;
  removeObject: (id: string) => void;
  setObjects: (objects: CanvasObject[]) => void;

  // Batch operations
  addObjects: (objects: CanvasObject[]) => void;
  removeObjects: (ids: string[]) => void;

  // Selection actions (will be moved to selectionStore in PR #7)
  setSelectedIds: (ids: string[]) => void;
  clearSelection: () => void;
  addToSelection: (id: string) => void;
  removeFromSelection: (id: string) => void;
  toggleSelection: (id: string) => void;

  // Sync state actions
  setSyncing: (isSyncing: boolean) => void;
  setSyncError: (error: Error | null) => void;

  // Helper getters
  getObjectById: (id: string) => CanvasObject | undefined;
  getSelectedObjects: () => CanvasObject[];
}

export const useCanvasStore = create<CanvasStore>((set, get) => ({
  // Initial state
  objects: [],
  viewport: {
    x: 0,
    y: 0,
    scale: 1,
  },
  selectedIds: [],
  isSyncing: false,
  lastSyncError: null,

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

  // Batch operations
  addObjects: (objects) =>
    set((state) => ({
      objects: [...state.objects, ...objects],
    })),

  removeObjects: (ids) =>
    set((state) => ({
      objects: state.objects.filter((obj) => !ids.includes(obj.id)),
      selectedIds: state.selectedIds.filter(
        (selectedId) => !ids.includes(selectedId)
      ),
    })),

  // Selection actions
  setSelectedIds: (ids) => set({ selectedIds: ids }),
  clearSelection: () => set({ selectedIds: [] }),

  addToSelection: (id) =>
    set((state) => {
      if (state.selectedIds.includes(id)) {
        return state;
      }
      return { selectedIds: [...state.selectedIds, id] };
    }),

  removeFromSelection: (id) =>
    set((state) => ({
      selectedIds: state.selectedIds.filter((selectedId) => selectedId !== id),
    })),

  toggleSelection: (id) =>
    set((state) => {
      if (state.selectedIds.includes(id)) {
        return {
          selectedIds: state.selectedIds.filter(
            (selectedId) => selectedId !== id
          ),
        };
      }
      return { selectedIds: [...state.selectedIds, id] };
    }),

  // Sync state actions
  setSyncing: (isSyncing) => set({ isSyncing }),
  setSyncError: (error) => set({ lastSyncError: error }),

  // Helper getters
  getObjectById: (id) => {
    return get().objects.find((obj) => obj.id === id);
  },

  getSelectedObjects: () => {
    const { objects, selectedIds } = get();
    return objects.filter((obj) => selectedIds.includes(obj.id));
  },
}));
