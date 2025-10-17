// Custom hook to manage active lock state
// Simplifies lock acquisition and release logic
// PR #13 - Enhanced to support multiple active locks for multi-select

import { useRef, useCallback } from "react";
import { useLocking } from "./useLocking";

export function useActiveLock() {
  const {
    acquireLock,
    releaseLock,
    isLocked,
    getLockInfo,
    batchAcquireLocks,
    batchReleaseLocks,
  } = useLocking();
  // PR #13 - Changed from single lock to Set of locks for multi-select
  const activeLocksRef = useRef<Set<string>>(new Set());

  // Acquire lock for a new object (adds to active locks set)
  const acquireActiveLock = useCallback(
    async (objectId: string) => {
      // Check if already locked by someone else
      if (isLocked(objectId)) {
        const lockInfo = getLockInfo(objectId);
        console.warn(
          `[Lock] ✗ Shape already locked by ${lockInfo?.lockedByName}`
        );
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
        console.warn(
          `[Lock] ✗ Failed to acquire lock: ${result.lockedByName} is editing ${objectId}`
        );
      }

      return result;
    },
    [acquireLock, isLocked, getLockInfo]
  );

  // Batch acquire locks for multiple objects (optimized for multi-select)
  const batchAcquireActiveLocks = useCallback(
    async (objectIds: string[], forceReacquire: boolean = false) => {
      if (objectIds.length === 0) {
        return { successCount: 0, failedIds: [] };
      }

      // Determine which locks to acquire
      let idsToLock: string[];

      if (forceReacquire) {
        // Force re-acquire all locks to ensure they're in Firestore
        // This is important for critical operations like drag/transform start
        idsToLock = objectIds;
        console.log(
          `[Lock] Force re-acquiring locks for: ${objectIds.join(", ")}`
        );
      } else {
        // Filter out objects we already have locks for (optimization)
        idsToLock = objectIds.filter((id) => !activeLocksRef.current.has(id));

        if (idsToLock.length === 0) {
          return { successCount: objectIds.length, failedIds: [] };
        }
      }

      // Check if any are locked by others before attempting batch
      const lockedByOthers = idsToLock.filter((id) => isLocked(id));
      if (lockedByOthers.length > 0) {
        console.log(
          `[Lock] Some shapes are locked by others: ${lockedByOthers.join(
            ", "
          )}`
        );
      }

      // Try to acquire locks in batch
      console.log(
        `[Lock] Batch acquiring locks for ${idsToLock.length} shapes`
      );
      const results = await batchAcquireLocks(idsToLock);

      // Update active locks set with successful acquisitions
      const failedIds: string[] = [];
      let successCount = 0;

      results.forEach((result) => {
        if (result.success) {
          activeLocksRef.current.add(result.id);
          successCount++;
        } else {
          failedIds.push(result.id);
          console.warn(
            `[Lock] ✗ Failed to lock shape: ${result.id}, reason: ${result.reason}`
          );
        }
      });

      // Include objects we already had locks for in success count (if not force)
      if (!forceReacquire) {
        successCount += objectIds.length - idsToLock.length;
      }
      return { successCount, failedIds };
    },
    [batchAcquireLocks, isLocked]
  );

  // Release all active locks
  const releaseActiveLock = useCallback(async () => {
    const lockIds = Array.from(activeLocksRef.current);

    if (lockIds.length === 0) return;

    // Use batch release if available
    if (batchReleaseLocks && lockIds.length > 1) {
      try {
        await batchReleaseLocks(lockIds);
      } catch (error) {
        console.error(
          "Batch release failed, falling back to individual releases:",
          error
        );
        // Fallback to individual releases
        const releasePromises = lockIds.map((id) => releaseLock(id));
        await Promise.allSettled(releasePromises);
      }
    } else {
      // Single lock or no batch support - use individual release
      const releasePromises = lockIds.map((id) => releaseLock(id));
      await Promise.allSettled(releasePromises);
    }

    activeLocksRef.current.clear();
  }, [releaseLock, batchReleaseLocks]);

  // Check if we have the active lock for an object
  const hasActiveLock = useCallback((objectId: string) => {
    return activeLocksRef.current.has(objectId);
  }, []);

  return {
    acquireActiveLock,
    batchAcquireActiveLocks,
    releaseActiveLock,
    hasActiveLock,
    isLocked,
    getLockInfo,
  };
}
