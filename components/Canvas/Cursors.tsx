// PR #9 - User Presence & Multiplayer Cursors
// Cursors component to render all user cursors
// - Render all cursors overlaying the canvas
// - Transform cursor positions based on canvas zoom/pan

"use client";

import React from "react";
import { useCursors } from "@/hooks/useCursors";
import { useCanvasStore } from "@/store/canvasStore";
import UserCursor from "@/components/Presence/UserCursor";

export default function Cursors() {
  const { cursors } = useCursors();
  // Use selective selector to avoid unnecessary re-renders
  const viewport = useCanvasStore((state) => state.viewport);

  return (
    <>
      {cursors.map((cursor) => {
        // Convert canvas coordinates to screen coordinates based on local viewport
        // cursor.x and cursor.y are in canvas space (world coordinates)
        // We need to transform them to screen space for rendering
        const screenX = cursor.x * viewport.scale + viewport.x;
        const screenY = cursor.y * viewport.scale + viewport.y;

        return (
          <UserCursor
            key={cursor.userId}
            x={screenX}
            y={screenY}
            displayName={cursor.displayName}
            color={cursor.color}
          />
        );
      })}
    </>
  );
}
