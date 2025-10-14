"use client";

// PR #4 - Basic Canvas with Pan & Zoom
// Main canvas wrapper component
// - Render Stage component
// - Handle canvas events
// - Canvas dimensions and responsiveness

import { useCanvas } from "@/hooks/useCanvas";
import Stage from "./Stage";
import { Text } from "react-konva";

export default function Canvas() {
  const { dimensions, viewport, objects } = useCanvas();

  return (
    <div className="canvas-container">
      <Stage width={dimensions.width} height={dimensions.height}>
        {/* Placeholder for shapes - will be implemented in PR #6 */}
        {objects.length === 0 && (
          <Text
            text="Canvas is ready! Pan: Space+Drag or Middle-Click • Zoom: Mouse Wheel"
            x={50}
            y={50}
            fontSize={16}
            fill="#666"
          />
        )}
        {/* Future: Shape components will be rendered here */}
      </Stage>

      {/* Viewport debug info (optional, can be removed) */}
      <div className="canvas-info">
        <div className="text-xs text-gray-500 bg-white/90 px-3 py-2 rounded shadow">
          <div>Zoom: {(viewport.scale * 100).toFixed(0)}%</div>
          <div>
            Position: ({viewport.x.toFixed(0)}, {viewport.y.toFixed(0)})
          </div>
          <div>Objects: {objects.length}</div>
        </div>
      </div>
    </div>
  );
}
