// Layout Utilities
// Functions for calculating positions for grid, distribution, and alignment

import type { CanvasObject } from "@/types/canvas.types";

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Position {
  x: number;
  y: number;
}

/**
 * Get the bounding box that contains all shapes
 */
export function getBoundingBox(shapes: CanvasObject[]): BoundingBox {
  if (shapes.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  shapes.forEach((shape) => {
    const left = shape.x;
    const top = shape.y;
    const right = shape.x + shape.width;
    const bottom = shape.y + shape.height;

    minX = Math.min(minX, left);
    minY = Math.min(minY, top);
    maxX = Math.max(maxX, right);
    maxY = Math.max(maxY, bottom);
  });

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Calculate positions for arranging shapes in a grid
 * Returns a map of shapeId to new position
 */
export function calculateGridPositions(
  shapes: CanvasObject[],
  rows: number,
  cols: number,
  spacing: number = 50
): Map<string, Position> {
  const positionMap = new Map<string, Position>();

  if (shapes.length === 0) {
    return positionMap;
  }

  // Calculate cell dimensions based on largest shape
  let maxWidth = 0;
  let maxHeight = 0;
  shapes.forEach((shape) => {
    maxWidth = Math.max(maxWidth, shape.width);
    maxHeight = Math.max(maxHeight, shape.height);
  });

  const cellWidth = maxWidth + spacing;
  const cellHeight = maxHeight + spacing;

  // Get starting position (top-left of first shape or use a default)
  const startX = shapes[0]?.x || 100;
  const startY = shapes[0]?.y || 100;

  // Arrange shapes in grid
  shapes.forEach((shape, index) => {
    const row = Math.floor(index / cols);
    const col = index % cols;

    const x = startX + col * cellWidth;
    const y = startY + row * cellHeight;

    positionMap.set(shape.id, { x, y });
  });

  return positionMap;
}

/**
 * Calculate positions for distributing shapes evenly
 * Returns a map of shapeId to new position
 */
export function calculateDistribution(
  shapes: CanvasObject[],
  direction: "horizontal" | "vertical",
  spacing?: number
): Map<string, Position> {
  const positionMap = new Map<string, Position>();

  if (shapes.length <= 1) {
    // Nothing to distribute
    return positionMap;
  }

  // Sort shapes by position
  const sortedShapes = [...shapes].sort((a, b) => {
    return direction === "horizontal" ? a.x - b.x : a.y - b.y;
  });

  if (spacing !== undefined && spacing >= 0) {
    // Distribute with fixed spacing
    const firstShape = sortedShapes[0];
    let currentPos =
      direction === "horizontal" ? firstShape.x : firstShape.y;

    sortedShapes.forEach((shape) => {
      if (direction === "horizontal") {
        positionMap.set(shape.id, { x: currentPos, y: shape.y });
        currentPos += shape.width + spacing;
      } else {
        positionMap.set(shape.id, { x: shape.x, y: currentPos });
        currentPos += shape.height + spacing;
      }
    });
  } else {
    // Distribute evenly between first and last
    const firstShape = sortedShapes[0];
    const lastShape = sortedShapes[sortedShapes.length - 1];

    const startPos =
      direction === "horizontal" ? firstShape.x : firstShape.y;
    const endPos =
      direction === "horizontal"
        ? lastShape.x + lastShape.width
        : lastShape.y + lastShape.height;

    const totalSize =
      direction === "horizontal"
        ? sortedShapes.reduce((sum, s) => sum + s.width, 0)
        : sortedShapes.reduce((sum, s) => sum + s.height, 0);

    const availableSpace = endPos - startPos - totalSize;
    const gap =
      sortedShapes.length > 1 ? availableSpace / (sortedShapes.length - 1) : 0;

    let currentPos = startPos;
    sortedShapes.forEach((shape) => {
      if (direction === "horizontal") {
        positionMap.set(shape.id, { x: currentPos, y: shape.y });
        currentPos += shape.width + gap;
      } else {
        positionMap.set(shape.id, { x: shape.x, y: currentPos });
        currentPos += shape.height + gap;
      }
    });
  }

  return positionMap;
}

/**
 * Calculate positions for aligning shapes
 * Returns a map of shapeId to new position
 */
export function calculateAlignment(
  shapes: CanvasObject[],
  alignType: "left" | "right" | "top" | "bottom" | "center-horizontal" | "center-vertical"
): Map<string, Position> {
  const positionMap = new Map<string, Position>();

  if (shapes.length === 0) {
    return positionMap;
  }

  const bbox = getBoundingBox(shapes);

  shapes.forEach((shape) => {
    let newX = shape.x;
    let newY = shape.y;

    switch (alignType) {
      case "left":
        newX = bbox.x;
        break;
      case "right":
        newX = bbox.x + bbox.width - shape.width;
        break;
      case "top":
        newY = bbox.y;
        break;
      case "bottom":
        newY = bbox.y + bbox.height - shape.height;
        break;
      case "center-horizontal":
        newX = bbox.x + (bbox.width - shape.width) / 2;
        break;
      case "center-vertical":
        newY = bbox.y + (bbox.height - shape.height) / 2;
        break;
    }

    positionMap.set(shape.id, { x: newX, y: newY });
  });

  return positionMap;
}

/**
 * Ensure no overlap between shapes (simple adjustment)
 * This is a basic implementation that adds spacing if shapes would overlap
 */
export function ensureNoOverlap(
  positions: Map<string, Position>,
  shapes: CanvasObject[],
  minSpacing: number = 10
): Map<string, Position> {
  const adjusted = new Map(positions);

  // For simplicity, we'll just add a small offset if we detect potential overlaps
  // A more sophisticated algorithm would use force-directed layout or bin packing

  const shapesWithPositions = shapes
    .map((shape) => ({
      shape,
      pos: adjusted.get(shape.id) || { x: shape.x, y: shape.y },
    }))
    .sort((a, b) => a.pos.y - b.pos.y || a.pos.x - b.pos.x);

  for (let i = 0; i < shapesWithPositions.length; i++) {
    const current = shapesWithPositions[i];

    for (let j = i + 1; j < shapesWithPositions.length; j++) {
      const other = shapesWithPositions[j];

      // Check for overlap
      const overlapX =
        current.pos.x < other.pos.x + other.shape.width + minSpacing &&
        current.pos.x + current.shape.width + minSpacing > other.pos.x;

      const overlapY =
        current.pos.y < other.pos.y + other.shape.height + minSpacing &&
        current.pos.y + current.shape.height + minSpacing > other.pos.y;

      if (overlapX && overlapY) {
        // Simple adjustment: move the later shape down and to the right
        other.pos.x = current.pos.x + current.shape.width + minSpacing;
        adjusted.set(other.shape.id, { ...other.pos });
      }
    }
  }

  return adjusted;
}

