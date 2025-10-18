"use client";

// PR #6 - Rectangle Shape Creation & Rendering
// Generic shape wrapper component
// Conditionally renders the appropriate shape component based on type

import { memo } from "react";
import { CanvasObject } from "@/types/canvas.types";
import Rectangle from "./Rectangle";
import Circle from "./Circle";
import Text from "./Text";
import type Konva from "konva";
import { compareShapeProps } from "./shapeComparison";

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
  onClick?: (e: Konva.KonvaEventObject<MouseEvent>) => void; // PR #13 - Pass event for shift detection
  onDragStart?: (e: Konva.KonvaEventObject<DragEvent>) => void; // PR #8
  onDragEnd?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDblClick?: () => void; // PR #11 - Text editing
  isEditing?: boolean; // PR #11 - Text editing state
  onContextMenu?: (e: Konva.KonvaEventObject<PointerEvent>) => void; // Right-click context menu
}

const Shape = memo(function Shape({
  shape,
  isSelected = false,
  isLocked = false,
  lockInfo,
  onClick,
  onDragStart,
  onDragEnd,
  onDblClick,
  isEditing,
  onContextMenu,
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
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onContextMenu={onContextMenu}
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
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onContextMenu={onContextMenu}
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
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onDblClick={onDblClick}
          isEditing={isEditing}
          onContextMenu={onContextMenu}
        />
      );

    default:
      // Fallback for unknown shape types
      if (process.env.NODE_ENV !== "production") {
        console.warn(`Unknown shape type: ${shape.type}`);
      }
      return null;
  }
},
compareShapeProps);

export default Shape;
