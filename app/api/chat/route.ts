import { openai } from "@ai-sdk/openai";
import { streamText, convertToModelMessages } from "ai";
import type { UIMessage } from "ai";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

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

You can answer questions about how to use the canvas and provide guidance. Be concise and helpful.`,
  });

  return result.toUIMessageStreamResponse();
}
