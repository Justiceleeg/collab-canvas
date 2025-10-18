// AI Agent Service
// Handles AI command execution and canvas analysis

import type { CanvasObject, ShapeType } from "@/types/canvas.types";
import type { CanvasCommandService } from "./canvasCommands";
import type {
  CreateShapeCommand,
  MoveShapeCommand,
  ResizeShapeCommand,
  RotateShapeCommand,
  ArrangeGridCommand,
  DistributeCommand,
  AlignCommand,
  AICommandResult,
} from "@/types/ai.types";
import { parseColor } from "@/utils/colors";
import {
  findSelectedShapes,
  findBestMatch,
  countShapes,
  findShapesByType,
  findShapesByColor,
} from "@/utils/shapeQuery";
import {
  calculateGridPositions,
  calculateDistribution,
  calculateAlignment,
  getBoundingBox,
} from "@/utils/layout";

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

// PR #24: Layout Commands

/**
 * Execute an arrange grid command
 */
export async function executeArrangeGrid(
  command: ArrangeGridCommand,
  commandService: CanvasCommandService,
  objects: CanvasObject[],
  selectedIds: string[]
): Promise<AICommandResult> {
  try {
    // Determine which shapes to arrange
    let targetShapes: CanvasObject[] = [];

    if (command.shapeIds && command.shapeIds.length > 0) {
      targetShapes = objects.filter((obj) =>
        command.shapeIds!.includes(obj.id)
      );
    } else if (selectedIds.length > 0) {
      targetShapes = findSelectedShapes(objects, selectedIds);
    } else {
      targetShapes = objects; // Arrange all shapes if none specified
    }

    if (targetShapes.length === 0) {
      return {
        success: false,
        message: "No shapes to arrange.",
      };
    }

    // Calculate grid positions
    const spacing = command.spacing ?? 50;
    const positions = calculateGridPositions(
      targetShapes,
      command.rows,
      command.cols,
      spacing
    );

    // Move each shape to its grid position
    for (const shape of targetShapes) {
      const newPos = positions.get(shape.id);
      if (newPos) {
        const delta = {
          x: newPos.x - shape.x,
          y: newPos.y - shape.y,
        };
        await commandService.moveShapes([shape.id], delta);
      }
    }

    return {
      success: true,
      message: `Arranged ${targetShapes.length} shapes in a ${command.rows}x${command.cols} grid`,
    };
  } catch (error) {
    console.error("Error arranging grid:", error);
    return {
      success: false,
      message: `Failed to arrange grid: ${error}`,
    };
  }
}

/**
 * Execute a distribute shapes command
 */
export async function executeDistributeShapes(
  command: DistributeCommand,
  commandService: CanvasCommandService,
  objects: CanvasObject[],
  selectedIds: string[]
): Promise<AICommandResult> {
  try {
    // Determine which shapes to distribute
    let targetShapes: CanvasObject[] = [];

    if (command.shapeIds && command.shapeIds.length > 0) {
      targetShapes = objects.filter((obj) =>
        command.shapeIds!.includes(obj.id)
      );
    } else if (selectedIds.length > 0) {
      targetShapes = findSelectedShapes(objects, selectedIds);
    }

    if (targetShapes.length < 2) {
      return {
        success: false,
        message: "Need at least 2 shapes to distribute.",
      };
    }

    // Calculate distribution positions
    const positions = calculateDistribution(
      targetShapes,
      command.direction,
      command.spacing
    );

    // Move each shape to its new position
    for (const shape of targetShapes) {
      const newPos = positions.get(shape.id);
      if (newPos) {
        const delta = {
          x: newPos.x - shape.x,
          y: newPos.y - shape.y,
        };
        await commandService.moveShapes([shape.id], delta);
      }
    }

    return {
      success: true,
      message: `Distributed ${targetShapes.length} shapes ${command.direction}ly`,
    };
  } catch (error) {
    console.error("Error distributing shapes:", error);
    return {
      success: false,
      message: `Failed to distribute shapes: ${error}`,
    };
  }
}

