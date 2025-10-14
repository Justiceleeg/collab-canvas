"use client";

// PR #10 - Circle Shape Support (Placeholder for PR #6)
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
  const getStrokeColor = () => {
    if (isLocked && lockInfo && !lockInfo.isOwnLock) {
      return lockInfo.color; // User's color from presence system
    }
    // Only show selection border if not locked by someone else
    if (isSelected && !isLocked) {
      return "#0066FF"; // Blue for selected
    }
    return undefined; // No stroke
  };

  return (
    <KonvaCircle
      id={shape.id}
      x={shape.x + radius} // Center the circle
      y={shape.y + radius}
      radius={radius}
      fill={shape.color}
      rotation={shape.rotation || 0}
      draggable={!isLocked} // PR #8 - Disable drag if locked by another user
      onClick={onClick}
      onTap={onClick}
      onMouseDown={onMouseDown}
      onDragStart={onDragStart} // PR #8
      onDragEnd={onDragEnd}
      // Visual feedback for selection and lock status
      stroke={getStrokeColor()}
      strokeWidth={isSelected || isLocked ? 2 : 0}
      // Performance optimizations
      perfectDrawEnabled={false}
      listening={true}
    />
  );
}
