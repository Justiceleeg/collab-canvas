"use client";

// PR #6 - Rectangle Shape Creation & Rendering
// Rectangle shape rendering with Konva.Rect

import { Rect } from "react-konva";
import { CanvasObject } from "@/types/canvas.types";
import type Konva from "konva";
import { LockInfo } from "./Shape"; // PR #8

interface RectangleProps {
  shape: CanvasObject;
  isSelected?: boolean;
  isLocked?: boolean; // PR #8
  lockInfo?: LockInfo | null; // PR #8
  onClick?: () => void;
  onMouseDown?: () => void;
  onDragStart?: (e: Konva.KonvaEventObject<DragEvent>) => void; // PR #8
  onDragEnd?: (e: Konva.KonvaEventObject<DragEvent>) => void;
}

export default function Rectangle({
  shape,
  isSelected = false,
  isLocked = false,
  lockInfo,
  onClick,
  onMouseDown,
  onDragStart,
  onDragEnd,
}: RectangleProps) {
  // PR #8 - Determine stroke color based on lock status
  // PR #12 - Remove selection stroke (Transformer handles this now)
  const getStrokeColor = () => {
    if (isLocked && lockInfo && !lockInfo.isOwnLock) {
      return lockInfo.color; // User's color from presence system
    }
    return undefined; // No stroke (selection handled by Transformer)
  };

  return (
    <Rect
      id={shape.id}
      x={shape.x}
      y={shape.y}
      width={shape.width}
      height={shape.height}
      fill={shape.color}
      rotation={shape.rotation || 0}
      draggable={!isLocked} // PR #8 - Disable drag if locked by another user
      onClick={onClick}
      onTap={onClick}
      onMouseDown={onMouseDown}
      onDragStart={onDragStart} // PR #8
      onDragEnd={onDragEnd}
      // Visual feedback for lock status (selection handled by Transformer)
      stroke={getStrokeColor()}
      strokeWidth={isLocked ? 2 : 0}
      // Performance optimizations
      perfectDrawEnabled={false}
      listening={true}
    />
  );
}
