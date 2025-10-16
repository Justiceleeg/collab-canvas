// Custom hook to manage active lock state
// Simplifies lock acquisition and release logic
// PR #13 - Enhanced to support multiple active locks for multi-select

import { useRef, useCallback } from "react";
import { useLocking } from "./useLocking";

export function useActiveLock() {
  const { acquireLock, releaseLock, isLocked, getLockInfo } = useLocking();
  // PR #13 - Changed from single lock to Set of locks for multi-select
  const activeLocksRef = useRef<Set<string>>(new Set());

  // Acquire lock for a new object (adds to active locks set)
  const acquireActiveLock = useCallback(
    async (objectId: string) => {
      // Check if already locked by someone else
      if (isLocked(objectId)) {
        const lockInfo = getLockInfo(objectId);
        console.log(`Shape locked by ${lockInfo?.lockedByName}`);
        return { success: false, lockInfo };
      }

      // Skip if we already have this lock
      if (activeLocksRef.current.has(objectId)) {
        return { success: true };
      }

      // Try to acquire lock
      const result = await acquireLock(objectId);
      if (result.success) {
        activeLocksRef.current.add(objectId);
      } else {
        console.log(
          `Failed to acquire lock: ${result.lockedByName} is editing this shape`
        );
      }

      return result;
    },
    [acquireLock, isLocked, getLockInfo]
  );

  // Release all active locks
  const releaseActiveLock = useCallback(async () => {
    const lockIds = Array.from(activeLocksRef.current);
    // PR #13 - Use Promise.allSettled to continue even if some releases fail
    const releasePromises = lockIds.map((id) => releaseLock(id));
    await Promise.allSettled(releasePromises);
    activeLocksRef.current.clear();
  }, [releaseLock]);

  // Check if we have the active lock for an object
  const hasActiveLock = useCallback((objectId: string) => {
    return activeLocksRef.current.has(objectId);
  }, []);

  return {
    acquireActiveLock,
    releaseActiveLock,
    hasActiveLock,
    isLocked,
    getLockInfo,
  };
}
