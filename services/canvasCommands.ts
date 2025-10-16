// Canvas Command Service
// Centralized service for all canvas operations (CRUD, transformations, etc.)
// Handles locking, Firestore sync, optimistic updates, and error handling
// This is the "action layer" that sits between UI interactions and domain state

import { firestoreService } from "./firestore.service";
import { useCanvasStore } from "@/store/canvasStore";
import { useSelectionStore } from "@/store/selectionStore";
import { useUIStore } from "@/store/uiStore";
import type { CanvasObject } from "@/types/canvas.types";
import type Konva from "konva";

export interface LockManager {
  acquireActiveLock: (shapeId: string) => Promise<any>;
  releaseActiveLock: () => Promise<void>;
  hasActiveLock: (shapeId: string) => boolean;
  isLocked: (shapeId: string) => boolean;
  getLockInfo: (shapeId: string) => any;
}

export class CanvasCommandService {
  constructor(
    private lockManager: LockManager,
    private userId: string | undefined
  ) {}

  /**
   * Delete multiple shapes
   * Releases locks before deleting to prevent 400 errors
   */
  async deleteShapes(shapeIds: string[]): Promise<void> {
    if (shapeIds.length === 0 || !this.userId) return;

    try {
      // Release locks BEFORE deleting
      await this.lockManager.releaseActiveLock();

      // Delete all shapes in parallel
      await Promise.all(
        shapeIds.map((id) => firestoreService.deleteObject(id))
      );

      // Clear selection
      useSelectionStore.getState().setSelectedIds([]);

      // Show success toast
      useUIStore
        .getState()
        .showToast(
          `Deleted ${shapeIds.length} shape${shapeIds.length > 1 ? "s" : ""}`,
          "success"
        );
    } catch (error) {
      console.error("Error deleting shapes:", error);
      useUIStore.getState().showToast("Failed to delete shapes", "error");
      throw error;
    }
  }

  /**
   * Duplicate shapes on top of the original (no offset)
   */
  async duplicateShapes(shapeIds: string[]): Promise<void> {
    if (shapeIds.length === 0 || !this.userId) return;

    try {
      const { getObjectById } = useCanvasStore.getState();

      const newShapeIds: string[] = [];

      for (const id of shapeIds) {
        const shape = getObjectById(id);
        if (!shape) continue;

        // Create duplicate at same position (on top)
        // Build base data with only defined values (Firestore rejects undefined)
        const duplicateData: any = {
          type: shape.type,
          x: shape.x,
          y: shape.y,
          width: shape.width,
          height: shape.height,
          rotation: shape.rotation || 0,
          color: shape.color,
          zIndex: shape.zIndex + 1,
          lockedBy: null,
          lockedAt: null,
          lastUpdatedBy: this.userId,
        };

        // Only add text fields if they exist and are not undefined
        // (Firestore rejects undefined values)
        if (shape.text !== undefined && shape.text !== null) {
          duplicateData.text = shape.text;
        }
        if (shape.fontSize !== undefined && shape.fontSize !== null) {
          duplicateData.fontSize = shape.fontSize;
        }

        const newShape = await firestoreService.createObject(
          duplicateData,
          this.userId
        );
        newShapeIds.push(newShape.id);
      }

      // Select the new shapes
      useSelectionStore.getState().setSelectedIds(newShapeIds);

      useUIStore
        .getState()
        .showToast(
          `Duplicated ${shapeIds.length} shape${
            shapeIds.length > 1 ? "s" : ""
          }`,
          "success"
        );
    } catch (error) {
      console.error("Error duplicating shapes:", error);
      useUIStore.getState().showToast("Failed to duplicate shapes", "error");
      throw error;
    }
  }

  /**
   * Change color of multiple shapes
   */
  async changeColor(shapeIds: string[], color: string): Promise<void> {
    if (shapeIds.length === 0 || !this.userId) return;

    const userId = this.userId; // Capture for TypeScript type narrowing

    try {
      // Acquire lock for first shape (simplified locking)
      if (shapeIds.length > 0) {
        await this.lockManager.acquireActiveLock(shapeIds[0]);
      }

      // Update all shapes
      await Promise.all(
        shapeIds.map((id) =>
          firestoreService.updateObject(id, { color }, userId)
        )
      );

      // Release lock
      await this.lockManager.releaseActiveLock();

      useUIStore.getState().showToast("Color updated", "success");
    } catch (error) {
      console.error("Error changing color:", error);
      useUIStore.getState().showToast("Failed to change color", "error");
      throw error;
    }
  }

