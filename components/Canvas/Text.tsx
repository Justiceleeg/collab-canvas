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
  onDragStart?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragEnd?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDblClick?: () => void;
  isEditing?: boolean;
  onContextMenu?: (e: Konva.KonvaEventObject<PointerEvent>) => void; // Right-click
}

export default function Text({
  shape,
  isSelected = false,
  isLocked = false,
  lockInfo,
  onClick,
  onDragStart,
  onDragEnd,
  onDblClick,
  isEditing = false,
  onContextMenu,
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

  // PR #14 - Show bounding box for locked or selected text
  const showBoundingBox =
    (isLocked && lockInfo && !lockInfo.isOwnLock) || isSelected;

  // PR #14 - Determine bounding box color and style
  const getBoundingBoxProps = () => {
    // Locked by another user - show their color
    if (isLocked && lockInfo && !lockInfo.isOwnLock) {
      return {
        stroke: lockInfo.color,
        strokeWidth: 2,
        dash: undefined,
      };
    }

    // Selected - show blue solid border
    if (isSelected) {
      return {
        stroke: "rgba(0, 102, 255, 0.8)",
        strokeWidth: 2,
        dash: undefined,
      };
    }

    return null;
  };

  const boundingBoxProps = getBoundingBoxProps();

  return (
    <Group
      id={shape.id}
      x={shape.x + textBounds.width / 2} // Position at center for rotation
      y={shape.y + textBounds.height / 2}
      offsetX={textBounds.width / 2} // Rotate around center
      offsetY={textBounds.height / 2}
      rotation={shape.rotation || 0}
      opacity={shape.opacity !== undefined ? shape.opacity : 1} // PR #16 - Opacity support
      draggable={!isLocked && !isEditing}
      onClick={onClick}
      onTap={onClick}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDblClick={onDblClick}
      onDblTap={onDblClick}
      onContextMenu={onContextMenu}
      visible={!isEditing}
    >
      {/* Bounding box for locked or selected text */}
      {showBoundingBox && textBounds.width > 0 && boundingBoxProps && (
        <Rect
          x={0}
          y={0}
          width={textBounds.width}
          height={textBounds.height}
          stroke={boundingBoxProps.stroke}
          strokeWidth={boundingBoxProps.strokeWidth}
          dash={boundingBoxProps.dash}
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
        fontStyle={`${shape.fontStyle || "normal"} ${
          shape.fontWeight || "normal"
        }`} // PR #16 - Bold/Italic support
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
