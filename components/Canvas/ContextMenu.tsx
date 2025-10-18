"use client";

// Context Menu Component
// Displays a right-click context menu for shape operations
// Positioned at cursor location, shows relevant actions for selected shapes

import { useEffect, useRef } from "react";
import { useUIStore } from "@/store/uiStore";
import type { CanvasCommandService } from "@/services/canvasCommands";

interface ContextMenuProps {
  commands: CanvasCommandService;
}

export default function ContextMenu({ commands }: ContextMenuProps) {
  // Use selective selectors to avoid unnecessary re-renders
  const contextMenu = useUIStore((state) => state.contextMenu);
  const closeContextMenu = useUIStore((state) => state.closeContextMenu);
  const menuRef = useRef<HTMLDivElement>(null);

  const { isOpen, position, targetShapeIds } = contextMenu;

  // Close menu when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeContextMenu();
      }
    };

    // Close on Escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeContextMenu();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, closeContextMenu]);

  if (!isOpen) return null;

  const handleAction = async (action: () => Promise<void>) => {
    await action();
    closeContextMenu();
  };

  const isSingleShape = targetShapeIds.length === 1;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: "transparent" }}
      />

      {/* Context Menu */}
      <div
        ref={menuRef}
        className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 py-1 min-w-[180px]"
        style={{
          left: position.x,
          top: position.y,
        }}
      >
        {/* Duplicate */}
        <button
          className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center gap-2"
          onClick={() =>
            handleAction(() => commands.duplicateShapes(targetShapeIds))
          }
        >
          <span className="text-lg">📋</span>
          <span>Duplicate</span>
          <span className="ml-auto text-xs text-gray-400">⌘D</span>
        </button>

        {/* Copy */}
        <button
          className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center gap-2"
          onClick={() =>
            handleAction(() => commands.copyShapes(targetShapeIds))
          }
        >
          <span className="text-lg">📄</span>
          <span>Copy</span>
          <span className="ml-auto text-xs text-gray-400">⌘C</span>
        </button>

        {/* Paste */}
        <button
          className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center gap-2"
          onClick={() => {
            handleAction(() => commands.pasteShapes());
          }}
        >
          <span className="text-lg">📋</span>
          <span>Paste</span>
          <span className="ml-auto text-xs text-gray-400">⌘V</span>
        </button>

        <div className="border-t border-gray-200 my-1" />

        {/* Bring to Front */}
        <button
          className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center gap-2"
          onClick={() =>
            handleAction(() => commands.bringToFront(targetShapeIds))
          }
        >
          <span className="text-lg">⏫</span>
          <span>Bring to Front</span>
          <span className="ml-auto text-xs text-gray-400">]</span>
        </button>

        {/* Bring Forward */}
        <button
          className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center gap-2"
          onClick={() =>
            handleAction(() => commands.bringForward(targetShapeIds))
          }
        >
          <span className="text-lg">⬆️</span>
          <span>Bring Forward</span>
          <span className="ml-auto text-xs text-gray-400">Shift+]</span>
        </button>

        {/* Send Backward */}
        <button
          className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center gap-2"
          onClick={() =>
            handleAction(() => commands.sendBackward(targetShapeIds))
          }
        >
          <span className="text-lg">⬇️</span>
          <span>Send Backward</span>
          <span className="ml-auto text-xs text-gray-400">Shift+[</span>
        </button>

        {/* Send to Back */}
        <button
          className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center gap-2"
          onClick={() =>
            handleAction(() => commands.sendToBack(targetShapeIds))
          }
        >
          <span className="text-lg">⏬</span>
          <span>Send to Back</span>
          <span className="ml-auto text-xs text-gray-400">[</span>
        </button>

        {/* Properties (only show for single shape) */}
        {isSingleShape && (
          <>
            <div className="border-t border-gray-200 my-1" />
            <button
              className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center gap-2"
              onClick={() => {
                commands.openPropertiesPanel(targetShapeIds[0]);
                closeContextMenu();
              }}
            >
              <span className="text-lg">⚙️</span>
              <span>Properties...</span>
            </button>
          </>
        )}

        <div className="border-t border-gray-200 my-1" />

        {/* Delete */}
        <button
          className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 hover:text-red-600 transition-colors flex items-center gap-2"
          onClick={() =>
            handleAction(() => commands.deleteShapes(targetShapeIds))
          }
        >
          <span className="text-lg">🗑️</span>
          <span>Delete</span>
          <span className="ml-auto text-xs text-gray-400">⌫</span>
        </button>
      </div>
    </>
  );
}
