// PR #12 - Transform Controls (Resize & Rotate)
// Transform utilities for rotation calculations and bounding box operations

import { CanvasObject } from "@/types/canvas.types";

/**
 * Convert degrees to radians
 */
export function degreesToRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Convert radians to degrees
 */
export function radiansToDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

/**
 * Normalize angle to be within 0-360 degrees
 */
export function normalizeAngle(degrees: number): number {
  let normalized = degrees % 360;
  if (normalized < 0) {
    normalized += 360;
  }
  return normalized;
}

/**
 * Calculate the bounding box of a rotated rectangle
 * Returns the axis-aligned bounding box (AABB) that contains the rotated shape
 */
export function getRotatedBoundingBox(
  x: number,
  y: number,
  width: number,
  height: number,
  rotation: number // in degrees
): { x: number; y: number; width: number; height: number } {
  if (rotation === 0 || rotation === 360) {
    return { x, y, width, height };
  }

  const rad = degreesToRadians(rotation);
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));

  const newWidth = width * cos + height * sin;
  const newHeight = width * sin + height * cos;

  return {
    x: x - (newWidth - width) / 2,
    y: y - (newHeight - height) / 2,
    width: newWidth,
    height: newHeight,
  };
}

/**
 * Rotate a point around a center point
 */
export function rotatePoint(
  pointX: number,
  pointY: number,
  centerX: number,
  centerY: number,
  rotation: number // in degrees
): { x: number; y: number } {
  const rad = degreesToRadians(rotation);
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  // Translate point to origin
  const translatedX = pointX - centerX;
  const translatedY = pointY - centerY;

  // Rotate point
  const rotatedX = translatedX * cos - translatedY * sin;
  const rotatedY = translatedX * sin + translatedY * cos;

  // Translate back
  return {
    x: rotatedX + centerX,
    y: rotatedY + centerY,
  };
}

/**
 * Get the center point of a shape
 */
export function getShapeCenter(shape: CanvasObject): { x: number; y: number } {
  return {
    x: shape.x + shape.width / 2,
    y: shape.y + shape.height / 2,
  };
}

/**
 * Calculate new dimensions after transformation
 * Handles scale and size constraints
 */
export function calculateTransformedDimensions(
  originalWidth: number,
  originalHeight: number,
  scaleX: number,
  scaleY: number,
  minSize: number = 10
): { width: number; height: number } {
  let newWidth = Math.abs(originalWidth * scaleX);
  let newHeight = Math.abs(originalHeight * scaleY);

  // Enforce minimum size
  newWidth = Math.max(newWidth, minSize);
  newHeight = Math.max(newHeight, minSize);

  return { width: newWidth, height: newHeight };
}

/**
 * Snap angle to common increments (0, 45, 90, 135, 180, 225, 270, 315)
 * Useful when shift key is held during rotation
 */
export function snapAngleToIncrement(
  angle: number,
  increment: number = 45
): number {
  const normalized = normalizeAngle(angle);
  return Math.round(normalized / increment) * increment;
}

/**
 * Check if two rotated rectangles intersect
 * Uses the Separating Axis Theorem (SAT)
 */
export function rotatedRectanglesIntersect(
  rect1: {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
  },
  rect2: {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
  }
): boolean {
  // For simplicity, we'll use AABB intersection for now
  // A more accurate implementation would use SAT with all 4 corners
  const box1 = getRotatedBoundingBox(
    rect1.x,
    rect1.y,
    rect1.width,
    rect1.height,
    rect1.rotation
  );
  const box2 = getRotatedBoundingBox(
    rect2.x,
    rect2.y,
    rect2.width,
    rect2.height,
    rect2.rotation
  );

  return !(
    box1.x + box1.width < box2.x ||
    box2.x + box2.width < box1.x ||
    box1.y + box1.height < box2.y ||
    box2.y + box2.height < box1.y
  );
}

/**
 * Get the four corner points of a rotated rectangle
 */
export function getRotatedRectangleCorners(
  x: number,
  y: number,
  width: number,
  height: number,
  rotation: number
): Array<{ x: number; y: number }> {
  const centerX = x + width / 2;
  const centerY = y + height / 2;

  const corners = [
    { x, y }, // top-left
    { x: x + width, y }, // top-right
    { x: x + width, y: y + height }, // bottom-right
    { x, y: y + height }, // bottom-left
  ];

  if (rotation === 0) {
    return corners;
  }

  return corners.map((corner) =>
    rotatePoint(corner.x, corner.y, centerX, centerY, rotation)
  );
}

/**
 * Apply transformation matrix to position
 * Useful for transforming coordinates between spaces
 */
export function applyTransformMatrix(
  x: number,
  y: number,
  matrix: {
    a: number;
    b: number;
    c: number;
    d: number;
    e: number;
    f: number;
  }
): { x: number; y: number } {
  return {
    x: x * matrix.a + y * matrix.c + matrix.e,
    y: x * matrix.b + y * matrix.d + matrix.f,
  };
}
