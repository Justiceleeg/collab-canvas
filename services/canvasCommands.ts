// Canvas Command Service
// Centralized service for all canvas operations (CRUD, transformations, etc.)
// Handles locking, Firestore sync, optimistic updates, and error handling
// This is the "action layer" that sits between UI interactions and domain state

import { firestoreService } from "./firestore.service";
import { useCanvasStore } from "@/store/canvasStore";
import { useSelectionStore } from "@/store/selectionStore";
import { useUIStore } from "@/store/uiStore";
import { useHistoryStore } from "@/store/historyStore";
import type { CanvasObject, ShapeType } from "@/types/canvas.types";
import type Konva from "konva";

export interface LockManager {
  acquireActiveLock: (shapeId: string) => Promise<any>;
  batchAcquireActiveLocks: (
    shapeIds: string[],
    forceReacquire?: boolean
  ) => Promise<any>;
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
      const { getObjectById } = useCanvasStore.getState();

      // Capture shape data for undo BEFORE deleting
      const shapesData = shapeIds
        .map((id) => getObjectById(id))
        .filter(Boolean) as CanvasObject[];

      // Release locks BEFORE deleting
      await this.lockManager.releaseActiveLock();

      // Delete all shapes in parallel
      await Promise.all(
        shapeIds.map((id) => firestoreService.deleteObject(id))
      );

      // Clear selection
      useSelectionStore.getState().setSelectedIds([]);

      // Add to history for undo
      useHistoryStore.getState().addCommand({
        type: "delete",
        description: `Delete ${shapeIds.length} shape${
          shapeIds.length > 1 ? "s" : ""
        }`,
        undo: {
          shapes: shapesData, // Restore deleted shapes
        },
        redo: {
          shapeIds, // Delete these shapes again
        },
      });

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
      const { getObjectById } = useCanvasStore.getState();

      // Acquire locks for ALL shapes being updated
      if (shapeIds.length > 1) {
        await this.lockManager.batchAcquireActiveLocks(shapeIds);
      } else if (shapeIds.length === 1) {
        await this.lockManager.acquireActiveLock(shapeIds[0]);
      }

      // Capture previous colors for undo
      const previousValues = shapeIds
        .map((id) => {
          const shape = getObjectById(id);
          if (!shape) return null;
          return { id, data: { color: shape.color } };
        })
        .filter(Boolean) as Array<{ id: string; data: { color: string } }>;

      // Build update data
      const updates = shapeIds.map((id) => ({
        id,
        data: { color },
      }));

      // Optimistic local update
      updates.forEach(({ id, data }) => {
        useCanvasStore.getState().updateObject(id, data);
      });

      // Use batch update for multi-shape operations (atomic Firestore write)
      if (updates.length > 1) {
        await firestoreService.batchUpdateObjects(updates, userId);
      } else {
        await firestoreService.updateObject(
          updates[0].id,
          updates[0].data,
          userId
        );
      }

      // Add to history for undo
      useHistoryStore.getState().addCommand({
        type: "changeColor",
        description: `Change color of ${shapeIds.length} shape${
          shapeIds.length > 1 ? "s" : ""
        }`,
        undo: {
          previousValues,
        },
        redo: {
          newValues: updates,
        },
      });

      // Note: We do NOT release locks here because shapes are still selected
      // Locks will be released when shapes are deselected

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
      const { objects, getObjectById } = useCanvasStore.getState();
      const maxZIndex = Math.max(...objects.map((obj) => obj.zIndex || 0));

      // Capture previous zIndex values for history
      const previousValues = shapeIds.map((id) => {
        const shape = getObjectById(id);
        return {
          id,
          data: { zIndex: shape?.zIndex || 0 },
        };
      });

      // Build update data
      const updates = shapeIds.map((id, index) => ({
        id,
        data: { zIndex: maxZIndex + index + 1 },
      }));

      // Optimistic local update
      updates.forEach(({ id, data }) => {
        useCanvasStore.getState().updateObject(id, data);
      });

      // Use batch update for multi-shape operations
      if (updates.length > 1) {
        await firestoreService.batchUpdateObjects(updates, userId);
      } else {
        await firestoreService.updateObject(
          updates[0].id,
          updates[0].data,
          userId
        );
      }

      // Add to history for undo
      useHistoryStore.getState().addCommand({
        type: "bringToFront",
        description: "Bring to front",
        undo: {
          previousValues,
        },
        redo: {
          newValues: updates,
        },
      });

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
      const { objects, getObjectById } = useCanvasStore.getState();
      const minZIndex = Math.min(...objects.map((obj) => obj.zIndex || 0));

      // Capture previous zIndex values for history
      const previousValues = shapeIds.map((id) => {
        const shape = getObjectById(id);
        return {
          id,
          data: { zIndex: shape?.zIndex || 0 },
        };
      });

