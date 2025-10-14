"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

/**
 * AuthGuard component to protect routes and handle redirects based on auth state
 *
 * @param requireAuth - If true, requires user to be authenticated (default: true)
 * @param redirectTo - Where to redirect if auth requirement not met (default: /login for protected, /canvas for public)
 */
export default function AuthGuard({
  children,
  requireAuth = true,
  redirectTo,
}: AuthGuardProps) {
  const router = useRouter();
  const { user, loading, initialized } = useAuth();

  useEffect(() => {
    // Wait for auth to initialize
    if (!initialized) return;

    // Redirect logic
    if (requireAuth && !user) {
      // Protected route, no user -> redirect to login
      router.push(redirectTo || "/login");
    } else if (!requireAuth && user) {
      // Public route (like login), but user exists -> redirect to canvas
      router.push(redirectTo || "/canvas");
    }
  }, [user, initialized, requireAuth, redirectTo, router]);

  // Show loading state while checking auth
  if (loading || !initialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If auth requirement not met, show nothing (will redirect)
  if (requireAuth && !user) {
    return null;
  }

  // If user exists but on public route, show nothing (will redirect)
  if (!requireAuth && user) {
    return null;
  }

  // Render children if auth state is correct
  return <>{children}</>;
}


