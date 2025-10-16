// PR #6 - Rectangle Shape Creation & Rendering
// Geometry utility functions for shape calculations

import { CanvasObject } from "@/types/canvas.types";

/**
 * Calculate the bounding box of a shape
 * PR #10 - Enhanced to properly handle all shape types including circles
 * PR #12.1 - Updated to handle ellipses (width and height can be different)
 */
export function getShapeBounds(shape: CanvasObject): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  // All shape types store their bounds as x, y, width, height
  // For circles/ellipses, width and height represent the diameters
  // and x, y represent the top-left of the bounding box
  return {
    x: shape.x,
    y: shape.y,
    width: shape.width,
    height: shape.height,
  };
}

/**
 * Check if a point is inside a shape's bounds
 * PR #10 - Enhanced to properly handle circle collision detection
 * PR #12.1 - Updated to handle ellipse collision detection
 */
export function isPointInShape(
  point: { x: number; y: number },
  shape: CanvasObject
): boolean {
  // For circles/ellipses, use ellipse collision detection
  if (shape.type === "circle") {
    const center = getShapeCenter(shape);
    const radiusX = shape.width / 2;
    const radiusY = shape.height / 2;

    // Ellipse equation: (x-cx)²/rx² + (y-cy)²/ry² <= 1
    const dx = point.x - center.x;
    const dy = point.y - center.y;
    const normalizedDistance =
      (dx * dx) / (radiusX * radiusX) + (dy * dy) / (radiusY * radiusY);

    return normalizedDistance <= 1;
  }

  // For rectangles and text, use bounding box
  const bounds = getShapeBounds(shape);

  // Handle rotation if needed (simplified check for now)
  // TODO: Add proper rotation handling in future PRs
  if (shape.rotation && shape.rotation !== 0) {
    // For now, use a simple axis-aligned bounding box check
    // This will be improved when rotation is fully implemented in PR #12
  }

  return (
    point.x >= bounds.x &&
    point.x <= bounds.x + bounds.width &&
    point.y >= bounds.y &&
    point.y <= bounds.y + bounds.height
  );
}

/**
 * Check if two shapes intersect
 */
export function doShapesIntersect(
  shape1: CanvasObject,
  shape2: CanvasObject
): boolean {
  const bounds1 = getShapeBounds(shape1);
  const bounds2 = getShapeBounds(shape2);

  return !(
    bounds1.x + bounds1.width < bounds2.x ||
    bounds2.x + bounds2.width < bounds1.x ||
    bounds1.y + bounds1.height < bounds2.y ||
    bounds2.y + bounds2.height < bounds1.y
  );
}

/**
 * Check if a rectangle intersects with a shape
 * Used for drag-to-select functionality (PR #14)
 */
export function isShapeInSelectionBox(
  shape: CanvasObject,
  selectionBox: { x: number; y: number; width: number; height: number }
): boolean {
  const shapeBounds = getShapeBounds(shape);

  // Normalize selection box (handle negative width/height)
  const boxX =
    selectionBox.width < 0
      ? selectionBox.x + selectionBox.width
      : selectionBox.x;
  const boxY =
    selectionBox.height < 0
      ? selectionBox.y + selectionBox.height
      : selectionBox.y;
  const boxWidth = Math.abs(selectionBox.width);
  const boxHeight = Math.abs(selectionBox.height);

  return !(
    shapeBounds.x + shapeBounds.width < boxX ||
    boxX + boxWidth < shapeBounds.x ||
    shapeBounds.y + shapeBounds.height < boxY ||
    boxY + boxHeight < shapeBounds.y
  );
}

/**
 * Calculate the center point of a shape
 * PR #12.1 - Updated to handle ellipses with different width/height
 */
export function getShapeCenter(shape: CanvasObject): { x: number; y: number } {
  if (shape.type === "circle") {
    // For circles/ellipses, the center is offset by the radii
    const radiusX = shape.width / 2;
    const radiusY = shape.height / 2;
    return {
      x: shape.x + radiusX,
      y: shape.y + radiusY,
    };
  }

  // For rectangles and text
  return {
    x: shape.x + shape.width / 2,
    y: shape.y + shape.height / 2,
  };
}

/**
 * Calculate distance between two points
 */
export function getDistance(
  point1: { x: number; y: number },
  point2: { x: number; y: number }
): number {
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Snap a value to a grid
 * @param value - The value to snap
 * @param gridSize - The grid size (default 10)
 */
export function snapToGrid(value: number, gridSize: number = 10): number {
  return Math.round(value / gridSize) * gridSize;
}

/**
 * Snap a point to a grid
 */
export function snapPointToGrid(
  point: { x: number; y: number },
  gridSize: number = 10
): { x: number; y: number } {
  return {
    x: snapToGrid(point.x, gridSize),
    y: snapToGrid(point.y, gridSize),
  };
}

/**
 * Generate a random color for shapes
 */
export function getRandomColor(): string {
  const colors = [
    "#FF6B6B", // Red
    "#4ECDC4", // Teal
    "#45B7D1", // Blue
    "#FFA07A", // Light Salmon
    "#98D8C8", // Mint
    "#F7DC6F", // Yellow
    "#BB8FCE", // Purple
    "#85C1E2", // Sky Blue
    "#F8B195", // Peach
    "#C06C84", // Mauve
  ];

  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Calculate bounds for multiple shapes (for multi-select)
 * Will be used in PR #13 for multi-select functionality
 */
export function getMultiShapeBounds(shapes: CanvasObject[]): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  if (shapes.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  shapes.forEach((shape) => {
    const bounds = getShapeBounds(shape);
    minX = Math.min(minX, bounds.x);
    minY = Math.min(minY, bounds.y);
    maxX = Math.max(maxX, bounds.x + bounds.width);
    maxY = Math.max(maxY, bounds.y + bounds.height);
  });

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}
