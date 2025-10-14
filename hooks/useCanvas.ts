// PR #4 - Basic Canvas with Pan & Zoom
// PR #6 - Rectangle Shape Creation & Rendering
// Canvas state management hook
// - Handle canvas events
// - Shape creation logic (PR #6) ✓
// - Selection logic (PR #7)
// - Keyboard shortcuts (PR #16)

import { useState, useEffect, useCallback } from "react";
import { useCanvasStore } from "@/store/canvasStore";
import { ShapeType } from "@/types/canvas.types";
import { firestoreService } from "@/services/firestore.service";
import { useAuth } from "./useAuth";

export function useCanvas() {
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [activeTool, setActiveTool] = useState<ShapeType | null>(null);
  const [isCreatingShape, setIsCreatingShape] = useState(false);

  const {
    viewport,
    objects,
    selectedIds,
    createShapeData,
    addObject,
    clearSelection,
  } = useCanvasStore();
  const { user } = useAuth();

  // Update canvas dimensions on window resize
  useEffect(() => {
    const updateDimensions = () => {
      // Account for the toolbar height (64px)
      const toolbarHeight = 64;
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight - toolbarHeight,
      });
    };

    // Set initial dimensions
    updateDimensions();

    // Add resize listener
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // Handle Escape key to deselect tool
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        // Deselect any shapes
        clearSelection();
        // Also exit any active tool
        if (activeTool) {
          setActiveTool(null);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTool, clearSelection]);

  // Handle canvas click for shape creation and deselection
  const handleCanvasClick = useCallback(
    async (e: any) => {
      console.log("Canvas click detected", {
        activeTool,
        isCreatingShape,
        hasUser: !!user,
      });

      // Don't create shape if we're already creating one
      if (isCreatingShape) {
        console.log("Already creating a shape, skipping...");
        return;
      }

      // If a shape tool is selected, create a new shape
      if (activeTool && user) {
        console.log("Creating shape with tool:", activeTool);
        setIsCreatingShape(true);

        try {
          // Get click position relative to stage (accounting for viewport transform)
          const stage = e.target.getStage();
          const pointerPosition = stage.getPointerPosition();

          console.log("Pointer position:", pointerPosition);

          if (!pointerPosition) {
            console.log("No pointer position available");
            setIsCreatingShape(false);
            return;
          }

          // Convert screen coordinates to canvas coordinates
          const canvasX = (pointerPosition.x - viewport.x) / viewport.scale;
          const canvasY = (pointerPosition.y - viewport.y) / viewport.scale;

          console.log("Canvas coordinates:", { canvasX, canvasY });
          console.log("Viewport:", viewport);

          // Create shape data
          const shapeData = createShapeData(
            activeTool,
            { x: canvasX, y: canvasY },
            user.uid
          );

          console.log("Shape data created:", shapeData);

          // Optimistically add to local store
          const tempId = `temp-${Date.now()}`;
          addObject({
            ...shapeData,
            id: tempId,
            createdAt: new Date(),
            updatedAt: new Date(),
          } as any);

          console.log("Shape added to local store with temp ID:", tempId);

          // Save to Firestore
          const createdShape = await firestoreService.createObject(
            shapeData,
            user.uid
          );

          console.log("Shape created successfully in Firestore:", createdShape);

          // The shape will be updated via Firestore sync hook
          // No need to manually update the store

          // Deselect tool after creating shape (optional - can be removed if you want continuous creation)
          // setActiveTool(null);
        } catch (error) {
          console.error("Error creating shape:", error);
          // TODO: Show error toast (PR #18)
        } finally {
          setIsCreatingShape(false);
        }
      } else {
        console.log("No active tool or user:", { activeTool, hasUser: !!user });
        // Clicked on empty canvas: clear selection
        clearSelection();
      }
    },
    [
      activeTool,
      user,
      viewport,
      createShapeData,
      addObject,
      isCreatingShape,
      clearSelection,
    ]
  );

  return {
    dimensions,
    viewport,
    objects,
    selectedIds,
    handleCanvasClick,
    activeTool,
    setActiveTool,
    isCreatingShape,
  };
}
