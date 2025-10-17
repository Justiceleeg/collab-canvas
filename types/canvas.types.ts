// PR #4 - Basic Canvas with Pan & Zoom
// Shape & canvas types

export type ShapeType = "rectangle" | "circle" | "text";

export interface CanvasObject {
  id: string;
  type: ShapeType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number; // degrees, default 0
  color: string; // hex color (fill color)
  strokeColor?: string; // border/stroke color (optional)
  strokeWidth?: number; // border/stroke width (optional, default 0)
  opacity?: number; // 0-1, default 1 (optional)
  text?: string; // only for text objects
  fontSize?: number; // only for text objects
  fontWeight?: string; // 'normal' | 'bold' (only for text)
  fontStyle?: string; // 'normal' | 'italic' (only for text)
  zIndex: number; // layer order
  lockedBy?: string | null; // user ID or null
  lockedAt?: any; // Firebase Timestamp or null
  lastUpdatedBy: string; // user ID
  updatedAt: any; // Firebase Timestamp
  createdAt: any; // Firebase Timestamp
}

export interface Viewport {
  x: number;
  y: number;
  scale: number;
}

export interface CanvasState {
  objects: CanvasObject[];
  viewport: Viewport;
}

export interface Shape extends CanvasObject {
  // Alias for CanvasObject for component usage
}
