// PR #8 - Object-Level Locking System
// Lock timeout & cleanup utilities
// Strategy 3: Timestamp-based expiry with no polling

import { LOCK_TIMEOUT_MS } from "@/types/lock.types";
import { CanvasObject } from "@/types/canvas.types";

export const lockManager = {
  /**
   * Check if a lock is stale (older than LOCK_TIMEOUT_MS)
   */
  isLockStale(lockedAt: number | null | undefined): boolean {
    if (!lockedAt) return true; // No lock timestamp = consider stale

    const now = Date.now();
    const lockAge = now - lockedAt;

    return lockAge > LOCK_TIMEOUT_MS;
  },

  /**
   * Check if an object is effectively locked
   * Returns false if lock is stale or doesn't exist
   */
  isObjectLocked(object: CanvasObject, currentUserId: string): boolean {
    // No lock data = not locked
    if (!object.lockedBy || !object.lockedAt) {
      return false;
    }

    // Locked by current user = not locked for them
    if (object.lockedBy === currentUserId) {
      return false;
    }

    // Check if lock is stale
    if (this.isLockStale(object.lockedAt)) {
      return false; // Stale lock = effectively unlocked
    }

    // Valid lock by another user
    return true;
  },

  /**
   * Get the age of a lock in milliseconds
   */
  getLockAge(lockedAt: number | null | undefined): number {
    if (!lockedAt) return Infinity;
    return Date.now() - lockedAt;
  },

  /**
   * Check if a lock can be acquired (unlocked or stale)
   */
  canAcquireLock(object: CanvasObject, userId: string): boolean {
    return !this.isObjectLocked(object, userId);
  },
};
