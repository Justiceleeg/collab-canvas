"use client";

// PR #11 - Text Shape Support
// Text shape rendering with Konva.Text

import { Text as KonvaText } from "react-konva";
import { CanvasObject } from "@/types/canvas.types";
import type Konva from "konva";
import { LockInfo } from "./Shape";

interface TextProps {
  shape: CanvasObject;
  isSelected?: boolean;
  isLocked?: boolean;
  lockInfo?: LockInfo | null;
  onClick?: () => void;
  onMouseDown?: () => void;
  onDragStart?: (e: Konva.KonvaEventObject<DragEvent>) => void;
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
  // PR #11 - Determine stroke color based on lock status
  // PR #12 - Remove selection stroke (Transformer handles this now)
  const getStrokeColor = () => {
    if (isLocked && lockInfo && !lockInfo.isOwnLock) {
      return lockInfo.color; // User's color from presence system
    }
    return undefined; // No stroke (selection handled by Transformer)
  };

  return (
    <KonvaText
      id={shape.id}
      x={shape.x}
      y={shape.y}
      // Auto-size to content - no fixed width/height
      text={shape.text || "Text"}
      fontSize={shape.fontSize || 16}
      fontFamily="Arial, sans-serif"
      fill={shape.color}
      rotation={shape.rotation || 0}
      draggable={!isLocked}
      onClick={onClick}
      onTap={onClick}
      onMouseDown={onMouseDown}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      // Visual feedback for lock status (selection handled by Transformer)
      stroke={getStrokeColor()}
      strokeWidth={isLocked ? 2 : 0}
      // Text rendering options
      align="left"
      padding={4}
      wrap="none"
      // Performance optimizations
      perfectDrawEnabled={false}
      listening={true}
    />
  );
}
