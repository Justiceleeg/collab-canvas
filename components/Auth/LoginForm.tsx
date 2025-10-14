"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function LoginForm() {
  const router = useRouter();
  const { signInWithEmail, signUpWithEmail, signInAnonymously, refreshUser } =
    useAuth();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "signup") {
        await signUpWithEmail(email, password, displayName || "User");
        // Force refresh to get updated display name
        setTimeout(() => refreshUser(), 100);
      } else {
        await signInWithEmail(email, password);
      }
      router.push("/canvas");
    } catch (err: any) {
      console.error("Auth error:", err);
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleAnonymousLogin = async () => {
    setError(null);
    setLoading(true);

    try {
      await signInAnonymously(displayName || `Guest_${Date.now()}`);
      // Force refresh to get updated display name
      setTimeout(() => refreshUser(), 100);
      router.push("/canvas");
    } catch (err: any) {
      console.error("Anonymous auth error:", err);
      setError(err.message || "Anonymous login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">
        Collab Canvas
      </h1>
      <p className="text-center text-gray-600 mb-8">
        Collaborative real-time drawing board
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex mb-6 border-b border-gray-300">
        <button
          onClick={() => setMode("signin")}
          className={`flex-1 py-2 text-center font-medium transition-colors ${
            mode === "signin"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Sign In
        </button>
        <button
          onClick={() => setMode("signup")}
          className={`flex-1 py-2 text-center font-medium transition-colors ${
            mode === "signup"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Sign Up
        </button>
      </div>

      {/* Email/Password Form */}
      <form onSubmit={handleEmailAuth} className="space-y-4">
        {mode === "signup" && (
          <div>
            <label
              htmlFor="displayName"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Display Name
            </label>
            <input
              type="text"
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              placeholder="Your name"
            />
          </div>
        )}

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Loading..." : mode === "signin" ? "Sign In" : "Sign Up"}
        </button>
      </form>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or</span>
        </div>
      </div>

      {/* Anonymous Login */}
      <div className="space-y-4">
        <div>
          <label
            htmlFor="anonymousName"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Guest Name (Optional)
          </label>
          <input
            type="text"
            id="anonymousName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-500 focus:border-transparent text-gray-900"
            placeholder="Guest User"
          />
        </div>

        <button
          type="button"
          onClick={handleAnonymousLogin}
          disabled={loading}
          className="w-full py-3 px-4 bg-gray-600 text-white font-medium rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Loading..." : "Continue as Guest"}
        </button>
      </div>
    </div>
  );
}
