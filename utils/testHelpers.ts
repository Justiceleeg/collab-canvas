// PR #5 - Testing utilities for Firestore sync
// Helper functions to test canvas functionality

import { CanvasObject } from "@/types/canvas.types";

/**
 * Generate a random color
 */
export function randomColor(): string {
  const colors = [
    "#FF6B6B", // Red
    "#4ECDC4", // Teal
    "#45B7D1", // Blue
    "#FFA07A", // Orange
    "#98D8C8", // Mint
    "#F7DC6F", // Yellow
    "#BB8FCE", // Purple
    "#85C1E2", // Sky Blue
    "#F8B739", // Gold
    "#52B788", // Green
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Generate test rectangle objects
 */
export function generateTestRectangles(
  count: number,
  userId: string
): Array<Omit<CanvasObject, "id" | "createdAt" | "updatedAt">> {
  const rectangles: Array<
    Omit<CanvasObject, "id" | "createdAt" | "updatedAt">
  > = [];

  for (let i = 0; i < count; i++) {
    rectangles.push({
      type: "rectangle",
      x: Math.random() * 800 + 100,
      y: Math.random() * 600 + 100,
      width: Math.random() * 100 + 50,
      height: Math.random() * 100 + 50,
      rotation: 0,
      color: randomColor(),
      zIndex: i,
      lastUpdatedBy: userId,
    });
  }

  return rectangles;
}

/**
 * Generate test circle objects
 */
export function generateTestCircles(
  count: number,
  userId: string
): Array<Omit<CanvasObject, "id" | "createdAt" | "updatedAt">> {
  const circles: Array<Omit<CanvasObject, "id" | "createdAt" | "updatedAt">> =
    [];

  for (let i = 0; i < count; i++) {
    const radius = Math.random() * 50 + 25;
    circles.push({
      type: "circle",
      x: Math.random() * 800 + 100,
      y: Math.random() * 600 + 100,
      width: radius * 2,
      height: radius * 2,
      rotation: 0,
      color: randomColor(),
      zIndex: i,
      lastUpdatedBy: userId,
    });
  }

  return circles;
}

/**
 * Generate test text objects
 */
export function generateTestTexts(
  count: number,
  userId: string
): Array<Omit<CanvasObject, "id" | "createdAt" | "updatedAt">> {
  const texts: Array<Omit<CanvasObject, "id" | "createdAt" | "updatedAt">> = [];
  const sampleTexts = [
    "Hello World",
    "Test Text",
    "Canvas Object",
    "Real-time Sync",
    "Collaboration",
    "Firestore",
    "Next.js",
    "TypeScript",
  ];

  for (let i = 0; i < count; i++) {
    texts.push({
      type: "text",
      x: Math.random() * 800 + 100,
      y: Math.random() * 600 + 100,
      width: 200,
      height: 50,
      rotation: 0,
      color: randomColor(),
      text: sampleTexts[i % sampleTexts.length],
      fontSize: 16 + Math.floor(Math.random() * 16),
      zIndex: i,
      lastUpdatedBy: userId,
    });
  }

  return texts;
}

/**
 * Generate mixed test objects
 */
export function generateMixedTestObjects(
  count: number,
  userId: string
): Array<Omit<CanvasObject, "id" | "createdAt" | "updatedAt">> {
  const objects: Array<Omit<CanvasObject, "id" | "createdAt" | "updatedAt">> =
    [];
  const types: ("rectangle" | "circle" | "text")[] = [
    "rectangle",
    "circle",
    "text",
  ];

  for (let i = 0; i < count; i++) {
    const type = types[Math.floor(Math.random() * types.length)];

    switch (type) {
      case "rectangle":
        objects.push({
          type: "rectangle",
          x: Math.random() * 800 + 100,
          y: Math.random() * 600 + 100,
          width: Math.random() * 100 + 50,
          height: Math.random() * 100 + 50,
          rotation: 0,
          color: randomColor(),
          zIndex: i,
          lastUpdatedBy: userId,
        });
        break;

      case "circle":
        const radius = Math.random() * 50 + 25;
        objects.push({
          type: "circle",
          x: Math.random() * 800 + 100,
          y: Math.random() * 600 + 100,
          width: radius * 2,
          height: radius * 2,
          rotation: 0,
          color: randomColor(),
          zIndex: i,
          lastUpdatedBy: userId,
        });
        break;

      case "text":
        objects.push({
          type: "text",
          x: Math.random() * 800 + 100,
          y: Math.random() * 600 + 100,
          width: 200,
          height: 50,
          rotation: 0,
          color: randomColor(),
          text: `Test ${i + 1}`,
          fontSize: 16 + Math.floor(Math.random() * 16),
          zIndex: i,
          lastUpdatedBy: userId,
        });
        break;
    }
  }

  return objects;
}

/**
 * Calculate performance metrics
 */
export interface PerformanceMetrics {
  fps: number;
  objectCount: number;
  avgRenderTime: number;
  lastSyncLatency: number;
}

let lastFrameTime = performance.now();
let frameCount = 0;
let fpsSum = 0;

export function measureFPS(): number {
  const now = performance.now();
  const delta = now - lastFrameTime;
  lastFrameTime = now;

  const fps = 1000 / delta;
  frameCount++;
  fpsSum += fps;

  return fps;
}

export function getAverageFPS(): number {
  if (frameCount === 0) return 0;
  return fpsSum / frameCount;
}

export function resetFPSMeasurement(): void {
  frameCount = 0;
  fpsSum = 0;
  lastFrameTime = performance.now();
}

/**
 * Measure sync latency
 */
export class SyncLatencyTracker {
  private startTimes: Map<string, number> = new Map();
  private latencies: number[] = [];

  startOperation(operationId: string): void {
    this.startTimes.set(operationId, performance.now());
  }

  endOperation(operationId: string): number {
    const startTime = this.startTimes.get(operationId);
    if (!startTime) return 0;

    const latency = performance.now() - startTime;
    this.latencies.push(latency);
    this.startTimes.delete(operationId);

    // Keep only last 100 measurements
    if (this.latencies.length > 100) {
      this.latencies.shift();
    }

    return latency;
  }

  getAverageLatency(): number {
    if (this.latencies.length === 0) return 0;
    return (
      this.latencies.reduce((sum, l) => sum + l, 0) / this.latencies.length
    );
  }

  getMaxLatency(): number {
    if (this.latencies.length === 0) return 0;
    return Math.max(...this.latencies);
  }

  getMinLatency(): number {
    if (this.latencies.length === 0) return 0;
    return Math.min(...this.latencies);
  }

  reset(): void {
    this.startTimes.clear();
    this.latencies = [];
  }
}
