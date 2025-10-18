import { openai } from "@ai-sdk/openai";
import { streamText, convertToModelMessages, tool, stepCountIs } from "ai";
import type { UIMessage } from "ai";
import { z } from "zod";
import type { CanvasObject } from "@/types/canvas.types";
import {
  createShape,
  moveShape,
  resizeShape,
  rotateShape,
  arrangeGrid,
  distributeShapes,
  alignShapes,
  countShapesByType,
  findShapesByCriteria,
  getCanvasStatistics,
} from "@/services/aiCanvasOperations";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
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

  // Enable multi-step tool calling with stopWhen
  // The AI SDK will automatically continue after tool calls until text is generated
  const result = streamText({
    model: openai("gpt-4o-mini"),
    messages: convertToModelMessages(messages),
    stopWhen: stepCountIs(5), // Allow up to 5 steps for tool calls + text generation
    system: `You are a helpful assistant for a collaborative canvas application.

The canvas allows users to:
- Create shapes (rectangles, circles, text)
- Move, resize, and rotate shapes  
- Select multiple shapes
- Arrange shapes in layers
- Collaborate with other users in real-time

You can answer questions AND execute commands using the provided tools.

Canvas state: ${
      canvasState
        ? `${canvasState.objects.length} shapes on canvas. ${
            canvasState.selectedIds.length > 0
              ? `Selected shape IDs: ${canvasState.selectedIds.join(", ")}`
              : "No shapes selected"
          }`
        : "unknown"
    }

${
  canvasState && canvasState.objects.length > 0
    ? `Current shapes:\n${JSON.stringify(canvasState.objects, null, 2)}`
    : ""
}

When executing commands:
- For colors, you can use names like "red", "blue", "dark green", etc.
- Coordinates are in pixels from the top-left
- If no position is specified for new shapes, place them at a sensible location
- When moving/resizing/rotating, if no shape is specified, operate on the most recently created or selected shape
- IMPORTANT: moveShape uses ABSOLUTE coordinates, not relative offsets
  - For "move it 10 pixels right", you must calculate the new absolute position (current_x + 10, current_y)
  - For "move it to 500, 300", use those coordinates directly

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
        description:
          "Create a new shape (rectangle, circle, or text) on the canvas",
        inputSchema: z.object({
          type: z
            .enum(["rectangle", "circle", "text"])
            .describe("Type of shape to create"),
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
        execute: async ({ type, x, y, width, height, color, text }) => {
          try {
            const result = await createShape({
              type,
              x,
              y,
              width,
              height,
              color,
              text,
            });
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
        description: "Move a shape or selected shapes to a new position",
        inputSchema: z.object({
          x: z.number().describe("Target X position"),
          y: z.number().describe("Target Y position"),
          shapeId: z
            .string()
            .optional()
            .describe(
              "Specific shape ID (optional, uses selected if not provided)"
            ),
        }),
        execute: async ({ x, y, shapeId }) => {
          try {
            const result = await moveShape({ x, y, shapeId }, selectedIds);
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
        description: "Resize a shape or the selected shape",
        inputSchema: z.object({
          width: z.number().describe("New width in pixels"),
          height: z.number().describe("New height in pixels"),
          shapeId: z
            .string()
            .optional()
            .describe(
              "Specific shape ID (optional, uses selected if not provided)"
            ),
        }),
        execute: async ({ width, height, shapeId }) => {
          try {
            const result = await resizeShape(
              { width, height, shapeId },
              selectedIds
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
        description: "Rotate a shape or the selected shape",
        inputSchema: z.object({
          rotation: z.number().describe("Rotation angle in degrees (0-360)"),
          shapeId: z
            .string()
            .optional()
            .describe(
              "Specific shape ID (optional, uses selected if not provided)"
            ),
        }),
        execute: async ({ rotation, shapeId }) => {
          try {
            const result = await rotateShape(
              { rotation, shapeId },
              selectedIds
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
      // PR #24: Layout Tools
      arrangeGrid: tool({
        description: "Arrange shapes in a grid pattern",
        inputSchema: z.object({
          rows: z.number().describe("Number of rows in the grid"),
          cols: z.number().describe("Number of columns in the grid"),
          spacing: z
            .number()
            .optional()
            .describe("Spacing between shapes in pixels (default: 50)"),
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
              selectedIds
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
              selectedIds
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
              selectedIds
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
