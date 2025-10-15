// PR #9 - User Presence & Multiplayer Cursors
// User presence tracking hook (Realtime Database)
// - Subscribe to presence path using onValue() listener
// - Track online users in real-time
// - Filter for users with online: true

import { useEffect, useState } from "react";
import { rtdb } from "@/services/firebase";
import { ref, onValue } from "firebase/database";
import { UserPresence } from "@/types/user.types";
import { presenceService } from "@/services/presence.service";
import { useAuth } from "./useAuth";

export function usePresence() {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<UserPresence[]>([]);
  const [userColor, setUserColor] = useState<string | null>(null);

  useEffect(() => {
    if (!rtdb || !user) {
      return;
    }

    let connectionCleanup: (() => void) | null = null;

    // Join canvas when component mounts
    const joinCanvas = async () => {
      try {
        const { color, cleanup } = await presenceService.joinCanvas(
          user.uid,
          user.displayName
        );
        setUserColor(color);
        connectionCleanup = cleanup;
      } catch (error) {
        console.error("Error joining canvas:", error);
      }
    };

    joinCanvas();

    // Subscribe to presence changes
    const presenceRef = ref(rtdb, "presence");
    const unsubscribePresence = onValue(presenceRef, (snapshot) => {
      const presenceData = snapshot.val();

      if (presenceData) {
        // Convert presence object to array and filter for online users
        const users = Object.values(presenceData) as UserPresence[];
        const onlineUsersFiltered = users.filter((u) => u.online === true);
        setOnlineUsers(onlineUsersFiltered);
      } else {
        setOnlineUsers([]);
      }
    });

    // Cleanup: unsubscribe from listeners
    // Note: onDisconnect() handlers will automatically mark user as offline
    return () => {
      // Clean up connection listener
      if (connectionCleanup) {
        connectionCleanup();
      }

      // Unsubscribe from presence listener
      unsubscribePresence();

      // Don't manually call leaveCanvas here - it can cause permission errors
      // when auth state changes. The onDisconnect() handlers will take care of it.
    };
  }, [user]);

  return {
    onlineUsers,
    userColor,
  };
}
