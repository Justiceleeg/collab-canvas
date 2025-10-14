"use client";

// PR #6 - Rectangle Shape Creation & Rendering
// Generic shape wrapper component
// Conditionally renders the appropriate shape component based on type

import { CanvasObject } from "@/types/canvas.types";
import Rectangle from "./Rectangle";
import Circle from "./Circle";
import Text from "./Text";
import type Konva from "konva";

// PR #8 - Lock info type for visual feedback
export interface LockInfo {
  lockedBy: string;
  lockedByName: string;
  lockedAt: number;
  isOwnLock: boolean;
  color: string; // User's color from presence system
}

export interface ShapeProps {
  shape: CanvasObject;
  isSelected?: boolean;
  isLocked?: boolean; // PR #8 - Is locked by another user
  lockInfo?: LockInfo | null; // PR #8 - Lock details for UI
  onClick?: () => void;
  onMouseDown?: () => void;
  onDragStart?: (e: Konva.KonvaEventObject<DragEvent>) => void; // PR #8
  onDragEnd?: (e: Konva.KonvaEventObject<DragEvent>) => void;
}

export default function Shape({
  shape,
  isSelected = false,
  isLocked = false,
  lockInfo,
  onClick,
  onMouseDown,
  onDragStart,
  onDragEnd,
}: ShapeProps) {
  // Render the appropriate shape component based on type
  switch (shape.type) {
    case "rectangle":
      return (
        <Rectangle
          shape={shape}
          isSelected={isSelected}
          isLocked={isLocked}
          lockInfo={lockInfo}
          onClick={onClick}
          onMouseDown={onMouseDown}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
        />
      );

    case "circle":
      return (
        <Circle
          shape={shape}
          isSelected={isSelected}
          isLocked={isLocked}
          lockInfo={lockInfo}
          onClick={onClick}
          onMouseDown={onMouseDown}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
        />
      );

    case "text":
      return (
        <Text
          shape={shape}
          isSelected={isSelected}
          isLocked={isLocked}
          lockInfo={lockInfo}
          onClick={onClick}
          onMouseDown={onMouseDown}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
        />
      );

    default:
      // Fallback for unknown shape types
      console.warn(`Unknown shape type: ${shape.type}`);
      return null;
  }
}
