"use client";

import { useEffect, useState } from "react";
import { auth, db, rtdb } from "@/services/firebase";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { ref, set, get, remove } from "firebase/database";

export default function FirebaseTest() {
  const [firestoreStatus, setFirestoreStatus] = useState<string>("Testing...");
  const [realtimeDbStatus, setRealtimeDbStatus] =
    useState<string>("Testing...");
  const [authStatus, setAuthStatus] = useState<string>("Testing...");
  const [debugInfo, setDebugInfo] = useState<string>("");

  useEffect(() => {
    async function testFirebase() {
      // Debug info
      const dbUrl = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;
      const hasRtdb = rtdb !== null;
      setDebugInfo(
        `DB URL exists: ${!!dbUrl} | RTDB initialized: ${hasRtdb}${
          dbUrl ? ` | URL: ${dbUrl.substring(0, 30)}...` : ""
        }`
      );

      // Test Auth
      try {
        if (auth) {
          setAuthStatus("✅ Firebase Auth initialized");
        } else {
          setAuthStatus("❌ Firebase Auth not initialized");
        }
      } catch (error) {
        setAuthStatus(`❌ Auth Error: ${error}`);
      }

      // Test Firestore
      try {
        const testCollection = collection(db, "test");
        const testDoc = await addDoc(testCollection, {
          message: "Connection test",
          timestamp: new Date().toISOString(),
        });

        // Read it back
        const snapshot = await getDocs(testCollection);
        const found = snapshot.docs.find((d) => d.id === testDoc.id);

        // Clean up
        await deleteDoc(doc(db, "test", testDoc.id));

        if (found) {
          setFirestoreStatus(
            "✅ Firestore connected - Write & Read successful"
          );
        } else {
          setFirestoreStatus("⚠️ Firestore write succeeded but read failed");
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        setFirestoreStatus(`❌ Firestore Error: ${errorMessage}`);
      }

      // Test Realtime Database
      try {
        if (!rtdb) {
          setRealtimeDbStatus(
            "⚠️ Realtime Database not configured - Check NEXT_PUBLIC_FIREBASE_DATABASE_URL in .env.local"
          );
          return;
        }

        console.log("Testing Realtime Database connection...");
        const testRef = ref(rtdb, "test/connection");

        console.log("Writing to Realtime Database...");
        await set(testRef, {
          message: "Connection test",
          timestamp: Date.now(),
        });

        console.log("Reading from Realtime Database...");
        // Read it back
        const snapshot = await get(testRef);

        console.log("Cleaning up test data...");
        // Clean up
        await remove(testRef);

        if (snapshot.exists()) {
          console.log("✅ Realtime Database test successful!");
          setRealtimeDbStatus(
            "✅ Realtime Database connected - Write & Read successful"
          );
        } else {
          console.warn("⚠️ Write succeeded but read failed");
          setRealtimeDbStatus("⚠️ Realtime DB write succeeded but read failed");
        }
      } catch (error) {
        console.error("Realtime DB Error:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : (error as { code?: string })?.code || String(error);
        setRealtimeDbStatus(`❌ Realtime DB Error: ${errorMessage}`);
      }
    }

    testFirebase();
  }, []);

  return (
    <div className="w-full max-w-2xl p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        🔥 Firebase Connection Test
      </h2>

      <div className="space-y-4">
        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded">
          <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">
            Authentication
          </h3>
          <p className="text-sm text-gray-700 dark:text-gray-300 font-mono">
            {authStatus}
          </p>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded">
          <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">
            Firestore (Persistent Data)
          </h3>
          <p className="text-sm text-gray-700 dark:text-gray-300 font-mono">
            {firestoreStatus}
          </p>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded">
          <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">
            Realtime Database (Presence & Cursors)
          </h3>
          <p className="text-sm text-gray-700 dark:text-gray-300 font-mono">
            {realtimeDbStatus}
          </p>
        </div>
      </div>

      {debugInfo && (
        <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900 rounded border border-yellow-200 dark:border-yellow-700">
          <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
            🔍 Debug Info:
          </p>
          <p className="text-xs text-yellow-800 dark:text-yellow-200 font-mono">
            {debugInfo}
          </p>
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900 rounded border border-blue-200 dark:border-blue-700">
        <p className="text-sm text-blue-900 dark:text-blue-100">
          <strong>Note:</strong> If you see errors, check:
        </p>
        <ul className="text-xs text-blue-800 dark:text-blue-200 mt-2 ml-4 list-disc space-y-1">
          <li>Environment variables in .env.local are set correctly</li>
          <li>Firebase project has Firestore and Realtime Database enabled</li>
          <li>
            Database rules are set to allow test writes (we&apos;ll secure them
            later)
          </li>
        </ul>
      </div>
    </div>
  );
}
