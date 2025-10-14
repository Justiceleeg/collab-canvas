"use client";

// PR #4 - Basic Canvas with Pan & Zoom
// PR #5 - Firestore Sync Infrastructure (with test panel)
// Import Canvas component dynamically (to avoid SSR issues with Konva)
// Add canvas layout

import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import AuthGuard from "@/components/Auth/AuthGuard";
import dynamic from "next/dynamic";

// Import Canvas dynamically to avoid SSR issues with Konva
const Canvas = dynamic(() => import("@/components/Canvas/Canvas"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading canvas...</p>
      </div>
    </div>
  ),
});

// Import TestPanel for PR #5 testing (can be removed in production)
const TestPanel = dynamic(() => import("@/components/DevTools/TestPanel"), {
  ssr: false,
});

export default function CanvasPage() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <AuthGuard requireAuth={true}>
      <div className="canvas-page">
        {/* Top toolbar */}
        <div className="canvas-header">
          <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200">
            <div className="flex items-center gap-4">
              <h1 className="text-lg font-semibold text-gray-800">
                Collab Canvas
              </h1>
              <span className="text-sm text-gray-500">
                Welcome, {user?.displayName || "User"}
              </span>
            </div>
            <button
              onClick={handleSignOut}
              className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Canvas area */}
        <Canvas />

        {/* Test Panel - for PR #5 testing (remove in production) */}
        {process.env.NODE_ENV === "development" && <TestPanel />}
      </div>
    </AuthGuard>
  );
}
