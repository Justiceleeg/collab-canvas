// Server-side canvas operations for AI agent
// These functions write directly to Firestore and the client will sync automatically

import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { parseColor } from "@/utils/colors";
import type { ShapeType, CanvasObject } from "@/types/canvas.types";
import {
  calculateGridPositions,
  calculateDistribution,
  calculateAlignment,
} from "@/utils/layout";
import {
  findShapesByType,
  findShapesByColor,
  countShapes,
} from "@/utils/shapeQuery";

const CANVAS_OBJECTS_COLLECTION = "canvasObjects";

// Helper to check if Firebase Admin is initialized
function ensureFirebaseAdmin() {
  if (!adminDb) {
    throw new Error(
      "Firebase Admin not initialized. Please add FIREBASE_ADMIN_* credentials to .env.local"
    );
  }
  return adminDb;
}

interface CreateShapeParams {
  type: ShapeType;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  color?: string;
  text?: string;
}

interface MoveShapeParams {
  shapeId?: string;
  x: number;
  y: number;
}

interface ResizeShapeParams {
  shapeId?: string;
  width: number;
  height: number;
}

interface RotateShapeParams {
  shapeId?: string;
  rotation: number;
}

interface ArrangeGridParams {
  shapeIds?: string[];
  rows: number;
  cols: number;
  spacing?: number;
}

interface DistributeShapesParams {
  shapeIds?: string[];
  direction: "horizontal" | "vertical";
  spacing?: number;
}

interface AlignShapesParams {
  shapeIds?: string[];
  alignType:
    | "left"
    | "right"
    | "top"
    | "bottom"
    | "center-horizontal"
    | "center-vertical";
}

/**
 * Create a new shape in Firestore
 */
export async function createShape(
  params: CreateShapeParams,
  userId: string = "ai-agent"
) {
  const { type, x = 400, y = 300, width, height, color, text } = params;

  const defaultSizes: Record<ShapeType, { width: number; height: number }> = {
    rectangle: { width: 200, height: 150 },
    circle: { width: 150, height: 150 },
    text: { width: 200, height: 50 },
  };

  const size = defaultSizes[type];
  const parsedColor = color ? parseColor(color) : "#3B82F6";

  const shapeData = {
    type,
    x,
    y,
    width: width || size.width,
    height: height || size.height,
    rotation: 0,
    color: parsedColor,
    strokeColor: "#000000",
    strokeWidth: 2,
    opacity: 1,
    ...(type === "text" && {
      text: text || "Text",
      fontSize: 24,
      fontWeight: "normal",
      fontStyle: "normal",
    }),
    zIndex: Date.now(),
    lockedBy: null,
    lockedAt: null,
    lastUpdatedBy: userId,
    updatedAt: FieldValue.serverTimestamp(),
    createdAt: FieldValue.serverTimestamp(),
  };

  const db = ensureFirebaseAdmin();
  const docRef = await db.collection(CANVAS_OBJECTS_COLLECTION).add(shapeData);

  return {
    success: true,
    message: `Created ${type}${color ? ` with color ${color}` : ""}`,
    shapeId: docRef.id,
  };
}

/**
 * Move a shape to a new position
 */
