"use client";

// PR #10 - Circle Shape Support
// PR #12.1 - Updated to use Ellipse for flexible width/height
// Ellipse shape rendering with Konva.Ellipse (can be circular or elliptical)

import { memo } from "react";
import { Ellipse as KonvaEllipse } from "react-konva";
import { CanvasObject } from "@/types/canvas.types";
import type Konva from "konva";
import { LockInfo } from "./Shape"; // PR #8
import { compareShapeProps } from "./shapeComparison";

interface CircleProps {
  shape: CanvasObject;
  isSelected?: boolean;
  isLocked?: boolean; // PR #8
  lockInfo?: LockInfo | null; // PR #8
  onClick?: (e: Konva.KonvaEventObject<MouseEvent>) => void; // PR #13 - Pass event
  onDragStart?: (e: Konva.KonvaEventObject<DragEvent>) => void; // PR #8
  onDragEnd?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onContextMenu?: (e: Konva.KonvaEventObject<PointerEvent>) => void; // Right-click
}

const Circle = memo(function Circle({
  shape,
  isSelected = false,
  isLocked = false,
  lockInfo,
  onClick,
  onDragStart,
  onDragEnd,
  onContextMenu,
}: CircleProps) {
  // Calculate radii from width and height (supports both circles and ellipses)
  const radiusX = shape.width / 2;
  const radiusY = shape.height / 2;

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
    <KonvaEllipse
      id={shape.id}
      x={shape.x + radiusX} // Center the ellipse (Konva positions ellipses by center)
      y={shape.y + radiusY}
      radiusX={radiusX} // Horizontal radius
      radiusY={radiusY} // Vertical radius
      fill={shape.color}
      rotation={shape.rotation || 0}
      opacity={shape.opacity !== undefined ? shape.opacity : 1} // PR #16 - Opacity support
      draggable={!isLocked} // PR #8 - Disable drag if locked by another user
      onClick={onClick}
      onTap={onClick}
      onDragStart={onDragStart} // PR #8
      onDragEnd={onDragEnd} // Parent Canvas.tsx handles coordinate conversion
      onContextMenu={onContextMenu} // Right-click context menu
      // Stroke properties
      stroke={finalStroke}
      strokeWidth={finalStrokeWidth}
      // Performance optimizations
      perfectDrawEnabled={false}
      listening={true}
    />
  );
},
compareShapeProps);

export default Circle;