  /**
   * Bring shapes to front (increase zIndex)
   */
  async bringToFront(shapeIds: string[]): Promise<void> {
    if (shapeIds.length === 0 || !this.userId) return;

    const userId = this.userId; // Capture for TypeScript type narrowing

    try {
      const { objects } = useCanvasStore.getState();
      const maxZIndex = Math.max(...objects.map((obj) => obj.zIndex || 0));

      // Update z-index for all selected shapes
      await Promise.all(
        shapeIds.map((id, index) =>
          firestoreService.updateObject(
            id,
            { zIndex: maxZIndex + index + 1 },
            userId
          )
        )
      );

      useUIStore.getState().showToast("Brought to front", "success");
    } catch (error) {
      console.error("Error bringing to front:", error);
      useUIStore.getState().showToast("Failed to bring to front", "error");
      throw error;
    }
  }

  /**
   * Send shapes to back (decrease zIndex)
   */
  async sendToBack(shapeIds: string[]): Promise<void> {
    if (shapeIds.length === 0 || !this.userId) return;

    const userId = this.userId; // Capture for TypeScript type narrowing

    try {
      const { objects } = useCanvasStore.getState();
      const minZIndex = Math.min(...objects.map((obj) => obj.zIndex || 0));

      // Update z-index for all selected shapes
      await Promise.all(
        shapeIds.map((id, index) =>
          firestoreService.updateObject(
            id,
            { zIndex: minZIndex - shapeIds.length + index },
            userId
          )
        )
      );

      useUIStore.getState().showToast("Sent to back", "success");
    } catch (error) {
      console.error("Error sending to back:", error);
      useUIStore.getState().showToast("Failed to send to back", "error");
      throw error;
    }
  }

  /**
   * Bring shapes forward one layer (move up by one position in z-order)
   */
  async bringForward(shapeIds: string[]): Promise<void> {
    if (shapeIds.length === 0 || !this.userId) return;

    const userId = this.userId;

    try {
      const { objects } = useCanvasStore.getState();

      // Sort all shapes by zIndex (ascending)
      const sortedShapes = [...objects].sort((a, b) => a.zIndex - b.zIndex);

      // Process each selected shape
      const updates: Array<{ id: string; zIndex: number }> = [];

      for (const shapeId of shapeIds) {
        const currentIndex = sortedShapes.findIndex((s) => s.id === shapeId);
        if (currentIndex === -1 || currentIndex === sortedShapes.length - 1) {
          continue; // Shape not found or already at top
        }

        // Find next non-selected shape above this one
        let targetIndex = currentIndex + 1;
        while (
          targetIndex < sortedShapes.length &&
          shapeIds.includes(sortedShapes[targetIndex].id)
        ) {
          targetIndex++;
        }

        if (targetIndex >= sortedShapes.length) {
          continue; // No non-selected shape above
        }

        // Calculate new zIndex: slightly above the target shape
        const targetShape = sortedShapes[targetIndex];
        const shapeAboveTarget = sortedShapes[targetIndex + 1];

        const newZIndex = shapeAboveTarget
          ? (targetShape.zIndex + shapeAboveTarget.zIndex) / 2
          : targetShape.zIndex + 1;

        updates.push({ id: shapeId, zIndex: newZIndex });
      }

      // Apply all updates
      if (updates.length > 0) {
        await Promise.all(
          updates.map((update) =>
            firestoreService.updateObject(
              update.id,
              { zIndex: update.zIndex },
              userId
            )
          )
        );
      }

      useUIStore.getState().showToast("Brought forward", "success");
    } catch (error) {
      console.error("Error bringing forward:", error);
      useUIStore.getState().showToast("Failed to bring forward", "error");
      throw error;
    }
  }

