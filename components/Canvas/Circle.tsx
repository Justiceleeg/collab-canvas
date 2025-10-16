"use client";

// PR #10 - Circle Shape Support
// PR #12.1 - Updated to use Ellipse for flexible width/height
// Ellipse shape rendering with Konva.Ellipse (can be circular or elliptical)

import { Ellipse as KonvaEllipse } from "react-konva";
import { CanvasObject } from "@/types/canvas.types";
import type Konva from "konva";
import { LockInfo } from "./Shape"; // PR #8

interface CircleProps {
  shape: CanvasObject;
  isSelected?: boolean;
  isLocked?: boolean; // PR #8
  lockInfo?: LockInfo | null; // PR #8
  onClick?: () => void;
  onMouseDown?: () => void;
  onDragStart?: (e: Konva.KonvaEventObject<DragEvent>) => void; // PR #8
  onDragEnd?: (e: Konva.KonvaEventObject<DragEvent>) => void;
}

export default function Circle({
  shape,
  isSelected = false,
  isLocked = false,
  lockInfo,
  onClick,
  onMouseDown,
  onDragStart,
  onDragEnd,
}: CircleProps) {
  // Calculate radii from width and height (supports both circles and ellipses)
  const radiusX = shape.width / 2;
  const radiusY = shape.height / 2;

  // PR #8 - Determine stroke color based on lock status
  // PR #12 - Remove selection stroke (Transformer handles this now)
  const getStrokeColor = () => {
    if (isLocked && lockInfo && !lockInfo.isOwnLock) {
      return lockInfo.color; // User's color from presence system
    }
    return undefined; // No stroke (selection handled by Transformer)
  };

  return (
    <KonvaEllipse
      id={shape.id}
      x={shape.x + radiusX} // Center the ellipse (Konva positions ellipses by center)
      y={shape.y + radiusY}
      radiusX={radiusX} // Horizontal radius
      radiusY={radiusY} // Vertical radius
      fill={shape.color}
      rotation={shape.rotation || 0}
      draggable={!isLocked} // PR #8 - Disable drag if locked by another user
      onClick={onClick}
      onTap={onClick}
      onMouseDown={onMouseDown}
      onDragStart={onDragStart} // PR #8
      onDragEnd={onDragEnd} // Parent Canvas.tsx handles coordinate conversion
      // Visual feedback for lock status (selection handled by Transformer)
      stroke={getStrokeColor()}
      strokeWidth={isLocked ? 2 : 0}
      // Performance optimizations
      perfectDrawEnabled={false}
      listening={true}
    />
  );
}
