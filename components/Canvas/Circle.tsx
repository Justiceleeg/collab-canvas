"use client";

// PR #10 - Circle Shape Support (Placeholder for PR #6)
// Circle shape rendering with Konva.Circle

import { Circle as KonvaCircle } from "react-konva";
import { CanvasObject } from "@/types/canvas.types";
import type Konva from "konva";

interface CircleProps {
  shape: CanvasObject;
  isSelected?: boolean;
  onClick?: () => void;
  onMouseDown?: () => void;
  onDragEnd?: (e: Konva.KonvaEventObject<DragEvent>) => void;
}

export default function Circle({
  shape,
  isSelected = false,
  onClick,
  onMouseDown,
  onDragEnd,
}: CircleProps) {
  // Calculate radius from width (assuming width === height for circles)
  const radius = shape.width / 2;

  return (
    <KonvaCircle
      id={shape.id}
      x={shape.x + radius} // Center the circle
      y={shape.y + radius}
      radius={radius}
      fill={shape.color}
      rotation={shape.rotation || 0}
      draggable={true}
      onClick={onClick}
      onTap={onClick}
      onMouseDown={onMouseDown}
      onDragEnd={onDragEnd}
      // Visual feedback for selection
      stroke={isSelected ? "#0066FF" : undefined}
      strokeWidth={isSelected ? 2 : 0}
      // Performance optimizations
      perfectDrawEnabled={false}
      listening={true}
    />
  );
}