  /**
   * Send shapes backward one layer (move down by one position in z-order)
   */
  async sendBackward(shapeIds: string[]): Promise<void> {
    if (shapeIds.length === 0 || !this.userId) return;

    const userId = this.userId;

    try {
      const { objects } = useCanvasStore.getState();

      // Sort all shapes by zIndex (ascending)
      const sortedShapes = [...objects].sort((a, b) => a.zIndex - b.zIndex);

      // Process each selected shape
      const updates: Array<{ id: string; zIndex: number }> = [];

      for (const shapeId of shapeIds) {
        const currentIndex = sortedShapes.findIndex((s) => s.id === shapeId);
        if (currentIndex === -1 || currentIndex === 0) {
          continue; // Shape not found or already at bottom
        }

        // Find next non-selected shape below this one
        let targetIndex = currentIndex - 1;
        while (
          targetIndex >= 0 &&
          shapeIds.includes(sortedShapes[targetIndex].id)
        ) {
          targetIndex--;
        }

        if (targetIndex < 0) {
          continue; // No non-selected shape below
        }

        // Calculate new zIndex: slightly below the target shape
        const targetShape = sortedShapes[targetIndex];
        const shapeBelowTarget = sortedShapes[targetIndex - 1];

        const newZIndex = shapeBelowTarget
          ? (targetShape.zIndex + shapeBelowTarget.zIndex) / 2
          : targetShape.zIndex - 1;

        updates.push({ id: shapeId, zIndex: newZIndex });
      }

      // Apply all updates
      if (updates.length > 0) {
        await Promise.all(
          updates.map((update) =>
            firestoreService.updateObject(
              update.id,
              { zIndex: update.zIndex },
              userId
            )
          )
        );
      }

      useUIStore.getState().showToast("Sent backward", "success");
    } catch (error) {
      console.error("Error sending backward:", error);
      useUIStore.getState().showToast("Failed to send backward", "error");
      throw error;
    }
  }

  /**
   * Move shapes by delta
   */
  async moveShapes(
    shapeIds: string[],
    delta: { x: number; y: number }
  ): Promise<void> {
    if (shapeIds.length === 0 || !this.userId) return;

    const userId = this.userId; // Capture for TypeScript type narrowing

    try {
      const { getObjectById } = useCanvasStore.getState();

      // Lock first shape
      if (shapeIds.length > 0) {
        await this.lockManager.acquireActiveLock(shapeIds[0]);
      }

      // Move all shapes
      await Promise.all(
        shapeIds.map((id) => {
          const shape = getObjectById(id);
          if (!shape) return Promise.resolve();

          return firestoreService.updateObject(
            id,
            {
              x: shape.x + delta.x,
              y: shape.y + delta.y,
            },
            userId
          );
        })
      );

      // Release lock
      await this.lockManager.releaseActiveLock();
    } catch (error) {
      console.error("Error moving shapes:", error);
      throw error;
    }
  }

  /**
   * Update shape transformations (position, size, rotation)
   */
  async transformShapes(
    transformedShapes: Array<{
      id: string;
      x: number;
      y: number;
      width: number;
      height: number;
      rotation: number;
    }>
  ): Promise<void> {
    if (transformedShapes.length === 0 || !this.userId) return;

    const userId = this.userId; // Capture for TypeScript type narrowing

    try {
      const { getObjectById } = useCanvasStore.getState();

      for (const transformed of transformedShapes) {
        const shape = getObjectById(transformed.id);
        if (!shape) continue;

        // Handle circle/ellipse positioning (center vs top-left)
        let finalX = transformed.x;
        let finalY = transformed.y;
        let finalWidth = transformed.width;
        let finalHeight = transformed.height;

        if (shape.type === "circle") {
          const radiusX = transformed.width / 2;
          const radiusY = transformed.height / 2;
          finalX = transformed.x - radiusX;
          finalY = transformed.y - radiusY;
          finalWidth = transformed.width;
          finalHeight = transformed.height;
        }

        await firestoreService.updateObject(
          transformed.id,
          {
            x: finalX,
            y: finalY,
            width: finalWidth,
            height: finalHeight,
            rotation: transformed.rotation,
          },
          userId
        );
      }

      // Release lock after transformation
      await this.lockManager.releaseActiveLock();
    } catch (error) {
      console.error("Error transforming shapes:", error);
      useUIStore.getState().showToast("Failed to transform shapes", "error");
      throw error;
    }
  }

