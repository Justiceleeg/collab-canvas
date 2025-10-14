"use client";

import { useContext } from "react";
import { AuthContext } from "@/components/Auth/AuthProvider";
import { authService } from "@/services/auth.service";

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return {
    user: context.user,
    loading: context.loading,
    error: context.error,
    initialized: context.initialized,
    refreshUser: context.refreshUser,

    // Auth methods
    signInWithEmail: authService.signInWithEmail,
    signUpWithEmail: authService.signUpWithEmail,
    signInAnonymously: authService.signInAnonymously,
    signOut: authService.signOut,
    updateDisplayName: authService.updateDisplayName,
  };
}
