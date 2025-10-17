// Keyboard Shortcuts Hook
// Centralized keyboard event handling for the canvas
// Consolidates all keyboard shortcuts in one place

import { useEffect, useCallback } from "react";
import { useSelectionStore } from "@/store/selectionStore";
import { useUIStore } from "@/store/uiStore";
import type { CanvasCommandService } from "@/services/canvasCommands";
import type { HistoryManager } from "@/services/historyManager";

interface UseKeyboardShortcutsProps {
  commands: CanvasCommandService;
  historyManager: HistoryManager;
  editingTextId: string | null;
  activeTool: string | null;
  onEscapeKey?: () => void;
}

/**
 * Check if user is currently typing in an input field
 */
function isTypingInInput(target: EventTarget | null): boolean {
  if (!target) return false;
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    (target as HTMLElement).isContentEditable
  );
}

/**
 * Centralized keyboard shortcuts management
 */
export function useKeyboardShortcuts({
  commands,
  historyManager,
  editingTextId,
  activeTool,
  onEscapeKey,
}: UseKeyboardShortcutsProps) {
  const { selectedIds, deselectAll } = useSelectionStore();
  const { setModifier, togglePropertiesPanel } = useUIStore();

  // Track modifier keys (Shift, Ctrl/Cmd, Alt)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Shift") setModifier("shift", true);
      if (e.key === "Control") setModifier("ctrl", true);
      if (e.key === "Meta") setModifier("meta", true);
      if (e.key === "Alt") setModifier("alt", true);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Shift") setModifier("shift", false);
      if (e.key === "Control") setModifier("ctrl", false);
      if (e.key === "Meta") setModifier("meta", false);
      if (e.key === "Alt") setModifier("alt", false);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [setModifier]);

  // Main keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      // Allow undo/redo shortcuts even when focused on inputs (they're command-level actions)
      const isUndoRedo =
        (cmdOrCtrl && e.key === "z") || (cmdOrCtrl && e.key === "y");

      // Don't handle other shortcuts when typing in inputs or editing text
      if (!isUndoRedo && (isTypingInInput(e.target) || editingTextId)) {
        return;
      }

      // Escape key: Deselect all and exit active tool
      if (e.key === "Escape") {
        deselectAll();
        if (onEscapeKey) {
          onEscapeKey();
        }
        return;
      }

      // Delete/Backspace: Delete selected shapes
      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        selectedIds.length > 0
      ) {
        e.preventDefault();
        await commands.deleteShapes(selectedIds);
        return;
      }

      // Cmd/Ctrl + D: Duplicate selected shapes
      if (cmdOrCtrl && e.key === "d" && selectedIds.length > 0) {
        e.preventDefault();
        await commands.duplicateShapes(selectedIds);
        return;
      }

      // Cmd/Ctrl + C: Copy selected shapes
      if (cmdOrCtrl && e.key === "c" && selectedIds.length > 0) {
        e.preventDefault();
        await commands.copyShapes(selectedIds);
        return;
      }

      // Cmd/Ctrl + V: Paste shapes
      if (cmdOrCtrl && e.key === "v") {
        e.preventDefault();
        await commands.pasteShapes();
        return;
      }

      // Cmd/Ctrl + A: Select all shapes
      if (cmdOrCtrl && e.key === "a") {
        e.preventDefault();
        // TODO: Implement select all in future PR
        console.log("Select all - coming soon");
        return;
      }

      // Cmd/Ctrl + Z: Undo
      if (cmdOrCtrl && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        await historyManager.undo();
        return;
      }

      // Cmd/Ctrl + Shift + Z or Cmd/Ctrl + Y: Redo
      if (
        (cmdOrCtrl && e.shiftKey && e.key === "z") ||
        (cmdOrCtrl && e.key === "y")
      ) {
        e.preventDefault();
        await historyManager.redo();
        return;
      }

      // Arrow keys: Move selected shapes (with modifier for larger steps)
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        if (selectedIds.length > 0) {
          e.preventDefault();

          const step = e.shiftKey ? 10 : 1; // Shift for larger steps
          const delta = { x: 0, y: 0 };

          switch (e.key) {
            case "ArrowUp":
              delta.y = -step;
              break;
            case "ArrowDown":
              delta.y = step;
              break;
            case "ArrowLeft":
              delta.x = -step;
              break;
            case "ArrowRight":
              delta.x = step;
              break;
          }

          await commands.moveShapes(selectedIds, delta);
        }
        return;
      }

      // Shift + ] or }: Bring forward
      if (
        (e.key === "}" || (e.key === "]" && e.shiftKey)) &&
        selectedIds.length > 0
      ) {
        e.preventDefault();
        await commands.bringForward(selectedIds);
        return;
      }

      // Shift + [ or {: Send backward
      if (
        (e.key === "{" || (e.key === "[" && e.shiftKey)) &&
        selectedIds.length > 0
      ) {
        e.preventDefault();
        await commands.sendBackward(selectedIds);
        return;
      }

      // ]: Bring to front
      if (e.key === "]" && !e.shiftKey && selectedIds.length > 0) {
        e.preventDefault();
        await commands.bringToFront(selectedIds);
        return;
      }

      // [: Send to back
      if (e.key === "[" && !e.shiftKey && selectedIds.length > 0) {
        e.preventDefault();
        await commands.sendToBack(selectedIds);
        return;
      }

      // P: Toggle properties panel
      if (e.key === "p" || e.key === "P") {
        e.preventDefault();
        togglePropertiesPanel();
        return;
      }

      // Cmd/Ctrl + G: Group selected shapes
      if (cmdOrCtrl && e.key === "g" && selectedIds.length > 1) {
        e.preventDefault();
        await commands.groupShapes(selectedIds);
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    commands,
    historyManager,
    selectedIds,
    editingTextId,
    activeTool,
    onEscapeKey,
    deselectAll,
    togglePropertiesPanel,
  ]);

  // Return current modifier state for components that need it
  const modifiers = useUIStore((state) => state.modifiers);
  return { modifiers };
}
