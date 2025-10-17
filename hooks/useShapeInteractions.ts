// Shape Interactions Hook
// Handles all shape-level interactions: click, drag, transform, right-click
// Consolidates event handlers that were previously scattered in Canvas.tsx

import { useCallback, useRef } from "react";
import { useSelectionStore } from "@/store/selectionStore";
import { useUIStore } from "@/store/uiStore";
import { useCanvasStore } from "@/store/canvasStore";
import { useFirestoreSync } from "./useFirestore";
import { useAuth } from "./useAuth";
import { firestoreService } from "@/services/firestore.service";
import type { CanvasCommandService } from "@/services/canvasCommands";
import type Konva from "konva";

interface UseShapeInteractionsProps {
  commands: CanvasCommandService;
  lockManager: {
    acquireActiveLock: (shapeId: string) => Promise<any>;
    releaseActiveLock: () => Promise<void>;
    hasActiveLock: (shapeId: string) => boolean;
    isLocked: (shapeId: string) => boolean;
    getLockInfo?: (shapeId: string) => any;
  };
}

/**
 * Hook that provides all shape interaction handlers
 * This extracts event handling logic from Canvas.tsx into a reusable hook
 */
export function useShapeInteractions({
  commands,
  lockManager,
}: UseShapeInteractionsProps) {
  const { selectedIds, setSelectedIds, toggleSelection } = useSelectionStore();
  const { openContextMenu } = useUIStore();
  // Don't destructure getObjectById - call it fresh each time to get current state
  const { updateObject } = useFirestoreSync();
  const { user } = useAuth();
  const modifiers = useUIStore((state) => state.modifiers);

  // Guard to prevent duplicate batch updates when multiple shapes fire dragEnd
  const dragEndProcessedRef = useRef<boolean>(false);

  /**
   * Handle shape click (single select or multi-select with shift)
   */
  const handleShapeClick = useCallback(
    async (id: string, shiftKey: boolean) => {
      if (shiftKey) {
        // Shift-click: toggle this shape in selection
        toggleSelection(id);

        // Acquire lock for newly selected shape or release if deselecting
        const wasSelected = selectedIds.includes(id);
        if (!wasSelected) {
          await lockManager.acquireActiveLock(id);
        }
      } else {
        // Normal click: single selection
        // Release all previous locks and acquire new one
        await lockManager.releaseActiveLock();
        setSelectedIds([id]);
        await lockManager.acquireActiveLock(id);
      }
    },
    [selectedIds, setSelectedIds, toggleSelection, lockManager]
  );

  /**
   * Handle right-click on shape to open context menu
   */
  const handleShapeRightClick = useCallback(
    (shapeId: string, e: Konva.KonvaEventObject<PointerEvent>) => {
      e.evt.preventDefault();

      // Get screen position for menu
      const stage = e.target.getStage();
      const pointerPos = stage?.getPointerPosition();
      if (!pointerPos) return;

      // Determine which shapes to include in context menu
      // If right-clicked on a selected shape, show menu for all selected shapes
      // Otherwise, show menu for just this shape
      const targetShapes = selectedIds.includes(shapeId)
        ? selectedIds
        : [shapeId];

      // If we right-clicked an unselected shape, select it first
      if (!selectedIds.includes(shapeId)) {
        setSelectedIds([shapeId]);
      }

      openContextMenu(pointerPos, targetShapes);
    },
    [selectedIds, setSelectedIds, openContextMenu]
  );

  /**
   * Handle shape drag start
   */
  const handleShapeDragStart = useCallback(
    async (id: string, e: Konva.KonvaEventObject<DragEvent>) => {
      // Reset the drag end guard for this new drag operation
      dragEndProcessedRef.current = false;

      // Prevent drag if locked by another user
      if (lockManager.isLocked(id) && !lockManager.hasActiveLock(id)) {
        e.evt.preventDefault();
        e.evt.stopPropagation();
        return false;
      }

      // If dragging a shape that's not in selection, select it
      if (!selectedIds.includes(id)) {
        setSelectedIds([id]);
      }

      // Only lock the dragged shape if we don't already have it
      if (!lockManager.hasActiveLock(id)) {
        await lockManager.acquireActiveLock(id);
      }
    },
    [lockManager, selectedIds, setSelectedIds]
  );

  /**
   * Handle shape drag end - update positions in Firestore
   */
  const handleShapeDragEnd = useCallback(
    async (id: string, e: Konva.KonvaEventObject<DragEvent>) => {
      const node = e.target as Konva.Node & {
        x: () => number;
        y: () => number;
      };
      let newX = node.x();
      let newY = node.y();

      const draggedShape = useCanvasStore.getState().getObjectById(id);
      if (!draggedShape) return;

      // Calculate the offset from the original position
      const originalX = draggedShape.x;
      const originalY = draggedShape.y;

      // Handle circle and rectangle positioning (center vs top-left)
      // Both are now positioned by center for consistent rotation behavior
      if (draggedShape.type === "circle" || draggedShape.type === "rectangle") {
        const halfWidth = (draggedShape.width || 0) / 2;
        const halfHeight = (draggedShape.height || 0) / 2;
        newX = newX - halfWidth;
        newY = newY - halfHeight;
      }

      const deltaX = newX - originalX;
      const deltaY = newY - originalY;

      try {
        // Move all selected shapes together if multi-select
        if (selectedIds.length > 1 && selectedIds.includes(id)) {
          // Guard: When dragging multiple shapes, Konva fires dragEnd for EACH shape
          // We only want to process the batch update ONCE
          if (dragEndProcessedRef.current) {
            return;
          }
          dragEndProcessedRef.current = true;

          // Reset the dragged node back to its original position
          // because the batch update will handle ALL shapes including this one
          if (
            draggedShape.type === "circle" ||
            draggedShape.type === "rectangle"
          ) {
            const halfWidth = (draggedShape.width || 0) / 2;
            const halfHeight = (draggedShape.height || 0) / 2;
            node.x(originalX + halfWidth);
            node.y(originalY + halfHeight);
          } else {
            node.x(originalX);
            node.y(originalY);
          }

          // Use batch update for simultaneous appearance on remote screens
          const updates = selectedIds
            .map((shapeId) => {
              const shape = useCanvasStore.getState().getObjectById(shapeId);
              if (!shape) return null;

              return {
                id: shapeId,
                data: {
                  x: shape.x + deltaX,
                  y: shape.y + deltaY,
                },
              };
            })
            .filter(Boolean) as Array<{
            id: string;
            data: { x: number; y: number };
          }>;

          if (updates.length > 0 && user?.uid) {
            // Optimistic local update for immediate feedback (store only, no Firestore)
            updates.forEach(({ id: shapeId, data }) => {
              useCanvasStore.getState().updateObject(shapeId, data);
            });

            // Single batch update to Firestore (all shapes appear at once on remote)
            await firestoreService.batchUpdateObjects(updates, user.uid);
          }
        } else {
          // Single shape: just move the dragged shape
          await updateObject(id, { x: newX, y: newY });
        }

        // Release locks after drag completes
        await lockManager.releaseActiveLock();
      } catch (error) {
        console.error("Error syncing shape position:", error);
        useUIStore.getState().showToast("Failed to move shape", "error");
      }
    },
    [selectedIds, updateObject, lockManager, user]
  );

  /**
   * Handle double-click on text shape to start editing
   */
  const handleTextDblClick = useCallback((id: string) => {
    // Return the id so Canvas.tsx can set editingTextId
    return id;
  }, []);

  /**
   * Handle text content change
   */
  const handleTextChange = useCallback(
    async (id: string, newText: string) => {
      try {
        await commands.updateText(id, newText);
      } catch (error) {
        console.error("Error updating text:", error);
      }
    },
    [commands]
  );

  /**
   * Handle transform start (resize/rotate)
   */
  const handleTransformStart = useCallback(
    async (shapeIds: string[]) => {
      // Lock the first shape to prevent concurrent edits
      if (shapeIds.length > 0 && !lockManager.hasActiveLock(shapeIds[0])) {
        await lockManager.acquireActiveLock(shapeIds[0]);
      }
    },
    [lockManager]
  );

  /**
   * Handle transform end - update Firestore with new dimensions/rotation
   */
  const handleTransformEnd = useCallback(
    async (
      transformedShapes: Array<{
        id: string;
        x: number;
        y: number;
        width: number;
        height: number;
        rotation: number;
        scaleX: number;
        scaleY: number;
      }>
    ) => {
      try {
        await commands.transformShapes(transformedShapes);
      } catch (error) {
        console.error("Error syncing shape transformation:", error);
      }
    },
    [commands]
  );

  return {
    handleShapeClick,
    handleShapeRightClick,
    handleShapeDragStart,
    handleShapeDragEnd,
    handleTextDblClick,
    handleTextChange,
    handleTransformStart,
    handleTransformEnd,
    modifiers,
  };
}
