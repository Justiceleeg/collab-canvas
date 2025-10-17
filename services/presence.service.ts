// PR #9 - User Presence & Multiplayer Cursors
// Presence management service (Realtime Database)
// - Write user to Realtime Database presence/{userId} path on mount
// - Use onDisconnect() to set online: false for automatic cleanup
// - Include user ID, display name, color, online status
// - Monitor connection state for reliability

import { rtdb } from "./firebase";
import {
  ref,
  set,
  onDisconnect,
  serverTimestamp,
  remove,
  update,
  onValue,
} from "firebase/database";
import { UserPresence } from "@/types/user.types";

// Generate a random color for user cursor
const generateUserColor = (): string => {
  const colors = [
    "#FF6B6B", // Red
    "#4ECDC4", // Teal
    "#45B7D1", // Blue
    "#FFA07A", // Light Salmon
    "#98D8C8", // Mint
    "#F7DC6F", // Yellow
    "#BB8FCE", // Purple
    "#85C1E2", // Sky Blue
    "#F8B739", // Orange
    "#52B788", // Green
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

export const presenceService = {
  /**
   * Join canvas - write user presence to Realtime Database
   * Sets up automatic cleanup on disconnect
   * Returns both the user color and a cleanup function for the connection listener
   */
  async joinCanvas(
    userId: string,
    displayName: string
  ): Promise<{ color: string; cleanup: () => void }> {
    if (!rtdb) {
      throw new Error("Realtime Database not initialized");
    }

    const userColor = generateUserColor();
    const presenceRef = ref(rtdb, `presence/${userId}`);
    const onlineRef = ref(rtdb, `presence/${userId}/online`);
    const lastSeenRef = ref(rtdb, `presence/${userId}/lastSeen`);

    // Create presence data
    const presenceData: Partial<UserPresence> = {
      userId,
      displayName,
      color: userColor,
      online: true,
      joinedAt: Date.now(),
      lastSeen: Date.now(),
    };

    // Set up automatic offline status on disconnect
    // This sets online: false instead of removing the record
    await onDisconnect(onlineRef).set(false);

    // Also update lastSeen on disconnect
    await onDisconnect(lastSeenRef).set(Date.now());

    // Write presence data
    await set(presenceRef, presenceData);

    // Monitor connection state for better reliability
    const connectedRef = ref(rtdb, ".info/connected");
    const unsubscribe = onValue(connectedRef, (snapshot) => {
      if (snapshot.val() === true) {
        // We're connected (or reconnected)
        // Reset the onDisconnect handlers
        onDisconnect(onlineRef).set(false);
        onDisconnect(lastSeenRef).set(Date.now());

        // Also re-mark as online in case we reconnected
        set(onlineRef, true);
      }
    });

    return {
      color: userColor,
      cleanup: unsubscribe,
    };
  },

  /**
   * Leave canvas - manually set user offline
   * Must be called BEFORE sign out while user still has auth
   */
  async leaveCanvas(userId: string): Promise<void> {
    if (!rtdb) {
      return;
    }

    const presenceRef = ref(rtdb, `presence/${userId}`);

    try {
      // Set online to false and update lastSeen
      await update(presenceRef, {
        online: false,
        lastSeen: Date.now(),
      });

      // Cancel any pending onDisconnect operations since we manually cleaned up
      const onlineRef = ref(rtdb, `presence/${userId}/online`);
      const lastSeenRef = ref(rtdb, `presence/${userId}/lastSeen`);
      await onDisconnect(onlineRef).cancel();
      await onDisconnect(lastSeenRef).cancel();
    } catch (error) {
      // Silently fail - onDisconnect handlers will handle it
      console.warn("Could not manually set offline status:", error);
    }
  },

  /**
   * Update cursor position in presence data
   * Optimized to use a single update() call instead of two set() calls
   */
  async updateCursor(userId: string, x: number, y: number): Promise<void> {
    if (!rtdb) {
      throw new Error("Realtime Database not initialized");
    }

    const presenceRef = ref(rtdb, `presence/${userId}`);
    const now = Date.now();

    // Batch both cursor and lastSeen updates in a single call
    await update(presenceRef, {
      cursor: {
        x,
        y,
        timestamp: now,
      },
      lastSeen: now,
    });
  },
};
