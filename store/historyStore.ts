// History Store
// Manages undo/redo stacks for command history
// Tracks reversible operations on canvas objects

import { create } from "zustand";
import type { CanvasObject } from "@/types/canvas.types";

// Command types that can be undone/redone
export type CommandType =
  | "create"
  | "delete"
  | "move"
  | "transform"
  | "updateProperties"
  | "changeColor"
  | "updateText"
  | "reorderLayers"
  | "bringToFront"
  | "sendToBack"
  | "bringForward"
  | "sendBackward";

// Command history entry
export interface HistoryEntry {
  id: string; // Unique ID for this history entry
  type: CommandType;
  timestamp: number;
  description: string; // Human-readable description (e.g., "Move 3 shapes")

  // Data needed to undo the command
  undo: {
    // For create: just the shape IDs to delete
    shapeIds?: string[];

    // For delete: full shape data to restore
    shapes?: CanvasObject[];

    // For updates: previous values
    previousValues?: Array<{
      id: string;
      data: Partial<CanvasObject>;
    }>;
  };

  // Data needed to redo the command
  redo: {
    // For delete: shape IDs to delete
    shapeIds?: string[];

    // For create: full shape data to recreate
    shapes?: CanvasObject[];

    // For updates: new values
    newValues?: Array<{
      id: string;
      data: Partial<CanvasObject>;
    }>;
  };
}

interface HistoryStore {
  // Undo stack (most recent at end)
  undoStack: HistoryEntry[];

  // Redo stack (most recent at end)
  redoStack: HistoryEntry[];

  // Maximum history size (to prevent memory issues)
  maxHistorySize: number;

  // Add a command to history
  addCommand: (entry: Omit<HistoryEntry, "id" | "timestamp">) => void;

  // Check if undo is available
  canUndo: () => boolean;

  // Check if redo is available
  canRedo: () => boolean;

  // Get the last command that can be undone
  peekUndo: () => HistoryEntry | null;

  // Get the last command that can be redone
  peekRedo: () => HistoryEntry | null;

  // Pop from undo stack (returns command to execute undo)
  popUndo: () => HistoryEntry | null;

  // Pop from redo stack (returns command to execute redo)
  popRedo: () => HistoryEntry | null;

  // Push to redo stack (after successful undo)
  pushRedo: (entry: HistoryEntry) => void;

  // Push to undo stack (after successful redo)
  pushUndo: (entry: HistoryEntry) => void;

  // Clear redo stack (when new command is executed)
  clearRedo: () => void;

  // Clear all history
  clearHistory: () => void;
}

export const useHistoryStore = create<HistoryStore>((set, get) => ({
  undoStack: [],
  redoStack: [],
  maxHistorySize: 100,

  addCommand: (entry) => {
    const newEntry: HistoryEntry = {
      ...entry,
      id: `cmd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };

    set((state) => {
      const undoStack = [...state.undoStack, newEntry];

      // Trim stack if it exceeds max size
      if (undoStack.length > state.maxHistorySize) {
        undoStack.shift();
      }

      return {
        undoStack,
        // Clear redo stack when new command is added
        redoStack: [],
      };
    });
  },

  canUndo: () => get().undoStack.length > 0,

  canRedo: () => get().redoStack.length > 0,

  peekUndo: () => {
    const stack = get().undoStack;
    return stack.length > 0 ? stack[stack.length - 1] : null;
  },

  peekRedo: () => {
    const stack = get().redoStack;
    return stack.length > 0 ? stack[stack.length - 1] : null;
  },

  popUndo: () => {
    const stack = get().undoStack;
    if (stack.length === 0) return null;

    const entry = stack[stack.length - 1];
    set({ undoStack: stack.slice(0, -1) });
    return entry;
  },

  popRedo: () => {
    const stack = get().redoStack;
    if (stack.length === 0) return null;

    const entry = stack[stack.length - 1];
    set({ redoStack: stack.slice(0, -1) });
    return entry;
  },

  pushRedo: (entry) => {
    set((state) => ({
      redoStack: [...state.redoStack, entry],
    }));
  },

  pushUndo: (entry) => {
    set((state) => ({
      undoStack: [...state.undoStack, entry],
    }));
  },

  clearRedo: () => {
    set({ redoStack: [] });
  },

  clearHistory: () => {
    set({ undoStack: [], redoStack: [] });
  },
}));
