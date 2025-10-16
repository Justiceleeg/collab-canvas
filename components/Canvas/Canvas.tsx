"use client";

// PR #4 - Basic Canvas with Pan & Zoom
// PR #5 - Firestore Sync Infrastructure
// PR #6 - Rectangle Shape Creation & Rendering
// Main canvas wrapper component
// - Render Stage component
// - Handle canvas events
// - Canvas dimensions and responsiveness
// - Loading states (PR #5)
// - Error states (PR #5)
// - Shape rendering (PR #6) ✓
// - Toolbar integration (PR #6) ✓

import { useCanvas } from "@/hooks/useCanvas";
import { useFirestore, useFirestoreSync } from "@/hooks/useFirestore";
import { useCursors } from "@/hooks/useCursors"; // PR #9 - Cursor tracking
import { useActiveLock } from "@/hooks/useActiveLock"; // PR #8 - Object locking (simplified)
import Stage from "./Stage";
import Shape from "./Shape";
import Toolbar from "../Toolbar/Toolbar";
import Cursors from "./Cursors"; // PR #9 - Multiplayer cursors
import Transformer from "./Transformer"; // PR #12 - Transform controls (early implementation)
import TextEditor from "./TextEditor"; // PR #11 - Text editing
import { Text } from "react-konva";
import { useCanvasStore } from "@/store/canvasStore";
import { useSelectionStore } from "@/store/selectionStore"; // PR #7 - Selection management
import { firestoreService } from "@/services/firestore.service"; // PR #13 - Delete operations
import type Konva from "konva";
import KonvaLib from "konva"; // PR #14 - Import Konva for utilities
import { useAuth } from "@/hooks/useAuth";
import { useRef, useState, useCallback, useMemo, useEffect } from "react"; // PR #13 - Added useEffect

