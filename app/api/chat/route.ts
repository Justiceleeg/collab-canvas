import { openai } from "@ai-sdk/openai";
import { streamText, convertToModelMessages, tool } from "ai";
import type { UIMessage } from "ai";
import { z } from "zod";
import {
  createShape,
  moveShape,
  resizeShape,
  rotateShape,
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

  // Extract selectedIds for server-side operations
  const selectedIds = canvasState?.selectedIds || [];

  const result = streamText({
    model: openai("gpt-4o-mini"),
    messages: convertToModelMessages(messages),
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
- Execute one command at a time

Be concise and helpful. When you execute a command, briefly confirm what you did.`,
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
          const result = await createShape({
            type,
            x,
            y,
            width,
            height,
            color,
            text,
          });
          // Return full result so AI can see and use the shapeId
          return result;
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
          const result = await moveShape({ x, y, shapeId }, selectedIds);
          return result;
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
          const result = await resizeShape(
            { width, height, shapeId },
            selectedIds
          );
          return result;
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
          const result = await rotateShape({ rotation, shapeId }, selectedIds);
          return result;
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
