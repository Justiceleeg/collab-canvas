"use client";

// PR #10 - Circle Shape Support
// Circle shape rendering with Konva.Circle

import { Circle as KonvaCircle } from "react-konva";
import { CanvasObject } from "@/types/canvas.types";
import type Konva from "konva";
import { LockInfo } from "./Shape"; // PR #8

interface CircleProps {
  shape: CanvasObject;
  isSelected?: boolean;
  isLocked?: boolean; // PR #8
  lockInfo?: LockInfo | null; // PR #8
  onClick?: () => void;
  onMouseDown?: () => void;
  onDragStart?: (e: Konva.KonvaEventObject<DragEvent>) => void; // PR #8
  onDragEnd?: (e: Konva.KonvaEventObject<DragEvent>) => void;
}

export default function Circle({
  shape,
  isSelected = false,
  isLocked = false,
  lockInfo,
  onClick,
  onMouseDown,
  onDragStart,
  onDragEnd,
}: CircleProps) {
  // Calculate radius from width (assuming width === height for circles)
  const radius = shape.width / 2;

  // PR #8 - Determine stroke color based on lock status
  // PR #12 - Remove selection stroke (Transformer handles this now)
  const getStrokeColor = () => {
    if (isLocked && lockInfo && !lockInfo.isOwnLock) {
      return lockInfo.color; // User's color from presence system
    }
    return undefined; // No stroke (selection handled by Transformer)
  };

  return (
    <KonvaCircle
      id={shape.id}
      x={shape.x + radius} // Center the circle (Konva positions circles by center)
      y={shape.y + radius}
      radius={radius}
      fill={shape.color}
      rotation={shape.rotation || 0}
      draggable={!isLocked} // PR #8 - Disable drag if locked by another user
      onClick={onClick}
      onTap={onClick}
      onMouseDown={onMouseDown}
      onDragStart={onDragStart} // PR #8
      onDragEnd={onDragEnd} // Parent Canvas.tsx handles coordinate conversion
      // Visual feedback for lock status (selection handled by Transformer)
      stroke={getStrokeColor()}
      strokeWidth={isLocked ? 2 : 0}
      // Performance optimizations
      perfectDrawEnabled={false}
      listening={true}
    />
  );
}
