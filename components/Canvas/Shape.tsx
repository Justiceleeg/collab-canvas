"use client";

// PR #6 - Rectangle Shape Creation & Rendering
// Generic shape wrapper component
// Conditionally renders the appropriate shape component based on type

import { CanvasObject } from "@/types/canvas.types";
import Rectangle from "./Rectangle";
import Circle from "./Circle";
import Text from "./Text";
import type Konva from "konva";

interface ShapeProps {
  shape: CanvasObject;
  isSelected?: boolean;
  onClick?: () => void;
  onMouseDown?: () => void;
  onDragEnd?: (e: Konva.KonvaEventObject<DragEvent>) => void;
}

export default function Shape({
  shape,
  isSelected = false,
  onClick,
  onMouseDown,
  onDragEnd,
}: ShapeProps) {
  // Render the appropriate shape component based on type
  switch (shape.type) {
    case "rectangle":
      return (
        <Rectangle
          shape={shape}
          isSelected={isSelected}
          onClick={onClick}
          onMouseDown={onMouseDown}
          onDragEnd={onDragEnd}
        />
      );

    case "circle":
      return (
        <Circle
          shape={shape}
          isSelected={isSelected}
          onClick={onClick}
          onMouseDown={onMouseDown}
          onDragEnd={onDragEnd}
        />
      );

    case "text":
      return (
        <Text
          shape={shape}
          isSelected={isSelected}
          onClick={onClick}
          onMouseDown={onMouseDown}
          onDragEnd={onDragEnd}
        />
      );

    default:
      // Fallback for unknown shape types
      console.warn(`Unknown shape type: ${shape.type}`);
      return null;
  }
}
