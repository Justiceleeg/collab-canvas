import { openai } from "@ai-sdk/openai";
import { streamText, convertToModelMessages, tool, stepCountIs } from "ai";
import type { UIMessage } from "ai";
import { z } from "zod";
import { AI } from "@/utils/constants";
import type { CanvasObject } from "@/types/canvas.types";
import {
  createShape,
  moveShape,
  resizeShape,
  rotateShape,
  deleteShape,
  arrangeGrid,
  distributeShapes,
  alignShapes,
  countShapesByType,
  findShapesByCriteria,
  getCanvasStatistics,
} from "@/services/aiCanvasOperations";
import { adminAuth } from "@/lib/firebase-admin";

// Allow streaming responses up to 30 seconds
// IMPORTANT: maxDuration must be a literal number, not a reference to a constant
// Next.js requires route segment config exports to be statically analyzable
// Using AI.MAX_STREAM_DURATION_SECONDS here will cause build errors
export const maxDuration = 30;

export async function POST(req: Request) {
  // Authenticate the request
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(
      "Unauthorized - Missing or invalid Authorization header",
      {
        status: 401,
      }
    );
  }

  // Verify Firebase ID token
  const idToken = authHeader.split("Bearer ")[1];
  let userId: string;

  try {
    if (!adminAuth) {
      return new Response(
        "Server configuration error - Firebase Admin not initialized",
        {
          status: 500,
        }
      );
    }

    const decodedToken = await adminAuth.verifyIdToken(idToken);
    userId = decodedToken.uid;
  } catch (error) {
    console.error("Token verification failed:", error);
    return new Response("Unauthorized - Invalid token", {
      status: 401,
    });
  }

  const {
    messages,
    canvasState,
  }: {
    messages: UIMessage[];
    canvasState?: { objects: unknown[]; selectedIds: string[] };
  } = await req.json();

  // Extract canvas state for server-side operations
  const selectedIds = canvasState?.selectedIds || [];
  const canvasObjects = (canvasState?.objects || []) as CanvasObject[];

  // Generate optimized canvas state summary
  const generateCanvasSummary = () => {
    if (!canvasState || canvasObjects.length === 0) {
      return "Canvas is empty.";
    }

    // Count shapes by type
    const typeCounts: Record<string, number> = {};
    const colorSet = new Set<string>();

    canvasObjects.forEach((obj) => {
      typeCounts[obj.type] = (typeCounts[obj.type] || 0) + 1;
      colorSet.add(obj.color);
    });

    const summary = [
      `Total: ${canvasObjects.length} shape(s)`,
      `By type: ${Object.entries(typeCounts)
        .map(([type, count]) => `${count} ${type}${count > 1 ? "s" : ""}`)
        .join(", ")}`,
      `Colors in use: ${Array.from(colorSet)
        .slice(0, AI.MAX_COLORS_IN_SUMMARY)
        .join(", ")}${
        colorSet.size > AI.MAX_COLORS_IN_SUMMARY
          ? ` and ${colorSet.size - AI.MAX_COLORS_IN_SUMMARY} more`
          : ""
      }`,
    ];

    // Include full details for selected shapes
    if (selectedIds.length > 0) {
      const selectedShapes = canvasObjects.filter((obj) =>
        selectedIds.includes(obj.id)
      );
      summary.push(`\nSelected shape(s) [${selectedIds.length}]:`);
      selectedShapes.forEach((shape) => {
        summary.push(
          `  - ${shape.type} (id: ${shape.id}): position (${shape.x}, ${
            shape.y
          }), size ${shape.width}x${shape.height}, color ${shape.color}${
            shape.type === "text" ? `, text: "${shape.text}"` : ""
          }`
        );
      });
    } else {
      summary.push("No shapes selected.");
    }

    return summary.join("\n");
  };

  // Enable multi-step tool calling with stopWhen
  // The AI SDK will automatically continue after tool calls until text is generated
  const result = streamText({
    model: openai("gpt-4o-mini"),
    messages: convertToModelMessages(messages),
    stopWhen: stepCountIs(AI.MAX_TOOL_CALLING_STEPS),
    system: `You are a helpful assistant for a collaborative canvas application.

The canvas allows users to:
- Create shapes (rectangles, circles, text)
- Move, resize, rotate, and delete shapes  
- Select multiple shapes
- Arrange shapes in layers
- Collaborate with other users in real-time

You can answer questions AND execute commands using the provided tools.

Canvas state:
${generateCanvasSummary()}

When executing commands:
- For colors, you can use names like "red", "blue", "dark green", etc.
- Coordinates are in pixels from the top-left
- If no position is specified for new shapes, place them at a sensible location

Batch operations:
- CREATE MULTIPLE: Use count parameter to create up to ${
      AI.MAX_SHAPES_PER_BATCH
    } shapes at once (e.g., count: 50)
  - Multiple shapes will be offset in a grid pattern (${
    AI.BATCH_GRID_COLUMNS
  } per row, ${AI.BATCH_GRID_OFFSET_X}px spacing)
  - All shapes will have the same color and size
- MOVE: Can move multiple selected shapes at once
  - Use isDelta: true to move by offset (e.g., "move 50px right" = x: 50, y: 0, isDelta: true)
  - Use isDelta: false for absolute position (e.g., "move to 500, 300" = x: 500, y: 300)
- RESIZE/ROTATE: Applies same size/rotation to all selected shapes
- DELETE: Can delete by shapeIds, selected shapes, OR by criteria
  - Delete by type: type: "circle" deletes all circles
  - Delete by color: color: "red" deletes all red shapes
  - Delete by both: type: "circle", color: "red" deletes all red circles

Layout commands:
- Use arrangeGrid to organize shapes in a grid pattern
- Use distributeShapes to evenly space shapes horizontally or vertically
- Use alignShapes to align shapes to a common edge or center

Query commands:
- Use countShapes to count shapes by type
- Use findShapes to find shapes matching criteria (type, color)
- Use getCanvasStats to get detailed statistics about the canvas

Be concise and helpful. 

IMPORTANT: Always respond after using a tool. When you execute a command or query:
- If successful: Describe what you found or what you did
- If failed: Explain the error and suggest how to fix it (e.g., "Please select a shape first" or "Create more shapes to distribute")

Never leave the user waiting - always provide a text response after using tools.`,
    tools: {
      createShape: tool({
        description: `Create one or more shapes (rectangle, circle, or text) on the canvas. Can create up to ${AI.MAX_SHAPES_PER_BATCH} shapes at once.`,
        inputSchema: z.object({
          type: z
            .enum(["rectangle", "circle", "text"])
            .describe("Type of shape to create"),
          count: z
            .number()
            .optional()
            .default(1)
            .describe(
              `Number of shapes to create (${AI.MIN_SHAPES_PER_BATCH}-${AI.MAX_SHAPES_PER_BATCH}, default: 1). Multiple shapes will be offset slightly from each other.`
            ),
          x: z
            .number()
            .optional()
            .describe(
              "X position (optional, will use default if not specified)"
            ),
          y: z
            .number()
            .optional()
            .describe(
              "Y position (optional, will use default if not specified)"
            ),
          width: z.number().optional().describe("Width in pixels (optional)"),
          height: z.number().optional().describe("Height in pixels (optional)"),
          color: z
            .string()
            .optional()
            .describe(
              "Color name or hex code (e.g., 'red', 'blue', '#FF0000')"
            ),
          text: z
            .string()
            .optional()
            .describe("Text content (only for text shapes)"),
        }),
        execute: async ({ type, count, x, y, width, height, color, text }) => {
          try {
            const result = await createShape(
              {
                type,
                count,
                x,
                y,
                width,
                height,
                color,
                text,
              },
              userId
            );
            return result;
          } catch (error) {
            return {
              success: false,
              message: `Failed to create shape: ${
                error instanceof Error ? error.message : String(error)
              }`,
            };
          }
        },
      }),
      moveShape: tool({
        description:
          "Move shape(s) to a new position or by an offset. Can move multiple selected shapes at once.",
        inputSchema: z.object({
          x: z.number().describe("X coordinate or offset"),
          y: z.number().describe("Y coordinate or offset"),
          isDelta: z
            .boolean()
            .optional()
            .default(false)
            .describe(
              "If true, x/y are offsets to add to current position (e.g., move 50px right). If false, x/y are absolute target position. Default: false"
            ),
          shapeId: z
            .string()
            .optional()
            .describe(
              "Specific shape ID (optional, uses selected if not provided)"
            ),
        }),
        execute: async ({ x, y, isDelta, shapeId }) => {
          try {
            const result = await moveShape(
              { x, y, isDelta, shapeId },
              canvasObjects,
              selectedIds,
              userId
            );
            return result;
          } catch (error) {
            return {
              success: false,
              message: `Failed to move shape: ${
                error instanceof Error ? error.message : String(error)
              }`,
            };
          }
        },
      }),
      resizeShape: tool({
        description:
          "Resize one or more shapes. Can resize all selected shapes to the same size.",
        inputSchema: z.object({
          width: z.number().describe("New width in pixels"),
          height: z.number().describe("New height in pixels"),
          shapeIds: z
            .array(z.string())
            .optional()
            .describe(
              "Specific shape IDs to resize (optional, uses selected if not provided)"
            ),
        }),
        execute: async ({ width, height, shapeIds }) => {
          try {
            const result = await resizeShape(
              { width, height, shapeIds },
              selectedIds,
              userId
            );
            return result;
          } catch (error) {
            return {
              success: false,
              message: `Failed to resize shape: ${
                error instanceof Error ? error.message : String(error)
              }`,
            };
          }
        },
      }),
      rotateShape: tool({
        description:
          "Rotate one or more shapes. Can rotate all selected shapes to the same angle.",
        inputSchema: z.object({
          rotation: z.number().describe("Rotation angle in degrees (0-360)"),
          shapeIds: z
            .array(z.string())
            .optional()
            .describe(
              "Specific shape IDs to rotate (optional, uses selected if not provided)"
            ),
        }),
        execute: async ({ rotation, shapeIds }) => {
          try {
            const result = await rotateShape(
              { rotation, shapeIds },
              selectedIds,
              userId
            );
            return result;
          } catch (error) {
            return {
              success: false,
              message: `Failed to rotate shape: ${
                error instanceof Error ? error.message : String(error)
              }`,
            };
          }
        },
      }),
      deleteShape: tool({
        description:
          "Delete shapes from the canvas. Can delete specific shapes, selected shapes, or shapes matching criteria (type, color)",
        inputSchema: z.object({
          shapeIds: z
            .array(z.string())
            .optional()
            .describe(
              "Specific shape IDs to delete (optional, uses selected if not provided)"
            ),
          type: z
            .enum(["rectangle", "circle", "text"])
            .optional()
            .describe(
              "Delete all shapes of this type (e.g., 'circle' to delete all circles)"
            ),
          color: z
            .string()
            .optional()
            .describe(
              "Delete all shapes of this color (e.g., 'red', '#FF0000')"
            ),
        }),
        execute: async ({ shapeIds, type, color }) => {
          try {
            const result = await deleteShape(
              { shapeIds, type, color },
              canvasObjects,
              selectedIds,
              userId
            );
            return result;
          } catch (error) {
            return {
              success: false,
              message: `Failed to delete shape: ${
                error instanceof Error ? error.message : String(error)
              }`,
            };
          }
        },
      }),
      // PR #24: Layout Tools
      arrangeGrid: tool({
        description: "Arrange shapes in a grid pattern",
        inputSchema: z.object({
          rows: z.number().describe("Number of rows in the grid"),
          cols: z.number().describe("Number of columns in the grid"),
          spacing: z
            .number()
            .optional()
            .describe(
              `Spacing between shapes in pixels (default: ${AI.DEFAULT_SPACING})`
            ),
          shapeIds: z
            .array(z.string())
            .optional()
            .describe(
              "Specific shape IDs to arrange (optional, uses selected or all shapes if not provided)"
            ),
        }),
        execute: async ({ rows, cols, spacing, shapeIds }) => {
          try {
            const result = await arrangeGrid(
              { rows, cols, spacing, shapeIds },
              canvasObjects,
              selectedIds,
              userId
            );
            return result;
          } catch (error) {
            return {
              success: false,
              message: `Failed to arrange grid: ${
                error instanceof Error ? error.message : String(error)
              }`,
            };
          }
        },
      }),
      distributeShapes: tool({
        description: "Distribute shapes evenly with equal spacing",
        inputSchema: z.object({
          direction: z
            .enum(["horizontal", "vertical"])
            .describe("Direction to distribute shapes"),
          spacing: z
            .number()
            .optional()
            .describe(
              "Fixed spacing between shapes in pixels (optional, will distribute evenly if not provided)"
            ),
          shapeIds: z
            .array(z.string())
            .optional()
            .describe(
              "Specific shape IDs to distribute (optional, uses selected shapes if not provided)"
            ),
        }),
        execute: async ({ direction, spacing, shapeIds }) => {
          try {
            const result = await distributeShapes(
              { direction, spacing, shapeIds },
              canvasObjects,
              selectedIds,
              userId
            );
            return result;
          } catch (error) {
            return {
              success: false,
              message: `Failed to distribute shapes: ${
                error instanceof Error ? error.message : String(error)
              }`,
            };
          }
        },
      }),
      alignShapes: tool({
        description: "Align shapes to a common edge or center",
        inputSchema: z.object({
          alignType: z
            .enum([
              "left",
              "right",
              "top",
              "bottom",
              "center-horizontal",
              "center-vertical",
            ])
            .describe("Type of alignment"),
          shapeIds: z
            .array(z.string())
            .optional()
            .describe(
              "Specific shape IDs to align (optional, uses selected shapes if not provided)"
            ),
        }),
        execute: async ({ alignType, shapeIds }) => {
          try {
            const result = await alignShapes(
              { alignType, shapeIds },
              canvasObjects,
              selectedIds,
              userId
            );
            return result;
          } catch (error) {
            return {
              success: false,
              message: `Failed to align shapes: ${
                error instanceof Error ? error.message : String(error)
              }`,
            };
          }
        },
      }),
      // PR #24: Query Tools
      countShapes: tool({
        description:
          "Count shapes on the canvas by type. After calling this tool, you MUST tell the user the count.",
        inputSchema: z.object({
          type: z
            .enum(["rectangle", "circle", "text"])
            .optional()
            .describe(
              "Type of shape to count (optional, counts all types if not provided)"
            ),
        }),
        execute: async ({ type }) => {
          try {
            const result = countShapesByType(canvasObjects, type);
            return result;
          } catch (error) {
            return {
              success: false,
              message: `Failed to count shapes: ${
                error instanceof Error ? error.message : String(error)
              }`,
            };
          }
        },
      }),
      findShapes: tool({
        description:
          "Find shapes matching specific criteria. After calling this tool, you MUST describe what you found to the user.",
        inputSchema: z.object({
          type: z
            .enum(["rectangle", "circle", "text"])
            .optional()
            .describe("Type of shape to find (optional)"),
          color: z
            .string()
            .optional()
            .describe(
              "Color name or hex code to match (e.g., 'red', '#FF0000', optional)"
            ),
        }),
        execute: async ({ type, color }) => {
          try {
            const result = findShapesByCriteria(canvasObjects, {
              type,
              color,
            });
            return result;
          } catch (error) {
            return {
              success: false,
              message: `Failed to find shapes: ${
                error instanceof Error ? error.message : String(error)
              }`,
            };
          }
        },
      }),
      getCanvasStats: tool({
        description:
          "Get detailed statistics about the canvas (total shapes, breakdown by type/color, largest/smallest shapes, etc.). After calling this tool, you MUST summarize the statistics for the user.",
        inputSchema: z.object({}),
        execute: async () => {
          try {
            const result = getCanvasStatistics(canvasObjects);
            return result;
          } catch (error) {
            return {
              success: false,
              message: `Failed to get canvas statistics: ${
                error instanceof Error ? error.message : String(error)
              }`,
            };
          }
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
