"use client";

// Canvas Component - Refactored Architecture
// Now uses:
// - Layer 1: UI State (uiStore) for context menus, tool windows, overlays
// - Layer 2: Interaction Hooks (useShapeInteractions, useKeyboardShortcuts)
// - Layer 3: Command Service (CanvasCommandService) for all operations
// - Layer 4: Domain State (canvasStore, selectionStore) via existing hooks

import { useCanvas } from "@/hooks/useCanvas";
import { useFirestore } from "@/hooks/useFirestore";
import { useCursors } from "@/hooks/useCursors";
import { useActiveLock } from "@/hooks/useActiveLock";
import { useShapeInteractions } from "@/hooks/useShapeInteractions";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useCanvasCommands } from "@/services/canvasCommands";
import Stage from "./Stage";
import Shape from "./Shape";
import Toolbar from "../Toolbar/Toolbar";
import Cursors from "./Cursors";
import Transformer from "./Transformer";
import TextEditor from "./TextEditor";
import ContextMenu from "./ContextMenu";
import Toast from "./Toast";
import { Text } from "react-konva";
import { useSelectionStore } from "@/store/selectionStore";
import { useAuth } from "@/hooks/useAuth";
import { useRef, useState, useCallback, useMemo, useEffect } from "react";
import type Konva from "konva";
import KonvaLib from "konva";

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
  const { updateCursor } = useCursors();
  const { user } = useAuth();

  // Locking system
  const lockManager = useActiveLock();
  const { acquireActiveLock, releaseActiveLock, isLocked, getLockInfo } =
    lockManager;

  // Selection state
  const { selectedIds, setSelectedIds } = useSelectionStore();

  // Text editing state
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const stageRef = useRef<Konva.Stage | null>(null);

  // ============================================================
  // NEW ARCHITECTURE: Command service and interaction hooks
  // ============================================================

  // Layer 3: Command service for all canvas operations
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const commands = useCanvasCommands(lockManager as any, user?.uid);

  // Layer 2: Shape interaction handlers
  const shapeInteractions = useShapeInteractions({
    commands,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    lockManager: lockManager as any,
  });

  // Layer 2: Keyboard shortcuts (centralized)
  useKeyboardShortcuts({
    commands,
    editingTextId,
    activeTool,
    onEscapeKey: () => setActiveTool(null),
  });

  // ============================================================
  // Canvas-level event handlers
  // ============================================================

  // Handle canvas click with lock release
  const handleCanvasClickWithLockRelease = useCallback(
    async (e: Konva.KonvaEventObject<MouseEvent>) => {
      await releaseActiveLock();
      handleCanvasClick(e);
    },
    [releaseActiveLock, handleCanvasClick]
  );

  // Handle selection box change (drag-to-select)
  const handleSelectionBoxChange = useCallback(
    async (
      box: { x: number; y: number; width: number; height: number } | null
    ) => {
      if (box && stageRef.current) {
        const stage = stageRef.current;

        // Find all shapes that intersect with the selection box
        const shapeIdsInBox = objects
          .filter((obj) => {
            const node = stage.findOne(`#${obj.id}`);
            if (!node) return false;

            const nodeBox = node.getClientRect();
            return KonvaLib.Util.haveIntersection(box, nodeBox);
          })
          .map((obj) => obj.id);

        // Check if shift key is pressed for additive selection
        const { modifiers } = shapeInteractions;

        if (modifiers.shift) {
          // Additive selection: add shapes to existing selection
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
          // Replace selection
          await releaseActiveLock();
          setSelectedIds(shapeIdsInBox);

          // Acquire lock for first shape (simplified locking)
          if (shapeIdsInBox.length > 0) {
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
      shapeInteractions,
    ]
  );

  // Track cursor movement for multiplayer
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      updateCursor(x, y);
    },
    [updateCursor]
  );

  // Text editing handlers
  const handleTextDblClick = useCallback((id: string) => {
    setEditingTextId(id);
  }, []);

  const handleTextChange = useCallback(
    async (id: string, newText: string) => {
      await shapeInteractions.handleTextChange(id, newText);
    },
    [shapeInteractions]
  );

  const handleTextEditClose = useCallback(() => {
    setEditingTextId(null);
  }, []);

  // Extract text node for editing (memoized)
  const editingTextNode = useMemo(() => {
    if (!editingTextId || !stageRef.current) return null;

    const group = stageRef.current.findOne(`#${editingTextId}`) as Konva.Group;
    if (!group) return null;

    return group.findOne(".text-node") as Konva.Text;
  }, [editingTextId]);

  // Release locks when selection is cleared externally
  useEffect(() => {
    if (selectedIds.length === 0) {
      releaseActiveLock();
    }
  }, [selectedIds.length, releaseActiveLock]);

  // ============================================================
  // Render
  // ============================================================

  // Loading state
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

  // Error state
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
              text="Welcome! Click Rectangle to create shapes • Drag to select • Shift+Click for multi-select • Pan: Space+Drag • Zoom: Mouse Wheel • Right-Click for menu"
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
              onClick={(e) =>
                shapeInteractions.handleShapeClick(obj.id, e.evt.shiftKey)
              }
              onDragStart={(e) =>
                shapeInteractions.handleShapeDragStart(obj.id, e)
              }
              onDragEnd={(e) => shapeInteractions.handleShapeDragEnd(obj.id, e)}
              onDblClick={
                obj.type === "text"
                  ? () => handleTextDblClick(obj.id)
                  : undefined
              }
              isEditing={obj.id === editingTextId}
              onContextMenu={(e) =>
                shapeInteractions.handleShapeRightClick(obj.id, e)
              }
            />
          ))}

          {/* Transformer for selected shapes (hide when editing text) */}
          {selectedIds.length > 0 && !editingTextId && (
            <Transformer
              selectedShapeIds={selectedIds}
              isLocked={selectedIds.some((id) => isLocked(id))}
              onTransformStart={shapeInteractions.handleTransformStart}
              onTransformEnd={shapeInteractions.handleTransformEnd}
            />
          )}

          {/* Text editor overlay */}
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

        {/* Multiplayer cursors overlay */}
        <Cursors />

        {/* Context menu overlay */}
        <ContextMenu commands={commands} />

        {/* Toast notifications */}
        <Toast />
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

      {/* Viewport debug info */}
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
