// History Manager Service
// Handles undo/redo operations for canvas commands
// Works with historyStore and firestoreService to reverse operations

import { useHistoryStore } from "@/store/historyStore";
import { firestoreService } from "./firestore.service";
import { useCanvasStore } from "@/store/canvasStore";
import { useSelectionStore } from "@/store/selectionStore";
import { useUIStore } from "@/store/uiStore";
import type { HistoryEntry } from "@/store/historyStore";

export class HistoryManager {
  constructor(private userId: string | undefined) {}

  /**
   * Execute undo operation
   */
  async undo(): Promise<boolean> {
    if (!this.userId) {
      console.warn("Cannot undo: no user ID");
      return false;
    }

    const { popUndo, pushRedo, canUndo } = useHistoryStore.getState();

    if (!canUndo()) {
      useUIStore.getState().showToast("Nothing to undo", "info");
      return false;
    }

    const entry = popUndo();
    if (!entry) return false;

    try {
      // Execute the undo operation based on command type
      await this.executeUndo(entry);

      // Push to redo stack for potential redo
      pushRedo(entry);

      useUIStore
        .getState()
        .showToast(`Undone: ${entry.description}`, "success");
      return true;
    } catch (error) {
      console.error("Error during undo:", error);
      useUIStore.getState().showToast("Failed to undo", "error");
      // Put entry back on undo stack
      useHistoryStore.getState().pushUndo(entry);
      return false;
    }
  }

  /**
   * Execute redo operation
   */
  async redo(): Promise<boolean> {
    if (!this.userId) {
      console.warn("Cannot redo: no user ID");
      return false;
    }

    const { popRedo, pushUndo, canRedo } = useHistoryStore.getState();

    if (!canRedo()) {
      useUIStore.getState().showToast("Nothing to redo", "info");
      return false;
    }

    const entry = popRedo();
    if (!entry) return false;

    try {
      // Execute the redo operation based on command type
      await this.executeRedo(entry);

      // Push back to undo stack
      pushUndo(entry);

      useUIStore
        .getState()
        .showToast(`Redone: ${entry.description}`, "success");
      return true;
    } catch (error) {
      console.error("Error during redo:", error);
      useUIStore.getState().showToast("Failed to redo", "error");
      // Put entry back on redo stack
      useHistoryStore.getState().pushRedo(entry);
      return false;
    }
  }

  /**
   * Execute undo based on command type
   */
  private async executeUndo(entry: HistoryEntry): Promise<void> {
    const userId = this.userId!;

    switch (entry.type) {
      case "create":
        // Undo create = delete the created shapes
        if (entry.undo.shapeIds) {
          await Promise.all(
            entry.undo.shapeIds.map((id) => firestoreService.deleteObject(id))
          );
          // Clear selection if deleted shapes were selected
          useSelectionStore.getState().setSelectedIds([]);
        }
        break;

      case "delete":
        // Undo delete = recreate the deleted shapes
        if (entry.undo.shapes) {
          for (const shape of entry.undo.shapes) {
            await firestoreService.createObjectWithId(
              shape.id,
              {
                type: shape.type,
                x: shape.x,
                y: shape.y,
                width: shape.width,
                height: shape.height,
                rotation: shape.rotation,
                color: shape.color,
                zIndex: shape.zIndex,
                lockedBy: null,
                lockedAt: null,
                lastUpdatedBy: userId,
                ...(shape.text !== undefined && { text: shape.text }),
                ...(shape.fontSize !== undefined && {
                  fontSize: shape.fontSize,
                }),
              },
              userId
            );
          }
        }
        break;

      case "move":
      case "transform":
      case "updateProperties":
      case "changeColor":
      case "updateText":
      case "reorderLayers":
      case "bringToFront":
      case "sendToBack":
      case "bringForward":
      case "sendBackward":
        // Undo any update = restore previous values
        if (entry.undo.previousValues) {
          const updates = entry.undo.previousValues;

          // Optimistic local update
          updates.forEach(({ id, data }) => {
            useCanvasStore.getState().updateObject(id, data);
          });

          // Batch update to Firestore
          if (updates.length > 1) {
            await firestoreService.batchUpdateObjects(updates, userId);
          } else if (updates.length === 1) {
            await firestoreService.updateObject(
              updates[0].id,
              updates[0].data,
              userId
            );
          }
        }
        break;

      default:
        console.warn(`Unknown command type for undo: ${entry.type}`);
    }
  }

  /**
   * Execute redo based on command type
   */
  private async executeRedo(entry: HistoryEntry): Promise<void> {
    const userId = this.userId!;

    switch (entry.type) {
      case "create":
        // Redo create = recreate the shapes
        if (entry.redo.shapes) {
          for (const shape of entry.redo.shapes) {
            await firestoreService.createObjectWithId(
              shape.id,
              {
                type: shape.type,
                x: shape.x,
                y: shape.y,
                width: shape.width,
                height: shape.height,
                rotation: shape.rotation,
                color: shape.color,
                zIndex: shape.zIndex,
                lockedBy: null,
                lockedAt: null,
                lastUpdatedBy: userId,
                ...(shape.text !== undefined && { text: shape.text }),
                ...(shape.fontSize !== undefined && {
                  fontSize: shape.fontSize,
                }),
              },
              userId
            );
          }
        }
        break;

      case "delete":
        // Redo delete = delete the shapes again
        if (entry.redo.shapeIds) {
          await Promise.all(
            entry.redo.shapeIds.map((id) => firestoreService.deleteObject(id))
          );
          // Clear selection if deleted shapes were selected
          useSelectionStore.getState().setSelectedIds([]);
        }
        break;

      case "move":
      case "transform":
      case "updateProperties":
      case "changeColor":
      case "updateText":
      case "reorderLayers":
      case "bringToFront":
      case "sendToBack":
      case "bringForward":
      case "sendBackward":
        // Redo any update = apply new values
        if (entry.redo.newValues) {
          const updates = entry.redo.newValues;

          // Optimistic local update
          updates.forEach(({ id, data }) => {
            useCanvasStore.getState().updateObject(id, data);
          });

          // Batch update to Firestore
          if (updates.length > 1) {
            await firestoreService.batchUpdateObjects(updates, userId);
          } else if (updates.length === 1) {
            await firestoreService.updateObject(
              updates[0].id,
              updates[0].data,
              userId
            );
          }
        }
        break;

      default:
        console.warn(`Unknown command type for redo: ${entry.type}`);
    }
  }
}

/**
 * Hook to access history manager
 */
export function useHistoryManager(userId?: string) {
  return new HistoryManager(userId);
}
