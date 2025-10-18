// Server-side canvas operations for AI agent
// These functions write directly to Firestore and the client will sync automatically

import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { parseColor } from "@/utils/colors";
import type { ShapeType } from "@/types/canvas.types";

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
