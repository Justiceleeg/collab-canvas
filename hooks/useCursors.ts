// PR #9 - User Presence & Multiplayer Cursors
// Cursor position sync hook (Realtime Database)
// - Update cursor position in Realtime Database (debounced 30-50ms)
// - Use set() on presence/{userId}/cursor path
// - Subscribe to other users' cursor positions with onValue()

import { useEffect, useState, useCallback, useRef } from "react";
import { rtdb } from "@/services/firebase";
import { ref, onValue } from "firebase/database";
import { presenceService } from "@/services/presence.service";
import { useAuth } from "./useAuth";
import { TIMING } from "@/utils/constants";

export interface CursorPosition {
  userId: string;
  displayName: string;
  color: string;
  x: number;
  y: number;
  timestamp: number;
}

export function useCursors() {
  const { user } = useAuth();
  const [cursors, setCursors] = useState<CursorPosition[]>([]);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateRef = useRef<{ x: number; y: number } | null>(null);

  // Subscribe to all users' cursor positions
  useEffect(() => {
    if (!rtdb || !user) {
      return;
    }

    const presenceRef = ref(rtdb, "presence");
    const unsubscribe = onValue(presenceRef, (snapshot) => {
      const presenceData = snapshot.val();

      if (presenceData) {
        const cursorList: CursorPosition[] = [];

        // Extract cursor positions from all users except current user
        Object.values(presenceData).forEach((userData: any) => {
          // Skip current user's cursor
          if (userData.userId === user.uid) {
            return;
          }

          // Only add if user has cursor data
          if (userData.cursor && userData.online) {
            cursorList.push({
              userId: userData.userId,
              displayName: userData.displayName,
              color: userData.color,
              x: userData.cursor.x,
              y: userData.cursor.y,
              timestamp: userData.cursor.timestamp,
            });
          }
        });

        setCursors(cursorList);
      } else {
        setCursors([]);
      }
    });

    // Cleanup
    return () => {
      unsubscribe();
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [user]);

  // Update cursor position with debouncing
  const updateCursor = useCallback(
    (x: number, y: number) => {
      if (!user) return;

      // Store the latest position
      lastUpdateRef.current = { x, y };

      // Clear existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set new timer to update
      debounceTimerRef.current = setTimeout(() => {
        if (lastUpdateRef.current) {
          presenceService
            .updateCursor(
              user.uid,
              lastUpdateRef.current.x,
              lastUpdateRef.current.y
            )
            .catch((error) => {
              console.error("Error updating cursor:", error);
            });
        }
      }, TIMING.CURSOR_DEBOUNCE_MS);
    },
    [user]
  );

  return {
    cursors,
    updateCursor,
  };
}
