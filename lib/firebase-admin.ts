// Firebase Admin SDK for server-side operations
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Initialize Firebase Admin if not already initialized
// Gracefully handle missing credentials during build time
let adminDb: ReturnType<typeof getFirestore> | null = null;

if (!getApps().length) {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  // Only initialize if credentials are available (not during build)
  if (projectId && clientEmail && privateKey) {
    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, "\n"),
      }),
    });
    adminDb = getFirestore();
  } else if (process.env.NODE_ENV !== "production") {
    console.warn(
      "Firebase Admin credentials not found. AI tools will not work until credentials are added to .env.local"
    );
  }
} else {
  adminDb = getFirestore();
}

export { adminDb };
