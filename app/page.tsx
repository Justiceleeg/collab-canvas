"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function Home() {
  const router = useRouter();
  const { user, initialized } = useAuth();

  useEffect(() => {
    // Wait for auth to initialize
    if (!initialized) return;

    // Redirect based on auth state
    if (user) {
      router.push("/canvas");
    } else {
      router.push("/login");
    }
  }, [user, initialized, router]);

  // Show loading state while determining where to redirect
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4 text-gray-800">
          🧩 Collab Canvas
        </h1>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}
