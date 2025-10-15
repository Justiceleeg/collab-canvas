// PR #5 - Testing utilities for Firestore sync
// Helper functions to test canvas functionality

import { CanvasObject } from "@/types/canvas.types";

/**
 * Generate a random color
 */
export function randomColor(): string {
  const colors = [
    "#FF6B6B", // Red
    "#4ECDC4", // Teal
    "#45B7D1", // Blue
    "#FFA07A", // Orange
    "#98D8C8", // Mint
    "#F7DC6F", // Yellow
    "#BB8FCE", // Purple
    "#85C1E2", // Sky Blue
    "#F8B739", // Gold
    "#52B788", // Green
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Generate test rectangle objects
 */
export function generateTestRectangles(
  count: number,
  userId: string
): Array<Omit<CanvasObject, "id" | "createdAt" | "updatedAt">> {
  const rectangles: Array<
    Omit<CanvasObject, "id" | "createdAt" | "updatedAt">
  > = [];

  for (let i = 0; i < count; i++) {
    rectangles.push({
      type: "rectangle",
      x: Math.random() * 800 + 100,
      y: Math.random() * 600 + 100,
      width: Math.random() * 100 + 50,
      height: Math.random() * 100 + 50,
      rotation: 0,
      color: randomColor(),
      zIndex: i,
      lastUpdatedBy: userId,
    });
  }

  return rectangles;
}

/**
 * Generate test circle objects
 */
export function generateTestCircles(
  count: number,
  userId: string
): Array<Omit<CanvasObject, "id" | "createdAt" | "updatedAt">> {
  const circles: Array<Omit<CanvasObject, "id" | "createdAt" | "updatedAt">> =
    [];

  for (let i = 0; i < count; i++) {
    const radius = Math.random() * 50 + 25;
    circles.push({
      type: "circle",
      x: Math.random() * 800 + 100,
      y: Math.random() * 600 + 100,
      width: radius * 2,
      height: radius * 2,
      rotation: 0,
      color: randomColor(),
      zIndex: i,
      lastUpdatedBy: userId,
    });
  }

  return circles;
}

/**
 * Generate mixed test objects
 */
export function generateMixedTestObjects(
  count: number,
  userId: string
): Array<Omit<CanvasObject, "id" | "createdAt" | "updatedAt">> {
  const objects: Array<Omit<CanvasObject, "id" | "createdAt" | "updatedAt">> =
    [];
  const types: ("rectangle" | "circle" | "text")[] = [
    "rectangle",
    "circle",
    "text",
  ];

  for (let i = 0; i < count; i++) {
    const type = types[Math.floor(Math.random() * types.length)];

    switch (type) {
      case "rectangle":
        objects.push({
          type: "rectangle",
          x: Math.random() * 800 + 100,
          y: Math.random() * 600 + 100,
          width: Math.random() * 100 + 50,
          height: Math.random() * 100 + 50,
          rotation: 0,
          color: randomColor(),
          zIndex: i,
          lastUpdatedBy: userId,
        });
        break;

      case "circle":
        const radius = Math.random() * 50 + 25;
        objects.push({
          type: "circle",
          x: Math.random() * 800 + 100,
          y: Math.random() * 600 + 100,
          width: radius * 2,
          height: radius * 2,
          rotation: 0,
          color: randomColor(),
          zIndex: i,
          lastUpdatedBy: userId,
        });
        break;

      case "text":
        objects.push({
          type: "text",
          x: Math.random() * 800 + 100,
          y: Math.random() * 600 + 100,
          width: 200,
          height: 50,
          rotation: 0,
          color: randomColor(),
          text: `Test ${i + 1}`,
          fontSize: 16 + Math.floor(Math.random() * 16),
          zIndex: i,
          lastUpdatedBy: userId,
        });
        break;
    }
  }

  return objects;
}
