import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  signOut as firebaseSignOut,
  updateProfile,
  User as FirebaseUser,
} from "firebase/auth";
import { auth } from "./firebase";
import { User } from "@/types/user.types";

/**
 * Convert Firebase User to our User type
 */
export const mapFirebaseUser = (firebaseUser: FirebaseUser): User => {
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email || undefined,
    displayName: firebaseUser.displayName || "Anonymous User",
    isAnonymous: firebaseUser.isAnonymous,
  };
};

export const authService = {
  /**
   * Sign in with email and password
   */
  signInWithEmail: async (email: string, password: string): Promise<User> => {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    return mapFirebaseUser(userCredential.user);
  },

  /**
   * Sign up with email and password
   */
  signUpWithEmail: async (
    email: string,
    password: string,
    displayName: string
  ): Promise<User> => {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    // Set display name
    if (displayName) {
      await updateProfile(userCredential.user, { displayName });
      // Reload user to get updated profile
      await userCredential.user.reload();
    }

    return mapFirebaseUser(auth.currentUser || userCredential.user);
  },

  /**
   * Sign in anonymously
   */
  signInAnonymously: async (displayName?: string): Promise<User> => {
    const userCredential = await signInAnonymously(auth);

    // Set display name for anonymous users
    if (displayName) {
      await updateProfile(userCredential.user, { displayName });
      // Reload user to get updated profile
      await userCredential.user.reload();
    }

    return mapFirebaseUser(auth.currentUser || userCredential.user);
  },

  /**
   * Sign out current user
   * The onDisconnect() handlers will automatically mark user as offline
   */
  signOut: async (): Promise<void> => {
    // Don't manually clean up presence - let onDisconnect() handle it
    // This avoids permission denied errors when auth token is invalidated
    await firebaseSignOut(auth);
  },

  /**
   * Update user display name
   */
  updateDisplayName: async (displayName: string): Promise<void> => {
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, { displayName });
    }
  },

  /**
   * Get current user
   */
  getCurrentUser: (): User | null => {
    if (auth.currentUser) {
      return mapFirebaseUser(auth.currentUser);
    }
    return null;
  },
};
