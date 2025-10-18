// AI Agent Service
// Handles AI command execution and canvas analysis

import type { CanvasObject, ShapeType } from "@/types/canvas.types";
import type { CanvasCommandService } from "./canvasCommands";
import type {
  CreateShapeCommand,
  MoveShapeCommand,
  ResizeShapeCommand,
  RotateShapeCommand,
  AICommandResult,
} from "@/types/ai.types";
import { parseColor } from "@/utils/colors";
import {
  findSelectedShapes,
  findBestMatch,
  countShapes,
} from "@/utils/shapeQuery";

/**
 * Analyze the current canvas state and return a summary
 */
export function analyzeCanvas(objects: CanvasObject[]): {
  totalShapes: number;
  shapesByType: Record<string, number>;
  colors: string[];
} {
  const shapesByType: Record<string, number> = {
    rectangle: 0,
    circle: 0,
    text: 0,
  };

  const colorSet = new Set<string>();

  objects.forEach((obj) => {
    shapesByType[obj.type] = (shapesByType[obj.type] || 0) + 1;
    colorSet.add(obj.color);
  });

  return {
    totalShapes: objects.length,
    shapesByType,
    colors: Array.from(colorSet),
  };
}

/**
 * Execute a create shape command
 */
export async function executeCreateShape(
  command: CreateShapeCommand,
  commandService: CanvasCommandService
): Promise<AICommandResult> {
  try {
    // Parse color if provided
    const color = command.color ? parseColor(command.color) : undefined;

    // Default position (center of viewport if not specified)
    const x = command.x ?? 400;
    const y = command.y ?? 300;

    // Create shape data
    const shapeData: Partial<CanvasObject> = {
      type: command.type,
      x,
      y,
      width: command.width,
      height: command.height,
      color,
      ...(command.type === "text" && command.text
        ? { text: command.text }
        : {}),
    };

    // Use command service to create shape
    const newShape = await commandService.createShape(
      command.type as ShapeType,
      { x, y }
    );

    if (!newShape) {
      return {
        success: false,
        message: "Failed to create shape",
      };
    }

    // Update color if specified
    if (color && color !== newShape.color) {
      await commandService.changeColor([newShape.id], color);
    }

    // Update size if specified
    if (command.width || command.height) {
      await commandService.updateShapeProperties(newShape.id, {
        width: command.width || newShape.width,
        height: command.height || newShape.height,
      });
    }

    // Update text if specified
    if (command.type === "text" && command.text) {
      await commandService.updateText(newShape.id, command.text);
    }

    return {
      success: true,
      message: `Created ${command.type}${
        color ? ` with color ${command.color}` : ""
      }`,
      data: newShape,
    };
  } catch (error) {
    console.error("Error creating shape:", error);
    return {
      success: false,
      message: `Failed to create shape: ${error}`,
    };
  }
}

/**
 * Execute a move shape command
 */
export async function executeMoveShape(
  command: MoveShapeCommand,
  commandService: CanvasCommandService,
  objects: CanvasObject[],
  selectedIds: string[]
): Promise<AICommandResult> {
  try {
    // Determine which shapes to move
    let targetShapes: CanvasObject[] = [];

    if (command.shapeId) {
      const shape = objects.find((obj) => obj.id === command.shapeId);
      if (shape) targetShapes = [shape];
    } else if (selectedIds.length > 0) {
      targetShapes = findSelectedShapes(objects, selectedIds);
    }

    if (targetShapes.length === 0) {
      return {
        success: false,
        message: "No shapes to move. Please select a shape first.",
      };
    }

    // Calculate delta for move
    const firstShape = targetShapes[0];
    const delta = {
      x: command.x - firstShape.x,
      y: command.y - firstShape.y,
    };

    // Use command service to move shapes
    await commandService.moveShapes(
      targetShapes.map((s) => s.id),
      delta
    );

    return {
      success: true,
      message: `Moved ${targetShapes.length} shape${
        targetShapes.length > 1 ? "s" : ""
      } to (${command.x}, ${command.y})`,
    };
  } catch (error) {
    console.error("Error moving shape:", error);
    return {
      success: false,
      message: `Failed to move shape: ${error}`,
    };
  }
}

/**
 * Execute a resize shape command
 */
export async function executeResizeShape(
  command: ResizeShapeCommand,
  commandService: CanvasCommandService,
  objects: CanvasObject[],
  selectedIds: string[]
): Promise<AICommandResult> {
  try {
    // Determine which shape to resize
    let targetShape: CanvasObject | undefined;

    if (command.shapeId) {
      targetShape = objects.find((obj) => obj.id === command.shapeId);
    } else if (selectedIds.length === 1) {
      targetShape = objects.find((obj) => obj.id === selectedIds[0]);
    }

    if (!targetShape) {
      return {
        success: false,
        message: "No shape to resize. Please select a single shape first.",
      };
    }

    // Use command service to update shape properties
    await commandService.updateShapeProperties(targetShape.id, {
      width: command.width,
      height: command.height,
    });

    return {
      success: true,
      message: `Resized shape to ${command.width}x${command.height}`,
    };
  } catch (error) {
    console.error("Error resizing shape:", error);
    return {
      success: false,
      message: `Failed to resize shape: ${error}`,
    };
  }
}

/**
 * Execute a rotate shape command
 */
export async function executeRotateShape(
  command: RotateShapeCommand,
  commandService: CanvasCommandService,
  objects: CanvasObject[],
  selectedIds: string[]
): Promise<AICommandResult> {
  try {
    // Determine which shape to rotate
    let targetShape: CanvasObject | undefined;

    if (command.shapeId) {
      targetShape = objects.find((obj) => obj.id === command.shapeId);
    } else if (selectedIds.length === 1) {
      targetShape = objects.find((obj) => obj.id === selectedIds[0]);
    }

    if (!targetShape) {
      return {
        success: false,
        message: "No shape to rotate. Please select a single shape first.",
      };
    }

    // Use command service to update rotation
    await commandService.updateShapeProperties(targetShape.id, {
      rotation: command.rotation,
    });

    return {
      success: true,
      message: `Rotated shape to ${command.rotation}°`,
    };
  } catch (error) {
    console.error("Error rotating shape:", error);
    return {
      success: false,
      message: `Failed to rotate shape: ${error}`,
    };
  }
}
