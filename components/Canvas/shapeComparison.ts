// Shared comparison utilities for React.memo shape components
// Prevents unnecessary re-renders by comparing only relevant props

import { CanvasObject } from "@/types/canvas.types";
import { LockInfo } from "./Shape";

/**
 * Compare two shapes for equality (for memo optimization)
 * Only compares visual properties that affect rendering
 */
export function areShapesEqual(
  prev: CanvasObject,
  next: CanvasObject
): boolean {
  // Fast path: if same reference, they're equal
  if (prev === next) return true;

  // Compare all visual properties
  return (
    prev.id === next.id &&
    prev.x === next.x &&
    prev.y === next.y &&
    prev.width === next.width &&
    prev.height === next.height &&
    prev.rotation === next.rotation &&
    prev.color === next.color &&
    prev.opacity === next.opacity &&
    prev.strokeColor === next.strokeColor &&
    prev.strokeWidth === next.strokeWidth &&
    prev.text === next.text &&
    prev.fontSize === next.fontSize &&
    prev.fontStyle === next.fontStyle &&
    prev.fontWeight === next.fontWeight
  );
}

/**
 * Compare lock info for equality
 */
export function areLockInfosEqual(
  prev: LockInfo | null | undefined,
  next: LockInfo | null | undefined
): boolean {
  // Both null/undefined
  if (!prev && !next) return true;
  // One is null/undefined, other isn't
  if (!prev || !next) return false;
  // Compare lockedBy (most important field for visual changes)
  return prev.lockedBy === next.lockedBy;
}

/**
 * Generic shape props comparison for React.memo
 */
export function compareShapeProps<
  T extends {
    shape: CanvasObject;
    isSelected?: boolean;
    isLocked?: boolean;
    lockInfo?: LockInfo | null;
    isEditing?: boolean;
  }
>(prevProps: T, nextProps: T): boolean {
  return (
    areShapesEqual(prevProps.shape, nextProps.shape) &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isLocked === nextProps.isLocked &&
    prevProps.isEditing === nextProps.isEditing &&
    areLockInfosEqual(prevProps.lockInfo, nextProps.lockInfo)
  );
}
