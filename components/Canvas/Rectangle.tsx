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
  onContextMenu?: (e: Konva.KonvaEventObject<PointerEvent>) => void; // Right-click
}

export default function Rectangle({
  shape,
  isSelected = false,
  isLocked = false,
  lockInfo,
  onClick,
  onDragStart,
  onDragEnd,
  onContextMenu,
}: RectangleProps) {
  // Determine base stroke (shape's own stroke)
  const hasShapeStroke = shape.strokeWidth && shape.strokeWidth > 0;
  const shapeStroke = hasShapeStroke
    ? shape.strokeColor || "#000000"
    : undefined;
  const shapeStrokeWidth = hasShapeStroke ? shape.strokeWidth : 0;

  // Determine selection/lock stroke (overlays on top)
  let selectionStroke = undefined;
  let selectionStrokeWidth = 0;

  if (isLocked && lockInfo && !lockInfo.isOwnLock) {
    selectionStroke = lockInfo.color;
    selectionStrokeWidth = 2;
  } else if (isSelected) {
    selectionStroke = "rgba(0, 102, 255, 0.8)";
    selectionStrokeWidth = 2;
  }

  // Combine both strokes - use selection stroke if present, otherwise shape stroke
  const finalStroke = selectionStroke || shapeStroke;
  const finalStrokeWidth = selectionStroke
    ? selectionStrokeWidth
    : shapeStrokeWidth;

  return (
    <Rect
      id={shape.id}
      x={shape.x + shape.width / 2} // Position at center for rotation
      y={shape.y + shape.height / 2}
      width={shape.width}
      height={shape.height}
      offsetX={shape.width / 2} // Rotate around center
      offsetY={shape.height / 2}
      fill={shape.color}
      rotation={shape.rotation || 0}
      opacity={shape.opacity !== undefined ? shape.opacity : 1} // PR #16 - Opacity support
      draggable={!isLocked} // PR #8 - Disable drag if locked by another user
      onClick={onClick}
      onTap={onClick}
      onDragStart={onDragStart} // PR #8
      onDragEnd={onDragEnd}
      onContextMenu={onContextMenu} // Right-click context menu
      // Stroke properties
      stroke={finalStroke}
      strokeWidth={finalStrokeWidth}
      // Performance optimizations
      perfectDrawEnabled={false}
      listening={true}
    />
  );
}
