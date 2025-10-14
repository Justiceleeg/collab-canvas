"use client";

// PR #5 - Testing panel for Firestore sync
// Dev tool to test canvas functionality

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useFirestoreSync } from "@/hooks/useFirestore";
import { useCanvasStore } from "@/store/canvasStore";
import { firestoreService } from "@/services/firestore.service";
import {
  generateTestRectangles,
  generateTestCircles,
  generateMixedTestObjects,
} from "@/utils/testHelpers";

export default function TestPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  const { user } = useAuth();
  const { deleteObjects } = useFirestoreSync();
  const objects = useCanvasStore((state) => state.objects);

  const showMessage = (msg: string, duration = 3000) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), duration);
  };

  const handleCreateTestRectangles = async (count: number) => {
    if (!user) return;
    setIsLoading(true);

    try {
      const rectangles = generateTestRectangles(count, user.uid);

      // Use batch create for better performance
      await firestoreService.batchCreateObjects(rectangles, user.uid);

      showMessage(`✅ Created ${count} test rectangles`);
    } catch (error) {
      console.error("Error creating test rectangles:", error);
      showMessage("❌ Error creating rectangles");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTestCircles = async (count: number) => {
    if (!user) return;
    setIsLoading(true);

    try {
      const circles = generateTestCircles(count, user.uid);
      await firestoreService.batchCreateObjects(circles, user.uid);
      showMessage(`✅ Created ${count} test circles`);
    } catch (error) {
      console.error("Error creating test circles:", error);
      showMessage("❌ Error creating circles");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateMixedObjects = async (count: number) => {
    if (!user) return;
    setIsLoading(true);

    try {
      const mixedObjects = generateMixedTestObjects(count, user.uid);
      await firestoreService.batchCreateObjects(mixedObjects, user.uid);
      showMessage(`✅ Created ${count} mixed objects`);
    } catch (error) {
      console.error("Error creating mixed objects:", error);
      showMessage("❌ Error creating objects");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearAll = async () => {
    if (!user) return;
    if (!confirm(`Delete all ${objects.length} objects?`)) return;

    setIsLoading(true);

    try {
      const objectIds = objects.map((obj) => obj.id);
      await deleteObjects(objectIds);
      showMessage(`✅ Deleted ${objectIds.length} objects`);
    } catch (error) {
      console.error("Error clearing objects:", error);
      showMessage("❌ Error clearing objects");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStressTest = async () => {
    if (!user) return;
    if (!confirm("This will create 100 objects. Continue?")) return;

    setIsLoading(true);

    try {
      const startTime = performance.now();
      const mixedObjects = generateMixedTestObjects(100, user.uid);
      await firestoreService.batchCreateObjects(mixedObjects, user.uid);
      const duration = performance.now() - startTime;

      showMessage(
        `✅ Stress test complete: 100 objects in ${duration.toFixed(0)}ms`
      );
    } catch (error) {
      console.error("Error in stress test:", error);
      showMessage("❌ Stress test failed");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 px-4 py-2 bg-purple-600 text-white rounded-lg shadow-lg hover:bg-purple-700 transition-colors z-50"
        title="Open Test Panel"
      >
        🧪 Test Tools
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-80 bg-white rounded-lg shadow-2xl border border-gray-200 z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-purple-50">
        <h3 className="font-semibold text-gray-800">🧪 Test Panel</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
        {/* Status */}
        <div className="p-3 bg-gray-50 rounded text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Objects:</span>
            <span className="font-semibold">{objects.length}</span>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-gray-600">User:</span>
            <span className="font-semibold text-xs truncate ml-2">
              {user?.displayName || user?.uid.slice(0, 8)}
            </span>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
            {message}
          </div>
        )}

        {/* Quick Actions */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-600 uppercase">
            Quick Add
          </p>

          <button
            onClick={() => handleCreateTestRectangles(5)}
            disabled={isLoading}
            className="w-full px-3 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            + 5 Rectangles
          </button>

          <button
            onClick={() => handleCreateTestCircles(5)}
            disabled={isLoading}
            className="w-full px-3 py-2 text-sm bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            + 5 Circles
          </button>

          <button
            onClick={() => handleCreateMixedObjects(10)}
            disabled={isLoading}
            className="w-full px-3 py-2 text-sm bg-purple-500 text-white rounded hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            + 10 Mixed Objects
          </button>
        </div>

        {/* Stress Test */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-600 uppercase">
            Performance
          </p>

          <button
            onClick={handleStressTest}
            disabled={isLoading}
            className="w-full px-3 py-2 text-sm bg-orange-500 text-white rounded hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            🔥 Stress Test (100 objects)
          </button>
        </div>

        {/* Danger Zone */}
        <div className="space-y-2 pt-2 border-t border-gray-200">
          <p className="text-xs font-semibold text-red-600 uppercase">
            Danger Zone
          </p>

          <button
            onClick={handleClearAll}
            disabled={isLoading || objects.length === 0}
            className="w-full px-3 py-2 text-sm bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            🗑️ Clear All Objects
          </button>
        </div>

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex items-center justify-center py-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-gray-200 bg-gray-50 text-xs text-gray-500 rounded-b-lg">
        Open in multiple tabs to test real-time sync
      </div>
    </div>
  );
}
