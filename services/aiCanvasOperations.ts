// Server-side canvas operations for AI agent
// These functions write directly to Firestore and the client will sync automatically

import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { parseColor } from "@/utils/colors";
import { AI } from "@/utils/constants";
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

/**
 * Fetch all canvas objects from Firestore
 * Used to refresh state after mutations so AI can see its own changes
 */
export async function fetchAllCanvasObjects(): Promise<CanvasObject[]> {
  const db = ensureFirebaseAdmin();
  const snapshot = await db.collection(CANVAS_OBJECTS_COLLECTION).get();
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as CanvasObject[];
}

interface CreateShapeParams {
  type: ShapeType;
  count?: number;
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
  isDelta?: boolean;
}

interface ResizeShapeParams {
  shapeIds?: string[];
  width: number;
  height: number;
}

interface RotateShapeParams {
  shapeIds?: string[];
  rotation: number;
}

interface UpdateShapeParams {
  shapeIds?: string[];
  color?: string;
  strokeColor?: string;
  strokeWidth?: number;
  opacity?: number;
  text?: string;
  fontSize?: number;
  fontWeight?: "normal" | "bold";
  fontStyle?: "normal" | "italic";
}

interface DeleteShapeParams {
  shapeIds?: string[];
  type?: ShapeType;
  color?: string;
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
 * Create one or more shapes in Firestore
 */
export async function createShape(
  params: CreateShapeParams,
  userId: string = "ai-agent"
) {
  const {
    type,
    count = 1,
    x = AI.DEFAULT_SHAPE_X,
    y = AI.DEFAULT_SHAPE_Y,
    width,
    height,
    color,
    text,
  } = params;

  // Validate count
  if (count < AI.MIN_SHAPES_PER_BATCH || count > AI.MAX_SHAPES_PER_BATCH) {
    return {
      success: false,
      message: `Count must be between ${AI.MIN_SHAPES_PER_BATCH} and ${AI.MAX_SHAPES_PER_BATCH}`,
    };
  }

  const defaultSizes = AI.DEFAULT_SIZES;

  const size = defaultSizes[type];
  const parsedColor = color ? parseColor(color) : "#3B82F6";
  const shapeWidth = width || size.width;
  const shapeHeight = height || size.height;

  const db = ensureFirebaseAdmin();

  // Single shape creation (original behavior)
  if (count === 1) {
    const shapeData = {
      type,
      x,
      y,
      width: shapeWidth,
      height: shapeHeight,
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

    const docRef = await db
      .collection(CANVAS_OBJECTS_COLLECTION)
      .add(shapeData);

    return {
      success: true,
      message: `Created ${type}${color ? ` with color ${color}` : ""}`,
      shapeId: docRef.id,
    };
  }

  // Batch creation for multiple shapes
  const batch = db.batch();
  const createdIds: string[] = [];
  const baseZIndex = Date.now();

  // Calculate grid layout
  const columnsPerRow = AI.BATCH_GRID_COLUMNS;
  const offsetX = AI.BATCH_GRID_OFFSET_X;
  const offsetY = AI.BATCH_GRID_OFFSET_Y;

  for (let i = 0; i < count; i++) {
    const col = i % columnsPerRow;
    const row = Math.floor(i / columnsPerRow);

    const shapeX = x + col * offsetX;
    const shapeY = y + row * offsetY;

    const shapeData = {
      type,
      x: shapeX,
      y: shapeY,
      width: shapeWidth,
      height: shapeHeight,
      rotation: 0,
      color: parsedColor,
      strokeColor: "#000000",
      strokeWidth: 2,
      opacity: 1,
      ...(type === "text" && {
        text: text || `Text ${i + 1}`,
        fontSize: 24,
        fontWeight: "normal",
        fontStyle: "normal",
      }),
      zIndex: baseZIndex + i,
      lockedBy: null,
      lockedAt: null,
      lastUpdatedBy: userId,
      updatedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
    };

    const docRef = db.collection(CANVAS_OBJECTS_COLLECTION).doc();
    batch.set(docRef, shapeData);
    createdIds.push(docRef.id);
  }

  await batch.commit();

  return {
    success: true,
    message: `Created ${count} ${type}${count > 1 ? "s" : ""}${
      color ? ` with color ${color}` : ""
    }`,
    shapeIds: createdIds,
    count,
  };
}

/**
 * Move shape(s) to a new position or by an offset
 */
export async function moveShape(
  params: MoveShapeParams,
  canvasObjects: CanvasObject[],
  selectedIds: string[],
  userId: string = "ai-agent"
) {
  const { shapeId, x, y, isDelta = false } = params;

  // Determine which shapes to move
  let targetIds: string[] = [];
  if (shapeId) {
    targetIds = [shapeId];
  } else if (selectedIds.length > 0) {
    targetIds = selectedIds;
  }

  if (targetIds.length === 0) {
    return {
      success: false,
      message:
        "No shape selected or specified. Please select a shape first, or provide a shape ID.",
    };
  }

  const db = ensureFirebaseAdmin();

  try {
    // For delta movement, we need current positions
    if (isDelta) {
      const batch = db.batch();
      let movedCount = 0;

      for (const id of targetIds) {
        const shape = canvasObjects.find((obj) => obj.id === id);
        if (shape) {
          const docRef = db.collection(CANVAS_OBJECTS_COLLECTION).doc(id);
          batch.update(docRef, {
            x: shape.x + x,
            y: shape.y + y,
            lastUpdatedBy: userId,
            updatedAt: FieldValue.serverTimestamp(),
          });
          movedCount++;
        }
      }

      if (movedCount === 0) {
        return {
          success: false,
          message: "No shapes found to move.",
        };
      }

      await batch.commit();

      return {
        success: true,
        message: `Moved ${movedCount} shape${
          movedCount > 1 ? "s" : ""
        } by offset (${x}, ${y})`,
      };
    }

    // Absolute positioning - move all shapes to same location
    const batch = db.batch();

    for (const id of targetIds) {
      const docRef = db.collection(CANVAS_OBJECTS_COLLECTION).doc(id);
      batch.update(docRef, {
        x,
        y,
        lastUpdatedBy: userId,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    await batch.commit();

    return {
      success: true,
      message: `Moved ${targetIds.length} shape${
        targetIds.length > 1 ? "s" : ""
      } to (${x}, ${y})`,
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
 * Resize one or more shapes
 */
export async function resizeShape(
  params: ResizeShapeParams,
  selectedIds: string[],
  userId: string = "ai-agent"
) {
  const { shapeIds, width, height } = params;

  // Determine which shapes to resize
  let targetIds: string[] = [];
  if (shapeIds && shapeIds.length > 0) {
    targetIds = shapeIds;
  } else if (selectedIds.length > 0) {
    targetIds = selectedIds;
  }

  if (targetIds.length === 0) {
    return {
      success: false,
      message:
        "No shape to resize. Please select exactly one shape, or specify a shapeId parameter.",
    };
  }

  const db = ensureFirebaseAdmin();
  const batch = db.batch();

  for (const id of targetIds) {
    const docRef = db.collection(CANVAS_OBJECTS_COLLECTION).doc(id);
    batch.update(docRef, {
      width,
      height,
      lastUpdatedBy: userId,
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  await batch.commit();

  return {
    success: true,
    message: `Resized ${targetIds.length} shape${
      targetIds.length > 1 ? "s" : ""
    } to ${width}x${height}`,
  };
}

/**
 * Rotate one or more shapes
 */
export async function rotateShape(
  params: RotateShapeParams,
  selectedIds: string[],
  userId: string = "ai-agent"
) {
  const { shapeIds, rotation } = params;

  // Determine which shapes to rotate
  let targetIds: string[] = [];
  if (shapeIds && shapeIds.length > 0) {
    targetIds = shapeIds;
  } else if (selectedIds.length > 0) {
    targetIds = selectedIds;
  }

  if (targetIds.length === 0) {
    return {
      success: false,
      message:
        "No shape to rotate. Please select exactly one shape, or specify a shapeId parameter.",
    };
  }

  const db = ensureFirebaseAdmin();
  const batch = db.batch();

  for (const id of targetIds) {
    const docRef = db.collection(CANVAS_OBJECTS_COLLECTION).doc(id);
    batch.update(docRef, {
      rotation,
      lastUpdatedBy: userId,
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  await batch.commit();

  return {
    success: true,
    message: `Rotated ${targetIds.length} shape${
      targetIds.length > 1 ? "s" : ""
    } to ${rotation} degrees`,
  };
}

/**
 * Update shape properties (color, stroke, opacity, text, etc.)
 */
export async function updateShape(
  params: UpdateShapeParams,
  selectedIds: string[],
  userId: string = "ai-agent"
) {
  const {
    shapeIds,
    color,
    strokeColor,
    strokeWidth,
    opacity,
    text,
    fontSize,
    fontWeight,
    fontStyle,
  } = params;

  // Determine which shapes to update
  let targetIds: string[] = [];
  if (shapeIds && shapeIds.length > 0) {
    targetIds = shapeIds;
  } else if (selectedIds.length > 0) {
    targetIds = selectedIds;
  }

  if (targetIds.length === 0) {
    return {
      success: false,
      message:
        "No shape to update. Please select a shape first, or specify shapeIds parameter.",
    };
  }

  // Build update object with only the provided properties
  const updateData: Record<string, any> = {
    lastUpdatedBy: userId,
    updatedAt: FieldValue.serverTimestamp(),
  };

  // Map of properties that need color parsing
  const colorProps = { color, strokeColor };
  for (const [key, value] of Object.entries(colorProps)) {
    if (value !== undefined) {
      updateData[key] = parseColor(value);
    }
  }

  // Direct property mappings
  const directProps = {
    strokeWidth,
    opacity,
    text,
    fontSize,
    fontWeight,
    fontStyle,
  };
  for (const [key, value] of Object.entries(directProps)) {
    if (value !== undefined) {
      updateData[key] = value;
    }
  }

  const db = ensureFirebaseAdmin();
  const batch = db.batch();

  for (const id of targetIds) {
    const docRef = db.collection(CANVAS_OBJECTS_COLLECTION).doc(id);
    batch.update(docRef, updateData);
  }

  await batch.commit();

  // Build descriptive message
  const changedProps: string[] = [];
  if (color) changedProps.push(`color to ${color}`);
  if (strokeColor) changedProps.push(`stroke color to ${strokeColor}`);
  if (strokeWidth !== undefined)
    changedProps.push(`stroke width to ${strokeWidth}px`);
  if (opacity !== undefined) changedProps.push(`opacity to ${opacity}`);
  if (text) changedProps.push(`text to "${text}"`);
  if (fontSize) changedProps.push(`font size to ${fontSize}px`);
  if (fontWeight) changedProps.push(`font weight to ${fontWeight}`);
  if (fontStyle) changedProps.push(`font style to ${fontStyle}`);

  return {
    success: true,
    message: `Updated ${targetIds.length} shape${
      targetIds.length > 1 ? "s" : ""
    }: ${changedProps.join(", ")}`,
  };
}

/**
 * Delete shapes by IDs, selection, or criteria (type, color)
 */
export async function deleteShape(
  params: DeleteShapeParams,
  canvasObjects: CanvasObject[],
  selectedIds: string[],
  userId: string = "ai-agent"
) {
  const { shapeIds, type, color } = params;

  // Determine which shapes to delete
  let targetIds: string[] = [];

  // Priority 1: Specific shape IDs
  if (shapeIds && shapeIds.length > 0) {
    targetIds = shapeIds;
  }
  // Priority 2: Filter by criteria (type and/or color)
  else if (type || color) {
    let filtered = canvasObjects;

    if (type) {
      filtered = findShapesByType(filtered, type);
    }

    if (color) {
      const hexColor = parseColor(color);
      filtered = findShapesByColor(filtered, hexColor);
    }

    targetIds = filtered.map((shape) => shape.id);
  }
  // Priority 3: Selected shapes
  else if (selectedIds.length > 0) {
    targetIds = selectedIds;
  }

  if (targetIds.length === 0) {
    return {
      success: false,
      message:
        "No shapes to delete. Select shapes or provide shapeIds parameter.",
    };
  }

  const db = ensureFirebaseAdmin();
  const batch = db.batch();

  // Delete each shape
  targetIds.forEach((id) => {
    const docRef = db.collection(CANVAS_OBJECTS_COLLECTION).doc(id);
    batch.delete(docRef);
  });

  await batch.commit();

  // Build descriptive message
  let message = `Deleted ${targetIds.length} shape${
    targetIds.length > 1 ? "s" : ""
  }`;
  if (type && color) {
    message += ` (${type}s with color ${color})`;
  } else if (type) {
    message += ` (all ${type}s)`;
  } else if (color) {
    message += ` (all shapes with color ${color})`;
  }

  return {
    success: true,
    message,
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
  const { shapeIds, rows, cols, spacing = AI.DEFAULT_SPACING } = params;

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
      message: `No shapes to arrange. The canvas has ${canvasObjects.length} shape(s) total.`,
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
      message: `Need at least 2 shapes to distribute. Currently have ${targetShapes.length} shape(s) selected. The canvas has ${canvasObjects.length} total shapes.`,
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
      message: `Need at least 2 shapes to align. Currently have ${targetShapes.length} shape(s) selected. The canvas has ${canvasObjects.length} total shapes.`,
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
