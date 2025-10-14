"use client";

// PR #6 - Rectangle Shape Creation & Rendering
// Rectangle shape rendering with Konva.Rect

import { Rect } from "react-konva";
import { CanvasObject } from "@/types/canvas.types";
import type Konva from "konva";

interface RectangleProps {
  shape: CanvasObject;
  isSelected?: boolean;
  onClick?: () => void;
  onMouseDown?: () => void;
  onDragEnd?: (e: Konva.KonvaEventObject<DragEvent>) => void;
}

export default function Rectangle({
  shape,
  isSelected = false,
  onClick,
  onMouseDown,
  onDragEnd,
}: RectangleProps) {
  return (
    <Rect
      id={shape.id}
      x={shape.x}
      y={shape.y}
      width={shape.width}
      height={shape.height}
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
