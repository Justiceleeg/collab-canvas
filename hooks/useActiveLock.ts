// Custom hook to manage active lock state
// Simplifies lock acquisition and release logic

import { useRef, useCallback } from "react";
import { useLocking } from "./useLocking";

export function useActiveLock() {
  const { acquireLock, releaseLock, isLocked, getLockInfo } = useLocking();
  const activeLockRef = useRef<string | null>(null);

  // Acquire lock for a new object (releases previous if different)
  const acquireActiveLock = useCallback(
    async (objectId: string) => {
      // If switching to a different shape, release previous lock
      if (activeLockRef.current && activeLockRef.current !== objectId) {
        await releaseLock(activeLockRef.current);
        activeLockRef.current = null;
      }

      // Check if already locked by someone else
      if (isLocked(objectId)) {
        const lockInfo = getLockInfo(objectId);
        console.log(`Shape locked by ${lockInfo?.lockedByName}`);
        return { success: false, lockInfo };
      }

      // Try to acquire lock
      const result = await acquireLock(objectId);
      if (result.success) {
        activeLockRef.current = objectId;
      } else {
        console.log(
          `Failed to acquire lock: ${result.lockedByName} is editing this shape`
        );
      }

      return result;
    },
    [acquireLock, releaseLock, isLocked, getLockInfo]
  );

  // Release the active lock
  const releaseActiveLock = useCallback(async () => {
    if (activeLockRef.current) {
      await releaseLock(activeLockRef.current);
      activeLockRef.current = null;
    }
  }, [releaseLock]);

  // Check if we have the active lock for an object
  const hasActiveLock = useCallback((objectId: string) => {
    return activeLockRef.current === objectId;
  }, []);

  return {
    acquireActiveLock,
    releaseActiveLock,
    hasActiveLock,
    isLocked,
    getLockInfo,
  };
}
