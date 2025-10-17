"use client";

// Google Docs-style presence avatars component
// Shows first letter of user names in colored circles
// Shows up to 3 users, then "+# others"

import { usePresence } from "@/hooks/usePresence";

export default function PresenceAvatars() {
  const { onlineUsers } = usePresence();

  // Show up to 3 avatars
  const visibleUsers = onlineUsers.slice(0, 3);
  const remainingCount = Math.max(0, onlineUsers.length - 3);

  // Helper to get initials from display name
  const getInitials = (name: string | undefined) => {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }
    // First letter of first and last name
    return (
      parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
    ).toUpperCase();
  };

  if (onlineUsers.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-1">
      {/* User avatars */}
      {visibleUsers.map((user, index) => (
        <div
          key={user.userId}
          className="relative group"
          style={{
            zIndex: visibleUsers.length - index,
          }}
        >
          {/* Avatar circle */}
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold cursor-pointer ring-2 ring-white transition-transform hover:scale-110"
            style={{ backgroundColor: user.color }}
            title={user.displayName || "User"}
          >
            {getInitials(user.displayName)}
          </div>

          {/* Tooltip on hover */}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
            {user.displayName || "User"}
          </div>
        </div>
      ))}

      {/* "+# others" indicator */}
      {remainingCount > 0 && (
        <div className="relative group">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-400 text-white text-xs font-semibold cursor-pointer ring-2 ring-white transition-transform hover:scale-110"
            title={`${remainingCount} more user${
              remainingCount > 1 ? "s" : ""
            }`}
          >
            +{remainingCount}
          </div>

          {/* Tooltip on hover */}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
            {onlineUsers
              .slice(3)
              .map((u) => u.displayName)
              .join(", ")}
          </div>
        </div>
      )}
    </div>
  );
}
