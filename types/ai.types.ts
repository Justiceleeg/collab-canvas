// AI Canvas Agent Types
// Types for AI chat messages and commands

export interface AIMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
}

// PR #23: Command Execution Types

export interface CreateShapeCommand {
  type: "rectangle" | "circle" | "text";
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  color?: string;
  text?: string;
}

export interface MoveShapeCommand {
  shapeId?: string;
  x: number;
  y: number;
}

export interface ResizeShapeCommand {
  shapeId?: string;
  width: number;
  height: number;
}

export interface RotateShapeCommand {
  shapeId?: string;
  rotation: number;
}

export interface AICommandResult {
  success: boolean;
  message: string;
  data?: unknown;
}
