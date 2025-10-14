// PR #9 - User Presence & Multiplayer Cursors
// Presence indicator component
// - Show count of online users
// - List user names with colored dots

"use client";

import { usePresence } from "@/hooks/usePresence";

export default function PresenceIndicator() {
  const { onlineUsers } = usePresence();

  return (
    <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 min-w-[200px] z-10">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span className="font-semibold text-gray-700">
          {onlineUsers.length} Online
        </span>
      </div>

      <div className="space-y-2">
        {onlineUsers.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No users online</p>
        ) : (
          onlineUsers.map((user) => (
            <div key={user.userId} className="flex items-center gap-2 text-sm">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: user.color }}
              ></div>
              <span className="text-gray-700 truncate">{user.displayName}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
