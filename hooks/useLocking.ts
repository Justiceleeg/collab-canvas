// PR #8 - Object-Level Locking System
// Object locking hook (Strategy 3: Interaction Lock)
// - Acquire lock on mousedown/dragstart
// - Release lock on mouseup/dragend
// - No heartbeat/polling needed

import { useCallback, useMemo, useRef, useEffect } from "react";
import { db } from "@/services/firebase";
import { doc, runTransaction, updateDoc } from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import { useCanvasStore } from "@/store/canvasStore";
import { lockManager } from "@/utils/lockManager";
import { LockResult } from "@/types/lock.types";
import { usePresence } from "@/hooks/usePresence";
import { firestoreService } from "@/services/firestore.service";

export function useLocking() {
  const { user } = useAuth();
  // Use selective selector to avoid unnecessary re-renders
  const getObjectById = useCanvasStore((state) => state.getObjectById);
  const { onlineUsers } = usePresence();

  // Use ref to access latest onlineUsers without causing re-memoization
  // onlineUsers updates on every cursor movement, which would otherwise
  // recreate all callbacks and break memoization chain
  const onlineUsersRef = useRef(onlineUsers);

  useEffect(() => {
    onlineUsersRef.current = onlineUsers;
  }, [onlineUsers]);

  /**
   * Acquire lock on an object using Firestore transaction
   * Strategy 3: Only locks during active interaction
   * PR #13 - Simplified to lock only the actively dragged/edited shape
   */
  const acquireLock = useCallback(
    async (objectId: string): Promise<LockResult> => {
      if (!user) {
        return { success: false, reason: "error" };
      }

      // PR #13 - Skip locking for temporary objects (not yet in Firestore)
      if (objectId.startsWith("temp-")) {
        return { success: true, reason: undefined };
      }

      try {
        const objectRef = doc(db, "canvasObjects", objectId);

        const result = await runTransaction(db, async (transaction) => {
          const objectDoc = await transaction.get(objectRef);

          if (!objectDoc.exists()) {
            // PR #13 - Object doesn't exist (possibly deleted)
            return { success: false, reason: "error" as const };
          }

          const objectData = objectDoc.data();
          const currentLock = {
            lockedBy: objectData.lockedBy,
            lockedAt: objectData.lockedAt,
          };

          // Check if already locked by another user
          if (currentLock.lockedBy && currentLock.lockedBy !== user.uid) {
            // Check if lock is stale
            if (!lockManager.isLockStale(currentLock.lockedAt)) {
              // Valid lock by another user - cannot acquire
              const lockedUser = onlineUsersRef.current.find(
                (u) => u.userId === currentLock.lockedBy
              );
              return {
                success: false,
                reason: "already_locked" as const,
                lockedBy: currentLock.lockedBy,
                lockedByName: lockedUser?.displayName || "Another user",
              };
            }
          }

          // Lock is available (unlocked, ours, or stale) - acquire it
          transaction.update(objectRef, {
            lockedBy: user.uid,
            lockedAt: Date.now(),
          });

          return {
            success: true,
            reason:
              currentLock.lockedBy && currentLock.lockedBy !== user.uid
                ? ("stale_lock_acquired" as const)
                : undefined,
          };
        });

        return result;
      } catch (error: any) {
        const errorMessage = (error as Error).message || "";

        // Silently handle not found errors
        if (
          errorMessage.includes("NOT_FOUND") ||
          errorMessage.includes("not found")
        ) {
          return { success: false, reason: "error" };
        }

        // Log other errors but don't block
        console.warn("Error acquiring lock:", error);
        return { success: false, reason: "error" };
      }
    },
    [user]
  );

  /**
   * Release lock on an object
   * Strategy 3: Called immediately on mouseup/dragend
   */
  const releaseLock = useCallback(
    async (objectId: string): Promise<boolean> => {
      if (!user) return false;

      try {
        // PR #13 - Check if object still exists before releasing lock
        // This prevents 400 errors when trying to release locks on deleted objects
        const object = getObjectById(objectId);
        if (!object) {
          // Object no longer exists (was deleted), no need to release lock
          return true;
        }

        const objectRef = doc(db, "canvasObjects", objectId);

        await updateDoc(objectRef, {
          lockedBy: null,
          lockedAt: null,
        });

        return true;
      } catch (error) {
        // Silently handle "not found" errors (object was deleted)
        const errorMessage = (error as Error).message || "";
        if (
          errorMessage.includes("NOT_FOUND") ||
          errorMessage.includes("No document")
        ) {
          // Object was deleted, no need to log error
          return true;
        }

        console.error("Error releasing lock:", error);
        return false;
      }
    },
    [user, getObjectById]
  );

  /**
   * Check if an object is locked by another user
   * Considers stale locks as unlocked
   */
  const isLocked = useCallback(
    (objectId: string): boolean => {
      if (!user) return false;

      const object = getObjectById(objectId);
      if (!object) return false;

      return lockManager.isObjectLocked(object, user.uid);
    },
    [user, getObjectById]
  );

  /**
   * Get lock info for an object (for UI display)
   */
  const getLockInfo = useCallback(
    (objectId: string) => {
      const object = getObjectById(objectId);
      if (!object || !object.lockedBy || !object.lockedAt) {
        return null;
      }

      // Check if lock is stale
      if (lockManager.isLockStale(object.lockedAt)) {
        return null;
      }

      // Find user info
      const lockedUser = onlineUsersRef.current.find(
        (u) => u.userId === object.lockedBy
      );

      return {
        lockedBy: object.lockedBy,
        lockedByName: lockedUser?.displayName || "Another user",
        lockedAt: object.lockedAt,
        isOwnLock: object.lockedBy === user?.uid,
        color: lockedUser?.color || "#999999", // User's color from presence
      };
    },
    [getObjectById, user]
  );

  /**
   * Batch acquire locks on multiple objects
   * Returns array of results for each object
   */
  const batchAcquireLocks = useCallback(
    async (
      objectIds: string[]
    ): Promise<Array<{ id: string; success: boolean; reason?: string }>> => {
      if (!user) {
        return objectIds.map((id) => ({
          id,
          success: false,
          reason: "no_user",
        }));
      }

      // Filter out temporary objects
      const realObjectIds = objectIds.filter((id) => !id.startsWith("temp-"));
      if (realObjectIds.length === 0) {
        return objectIds.map((id) => ({ id, success: true }));
      }

      try {
        const results = await firestoreService.batchAcquireLocks(
          realObjectIds,
          user.uid
        );
        return results;
      } catch (error) {
        console.error("Error batch acquiring locks:", error);
        return realObjectIds.map((id) => ({
          id,
          success: false,
          reason: "error",
        }));
      }
    },
    [user]
  );

  /**
   * Batch release locks on multiple objects
   */
  const batchReleaseLocks = useCallback(
    async (objectIds: string[]): Promise<void> => {
      if (!user) return;

      // Filter out temporary objects and objects that don't exist
      const realObjectIds = objectIds.filter((id) => {
        if (id.startsWith("temp-")) return false;
        const object = getObjectById(id);
        return object !== undefined;
      });

      if (realObjectIds.length === 0) return;

      try {
        await firestoreService.batchReleaseLocks(realObjectIds, user.uid);
      } catch (error) {
        console.error("Error batch releasing locks:", error);
      }
    },
    [user, getObjectById]
  );

  // Memoize the return object to prevent creating new reference on every render
  // This ensures stable reference for consumers like useActiveLock
  return useMemo(
    () => ({
      acquireLock,
      releaseLock,
      isLocked,
      getLockInfo,
      batchAcquireLocks,
      batchReleaseLocks,
    }),
    [
      acquireLock,
      releaseLock,
      isLocked,
      getLockInfo,
      batchAcquireLocks,
      batchReleaseLocks,
    ]
  );
}