  /**
   * Update text content
   */
  async updateText(shapeId: string, text: string): Promise<void> {
    if (!this.userId) return;

    const userId = this.userId; // Capture for TypeScript type narrowing

    try {
      await firestoreService.updateObject(shapeId, { text }, userId);
    } catch (error) {
      console.error("Error updating text:", error);
      useUIStore.getState().showToast("Failed to update text", "error");
      throw error;
    }
  }

  /**
   * Open properties tool window
   */
  openPropertiesPanel(shapeId: string): void {
    useUIStore.getState().openToolWindow("properties", shapeId);
  }

  /**
   * Group selected shapes (future feature)
   */
  async groupShapes(shapeIds: string[]): Promise<void> {
    // TODO: Implement grouping in future PR
    useUIStore.getState().showToast("Grouping coming soon!", "info");
  }

  /**
   * Copy shapes to clipboard
   */
  async copyShapes(shapeIds: string[]): Promise<void> {
    if (shapeIds.length === 0) return;

    try {
      const { getObjectById } = useCanvasStore.getState();
      const shapes = shapeIds
        .map((id) => getObjectById(id))
        .filter(Boolean) as CanvasObject[];

      if (shapes.length === 0) {
        useUIStore.getState().showToast("No shapes to copy", "info");
        return;
      }

      // Store in localStorage
      localStorage.setItem("clipboard", JSON.stringify(shapes));
      useUIStore
        .getState()
        .showToast(
          `Copied ${shapes.length} shape${shapes.length > 1 ? "s" : ""}`,
          "success"
        );
    } catch (error) {
      console.error("Error copying shapes:", error);
      useUIStore.getState().showToast("Failed to copy shapes", "error");
    }
  }

  /**
   * Paste shapes from clipboard with offset
   */
  async pasteShapes(): Promise<void> {
    if (!this.userId) return;

    try {
      const clipboardData = localStorage.getItem("clipboard");
      if (!clipboardData) {
        useUIStore.getState().showToast("Nothing to paste", "info");
        return;
      }

      const shapes = JSON.parse(clipboardData) as CanvasObject[];

      if (!shapes || shapes.length === 0) {
        useUIStore.getState().showToast("Nothing to paste", "info");
        return;
      }

      const offset = 20; // Offset pasted shapes so they're visible
      const newShapeIds: string[] = [];

      // Get max zIndex to place pasted shapes on top
      const { objects } = useCanvasStore.getState();
      const maxZIndex = Math.max(...objects.map((obj) => obj.zIndex || 0), 0);

      for (let i = 0; i < shapes.length; i++) {
        const shape = shapes[i];

        // Build shape data, excluding undefined values
        const pasteData: any = {
          type: shape.type,
          x: shape.x + offset,
          y: shape.y + offset,
          width: shape.width,
          height: shape.height,
          rotation: shape.rotation || 0,
          color: shape.color,
          zIndex: maxZIndex + i + 1,
          lockedBy: null,
          lockedAt: null,
          lastUpdatedBy: this.userId,
        };

        // Only add text fields if they exist
        if (shape.text !== undefined && shape.text !== null) {
          pasteData.text = shape.text;
        }
        if (shape.fontSize !== undefined && shape.fontSize !== null) {
          pasteData.fontSize = shape.fontSize;
        }

        const newShape = await firestoreService.createObject(
          pasteData,
          this.userId
        );
        newShapeIds.push(newShape.id);
      }

      // Select pasted shapes
      useSelectionStore.getState().setSelectedIds(newShapeIds);
      useUIStore
        .getState()
        .showToast(
          `Pasted ${shapes.length} shape${shapes.length > 1 ? "s" : ""}`,
          "success"
        );
    } catch (error) {
      console.error("Error pasting shapes:", error);
      useUIStore.getState().showToast("Failed to paste shapes", "error");
    }
  }
}

/**
 * Hook to access canvas commands
 * This creates a command service instance with current user and lock manager
 */
export function useCanvasCommands(lockManager: LockManager, userId?: string) {
  return new CanvasCommandService(lockManager, userId);
}
