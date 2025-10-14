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
  color: string; // hex color
  text?: string; // only for text objects
  fontSize?: number; // only for text objects
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
