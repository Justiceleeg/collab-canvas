"use client";

// Toast Notification Component
// Displays temporary notification messages from the UI store

import { useEffect } from "react";
import { useUIStore } from "@/store/uiStore";

export default function Toast() {
  const { toast, hideToast } = useUIStore();

  // Auto-hide is already handled in the store, but we can add escape key support
  useEffect(() => {
    if (!toast.isVisible) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        hideToast();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [toast.isVisible, hideToast]);

  if (!toast.isVisible) return null;

  // Color scheme based on toast type
  const colorSchemes = {
    success: {
      bg: "bg-green-100",
      border: "border-green-400",
      text: "text-green-800",
      icon: "✓",
    },
    error: {
      bg: "bg-red-100",
      border: "border-red-400",
      text: "text-red-800",
      icon: "✗",
    },
    warning: {
      bg: "bg-yellow-100",
      border: "border-yellow-400",
      text: "text-yellow-800",
      icon: "⚠",
    },
    info: {
      bg: "bg-blue-100",
      border: "border-blue-400",
      text: "text-blue-800",
      icon: "ℹ",
    },
  };

  const scheme = colorSchemes[toast.type];

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in">
      <div
        className={`${scheme.bg} ${scheme.border} ${scheme.text} px-4 py-3 rounded shadow-lg border flex items-center gap-3 min-w-[250px] max-w-[400px]`}
      >
        <span className="text-xl font-bold">{scheme.icon}</span>
        <span className="flex-1 text-sm font-medium">{toast.message}</span>
        <button
          onClick={hideToast}
          className="text-gray-500 hover:text-gray-700 font-bold text-lg leading-none"
          aria-label="Close"
        >
          ×
        </button>
      </div>
    </div>
  );
}