      // Build update data
      const updates = shapeIds.map((id, index) => ({
        id,
        data: { zIndex: minZIndex - shapeIds.length + index },
      }));

      // Optimistic local update
      updates.forEach(({ id, data }) => {
        useCanvasStore.getState().updateObject(id, data);
      });

      // Use batch update for multi-shape operations
      if (updates.length > 1) {
        await firestoreService.batchUpdateObjects(updates, userId);
      } else {
        await firestoreService.updateObject(
          updates[0].id,
          updates[0].data,
          userId
        );
      }

      // Add to history for undo
      useHistoryStore.getState().addCommand({
        type: "sendToBack",
        description: "Send to back",
        undo: {
          previousValues,
        },
        redo: {
          newValues: updates,
        },
      });

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
      const { objects, getObjectById } = useCanvasStore.getState();

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
        // Capture previous zIndex values for history
        const previousValues = updates.map(({ id }) => {
          const shape = getObjectById(id);
          return {
            id,
            data: { zIndex: shape?.zIndex || 0 },
          };
        });

        // Format for batch update
        const batchUpdates = updates.map(({ id, zIndex }) => ({
          id,
          data: { zIndex },
        }));

        // Optimistic local update
        batchUpdates.forEach(({ id, data }) => {
          useCanvasStore.getState().updateObject(id, data);
        });

        // Use batch update for multi-shape operations
        if (batchUpdates.length > 1) {
          await firestoreService.batchUpdateObjects(batchUpdates, userId);
        } else {
          await firestoreService.updateObject(
            batchUpdates[0].id,
            batchUpdates[0].data,
            userId
          );
        }

        // Add to history for undo
        useHistoryStore.getState().addCommand({
          type: "bringForward",
          description: "Bring forward",
          undo: {
            previousValues,
          },
          redo: {
            newValues: batchUpdates,
          },
        });
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
      const { objects, getObjectById } = useCanvasStore.getState();

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
        // Capture previous zIndex values for history
        const previousValues = updates.map(({ id }) => {
          const shape = getObjectById(id);
          return {
            id,
            data: { zIndex: shape?.zIndex || 0 },
          };
        });

        // Format for batch update
        const batchUpdates = updates.map(({ id, zIndex }) => ({
          id,
          data: { zIndex },
        }));

        // Optimistic local update
        batchUpdates.forEach(({ id, data }) => {
          useCanvasStore.getState().updateObject(id, data);
        });

        // Use batch update for multi-shape operations
        if (batchUpdates.length > 1) {
          await firestoreService.batchUpdateObjects(batchUpdates, userId);
        } else {
          await firestoreService.updateObject(
            batchUpdates[0].id,
            batchUpdates[0].data,
            userId
          );
        }

        // Add to history for undo
        useHistoryStore.getState().addCommand({
          type: "sendBackward",
          description: "Send backward",
          undo: {
            previousValues,
          },
          redo: {
            newValues: batchUpdates,
          },
        });
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

      // Acquire locks for ALL shapes being moved
      if (shapeIds.length > 1) {
        await this.lockManager.batchAcquireActiveLocks(shapeIds);
      } else if (shapeIds.length === 1) {
        await this.lockManager.acquireActiveLock(shapeIds[0]);
      }

      // Capture previous values for undo
      const previousValues = shapeIds
        .map((id) => {
          const shape = getObjectById(id);
          if (!shape) return null;
          return {
            id,
            data: { x: shape.x, y: shape.y },
          };
        })
        .filter(Boolean) as Array<{
        id: string;
        data: { x: number; y: number };
      }>;

      // Build update data for all shapes
      const updates = shapeIds
        .map((id) => {
          const shape = getObjectById(id);
          if (!shape) return null;

          return {
            id,
            data: {
              x: shape.x + delta.x,
              y: shape.y + delta.y,
            },
          };
        })
        .filter(Boolean) as Array<{
        id: string;
        data: { x: number; y: number };
      }>;

      if (updates.length === 0) return;

      // Optimistic local update for immediate feedback
      updates.forEach(({ id, data }) => {
        useCanvasStore.getState().updateObject(id, data);
      });

      // Use batch update for multi-shape operations (atomic Firestore write)
      // This ensures all shapes appear simultaneously on remote screens
      if (updates.length > 1) {
        await firestoreService.batchUpdateObjects(updates, userId);
      } else {
        // Single shape: use regular update
        await firestoreService.updateObject(
          updates[0].id,
          updates[0].data,
          userId
        );
      }