/**
 * Execute an align shapes command
 */
export async function executeAlignShapes(
  command: AlignCommand,
  commandService: CanvasCommandService,
  objects: CanvasObject[],
  selectedIds: string[]
): Promise<AICommandResult> {
  try {
    // Determine which shapes to align
    let targetShapes: CanvasObject[] = [];

    if (command.shapeIds && command.shapeIds.length > 0) {
      targetShapes = objects.filter((obj) =>
        command.shapeIds!.includes(obj.id)
      );
    } else if (selectedIds.length > 0) {
      targetShapes = findSelectedShapes(objects, selectedIds);
    }

    if (targetShapes.length < 2) {
      return {
        success: false,
        message: "Need at least 2 shapes to align.",
      };
    }

    // Calculate alignment positions
    const positions = calculateAlignment(targetShapes, command.alignType);

    // Move each shape to its aligned position
    for (const shape of targetShapes) {
      const newPos = positions.get(shape.id);
      if (newPos) {
        const delta = {
          x: newPos.x - shape.x,
          y: newPos.y - shape.y,
        };
        await commandService.moveShapes([shape.id], delta);
      }
    }

    return {
      success: true,
      message: `Aligned ${targetShapes.length} shapes (${command.alignType})`,
    };
  } catch (error) {
    console.error("Error aligning shapes:", error);
    return {
      success: false,
      message: `Failed to align shapes: ${error}`,
    };
  }
}

// PR #24: Query Functions

/**
 * Find shapes matching criteria
 */
export function findShapes(
  objects: CanvasObject[],
  criteria: {
    type?: ShapeType;
    color?: string;
    minWidth?: number;
    maxWidth?: number;
    minHeight?: number;
    maxHeight?: number;
  }
): CanvasObject[] {
  let results = objects;

  if (criteria.type) {
    results = findShapesByType(results, criteria.type);
  }

  if (criteria.color) {
    const hexColor = parseColor(criteria.color);
    results = findShapesByColor(results, hexColor);
  }

  if (criteria.minWidth !== undefined) {
    results = results.filter((obj) => obj.width >= criteria.minWidth!);
  }

  if (criteria.maxWidth !== undefined) {
    results = results.filter((obj) => obj.width <= criteria.maxWidth!);
  }

  if (criteria.minHeight !== undefined) {
    results = results.filter((obj) => obj.height >= criteria.minHeight!);
  }

  if (criteria.maxHeight !== undefined) {
    results = results.filter((obj) => obj.height <= criteria.maxHeight!);
  }

  return results;
}

/**
 * Get detailed canvas statistics
 */
export function getCanvasStats(objects: CanvasObject[]): {
  totalShapes: number;
  byType: Record<string, number>;
  byColor: Record<string, number>;
  largestShape?: { id: string; type: string; width: number; height: number };
  smallestShape?: { id: string; type: string; width: number; height: number };
  averageSize: { width: number; height: number };
} {
  if (objects.length === 0) {
    return {
      totalShapes: 0,
      byType: {},
      byColor: {},
      averageSize: { width: 0, height: 0 },
    };
  }

  const byType: Record<string, number> = {};
  const byColor: Record<string, number> = {};
  let largest = objects[0];
  let smallest = objects[0];
  let totalWidth = 0;
  let totalHeight = 0;

  objects.forEach((obj) => {
    // Count by type
    byType[obj.type] = (byType[obj.type] || 0) + 1;

    // Count by color
    byColor[obj.color] = (byColor[obj.color] || 0) + 1;

    // Find largest
    const objArea = obj.width * obj.height;
    const largestArea = largest.width * largest.height;
    if (objArea > largestArea) {
      largest = obj;
    }

    // Find smallest
    const smallestArea = smallest.width * smallest.height;
    if (objArea < smallestArea) {
      smallest = obj;
    }

    // Sum for average
    totalWidth += obj.width;
    totalHeight += obj.height;
  });

  return {
    totalShapes: objects.length,
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
      width: totalWidth / objects.length,
      height: totalHeight / objects.length,
    },
  };
}