export async function moveShape(
  params: MoveShapeParams,
  selectedIds: string[],
  userId: string = "ai-agent"
) {
  const { shapeId, x, y } = params;

  // Determine which shape to move
  const targetId = shapeId || (selectedIds.length > 0 ? selectedIds[0] : null);

  if (!targetId) {
    return {
      success: false,
      message: "No shape selected or specified to move.",
    };
  }

  const db = ensureFirebaseAdmin();

  try {
    const docRef = db.collection(CANVAS_OBJECTS_COLLECTION).doc(targetId);

    // Retry logic: Wait for document to exist (newly created shapes may take a moment)
    let doc = await docRef.get();
    let retries = 0;
    const maxRetries = 3;

    while (!doc.exists && retries < maxRetries) {
      // Wait 100ms before retrying
      await new Promise((resolve) => setTimeout(resolve, 100));
      doc = await docRef.get();
      retries++;
    }

    if (!doc.exists) {
      return {
        success: false,
        message: `Shape with ID ${targetId} not found after ${maxRetries} retries.`,
      };
    }

    await docRef.update({
      x,
      y,
      lastUpdatedBy: userId,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      message: `Moved shape to (${x}, ${y})`,
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to move shape: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }
}

/**
 * Resize a shape
 */
export async function resizeShape(
  params: ResizeShapeParams,
  selectedIds: string[],
  userId: string = "ai-agent"
) {
  const { shapeId, width, height } = params;

  // Determine which shape to resize
  const targetId =
    shapeId || (selectedIds.length === 1 ? selectedIds[0] : null);

  if (!targetId) {
    return {
      success: false,
      message: "No shape selected or specified to resize.",
    };
  }

  const db = ensureFirebaseAdmin();
  await db.collection(CANVAS_OBJECTS_COLLECTION).doc(targetId).update({
    width,
    height,
    lastUpdatedBy: userId,
    updatedAt: FieldValue.serverTimestamp(),
  });

  return {
    success: true,
    message: `Resized shape to ${width}x${height}`,
  };
}

/**
 * Rotate a shape
 */
export async function rotateShape(
  params: RotateShapeParams,
  selectedIds: string[],
  userId: string = "ai-agent"
) {
  const { shapeId, rotation } = params;

  // Determine which shape to rotate
  const targetId =
    shapeId || (selectedIds.length === 1 ? selectedIds[0] : null);

  if (!targetId) {
    return {
      success: false,
      message: "No shape selected or specified to rotate.",
    };
  }

  const db = ensureFirebaseAdmin();
  await db.collection(CANVAS_OBJECTS_COLLECTION).doc(targetId).update({
    rotation,
    lastUpdatedBy: userId,
    updatedAt: FieldValue.serverTimestamp(),
  });

  return {
    success: true,
    message: `Rotated shape to ${rotation} degrees`,
  };
}

// PR #24: Layout Operations

/**
 * Arrange shapes in a grid
 */
export async function arrangeGrid(
  params: ArrangeGridParams,
  canvasObjects: CanvasObject[],
  selectedIds: string[],
  userId: string = "ai-agent"
) {
  const { shapeIds, rows, cols, spacing = 50 } = params;

  // Determine which shapes to arrange
  let targetShapes: CanvasObject[] = [];
  if (shapeIds && shapeIds.length > 0) {
    targetShapes = canvasObjects.filter((obj) => shapeIds.includes(obj.id));
  } else if (selectedIds.length > 0) {
    targetShapes = canvasObjects.filter((obj) => selectedIds.includes(obj.id));
  } else {
    targetShapes = canvasObjects; // All shapes
  }

  if (targetShapes.length === 0) {
    return {
      success: false,
      message: "No shapes to arrange.",
    };
  }

  // Calculate grid positions
  const positions = calculateGridPositions(targetShapes, rows, cols, spacing);

  // Update positions in Firestore
  const db = ensureFirebaseAdmin();
  const batch = db.batch();

  positions.forEach((pos, shapeId) => {
    const docRef = db.collection(CANVAS_OBJECTS_COLLECTION).doc(shapeId);
    batch.update(docRef, {
      x: pos.x,
      y: pos.y,
      lastUpdatedBy: userId,
      updatedAt: FieldValue.serverTimestamp(),
    });
  });

  await batch.commit();

  return {
    success: true,
    message: `Arranged ${targetShapes.length} shapes in a ${rows}x${cols} grid`,
  };
}

/**
 * Distribute shapes evenly
 */
export async function distributeShapes(
  params: DistributeShapesParams,
  canvasObjects: CanvasObject[],
  selectedIds: string[],
  userId: string = "ai-agent"
) {
  const { shapeIds, direction, spacing } = params;

  // Determine which shapes to distribute
  let targetShapes: CanvasObject[] = [];
  if (shapeIds && shapeIds.length > 0) {
    targetShapes = canvasObjects.filter((obj) => shapeIds.includes(obj.id));
  } else if (selectedIds.length > 0) {
    targetShapes = canvasObjects.filter((obj) => selectedIds.includes(obj.id));
  }

  if (targetShapes.length < 2) {
    return {
      success: false,
      message: "Need at least 2 shapes to distribute.",
    };
  }

  // Calculate distribution positions
  const positions = calculateDistribution(targetShapes, direction, spacing);

  // Update positions in Firestore
  const db = ensureFirebaseAdmin();
  const batch = db.batch();

  positions.forEach((pos, shapeId) => {
    const docRef = db.collection(CANVAS_OBJECTS_COLLECTION).doc(shapeId);
    batch.update(docRef, {
      x: pos.x,
      y: pos.y,
      lastUpdatedBy: userId,
      updatedAt: FieldValue.serverTimestamp(),
    });
  });

  await batch.commit();

  return {
    success: true,
    message: `Distributed ${targetShapes.length} shapes ${direction}ly`,
  };
}

/**
 * Align shapes
 */
export async function alignShapes(
  params: AlignShapesParams,
  canvasObjects: CanvasObject[],
  selectedIds: string[],
  userId: string = "ai-agent"
) {
  const { shapeIds, alignType } = params;

  // Determine which shapes to align
  let targetShapes: CanvasObject[] = [];
  if (shapeIds && shapeIds.length > 0) {
    targetShapes = canvasObjects.filter((obj) => shapeIds.includes(obj.id));
  } else if (selectedIds.length > 0) {
    targetShapes = canvasObjects.filter((obj) => selectedIds.includes(obj.id));
  }

  if (targetShapes.length < 2) {
    return {
      success: false,
      message: "Need at least 2 shapes to align.",
    };
  }

  // Calculate alignment positions
  const positions = calculateAlignment(targetShapes, alignType);

  // Update positions in Firestore
  const db = ensureFirebaseAdmin();
  const batch = db.batch();

  positions.forEach((pos, shapeId) => {
    const docRef = db.collection(CANVAS_OBJECTS_COLLECTION).doc(shapeId);
    batch.update(docRef, {
      x: pos.x,
      y: pos.y,
      lastUpdatedBy: userId,
      updatedAt: FieldValue.serverTimestamp(),
    });
  });

  await batch.commit();

  return {
    success: true,
    message: `Aligned ${targetShapes.length} shapes (${alignType})`,
  };
}

// PR #24: Query Operations

/**
 * Count shapes by criteria
 */
export function countShapesByType(
  canvasObjects: CanvasObject[],
  type?: ShapeType
) {
  if (type) {
    return {
      success: true,
      count: countShapes(canvasObjects, { type }),
      message: `Found ${countShapes(canvasObjects, { type })} ${type}(s)`,
    };
  }

  const byType = {
    rectangle: countShapes(canvasObjects, { type: "rectangle" }),
    circle: countShapes(canvasObjects, { type: "circle" }),
    text: countShapes(canvasObjects, { type: "text" }),
  };

  return {
    success: true,
    count: canvasObjects.length,
    byType,
    message: `Total: ${canvasObjects.length} shapes. Rectangles: ${byType.rectangle}, Circles: ${byType.circle}, Text: ${byType.text}`,
  };
}

/**
 * Find shapes by criteria
 */
export function findShapesByCriteria(
  canvasObjects: CanvasObject[],
  criteria: {
    type?: ShapeType;
    color?: string;
  }
) {
  let results = canvasObjects;

  if (criteria.type) {
    results = findShapesByType(results, criteria.type);
  }

  if (criteria.color) {
    const hexColor = parseColor(criteria.color);
    results = findShapesByColor(results, hexColor);
  }

  return {
    success: true,
    shapes: results.map((s) => ({
      id: s.id,
      type: s.type,
      x: s.x,
      y: s.y,
      width: s.width,
      height: s.height,
      color: s.color,
    })),
    count: results.length,
    message: `Found ${results.length} shape(s) matching criteria`,
  };
}

/**
 * Get canvas statistics
 */
export function getCanvasStatistics(canvasObjects: CanvasObject[]) {
  if (canvasObjects.length === 0) {
    return {
      success: true,
      totalShapes: 0,
      message: "Canvas is empty",
    };
  }

  const byType = {
    rectangle: countShapes(canvasObjects, { type: "rectangle" }),
    circle: countShapes(canvasObjects, { type: "circle" }),
    text: countShapes(canvasObjects, { type: "text" }),
  };

  const byColor: Record<string, number> = {};
  canvasObjects.forEach((obj) => {
    byColor[obj.color] = (byColor[obj.color] || 0) + 1;
  });

  // Find largest and smallest
  let largest = canvasObjects[0];
  let smallest = canvasObjects[0];
  let totalWidth = 0;
  let totalHeight = 0;

  canvasObjects.forEach((obj) => {
    const objArea = obj.width * obj.height;
    const largestArea = largest.width * largest.height;
    const smallestArea = smallest.width * smallest.height;

    if (objArea > largestArea) largest = obj;
    if (objArea < smallestArea) smallest = obj;

    totalWidth += obj.width;
    totalHeight += obj.height;
  });

  return {
    success: true,
    totalShapes: canvasObjects.length,
    byType,
    byColor,
    largestShape: {
      id: largest.id,
      type: largest.type,
      width: largest.width,
      height: largest.height,
    },
    smallestShape: {
      id: smallest.id,
      type: smallest.type,
      width: smallest.width,
      height: smallest.height,
    },
    averageSize: {
      width: Math.round(totalWidth / canvasObjects.length),
      height: Math.round(totalHeight / canvasObjects.length),
    },
    message: `Canvas has ${canvasObjects.length} shapes`,
  };
}