      // Add to history for undo
      useHistoryStore.getState().addCommand({
        type: "move",
        description: `Move ${shapeIds.length} shape${
          shapeIds.length > 1 ? "s" : ""
        }`,
        undo: {
          previousValues,
        },
        redo: {
          newValues: updates,
        },
      });

      // Note: We do NOT release locks here because shapes are still selected
      // Locks will be released when shapes are deselected
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

      // Capture previous values for undo
      const previousValues: Array<{
        id: string;
        data: {
          x: number;
          y: number;
          width: number;
          height: number;
          rotation: number;
        };
      }> = [];

      // Build updates with proper positioning
      const updates: Array<{
        id: string;
        data: {
          x: number;
          y: number;
          width: number;
          height: number;
          rotation: number;
        };
      }> = [];

      for (const transformed of transformedShapes) {
        const shape = getObjectById(transformed.id);
        if (!shape) continue;

        // Capture previous values
        previousValues.push({
          id: transformed.id,
          data: {
            x: shape.x,
            y: shape.y,
            width: shape.width,
            height: shape.height,
            rotation: shape.rotation || 0,
          },
        });

        // Handle circle and rectangle positioning (center vs top-left)
        // Both are positioned by center for consistent rotation behavior
        let finalX = transformed.x;
        let finalY = transformed.y;
        let finalWidth = transformed.width;
        let finalHeight = transformed.height;

        if (shape.type === "circle" || shape.type === "rectangle") {
          const halfWidth = transformed.width / 2;
          const halfHeight = transformed.height / 2;
          finalX = transformed.x - halfWidth;
          finalY = transformed.y - halfHeight;
          finalWidth = transformed.width;
          finalHeight = transformed.height;
        }

        updates.push({
          id: transformed.id,
          data: {
            x: finalX,
            y: finalY,
            width: finalWidth,
            height: finalHeight,
            rotation: transformed.rotation,
          },
        });
      }

      if (updates.length === 0) return;

      // Optimistic local update
      updates.forEach(({ id, data }) => {
        useCanvasStore.getState().updateObject(id, data);
      });

      // Use batch update for multi-shape operations
      if (updates.length > 1) {
        await firestoreService.batchUpdateObjects(updates, userId);
      } else {
        await firestoreService.updateObject(
          updates[0].id,
          updates[0].data,
          userId
        );
      }

      // Add to history for undo
      useHistoryStore.getState().addCommand({
        type: "transform",
        description: `Transform ${transformedShapes.length} shape${
          transformedShapes.length > 1 ? "s" : ""
        }`,
        undo: {
          previousValues,
        },
        redo: {
          newValues: updates,
        },
      });

      // Note: We do NOT release locks here because shapes are still selected
      // Locks will be released when shapes are deselected
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
      const { getObjectById } = useCanvasStore.getState();
      const shape = getObjectById(shapeId);
      if (!shape) return;

      // Capture previous text for undo
      const previousText = shape.text || "";

      await firestoreService.updateObject(shapeId, { text }, userId);

