// PR #8 - Object-Level Locking System
// Object locking hook (Strategy 3: Interaction Lock)
// - Acquire lock on mousedown/dragstart
// - Release lock on mouseup/dragend
// - No heartbeat/polling needed

import { useCallback } from "react";
import { db } from "@/services/firebase";
import { doc, runTransaction, updateDoc } from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import { useCanvasStore } from "@/store/canvasStore";
import { lockManager } from "@/utils/lockManager";
import { LockResult } from "@/types/lock.types";
import { usePresence } from "@/hooks/usePresence";

export function useLocking() {
  const { user } = useAuth();
  const { getObjectById } = useCanvasStore();
  const { onlineUsers } = usePresence();

  /**
   * Acquire lock on an object using Firestore transaction
   * Strategy 3: Only locks during active interaction
   */
  const acquireLock = useCallback(
    async (objectId: string): Promise<LockResult> => {
      if (!user) {
        return { success: false, reason: "error" };
      }

      try {
        const objectRef = doc(db, "canvasObjects", objectId);

        const result = await runTransaction(db, async (transaction) => {
          const objectDoc = await transaction.get(objectRef);

          if (!objectDoc.exists()) {
            throw new Error("Object not found");
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
              const lockedUser = onlineUsers.find(
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
      } catch (error) {
        console.error("Error acquiring lock:", error);
        return { success: false, reason: "error" };
      }
    },
    [user, onlineUsers]
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
      const lockedUser = onlineUsers.find((u) => u.userId === object.lockedBy);

      return {
        lockedBy: object.lockedBy,
        lockedByName: lockedUser?.displayName || "Another user",
        lockedAt: object.lockedAt,
        isOwnLock: object.lockedBy === user?.uid,
        color: lockedUser?.color || "#999999", // User's color from presence
      };
    },
    [getObjectById, onlineUsers, user]
  );

  return {
    acquireLock,
    releaseLock,
    isLocked,
    getLockInfo,
  };
}
