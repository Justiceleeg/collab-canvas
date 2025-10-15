// PR #4 - Basic Canvas with Pan & Zoom
// PR #5 - Firestore Sync Infrastructure
// PR #6 - Rectangle Shape Creation & Rendering
// Zustand store for canvas state
// - Canvas state management
// - Shape CRUD operations (local only initially)
// - Subscribe to Firestore changes (PR #5) ✓
// - Push local changes to Firestore (PR #5) ✓
// - Optimistic updates ✓
// - Shape creation helpers (PR #6) ✓

import { create } from "zustand";
import { CanvasObject, Viewport, ShapeType } from "@/types/canvas.types";
import { getRandomColor } from "@/utils/geometry";
import { SHAPES } from "@/utils/constants";

interface CanvasStore {
  // State
  objects: CanvasObject[];
  viewport: Viewport;

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

  // Sync state actions
  setSyncing: (isSyncing: boolean) => void;
  setSyncError: (error: Error | null) => void;

  // Helper getters
  getObjectById: (id: string) => CanvasObject | undefined;

  // Shape creation helper (PR #6)
  createShapeData: (
    type: ShapeType,
    position: { x: number; y: number },
    userId: string
  ) => Omit<CanvasObject, "id" | "createdAt" | "updatedAt">;
}

export const useCanvasStore = create<CanvasStore>((set, get) => ({
  // Initial state
  objects: [],
  viewport: {
    x: 0,
    y: 0,
    scale: 1,
  },
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
    })),

  // Sync state actions
  setSyncing: (isSyncing) => set({ isSyncing }),
  setSyncError: (error) => set({ lastSyncError: error }),

  // Helper getters
  getObjectById: (id) => {
    return get().objects.find((obj) => obj.id === id);
  },

  // Shape creation helper
  createShapeData: (type, position, userId) => {
    const dimensions =
      SHAPES.DEFAULT_SIZES[type] || SHAPES.DEFAULT_SIZES.rectangle;
    const color = getRandomColor();

    // Calculate highest zIndex to place new shape on top
    const objects = get().objects;
    const maxZIndex =
      objects.length > 0
        ? Math.max(...objects.map((obj) => obj.zIndex || 0))
        : 0;

    const baseShape = {
      type,
      x: position.x,
      y: position.y,
      width: dimensions.width,
      height: dimensions.height,
      rotation: 0,
      color,
      zIndex: maxZIndex + 1,
      lockedBy: null,
      lockedAt: null,
      lastUpdatedBy: userId,
    };

    // Add type-specific properties
    if (type === "text") {
      return {
        ...baseShape,
        text: SHAPES.DEFAULT_TEXT,
        fontSize: SHAPES.DEFAULT_FONT_SIZE,
      };
    }

    return baseShape;
  },
}));
