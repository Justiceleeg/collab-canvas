// PR #7 - Shape Selection & Movement
// Transform utilities
// - Position calculation helpers ✓
// - Snap to grid (optional) ✓
// - Rotation calculations (PR #12)
// - Bounding box with rotation (PR #12)

import { CanvasObject } from "@/types/canvas.types";

/**
 * Snap a value to the nearest grid point
 */
export function snapToGrid(value: number, gridSize: number = 10): number {
  return Math.round(value / gridSize) * gridSize;
}

/**
 * Snap a position to the grid
 */
export function snapPositionToGrid(
  x: number,
  y: number,
  gridSize: number = 10
): { x: number; y: number } {
  return {
    x: snapToGrid(x, gridSize),
    y: snapToGrid(y, gridSize),
  };
}

/**
 * Calculate relative offset between two positions
 */
export function getRelativeOffset(
  from: { x: number; y: number },
  to: { x: number; y: number }
): { x: number; y: number } {
  return {
    x: to.x - from.x,
    y: to.y - from.y,
  };
}

/**
 * Apply offset to a position
 */
export function applyOffset(
  position: { x: number; y: number },
  offset: { x: number; y: number }
): { x: number; y: number } {
  return {
    x: position.x + offset.x,
    y: position.y + offset.y,
  };
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Constrain a position to bounds
 */
export function constrainToBounds(
  position: { x: number; y: number },
  bounds: { minX: number; minY: number; maxX: number; maxY: number }
): { x: number; y: number } {
  return {
    x: clamp(position.x, bounds.minX, bounds.maxX),
    y: clamp(position.y, bounds.minY, bounds.maxY),
  };
}

/**
 * Convert screen coordinates to canvas coordinates (accounting for viewport)
 */
export function screenToCanvas(
  screenX: number,
  screenY: number,
  viewport: { x: number; y: number; scale: number }
): { x: number; y: number } {
  return {
    x: (screenX - viewport.x) / viewport.scale,
    y: (screenY - viewport.y) / viewport.scale,
  };
}

/**
 * Convert canvas coordinates to screen coordinates (accounting for viewport)
 */
export function canvasToScreen(
  canvasX: number,
  canvasY: number,
  viewport: { x: number; y: number; scale: number }
): { x: number; y: number } {
  return {
    x: canvasX * viewport.scale + viewport.x,
    y: canvasY * viewport.scale + viewport.y,
  };
}

/**
 * Calculate the center point of a shape
 */
export function getShapeCenter(shape: CanvasObject): { x: number; y: number } {
  return {
    x: shape.x + shape.width / 2,
    y: shape.y + shape.height / 2,
  };
}

/**
 * Calculate distance between two points
 */
export function getDistance(
  p1: { x: number; y: number },
  p2: { x: number; y: number }
): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// Export as object for backward compatibility
export const transforms = {
  snapToGrid,
  snapPositionToGrid,
  getRelativeOffset,
  applyOffset,
  clamp,
  constrainToBounds,
  screenToCanvas,
  canvasToScreen,
  getShapeCenter,
  getDistance,
};
