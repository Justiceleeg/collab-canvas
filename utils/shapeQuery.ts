// Shape Query Utilities
// Helper functions to find and filter shapes on the canvas

import type { CanvasObject } from "@/types/canvas.types";
import { parseColor } from "./colors";

/**
 * Find shapes by color (accepts hex or color name)
 */
export function findShapesByColor(
  objects: CanvasObject[],
  color: string
): CanvasObject[] {
  const targetColor = parseColor(color).toLowerCase();
  return objects.filter((obj) => obj.color.toLowerCase() === targetColor);
}

/**
 * Find shapes by type
 */
export function findShapesByType(
  objects: CanvasObject[],
  type: "rectangle" | "circle" | "text"
): CanvasObject[] {
  return objects.filter((obj) => obj.type === type);
}

/**
 * Get currently selected shapes
 */
export function findSelectedShapes(
  objects: CanvasObject[],
  selectedIds: string[]
): CanvasObject[] {
  return objects.filter((obj) => selectedIds.includes(obj.id));
}

/**
 * Find shape by ID
 */
export function findShapeById(
  objects: CanvasObject[],
  id: string
): CanvasObject | undefined {
  return objects.find((obj) => obj.id === id);
}

/**
 * Find best match based on criteria (type + color)
 * If multiple matches, returns the most recently created
 */
export function findBestMatch(
  objects: CanvasObject[],
  criteria: {
    type?: "rectangle" | "circle" | "text";
    color?: string;
  }
): CanvasObject | undefined {
  let filtered = objects;

  if (criteria.type) {
    filtered = filtered.filter((obj) => obj.type === criteria.type);
  }

  if (criteria.color) {
    const targetColor = parseColor(criteria.color).toLowerCase();
    filtered = filtered.filter(
      (obj) => obj.color.toLowerCase() === targetColor
    );
  }

  // Return most recently created (highest createdAt timestamp)
  if (filtered.length === 0) return undefined;
  return filtered.reduce((latest, current) => {
    return current.createdAt > latest.createdAt ? current : latest;
  });
}

/**
 * Find closest shape to viewport center
 * Useful when multiple shapes match and we need to pick one
 */
export function findClosestToViewport(
  shapes: CanvasObject[],
  viewport: { x: number; y: number; scale: number }
): CanvasObject | undefined {
  if (shapes.length === 0) return undefined;

  const centerX = -viewport.x / viewport.scale;
  const centerY = -viewport.y / viewport.scale;

  return shapes.reduce((closest, current) => {
    const closestDist = Math.hypot(closest.x - centerX, closest.y - centerY);
    const currentDist = Math.hypot(current.x - centerX, current.y - centerY);
    return currentDist < closestDist ? current : closest;
  });
}

/**
 * Count shapes matching criteria
 */
export function countShapes(
  objects: CanvasObject[],
  criteria?: {
    type?: "rectangle" | "circle" | "text";
    color?: string;
  }
): number {
  if (!criteria) return objects.length;

  let filtered = objects;

  if (criteria.type) {
    filtered = filtered.filter((obj) => obj.type === criteria.type);
  }

  if (criteria.color) {
    const targetColor = parseColor(criteria.color).toLowerCase();
    filtered = filtered.filter(
      (obj) => obj.color.toLowerCase() === targetColor
    );
  }

  return filtered.length;
}
