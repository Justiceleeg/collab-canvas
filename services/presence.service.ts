// PR #9 - User Presence & Multiplayer Cursors
// Presence management service (Realtime Database)
// - Write user to Realtime Database presence/{userId} path on mount
// - Use onDisconnect().remove() for automatic cleanup
// - Include user ID, display name, color, online status
// - No need for manual heartbeat polling

import { rtdb } from "./firebase";
import {
  ref,
  set,
  onDisconnect,
  serverTimestamp,
  remove,
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
   */
  async joinCanvas(userId: string, displayName: string): Promise<string> {
    if (!rtdb) {
      throw new Error("Realtime Database not initialized");
    }

    const userColor = generateUserColor();
    const presenceRef = ref(rtdb, `presence/${userId}`);

    // Create presence data
    const presenceData: Partial<UserPresence> = {
      userId,
      displayName,
      color: userColor,
      online: true,
      joinedAt: Date.now(),
      lastSeen: Date.now(),
    };

    // Set up automatic cleanup on disconnect
    await onDisconnect(presenceRef).remove();

    // Write presence data
    await set(presenceRef, presenceData);

    return userColor;
  },

  /**
   * Leave canvas - manually remove user presence
   * (onDisconnect will also handle this automatically)
   */
  async leaveCanvas(userId: string): Promise<void> {
    if (!rtdb) {
      throw new Error("Realtime Database not initialized");
    }

    const presenceRef = ref(rtdb, `presence/${userId}`);
    await remove(presenceRef);
  },

  /**
   * Update cursor position in presence data
   */
  async updateCursor(userId: string, x: number, y: number): Promise<void> {
    if (!rtdb) {
      throw new Error("Realtime Database not initialized");
    }

    const cursorRef = ref(rtdb, `presence/${userId}/cursor`);
    await set(cursorRef, {
      x,
      y,
      timestamp: Date.now(),
    });

    // Update lastSeen timestamp
    const lastSeenRef = ref(rtdb, `presence/${userId}/lastSeen`);
    await set(lastSeenRef, Date.now());
  },
};
