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
  onClick?: (e: Konva.KonvaEventObject<MouseEvent>) => void; // PR #13 - Pass event
  onDragStart?: (e: Konva.KonvaEventObject<DragEvent>) => void; // PR #8
  onDragEnd?: (e: Konva.KonvaEventObject<DragEvent>) => void;
}

export default function Circle({
  shape,
  isSelected = false,
  isLocked = false,
  lockInfo,
  onClick,
  onDragStart,
  onDragEnd,
}: CircleProps) {
  // Calculate radii from width and height (supports both circles and ellipses)
  const radiusX = shape.width / 2;
  const radiusY = shape.height / 2;

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
      onDragStart={onDragStart} // PR #8
      onDragEnd={onDragEnd} // Parent Canvas.tsx handles coordinate conversion
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
