// PR #9 - User Presence & Multiplayer Cursors
// Single user cursor component
// - Render cursor SVG with user name label
// - Optimized with React.memo to prevent unnecessary re-renders

"use client";

import React from "react";

interface UserCursorProps {
  x: number;
  y: number;
  displayName: string;
  color: string;
}

// Memoize to prevent re-renders when other cursors update
const UserCursor = React.memo(function UserCursor({
  x,
  y,
  displayName,
  color,
}: UserCursorProps) {
  return (
    <div
      className="absolute pointer-events-none z-50"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        transform: "translate(-2px, -2px)",
        willChange: "transform",
      }}
    >
      {/* Cursor SVG - Classic arrow pointer */}
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))" }}
      >
        {/* Outer white stroke for visibility */}
        <path
          d="M2 2L2 16L6 12L9 18L11 17L8 11L14 11L2 2Z"
          fill="white"
          stroke="white"
          strokeWidth="1"
          strokeLinejoin="round"
        />
        {/* Inner colored fill */}
        <path
          d="M3 3L3 14L6 11L9 17L10 16.5L7.5 11L12 11L3 3Z"
          fill={color}
          strokeWidth="0"
        />
      </svg>

      {/* User name label */}
      <div
        className="mt-1 ml-5 px-2 py-1 rounded text-xs font-medium text-white whitespace-nowrap shadow-md"
        style={{
          backgroundColor: color,
        }}
      >
        {displayName}
      </div>
    </div>
  );
});

export default UserCursor;