      // Add to history for undo
      useHistoryStore.getState().addCommand({
        type: "updateText",
        description: `Update text`,
        undo: {
          previousValues: [{ id: shapeId, data: { text: previousText } }],
        },
        redo: {
          newValues: [{ id: shapeId, data: { text } }],
        },
      });
    } catch (error) {
      console.error("Error updating text:", error);
      useUIStore.getState().showToast("Failed to update text", "error");
      throw error;
    }
  }

  /**
   * Update shape properties (for properties panel)
   * Validates inputs and updates Firestore
   */
  async updateShapeProperties(
    shapeId: string,
    properties: Partial<CanvasObject>,
    originalValues?: Partial<CanvasObject>
  ): Promise<void> {
    if (!this.userId) return;

    const userId = this.userId; // Capture for TypeScript type narrowing

    try {
      const { getObjectById } = useCanvasStore.getState();
      const shape = getObjectById(shapeId);
      if (!shape) return;

      // Use provided original values if available (for slider/drag operations),
      // otherwise capture from current shape (for immediate updates)
      let previousValues: Partial<CanvasObject> = {};

      if (originalValues && Object.keys(originalValues).length > 0) {
        // Use the original values passed in (before optimistic updates)
        previousValues = originalValues;
      } else {
        // Capture from current shape (for non-optimistic operations)
        Object.keys(properties).forEach((key) => {
          const k = key as keyof CanvasObject;
          const value = shape[k];
          // Only store if value exists (not undefined)
          if (value !== undefined) {
            previousValues[k] = value as any;
          }
        });
      }

      // Validate numeric ranges
      const validatedProperties: Partial<CanvasObject> = { ...properties };

      // Validate opacity (0-1)
      if (validatedProperties.opacity !== undefined) {
        validatedProperties.opacity = Math.max(
          0,
          Math.min(1, validatedProperties.opacity)
        );
      }

      // Validate rotation (0-360)
      if (validatedProperties.rotation !== undefined) {
        validatedProperties.rotation = validatedProperties.rotation % 360;
        if (validatedProperties.rotation < 0) {
          validatedProperties.rotation += 360;
        }
      }

      // Validate dimensions (minimum 1)
      if (validatedProperties.width !== undefined) {
        validatedProperties.width = Math.max(1, validatedProperties.width);
      }
      if (validatedProperties.height !== undefined) {
        validatedProperties.height = Math.max(1, validatedProperties.height);
      }

      // Validate stroke width (minimum 0)
      if (validatedProperties.strokeWidth !== undefined) {
        validatedProperties.strokeWidth = Math.max(
          0,
          validatedProperties.strokeWidth
        );
      }

      // Filter out undefined values BEFORE sending to Firestore (Firestore doesn't accept undefined)
      const cleanedProperties = Object.fromEntries(
        Object.entries(validatedProperties).filter(
          ([_, value]) => value !== undefined
        )
      ) as Partial<CanvasObject>;

      // Optimistic local update for immediate feedback
      useCanvasStore.getState().updateObject(shapeId, cleanedProperties);

      // Update in Firestore with cleaned properties
      await firestoreService.updateObject(shapeId, cleanedProperties, userId);

      // Add to history for undo
      useHistoryStore.getState().addCommand({
        type: "updateProperties",
        description: `Update properties`,
        undo: {
          previousValues: [{ id: shapeId, data: previousValues }],
        },
        redo: {
          newValues: [{ id: shapeId, data: cleanedProperties }],
        },
      });
    } catch (error) {
      console.error("Error updating shape properties:", error);
      useUIStore.getState().showToast("Failed to update properties", "error");
      throw error;
    }
  }

  /**
   * Open properties tool window
   */
  openPropertiesPanel(shapeId: string): void {
    useUIStore.getState().setPropertiesPanelOpen(true);
  }

  /**
   * Group selected shapes (future feature)
   */
  async groupShapes(shapeIds: string[]): Promise<void> {
    // TODO: Implement grouping in future PR
    useUIStore.getState().showToast("Grouping coming soon!", "info");
  }

  /**
   * Create a new shape on the canvas
   */
  async createShape(
    type: ShapeType,
    position: { x: number; y: number }
  ): Promise<CanvasObject | null> {
    if (!this.userId) return null;

    try {
      const { createShapeData } = useCanvasStore.getState();

      // Create shape data
      const shapeData = createShapeData(type, position, this.userId);

      // Create in Firestore
      const newShape = await firestoreService.createObject(
        shapeData,
        this.userId
      );

      // Select the new shape
      useSelectionStore.getState().setSelectedIds([newShape.id]);

      // Add to history for undo
      useHistoryStore.getState().addCommand({
        type: "create",
        description: `Create ${type}`,
        undo: {
          shapeIds: [newShape.id], // Delete created shape
        },
        redo: {
          shapes: [newShape], // Recreate shape
        },
      });

      return newShape;
    } catch (error) {
      console.error("Error creating shape:", error);
      useUIStore.getState().showToast("Failed to create shape", "error");
      throw error;
    }
  }

  /**
   * Reorder layers by updating zIndex values
   * Used by LayerPanel for drag-to-reorder functionality
   */
  async reorderLayers(
    newOrder: Array<{ id: string; zIndex: number }>
  ): Promise<void> {
    if (!this.userId || newOrder.length === 0) return;

    const userId = this.userId;

    try {
      const { getObjectById } = useCanvasStore.getState();

      // Capture previous zIndex values for history
      const previousValues = newOrder.map(({ id }) => {
        const shape = getObjectById(id);
        return {
          id,
          data: { zIndex: shape?.zIndex || 0 },
        };
      });

      // Format for batch update
      const updates = newOrder.map(({ id, zIndex }) => ({
        id,
        data: { zIndex },
      }));

      // Optimistic local update
      updates.forEach(({ id, data }) => {
        useCanvasStore.getState().updateObject(id, data);
      });

      // Use batch update for atomic Firestore write
      if (updates.length > 1) {
        await firestoreService.batchUpdateObjects(updates, userId);
      } else {
        await firestoreService.updateObject(
          updates[0].id,
          updates[0].data,
          userId
        );
      }

      // Add to history for undo
      useHistoryStore.getState().addCommand({
        type: "reorderLayers",
        description: "Reorder layers",
        undo: {
          previousValues,
        },
        redo: {
          newValues: updates,
        },
      });
    } catch (error) {
      console.error("Error reordering layers:", error);
      useUIStore.getState().showToast("Failed to reorder layers", "error");
      throw error;
    }
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
