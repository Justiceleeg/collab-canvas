"use client";

// PR #4 - Basic Canvas with Pan & Zoom
// PR #5 - Firestore Sync Infrastructure
// Main canvas wrapper component
// - Render Stage component
// - Handle canvas events
// - Canvas dimensions and responsiveness
// - Loading states (PR #5)
// - Error states (PR #5)

import { useCanvas } from "@/hooks/useCanvas";
import { useFirestore } from "@/hooks/useFirestore";
import Stage from "./Stage";
import { Text } from "react-konva";

export default function Canvas() {
  const { dimensions, viewport, objects } = useCanvas();
  const { loading, error, isConnected, retry } = useFirestore();

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
