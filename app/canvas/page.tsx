"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import AuthGuard from "@/components/Auth/AuthGuard";

// TODO: PR #4 - Basic Canvas with Pan & Zoom
// Import Canvas component dynamically (to avoid SSR issues with Konva)
// Add canvas layout

export default function CanvasPage() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <AuthGuard requireAuth={true}>
      <div className="min-h-screen bg-gray-100">
        <div className="p-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h1 className="text-3xl font-bold mb-4">Canvas Page</h1>
            <p className="text-gray-600 mb-4">
              Welcome, {user?.displayName || "User"}!
            </p>
            <p className="text-gray-500 mb-4">
              Canvas implementation coming in PR #4
            </p>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
