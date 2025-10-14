"use client";

// PR #4 - Basic Canvas with Pan & Zoom
// PR #5 - Firestore Sync Infrastructure (with test panel)
// Import Canvas component dynamically (to avoid SSR issues with Konva)
// Add canvas layout

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
  return (
    <AuthGuard requireAuth={true}>
      <div className="canvas-page">
        {/* Canvas area - includes toolbar */}
        <Canvas />

        {/* Test Panel - for PR #5 testing (remove in production) */}
        {process.env.NODE_ENV === "development" && <TestPanel />}
      </div>
    </AuthGuard>
  );
}
