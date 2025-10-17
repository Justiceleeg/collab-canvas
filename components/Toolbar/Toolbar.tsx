"use client";

// Main toolbar component
// Top bar with logo, presence avatars, and user menu

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import PresenceAvatars from "../Presence/PresenceAvatars";

export default function Toolbar() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };
  return (
    <div className="toolbar fixed top-0 left-0 right-0 z-50 bg-white shadow-md border-b border-gray-200">
      <div className="toolbar-container max-w-screen-2xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Left section - Logo */}
        <div className="toolbar-left flex items-center gap-4">
          <div className="toolbar-logo flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="white"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M3 3h6v6H3V3zm8 0h6v6h-6V3zM3 11h6v6H3v-6zm8 0h6v6h-6v-6z" />
              </svg>
            </div>
            <h1 className="text-lg font-bold text-gray-900">Collab Canvas</h1>
          </div>
        </div>

        {/* Right section - Presence, User info and sign out */}
        <div className="toolbar-right flex items-center gap-4">
          {/* Presence avatars */}
          <PresenceAvatars />

          <div className="toolbar-divider h-8 w-px bg-gray-300"></div>

          {user && (
            <>
              <span className="text-sm text-gray-600">
                {user.displayName || user.email || "User"}
              </span>
              <button
                onClick={handleSignOut}
                className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              >
                Sign Out
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
