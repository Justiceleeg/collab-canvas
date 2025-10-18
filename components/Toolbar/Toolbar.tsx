"use client";

// Main toolbar component
// Top bar with logo, presence avatars, and user menu

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import PresenceAvatars from "../Presence/PresenceAvatars";
import { useHistoryStore } from "@/store/historyStore";
import { useHistoryManager } from "@/services/historyManager";

export default function Toolbar() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const historyManager = useHistoryManager(user?.uid);
  // Use selective selectors to avoid unnecessary re-renders
  const canUndo = useHistoryStore((state) => state.canUndo);
  const canRedo = useHistoryStore((state) => state.canRedo);

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

          <div className="toolbar-divider h-8 w-px bg-gray-300"></div>

          {/* Undo/Redo buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => historyManager.undo()}
              disabled={!canUndo()}
              className={`p-2 rounded-md transition-all ${
                canUndo()
                  ? "bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200"
                  : "bg-gray-100 text-gray-300 cursor-not-allowed border border-gray-200"
              }`}
              title="Undo (⌘Z)"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 7v6h6" />
                <path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13" />
              </svg>
            </button>
            <button
              onClick={() => historyManager.redo()}
              disabled={!canRedo()}
              className={`p-2 rounded-md transition-all ${
                canRedo()
                  ? "bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200"
                  : "bg-gray-100 text-gray-300 cursor-not-allowed border border-gray-200"
              }`}
              title="Redo (⌘⇧Z)"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 7v6h-6" />
                <path d="M3 17a9 9 0 019-9 9 9 0 016 2.3l3 2.7" />
              </svg>
            </button>
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
