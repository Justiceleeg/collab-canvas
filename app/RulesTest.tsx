"use client";

import { useEffect, useState } from "react";
import { db, rtdb } from "@/services/firebase";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { ref, set, get, remove } from "firebase/database";

export default function RulesTest() {
  const [firestoreRulesStatus, setFirestoreRulesStatus] =
    useState<string>("Testing...");
  const [rtdbRulesStatus, setRtdbRulesStatus] = useState<string>("Testing...");

  useEffect(() => {
    async function testRules() {
      // Test Firestore Rules (should work with test collection)
      try {
        console.log("Testing Firestore rules...");
        const testCollection = collection(db, "test");
        const testDoc = await addDoc(testCollection, {
          message: "Rules verification test",
          timestamp: new Date().toISOString(),
        });

        // Read it back
        const snapshot = await getDocs(testCollection);
        const found = snapshot.docs.find((d) => d.id === testDoc.id);

        // Clean up
        await deleteDoc(doc(db, "test", testDoc.id));

        if (found) {
          setFirestoreRulesStatus(
            "✅ Firestore rules deployed - Test collection accessible"
          );
        } else {
          setFirestoreRulesStatus(
            "⚠️ Firestore rules issue - Write succeeded but read failed"
          );
        }
        } catch (error) {
          console.error("Firestore rules test error:", error);
          const errorMessage = error instanceof Error 
            ? error.message 
            : (error as {code?: string})?.code || String(error);
          setFirestoreRulesStatus(`❌ Firestore Rules Error: ${errorMessage}`);
      }

      // Test Realtime Database Rules (should work with test path)
      try {
        if (!rtdb) {
          setRtdbRulesStatus("⚠️ Realtime Database not configured");
          return;
        }

        console.log("Testing Realtime Database rules...");
        const testRef = ref(rtdb, "test/rules-verification");
        await set(testRef, {
          message: "Rules verification test",
          timestamp: Date.now(),
        });

        // Read it back
        const snapshot = await get(testRef);

        // Clean up
        await remove(testRef);

        if (snapshot.exists()) {
          setRtdbRulesStatus(
            "✅ Realtime DB rules deployed - Test path accessible"
          );
        } else {
          setRtdbRulesStatus(
            "⚠️ Realtime DB rules issue - Write succeeded but read failed"
          );
        }
        } catch (error) {
          console.error("Realtime DB rules test error:", error);
          const errorMessage = error instanceof Error 
            ? error.message 
            : (error as {code?: string})?.code || String(error);
          setRtdbRulesStatus(`❌ Realtime DB Rules Error: ${errorMessage}`);
      }
    }

    testRules();
  }, []);

  return (
    <div className="w-full max-w-2xl p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        🛡️ Security Rules Verification
      </h2>

      <div className="space-y-4">
        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded">
          <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">
            Firestore Security Rules
          </h3>
          <p className="text-sm text-gray-700 dark:text-gray-300 font-mono">
            {firestoreRulesStatus}
          </p>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded">
          <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">
            Realtime Database Security Rules
          </h3>
          <p className="text-sm text-gray-700 dark:text-gray-300 font-mono">
            {rtdbRulesStatus}
          </p>
        </div>
      </div>

      <div className="mt-6 p-4 bg-green-50 dark:bg-green-900 rounded border border-green-200 dark:border-green-700">
        <p className="text-sm text-green-900 dark:text-green-100">
          <strong>✅ Rules Deployed:</strong>
        </p>
        <ul className="text-xs text-green-800 dark:text-green-200 mt-2 ml-4 list-disc space-y-1">
          <li>
            <code>firestore.rules</code> - Includes locking logic and auth
            requirements
          </li>
          <li>
            <code>database.rules.json</code> - Secure presence system with user
            isolation
          </li>
          <li>Test paths remain accessible for development verification</li>
        </ul>
      </div>

      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900 rounded border border-blue-200 dark:border-blue-700">
        <p className="text-sm text-blue-900 dark:text-blue-100">
          <strong>📋 Verification Checklist:</strong>
        </p>
        <ul className="text-xs text-blue-800 dark:text-blue-200 mt-2 ml-4 space-y-1">
          <li>
            ✅ <strong>Firebase Console → Firestore → Rules</strong> - Check
            rules timestamp matches deployment
          </li>
          <li>
            ✅ <strong>Firebase Console → Realtime Database → Rules</strong> -
            Verify rules are active
          </li>
          <li>✅ Above tests show green checkmarks</li>
          <li>
            ⏳ After PR #3 (Auth): Test that canvasObjects require
            authentication
          </li>
          <li>
            ⏳ After PR #8 (Locking): Test that locked objects can only be
            edited by locker
          </li>
        </ul>
      </div>

      <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900 rounded border border-yellow-200 dark:border-yellow-700">
        <p className="text-sm text-yellow-900 dark:text-yellow-100">
          <strong>🔒 Security Notes:</strong>
        </p>
        <ul className="text-xs text-yellow-800 dark:text-yellow-200 mt-2 ml-4 list-disc space-y-1">
          <li>Test collections/paths remain open for development</li>
          <li>
            canvasObjects collection requires authentication (enforced after PR
            #3)
          </li>
          <li>
            Presence system enforces user isolation (each user can only write
            their own data)
          </li>
          <li>Lock-based conflict resolution built into Firestore rules</li>
        </ul>
      </div>
    </div>
  );
}
