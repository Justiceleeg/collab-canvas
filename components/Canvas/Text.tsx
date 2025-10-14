"use client";

// PR #11 - Text Shape Support (Placeholder for PR #6)
// Text shape rendering with Konva.Text

import { Text as KonvaText } from "react-konva";
import { CanvasObject } from "@/types/canvas.types";
import type Konva from "konva";
import { LockInfo } from "./Shape"; // PR #8

interface TextProps {
  shape: CanvasObject;
  isSelected?: boolean;
  isLocked?: boolean; // PR #8
  lockInfo?: LockInfo | null; // PR #8
  onClick?: () => void;
  onMouseDown?: () => void;
  onDragStart?: (e: Konva.KonvaEventObject<DragEvent>) => void; // PR #8
  onDragEnd?: (e: Konva.KonvaEventObject<DragEvent>) => void;
}

export default function Text({
  shape,
  isSelected = false,
  isLocked = false,
  lockInfo,
  onClick,
  onMouseDown,
  onDragStart,
  onDragEnd,
}: TextProps) {
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
    <KonvaText
      id={shape.id}
      x={shape.x}
      y={shape.y}
      text={shape.text || "Double-click to edit"}
      fontSize={shape.fontSize || 16}
      fill={shape.color}
      width={shape.width}
      rotation={shape.rotation || 0}
      draggable={!isLocked} // PR #8 - Disable drag if locked by another user
      onClick={onClick}
      onTap={onClick}
      onMouseDown={onMouseDown}
      onDragStart={onDragStart} // PR #8
      onDragEnd={onDragEnd}
      // Visual feedback for selection and lock status
      stroke={getStrokeColor()}
      strokeWidth={isSelected || isLocked ? 1 : 0}
      // Performance optimizations
      perfectDrawEnabled={false}
      listening={true}
    />
  );
}
