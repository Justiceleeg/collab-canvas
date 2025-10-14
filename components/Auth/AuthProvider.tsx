"use client";

import React, { createContext, useEffect, useState, useCallback } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/services/firebase";
import { User, AuthState } from "@/types/user.types";
import { mapFirebaseUser } from "@/services/auth.service";

interface AuthContextType extends AuthState {
  initialized: boolean;
  refreshUser: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  initialized: false,
  refreshUser: () => {},
});

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });
  const [initialized, setInitialized] = useState(false);

  // Manual refresh function to force update auth state
  const refreshUser = useCallback(() => {
    if (auth.currentUser) {
      const user: User = mapFirebaseUser(auth.currentUser);
      setAuthState({ user, loading: false, error: null });
    }
  }, []);

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        if (firebaseUser) {
          const user: User = mapFirebaseUser(firebaseUser);
          setAuthState({ user, loading: false, error: null });
        } else {
          setAuthState({ user: null, loading: false, error: null });
        }
        setInitialized(true);
      },
      (error) => {
        console.error("Auth state change error:", error);
        setAuthState({ user: null, loading: false, error });
        setInitialized(true);
      }
    );

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ ...authState, initialized, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}
