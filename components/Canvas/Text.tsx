"use client";

// PR #11 - Text Shape Support
// Text shape rendering with Konva.Text
// Double-click to edit text

import { Text as KonvaText, Group, Rect } from "react-konva";
import { CanvasObject } from "@/types/canvas.types";
import type Konva from "konva";
import { LockInfo } from "./Shape";
import { useRef, useEffect, useState } from "react";

interface TextProps {
  shape: CanvasObject;
  isSelected?: boolean;
  isLocked?: boolean;
  lockInfo?: LockInfo | null;
  onClick?: (e: Konva.KonvaEventObject<MouseEvent>) => void; // PR #13 - Pass event
  onMouseDown?: (e: Konva.KonvaEventObject<MouseEvent>) => void; // PR #13 - Pass event
  onDragStart?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragEnd?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDblClick?: () => void;
  isEditing?: boolean;
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
  onDblClick,
  isEditing = false,
}: TextProps) {
  const textRef = useRef<Konva.Text>(null);
  const [textBounds, setTextBounds] = useState({ width: 0, height: 0 });

  // Update text bounds when text changes
  useEffect(() => {
    if (textRef.current) {
      const width = textRef.current.width();
      const height = textRef.current.height();
      setTextBounds({ width, height });
    }
  }, [shape.text, shape.fontSize]);

  // Show bounding box for locked text (not stroke)
  const showBoundingBox = isLocked && lockInfo && !lockInfo.isOwnLock;

  return (
    <Group
      id={shape.id}
      x={shape.x}
      y={shape.y}
      rotation={shape.rotation || 0}
      draggable={!isLocked && !isEditing}
      onClick={onClick}
      onTap={onClick}
      onMouseDown={onMouseDown}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDblClick={onDblClick}
      onDblTap={onDblClick}
      visible={!isEditing}
    >
      {/* Bounding box for locked text */}
      {showBoundingBox && textBounds.width > 0 && (
        <Rect
          x={0}
          y={0}
          width={textBounds.width}
          height={textBounds.height}
          stroke={lockInfo.color}
          strokeWidth={2}
          listening={false}
        />
      )}

      {/* Text content */}
      <KonvaText
        ref={textRef}
        name="text-node" // Add name for easier finding
        x={0}
        y={0}
        // Auto-size to content - no fixed width/height
        text={shape.text || "New Text"}
        fontSize={shape.fontSize || 16}
        fontFamily="Arial, sans-serif"
        fill={shape.color}
        // Text rendering options
        align="left"
        padding={4}
        wrap="none"
        // Performance optimizations
        perfectDrawEnabled={false}
        listening={true}
      />
    </Group>
  );
}
