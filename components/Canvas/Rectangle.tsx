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
  onClick?: (e: Konva.KonvaEventObject<MouseEvent>) => void; // PR #13 - Pass event
  onDragStart?: (e: Konva.KonvaEventObject<DragEvent>) => void; // PR #8
  onDragEnd?: (e: Konva.KonvaEventObject<DragEvent>) => void;
}

export default function Rectangle({
  shape,
  isSelected = false,
  isLocked = false,
  lockInfo,
  onClick,
  onDragStart,
  onDragEnd,
}: RectangleProps) {
  // PR #8/#14 - Determine stroke color and style based on selection/lock status
  const getStrokeProps = () => {
    // Locked by another user - show their color
    if (isLocked && lockInfo && !lockInfo.isOwnLock) {
      return {
        stroke: lockInfo.color,
        strokeWidth: 2,
        dash: undefined,
      };
    }

    // PR #14 - Selected - show blue solid border
    if (isSelected) {
      return {
        stroke: "rgba(0, 102, 255, 0.8)",
        strokeWidth: 2,
        dash: undefined,
      };
    }

    // No stroke
    return {
      stroke: undefined,
      strokeWidth: 0,
      dash: undefined,
    };
  };

  const strokeProps = getStrokeProps();

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
      onDragStart={onDragStart} // PR #8
      onDragEnd={onDragEnd}
      // Visual feedback for selection/lock status
      stroke={strokeProps.stroke}
      strokeWidth={strokeProps.strokeWidth}
      dash={strokeProps.dash}
      // Performance optimizations
      perfectDrawEnabled={false}
      listening={true}
    />
  );
}