export default function Canvas() {
  const {
    dimensions,
    viewport,
    objects,
    handleCanvasClick,
    activeTool,
    setActiveTool,
    isCreatingShape,
  } = useCanvas();
  const { loading, error, isConnected, retry } = useFirestore();
  const { updateObject } = useFirestoreSync(); // Use sync hook for Firestore updates
  const { updateCursor } = useCursors(); // PR #9 - Cursor tracking
  const {
    acquireActiveLock,
    releaseActiveLock,
    hasActiveLock,
    isLocked,
    getLockInfo,
  } = useActiveLock(); // PR #8 - Locking
  const { user } = useAuth();
  const { selectedIds, setSelectedIds } = useSelectionStore(); // PR #7 - Selection state
  const { getObjectById } = useCanvasStore.getState();

  // PR #11 - Text editing state
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const stageRef = useRef<Konva.Stage | null>(null);

  // PR #14 - Track shift key for additive selection
  const shiftKeyPressed = useRef(false);

  // PR #14 - Track shift key for additive selection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Shift") {
        shiftKeyPressed.current = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Shift") {
        shiftKeyPressed.current = false;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // PR #13 - Release locks when selection is fully cleared (externally, not by user click)
  useEffect(() => {
    if (selectedIds.length === 0) {
      // No selection: release all locks
      // This handles cases where selection is cleared programmatically
      releaseActiveLock();
    }
    // Note: We intentionally don't re-acquire locks when selection changes
    // Locks are acquired explicitly on click/drag/transform actions
  }, [selectedIds.length, releaseActiveLock]);

  // PR #13 - Delete multiple selected shapes
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      // Don't delete if user is editing text or typing in an input
      if (
        editingTextId ||
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Delete or Backspace key
      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        selectedIds.length > 0
      ) {
        e.preventDefault();

        try {
          // PR #13 - Release locks BEFORE deleting to prevent 400 errors
          await releaseActiveLock();

          // Delete all selected shapes
          const { removeObjects } = useCanvasStore.getState();
          const deletePromises = selectedIds.map((id) =>
            firestoreService.deleteObject(id)
          );

          await Promise.all(deletePromises);

          // Clear selection
          setSelectedIds([]);
        } catch (error) {
          console.error("Error deleting shapes:", error);
          // TODO: Show error toast (PR #18)
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIds, editingTextId, setSelectedIds, releaseActiveLock]);

  // PR #14 - Handle selection box change (drag-to-select)
  const handleSelectionBoxChange = useCallback(
    async (
      box: { x: number; y: number; width: number; height: number } | null
    ) => {
      if (box && stageRef.current) {
        // Find all shape nodes on the stage
        const stage = stageRef.current;

        // Get all shape nodes and check intersection using Konva's utilities
        const shapeIdsInBox = objects
          .filter((obj) => {
            // Find the actual Konva node for this shape
            const node = stage.findOne(`#${obj.id}`);
            if (!node) return false;

            // Use Konva's built-in getClientRect() to get actual bounding box
            // This accounts for rotation, scale, and all transformations
            // Note: For rotated shapes, this returns an axis-aligned bounding box (AABB)
            // which includes the rotated shape. This is the standard approach.
            const nodeBox = node.getClientRect();

            // Use Konva.Util.haveIntersection for accurate intersection detection
            const intersects = KonvaLib.Util.haveIntersection(box, nodeBox);

            return intersects;
          })
          .map((obj) => obj.id);

        if (shiftKeyPressed.current) {
          // PR #14 - Additive selection: add shapes to existing selection
          const newSelectedIds = [
            ...new Set([...selectedIds, ...shapeIdsInBox]),
          ];
          setSelectedIds(newSelectedIds);

          // Acquire locks for newly selected shapes
          for (const id of shapeIdsInBox) {
            if (!selectedIds.includes(id)) {
              await acquireActiveLock(id);
            }
          }
        } else {
          // PR #14 - Replace selection
          await releaseActiveLock();
          setSelectedIds(shapeIdsInBox);

          // Acquire locks for all selected shapes
          if (shapeIdsInBox.length > 0) {
            // For simplicity, only lock the first shape to avoid transaction conflicts
            await acquireActiveLock(shapeIdsInBox[0]);
          }
        }
      }
    },
    [
      objects,
      selectedIds,
      setSelectedIds,
      acquireActiveLock,
      releaseActiveLock,
      stageRef,
    ]
  );

  // PR #8 - Wrapper for canvas click that releases lock when clicking empty space
  const handleCanvasClickWithLockRelease = useCallback(
    async (e: Konva.KonvaEventObject<MouseEvent>) => {
      await releaseActiveLock();
      handleCanvasClick(e);
    },
    [releaseActiveLock, handleCanvasClick]
  );

  const handleShapeClick = useCallback(
    async (id: string, shiftKey: boolean) => {
      // PR #13 - Multi-select with shift-click
      const { toggleSelection, selectedIds: currentSelectedIds } =
        useSelectionStore.getState();

      if (shiftKey) {
        // Shift-click: toggle this shape in selection
        toggleSelection(id);

        // PR #13 - Acquire lock for newly selected shape or release if deselecting
        const wasSelected = currentSelectedIds.includes(id);
        if (!wasSelected) {
          // Adding to selection: acquire lock
          await acquireActiveLock(id);
        } else {
          // Removing from selection: would need to release just this one
          // For now, we'll handle this in releaseActiveLock when selection changes
        }
      } else {
        // Normal click: single selection
        // Release all previous locks and acquire new one
        await releaseActiveLock();
        setSelectedIds([id]);
        await acquireActiveLock(id);
      }
    },
    [setSelectedIds, acquireActiveLock, releaseActiveLock]
  );

  const handleShapeDragStart = useCallback(
    async (id: string, e: Konva.KonvaEventObject<DragEvent>) => {
      // PR #8 - Prevent drag if locked by another user
      if (isLocked(id) && !hasActiveLock(id)) {
        e.evt.preventDefault();
        e.evt.stopPropagation();
        return false;
      }

      // PR #13 - Simplified: only lock the shape being dragged
      // Other selected shapes will move together without individual locks
      // This avoids transaction conflicts while still preventing concurrent edits
      if (!selectedIds.includes(id)) {
        setSelectedIds([id]);
      }

      // Only lock the dragged shape if we don't already have it
      if (!hasActiveLock(id)) {
        await acquireActiveLock(id);
      }
    },
    [isLocked, hasActiveLock, selectedIds, setSelectedIds, acquireActiveLock]
  );

  const handleShapeDragEnd = useCallback(
    async (id: string, e: Konva.KonvaEventObject<DragEvent>) => {
      if (!user) return;

      const node = e.target as Konva.Node & {
        x: () => number;
        y: () => number;
      };
      let newX = node.x();
      let newY = node.y();

      const draggedShape = getObjectById(id);
      if (!draggedShape) return;

      // Calculate the offset from the original position
      let originalX = draggedShape.x;
      let originalY = draggedShape.y;

      if (draggedShape.type === "circle") {
        // Ellipses use separate radii for X and Y
        const radiusX = (draggedShape.width || 0) / 2;
        const radiusY = (draggedShape.height || 0) / 2;
        newX = newX - radiusX;
        newY = newY - radiusY;
      }

      const deltaX = newX - originalX;
      const deltaY = newY - originalY;

      try {
        // PR #13 - Move all selected shapes together
        if (selectedIds.length > 1 && selectedIds.includes(id)) {
          // Multi-select: move all selected shapes by the same offset
          const updates = selectedIds
            .map((shapeId) => {
              const shape = getObjectById(shapeId);
              if (!shape) return null;

              return updateObject(shapeId, {
                x: shape.x + deltaX,
                y: shape.y + deltaY,
              });
            })
            .filter(Boolean);

          await Promise.all(updates);
        } else {
          // Single shape: just move the dragged shape
          await updateObject(id, { x: newX, y: newY });
        }

        // PR #13 - Release locks after drag completes
        await releaseActiveLock();
      } catch (error) {
        console.error("Error syncing shape position:", error);
      }
    },
    [user, getObjectById, updateObject, selectedIds, releaseActiveLock]
  );

  // PR #9 - Track cursor movement and update in Realtime Database
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      updateCursor(x, y);
    },
    [updateCursor]
  );

  // PR #11 - Text editing handlers
  const handleTextDblClick = useCallback((id: string) => {
    setEditingTextId(id);
  }, []);

  const handleTextChange = useCallback(
    async (id: string, newText: string) => {
      if (!user) return;

      try {
        await updateObject(id, { text: newText });
      } catch (error) {
        console.error("Error updating text:", error);
        // TODO: Show error toast (PR #18)
      }
    },
    [user, updateObject]
  );

  const handleTextEditClose = useCallback(() => {
    setEditingTextId(null);
  }, []);

  // PR #12 - Transform handlers (resize & rotate)
  const handleTransformStart = useCallback(
    async (shapeIds: string[]) => {
      // PR #13 - Simplified: only lock the first shape (the one being transformed)
      // This avoids transaction conflicts in multi-select scenarios
      if (shapeIds.length > 0 && !hasActiveLock(shapeIds[0])) {
        await acquireActiveLock(shapeIds[0]);
      }
    },
    [acquireActiveLock, hasActiveLock]
  );

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
      if (!user) return;

      try {
        // Update each transformed shape
        for (const transformed of transformedShapes) {
          const shape = getObjectById(transformed.id);
          if (!shape) continue;

          // For circles/ellipses, we need to handle position differently
          let finalX = transformed.x;
          let finalY = transformed.y;
          let finalWidth = transformed.width;
          let finalHeight = transformed.height;

          if (shape.type === "circle") {
            // Ellipses are positioned by their center in Konva
            // Convert back to top-left corner for storage
            const radiusX = transformed.width / 2;
            const radiusY = transformed.height / 2;
            finalX = transformed.x - radiusX;
            finalY = transformed.y - radiusY;
            // Allow independent width and height for ellipse shapes
            finalWidth = transformed.width;
            finalHeight = transformed.height;
          }

          // Update the shape with new dimensions and rotation
          await updateObject(transformed.id, {
            x: finalX,
            y: finalY,
            width: finalWidth,
            height: finalHeight,
            rotation: transformed.rotation,
          });
        }

        // Release lock after successful update
        await releaseActiveLock();
      } catch (error) {
        console.error("Error syncing shape transformation:", error);
        // TODO: Show error toast (PR #18)
      }
    },
    [user, getObjectById, updateObject, releaseActiveLock]
  );

  // Extract text node for editing (memoized to avoid recalculating)
  const editingTextNode = useMemo(() => {
    if (!editingTextId || !stageRef.current) return null;

    const group = stageRef.current.findOne(`#${editingTextId}`) as Konva.Group;
    if (!group) return null;

    return group.findOne(".text-node") as Konva.Text;
  }, [editingTextId, stageRef.current]);

  // Loading state - show while fetching initial canvas state
  if (loading) {
    return (
      <div className="canvas-container flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading canvas...</p>
        </div>
      </div>
    );
  }

  // Error state - show if connection fails
  if (error) {
    return (
      <div className="canvas-container flex items-center justify-center">
        <div className="text-center max-w-md p-6 bg-red-50 rounded-lg border border-red-200">
          <div className="text-red-600 mb-4">
            <svg
              className="w-12 h-12 mx-auto mb-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="text-lg font-semibold">Connection Error</h3>
          </div>
          <p className="text-red-800 mb-4">{error.message}</p>
          <button
            onClick={retry}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="canvas-container">
      {/* Toolbar */}
      <Toolbar selectedTool={activeTool} onToolSelect={setActiveTool} />

      {/* Stage Wrapper */}
      <div className="canvas-stage-wrapper" onMouseMove={handleMouseMove}>
        {/* Canvas Stage */}
        <Stage
          width={dimensions.width}
          height={dimensions.height}
          onStageClick={handleCanvasClickWithLockRelease}
          stageRef={stageRef}
          onSelectionBoxChange={handleSelectionBoxChange}
        >
          {/* Help text when canvas is empty */}
          {objects.length === 0 && (
            <Text
              text="Welcome! Click Rectangle to create shapes • Drag to select • Shift+Click for multi-select • Pan: Space+Drag • Zoom: Mouse Wheel"
              x={50}
              y={50}
              fontSize={16}
              fill="#666"
              listening={false}
            />
          )}

          {/* Render all shapes */}
          {objects.map((obj) => (
            <Shape
              key={obj.id}
              shape={obj}
              isSelected={selectedIds.includes(obj.id)}
              isLocked={isLocked(obj.id)}
              lockInfo={getLockInfo(obj.id)}
              onClick={(e) => handleShapeClick(obj.id, e.evt.shiftKey)}
              onDragStart={(e) => handleShapeDragStart(obj.id, e)}
              onDragEnd={(e) => handleShapeDragEnd(obj.id, e)}
              // PR #11 - Text editing props
              onDblClick={
                obj.type === "text"
                  ? () => handleTextDblClick(obj.id)
                  : undefined
              }
              isEditing={obj.id === editingTextId}
            />
          ))}

          {/* PR #12 - Transformer for selected shapes (hide when editing text) */}
          {selectedIds.length > 0 && !editingTextId && (
            <Transformer
              selectedShapeIds={selectedIds}
              isLocked={selectedIds.some((id) => isLocked(id))}
              onTransformStart={handleTransformStart}
              onTransformEnd={handleTransformEnd}
            />
          )}

          {/* PR #11 - Text editor overlay */}
          {editingTextNode && (
            <TextEditor
              key={editingTextId}
              textNode={editingTextNode}
              onClose={handleTextEditClose}
              onChange={(newText) => handleTextChange(editingTextId!, newText)}
            />
          )}

          {/* Creating shape indicator */}
          {isCreatingShape && (
            <Text
              text="Creating shape..."
              x={dimensions.width / 2 - 60}
              y={20}
              fontSize={14}
              fill="#0066FF"
              listening={false}
            />
          )}
        </Stage>

        {/* PR #9 - Multiplayer cursors overlay */}
        <Cursors />
      </div>

      {/* Connection status indicator */}
      {!isConnected && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 rounded shadow-lg">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">Reconnecting...</span>
          </div>
        </div>
      )}

      {/* Viewport debug info (optional, can be removed) */}
      <div className="canvas-info">
        <div className="text-xs text-gray-500 bg-white/90 px-3 py-2 rounded shadow">
          <div>Zoom: {(viewport.scale * 100).toFixed(0)}%</div>
          <div>
            Position: ({viewport.x.toFixed(0)}, {viewport.y.toFixed(0)})
          </div>
          <div>Objects: {objects.length}</div>
          <div className="flex items-center gap-1">
            <span>Sync:</span>
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? "bg-green-500" : "bg-yellow-500"
              }`}
            ></span>
          </div>
        </div>
      </div>
    </div>
  );
}
