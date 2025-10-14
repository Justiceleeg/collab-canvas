// PR #9 - User Presence & Multiplayer Cursors
// Cursors component to render all user cursors
// - Render all cursors overlaying the canvas
// - Transform cursor positions based on canvas zoom/pan

"use client";

import React from "react";
import { useCursors } from "@/hooks/useCursors";
import UserCursor from "@/components/Presence/UserCursor";

export default function Cursors() {
  const { cursors } = useCursors();

  return (
    <>
      {cursors.map((cursor) => (
        <UserCursor
          key={cursor.userId}
          x={cursor.x}
          y={cursor.y}
          displayName={cursor.displayName}
          color={cursor.color}
        />
      ))}
    </>
  );
}
