// PR #4 - Basic Canvas with Pan & Zoom
// PR #6 - Rectangle Shape Creation & Rendering
// Canvas state management hook
// - Handle canvas events
// - Shape creation logic (PR #6) ✓
// - Selection logic (PR #7)
// - Keyboard shortcuts (PR #16)

import { useState, useEffect, useCallback } from "react";
import { useCanvasStore } from "@/store/canvasStore";
import { useSelectionStore } from "@/store/selectionStore"; // PR #7 - Selection management
import { ShapeType } from "@/types/canvas.types";
import { useAuth } from "./useAuth";
import { useCanvasCommands } from "@/services/canvasCommands";
import { useActiveLock } from "./useActiveLock";
import { CANVAS } from "@/utils/constants";
import Konva from "konva";

export function useCanvas() {
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [activeTool, setActiveTool] = useState<ShapeType | null>(null);
  const [isCreatingShape, setIsCreatingShape] = useState(false);

  const { viewport, objects } = useCanvasStore();
  const { deselectAll } = useSelectionStore(); // PR #7 - Use selection store
  const { user } = useAuth();

  // Get command service
  const lockManager = useActiveLock();
  const commands = useCanvasCommands(lockManager, user?.uid);

  // Update canvas dimensions on window resize
  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight - CANVAS.TOOLBAR_HEIGHT,
      });
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // Handle Escape key to deselect tool
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        // Deselect any shapes
        deselectAll();
        // Also exit any active tool
        if (activeTool) {
          setActiveTool(null);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTool, deselectAll]);

  // Handle canvas click for shape creation and deselection
  const handleCanvasClick = useCallback(
    async (e: Konva.KonvaEventObject<MouseEvent>) => {
      // Don't create shape if we're already creating one
      if (isCreatingShape) return;

      // If a shape tool is selected, create a new shape
      if (activeTool && user) {
        setIsCreatingShape(true);

        try {
          // Get click position relative to stage (accounting for viewport transform)
          const stage = e.target.getStage();
          if (!stage) {
            setIsCreatingShape(false);
            return;
          }

          const pointerPosition = stage.getPointerPosition();
          if (!pointerPosition) {
            setIsCreatingShape(false);
            return;
          }

          // Convert screen coordinates to canvas coordinates
          const canvasX = (pointerPosition.x - viewport.x) / viewport.scale;
          const canvasY = (pointerPosition.y - viewport.y) / viewport.scale;

          // Use command service to create shape
          await commands.createShape(activeTool, { x: canvasX, y: canvasY });

          // Reset tool to selection mode after creating shape
          setActiveTool(null);
        } catch (error) {
          console.error("Error creating shape:", error);
          // Command service already shows toast
        } finally {
          setIsCreatingShape(false);
        }
      } else {
        // Clicked on empty canvas: clear selection
        deselectAll();
      }
    },
    [activeTool, user, viewport, isCreatingShape, deselectAll, commands]
  );

  return {
    dimensions,
    viewport,
    objects,
    handleCanvasClick,
    activeTool,
    setActiveTool,
    isCreatingShape,
  };
}
