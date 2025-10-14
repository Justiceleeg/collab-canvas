// PR #4 - Basic Canvas with Pan & Zoom
// Canvas state management hook
// - Handle canvas events
// - Shape creation logic (PR #6)
// - Selection logic (PR #7)
// - Keyboard shortcuts (PR #16)

import { useState, useEffect, useCallback } from "react";
import { useCanvasStore } from "@/store/canvasStore";

export function useCanvas() {
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const { viewport, objects, selectedIds } = useCanvasStore();

  // Update canvas dimensions on window resize
  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    // Set initial dimensions
    updateDimensions();

    // Add resize listener
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // Handle canvas click (for future shape creation and deselection)
  const handleCanvasClick = useCallback((e: any) => {
    // TODO: Implement shape creation (PR #6) and deselection (PR #7)
    // For now, this is a placeholder for future implementation
  }, []);

  return {
    dimensions,
    viewport,
    objects,
    selectedIds,
    handleCanvasClick,
  };
}
