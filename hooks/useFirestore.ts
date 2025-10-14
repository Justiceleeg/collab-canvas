// PR #5 - Firestore Sync Infrastructure
// Firestore sync hook
// - onSnapshot listeners for canvasObjects
// - Real-time updates to local store
// - Error handling and reconnection
// - Canvas state persists on reload

"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { firestoreService } from "@/services/firestore.service";
import { useCanvasStore } from "@/store/canvasStore";
import { CanvasObject } from "@/types/canvas.types";
import { useAuth } from "./useAuth";

interface UseFirestoreReturn {
  loading: boolean;
  error: Error | null;
  isConnected: boolean;
  retry: () => void;
}

/**
 * Hook to sync canvas objects with Firestore
 * Manages real-time subscription and handles errors with automatic reconnection
 */
export function useFirestore(): UseFirestoreReturn {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const { user } = useAuth();
  const setObjects = useCanvasStore((state) => state.setObjects);

  // Track if this is the initial load
  const isInitialLoad = useRef(true);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Exponential backoff for retries
  const getRetryDelay = useCallback((attempt: number) => {
    return Math.min(1000 * Math.pow(2, attempt), 30000); // Max 30 seconds
  }, []);

  // Setup subscription to Firestore
  const setupSubscription = useCallback(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Clear any existing subscription
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }

      console.log("Setting up Firestore subscription...");
      setError(null);

      // Subscribe to all canvas objects
      const unsubscribe = firestoreService.subscribeToObjects(
        (objects: CanvasObject[]) => {
          console.log(`Received ${objects.length} objects from Firestore`);

          // Update local store with objects from Firestore
          setObjects(objects);

          // Mark as connected and loaded
          setIsConnected(true);

          if (isInitialLoad.current) {
            setLoading(false);
            isInitialLoad.current = false;
          }

          // Reset retry count on successful connection
          setRetryCount(0);
        },
        (err: Error) => {
          console.error("Firestore subscription error:", err);
          setError(err);
          setIsConnected(false);

          // Attempt to reconnect with exponential backoff
          const delay = getRetryDelay(retryCount);
          console.log(`Will retry connection in ${delay}ms...`);

          retryTimeoutRef.current = setTimeout(() => {
            setRetryCount((prev) => prev + 1);
            setupSubscription();
          }, delay);
        }
      );

      unsubscribeRef.current = unsubscribe;
    } catch (err) {
      console.error("Error setting up Firestore subscription:", err);
      setError(err as Error);
      setIsConnected(false);
      setLoading(false);

      // Attempt to reconnect
      const delay = getRetryDelay(retryCount);
      retryTimeoutRef.current = setTimeout(() => {
        setRetryCount((prev) => prev + 1);
        setupSubscription();
      }, delay);
    }
  }, [user, setObjects, getRetryDelay, retryCount]);

  // Manual retry function
  const retry = useCallback(() => {
    console.log("Manual retry requested");
    setRetryCount(0);
    setLoading(true);
    isInitialLoad.current = true;
    setupSubscription();
  }, [setupSubscription]);

  // Setup subscription on mount and when user changes
  useEffect(() => {
    setupSubscription();

    // Cleanup on unmount
    return () => {
      if (unsubscribeRef.current) {
        console.log("Cleaning up Firestore subscription");
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };
  }, [setupSubscription]);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      console.log("Network connection restored, reconnecting to Firestore...");
      retry();
    };

    const handleOffline = () => {
      console.log("Network connection lost");
      setIsConnected(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [retry]);

  return {
    loading,
    error,
    isConnected,
    retry,
  };
}

/**
 * Hook to sync canvas objects with Firestore with write operations
 * Provides methods to create, update, and delete objects with optimistic updates
 */
export function useFirestoreSync() {
  const { user } = useAuth();
  const {
    addObject: addObjectToStore,
    updateObject: updateObjectInStore,
    removeObject: removeObjectFromStore,
  } = useCanvasStore();

  // Create object with optimistic update
  const createObject = useCallback(
    async (object: Omit<CanvasObject, "id" | "createdAt" | "updatedAt">) => {
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Generate temporary ID for optimistic update
      const tempId = `temp-${Date.now()}-${Math.random()}`;
      const optimisticObject: CanvasObject = {
        ...object,
        id: tempId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Optimistic update
      addObjectToStore(optimisticObject);

      try {
        // Create in Firestore (will trigger subscription update with real ID)
        const createdObject = await firestoreService.createObject(
          object,
          user.uid
        );

        // Remove temporary object and let subscription add the real one
        removeObjectFromStore(tempId);

        return createdObject;
      } catch (error) {
        // Rollback optimistic update on error
        removeObjectFromStore(tempId);
        throw error;
      }
    },
    [user, addObjectToStore, removeObjectFromStore]
  );

  // Update object with optimistic update
  const updateObject = useCallback(
    async (
      id: string,
      updates: Partial<Omit<CanvasObject, "id" | "createdAt">>
    ) => {
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Optimistic update
      updateObjectInStore(id, updates);

      try {
        // Update in Firestore (will trigger subscription update)
        await firestoreService.updateObject(id, updates, user.uid);
      } catch (error) {
        console.error(
          "Error updating object, will revert on next sync:",
          error
        );
        // Note: The subscription will revert to the actual Firestore state
        throw error;
      }
    },
    [user, updateObjectInStore]
  );

  // Delete object with optimistic update
  const deleteObject = useCallback(
    async (id: string) => {
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Store the object in case we need to restore it
      const objects = useCanvasStore.getState().objects;
      const objectToDelete = objects.find((obj) => obj.id === id);

      // Optimistic update
      removeObjectFromStore(id);

      try {
        // Delete from Firestore (will trigger subscription update)
        await firestoreService.deleteObject(id);
      } catch (error) {
        console.error("Error deleting object:", error);
        // Restore object if deletion failed
        if (objectToDelete) {
          addObjectToStore(objectToDelete);
        }
        throw error;
      }
    },
    [user, removeObjectFromStore, addObjectToStore]
  );

  // Batch delete objects
  const deleteObjects = useCallback(
    async (ids: string[]) => {
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Store objects in case we need to restore them
      const objects = useCanvasStore.getState().objects;
      const objectsToDelete = objects.filter((obj) => ids.includes(obj.id));

      // Optimistic updates
      ids.forEach((id) => removeObjectFromStore(id));

      try {
        // Batch delete from Firestore
        await firestoreService.batchDeleteObjects(ids);
      } catch (error) {
        console.error("Error batch deleting objects:", error);
        // Restore objects if deletion failed
        objectsToDelete.forEach((obj) => addObjectToStore(obj));
        throw error;
      }
    },
    [user, removeObjectFromStore, addObjectToStore]
  );

  return {
    createObject,
    updateObject,
    deleteObject,
    deleteObjects,
  };
}
