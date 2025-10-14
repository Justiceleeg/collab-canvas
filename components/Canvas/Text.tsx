"use client";

// PR #11 - Text Shape Support (Placeholder for PR #6)
// Text shape rendering with Konva.Text

import { Text as KonvaText } from "react-konva";
import { CanvasObject } from "@/types/canvas.types";
import type Konva from "konva";

interface TextProps {
  shape: CanvasObject;
  isSelected?: boolean;
  onClick?: () => void;
  onMouseDown?: () => void;
  onDragEnd?: (e: Konva.KonvaEventObject<DragEvent>) => void;
}

export default function Text({
  shape,
  isSelected = false,
  onClick,
  onMouseDown,
  onDragEnd,
}: TextProps) {
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
      draggable={true}
      onClick={onClick}
      onTap={onClick}
      onMouseDown={onMouseDown}
      onDragEnd={onDragEnd}
      // Visual feedback for selection
      stroke={isSelected ? "#0066FF" : undefined}
      strokeWidth={isSelected ? 1 : 0}
      // Performance optimizations
      perfectDrawEnabled={false}
      listening={true}
    />
  );
}
