"use client";

// PR #14 - Drag-to-Select (Selection Box)
// Component to render the visual selection rectangle when dragging

import { Rect } from "react-konva";

interface SelectionBoxProps {
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean;
}

export default function SelectionBox({
  x,
  y,
  width,
  height,
  visible,
}: SelectionBoxProps) {
  if (!visible) return null;

  return (
    <Rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill="rgba(0, 102, 255, 0.1)"
      stroke="rgba(0, 102, 255, 0.5)"
      strokeWidth={1 / 1} // Will be scaled by viewport
      dash={[5, 5]}
      listening={false} // Don't capture events
    />
  );
}
