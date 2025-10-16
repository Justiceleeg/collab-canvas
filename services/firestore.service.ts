// PR #5 - Firestore Sync Infrastructure
// Firestore CRUD operations for canvasObjects
// - CRUD operations for canvasObjects
// - Batch operations
// - Transaction support

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  runTransaction,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
  onSnapshot,
  DocumentData,
  QuerySnapshot,
  Unsubscribe,
} from "firebase/firestore";
import { db } from "./firebase";
import { CanvasObject } from "@/types/canvas.types";

const CANVAS_OBJECTS_COLLECTION = "canvasObjects";

// Helper function to convert Firestore document to CanvasObject
function docToCanvasObject(doc: DocumentData): CanvasObject {
  const data = doc.data();
  return {
    id: doc.id,
    type: data.type,
    x: data.x,
    y: data.y,
    width: data.width,
    height: data.height,
    rotation: data.rotation || 0,
    color: data.color,
    text: data.text,
    fontSize: data.fontSize,
    zIndex: data.zIndex,
    lockedBy: data.lockedBy || null,
    lockedAt: data.lockedAt,
    lastUpdatedBy: data.lastUpdatedBy,
    updatedAt: data.updatedAt,
    createdAt: data.createdAt,
  };
}

export const firestoreService = {
  // ===== READ OPERATIONS =====

  /**
   * Get all canvas objects
   */
  async getAllObjects(): Promise<CanvasObject[]> {
    try {
      const objectsRef = collection(db, CANVAS_OBJECTS_COLLECTION);
      const q = query(objectsRef, orderBy("createdAt", "asc"));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => docToCanvasObject(doc));
    } catch (error) {
      console.error("Error fetching canvas objects:", error);
      throw error;
    }
  },

  /**
   * Get a single canvas object by ID
   */
  async getObject(id: string): Promise<CanvasObject | null> {
    try {
      const docRef = doc(db, CANVAS_OBJECTS_COLLECTION, id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docToCanvasObject(docSnap);
      }
      return null;
    } catch (error) {
      console.error("Error fetching canvas object:", error);
      throw error;
    }
  },

  // ===== CREATE OPERATIONS =====

  /**
   * Create a new canvas object
   * Returns the created object with its ID
   */
  async createObject(
    object: Omit<CanvasObject, "id" | "createdAt" | "updatedAt">,
    userId: string
  ): Promise<CanvasObject> {
    try {
      const objectsRef = collection(db, CANVAS_OBJECTS_COLLECTION);

      // Filter out undefined values (Firestore doesn't accept them)
      const cleanObject = Object.fromEntries(
        Object.entries(object).filter(([_, value]) => value !== undefined)
      );

      const objectData = {
        ...cleanObject,
        lastUpdatedBy: userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lockedBy: null,
        lockedAt: null,
      };

      const docRef = await addDoc(objectsRef, objectData);

      // Fetch the created document to get the actual timestamps
      const createdDoc = await getDoc(docRef);
      return docToCanvasObject(createdDoc);
    } catch (error) {
      console.error("Error creating canvas object:", error);
      throw error;
    }
  },

  /**
   * Create a new canvas object with a specific ID
   */
  async createObjectWithId(
    id: string,
    object: Omit<CanvasObject, "id" | "createdAt" | "updatedAt">,
    userId: string
  ): Promise<CanvasObject> {
    try {
      const docRef = doc(db, CANVAS_OBJECTS_COLLECTION, id);

      // Filter out undefined values (Firestore doesn't accept them)
      const cleanObject = Object.fromEntries(
        Object.entries(object).filter(([_, value]) => value !== undefined)
      );

      const objectData = {
        ...cleanObject,
        lastUpdatedBy: userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lockedBy: null,
        lockedAt: null,
      };

      await setDoc(docRef, objectData);

      // Fetch the created document to get the actual timestamps
      const createdDoc = await getDoc(docRef);
      return docToCanvasObject(createdDoc);
    } catch (error) {
      console.error("Error creating canvas object with ID:", error);
      throw error;
    }
  },

  // ===== UPDATE OPERATIONS =====

  /**
   * Update a canvas object
   */
  async updateObject(
    id: string,
    updates: Partial<Omit<CanvasObject, "id" | "createdAt">>,
    userId: string
  ): Promise<void> {
    try {
      const docRef = doc(db, CANVAS_OBJECTS_COLLECTION, id);
      await updateDoc(docRef, {
        ...updates,
        lastUpdatedBy: userId,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating canvas object:", error);
      throw error;
    }
  },

  /**
   * Lock a canvas object
   */
  async lockObject(id: string, userId: string): Promise<void> {
    try {
      const docRef = doc(db, CANVAS_OBJECTS_COLLECTION, id);
      await updateDoc(docRef, {
        lockedBy: userId,
        lockedAt: serverTimestamp(),
        lastUpdatedBy: userId,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error locking canvas object:", error);
      throw error;
    }
  },

  /**
   * Unlock a canvas object
   */
  async unlockObject(id: string, userId: string): Promise<void> {
    try {
      const docRef = doc(db, CANVAS_OBJECTS_COLLECTION, id);
      await updateDoc(docRef, {
        lockedBy: null,
        lockedAt: null,
        lastUpdatedBy: userId,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error unlocking canvas object:", error);
      throw error;
    }
  },

  // ===== DELETE OPERATIONS =====

  /**
   * Delete a canvas object
   */
  async deleteObject(id: string): Promise<void> {
    try {
      const docRef = doc(db, CANVAS_OBJECTS_COLLECTION, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Error deleting canvas object:", error);
      throw error;
    }
  },

  // ===== BATCH OPERATIONS =====

  /**
   * Create multiple canvas objects in a batch
   */
  async batchCreateObjects(
    objects: Array<Omit<CanvasObject, "id" | "createdAt" | "updatedAt">>,
    userId: string
  ): Promise<void> {
    try {
      const batch = writeBatch(db);

      objects.forEach((object) => {
        const docRef = doc(collection(db, CANVAS_OBJECTS_COLLECTION));
        const objectData = {
          ...object,
          lastUpdatedBy: userId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lockedBy: null,
          lockedAt: null,
        };
        batch.set(docRef, objectData);
      });

      await batch.commit();
    } catch (error) {
      console.error("Error batch creating canvas objects:", error);
      throw error;
    }
  },

  /**
   * Update multiple canvas objects in a batch
   */
  async batchUpdateObjects(
    updates: Array<{
      id: string;
      data: Partial<Omit<CanvasObject, "id" | "createdAt">>;
    }>,
    userId: string
  ): Promise<void> {
    try {
      const batch = writeBatch(db);

      updates.forEach(({ id, data }) => {
        const docRef = doc(db, CANVAS_OBJECTS_COLLECTION, id);
        batch.update(docRef, {
          ...data,
          lastUpdatedBy: userId,
          updatedAt: serverTimestamp(),
        });
      });

      await batch.commit();
    } catch (error) {
      console.error("Error batch updating canvas objects:", error);
      throw error;
    }
  },

  /**
   * Delete multiple canvas objects in a batch
   */
  async batchDeleteObjects(ids: string[]): Promise<void> {
    try {
      const batch = writeBatch(db);

      ids.forEach((id) => {
        const docRef = doc(db, CANVAS_OBJECTS_COLLECTION, id);
        batch.delete(docRef);
      });

      await batch.commit();
    } catch (error) {
      console.error("Error batch deleting canvas objects:", error);
      throw error;
    }
  },

  // ===== TRANSACTION OPERATIONS =====

  /**
   * Acquire lock with transaction (ensures atomic lock acquisition)
   */
  async acquireLockTransaction(id: string, userId: string): Promise<boolean> {
    try {
      const docRef = doc(db, CANVAS_OBJECTS_COLLECTION, id);

      const result = await runTransaction(db, async (transaction) => {
        const objectDoc = await transaction.get(docRef);

        if (!objectDoc.exists()) {
          throw new Error("Object does not exist");
        }

        const data = objectDoc.data();

        // Check if object is already locked by someone else
        if (data.lockedBy && data.lockedBy !== userId) {
          // Check if lock is stale (older than 5 seconds)
          const lockedAt = data.lockedAt?.toDate?.() || new Date(0);
          const now = new Date();
          const lockAge = now.getTime() - lockedAt.getTime();

          if (lockAge < 5000) {
            // Lock is still fresh, cannot acquire
            return false;
          }
          // Lock is stale, will override
        }

        // Acquire or refresh lock
        transaction.update(docRef, {
          lockedBy: userId,
          lockedAt: serverTimestamp(),
          lastUpdatedBy: userId,
          updatedAt: serverTimestamp(),
        });

        return true;
      });

      return result;
    } catch (error) {
      console.error("Error acquiring lock:", error);
      throw error;
    }
  },

  /**
   * Update object with lock check (transaction ensures only locker can update)
   */
  async updateObjectWithLockCheck(
    id: string,
    updates: Partial<Omit<CanvasObject, "id" | "createdAt">>,
    userId: string
  ): Promise<boolean> {
    try {
      const docRef = doc(db, CANVAS_OBJECTS_COLLECTION, id);

      const result = await runTransaction(db, async (transaction) => {
        const objectDoc = await transaction.get(docRef);

        if (!objectDoc.exists()) {
          throw new Error("Object does not exist");
        }

        const data = objectDoc.data();

        // Check if user has the lock (or object is unlocked)
        if (data.lockedBy && data.lockedBy !== userId) {
          return false;
        }

        // Perform update
        transaction.update(docRef, {
          ...updates,
          lastUpdatedBy: userId,
          updatedAt: serverTimestamp(),
        });

        return true;
      });

      return result;
    } catch (error) {
      console.error("Error updating object with lock check:", error);
      throw error;
    }
  },

  // ===== REAL-TIME SUBSCRIPTIONS =====

  /**
   * Subscribe to all canvas objects changes
   */
  subscribeToObjects(
    callback: (objects: CanvasObject[]) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    try {
      const objectsRef = collection(db, CANVAS_OBJECTS_COLLECTION);
      const q = query(objectsRef, orderBy("createdAt", "asc"));

      return onSnapshot(
        q,
        (snapshot: QuerySnapshot) => {
          const objects = snapshot.docs.map((doc) => docToCanvasObject(doc));
          callback(objects);
        },
        (error) => {
          console.error("Error in objects subscription:", error);
          if (onError) {
            onError(error as Error);
          }
        }
      );
    } catch (error) {
      console.error("Error setting up objects subscription:", error);
      throw error;
    }
  },

  /**
   * Subscribe to a single canvas object
   */
  subscribeToObject(
    id: string,
    callback: (object: CanvasObject | null) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    try {
      const docRef = doc(db, CANVAS_OBJECTS_COLLECTION, id);

      return onSnapshot(
        docRef,
        (docSnap) => {
          if (docSnap.exists()) {
            callback(docToCanvasObject(docSnap));
          } else {
            callback(null);
          }
        },
        (error) => {
          console.error("Error in object subscription:", error);
          if (onError) {
            onError(error as Error);
          }
        }
      );
    } catch (error) {
      console.error("Error setting up object subscription:", error);
      throw error;
    }
  },
};
