"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSelectionStore } from "@/store/selectionStore";
import { useCanvasStore } from "@/store/canvasStore";
import { useUIStore } from "@/store/uiStore";
import { CanvasObject } from "@/types/canvas.types";
import ColorPicker from "./ColorPicker";
import { useAuth } from "@/hooks/useAuth";
import { useCanvasCommands } from "@/services/canvasCommands";
import { useActiveLock } from "@/hooks/useActiveLock";

// Validation helper function
function validatePropertyUpdates(
  updates: Partial<CanvasObject>
): Partial<CanvasObject> {
  const validated = { ...updates };

  // Validate opacity (0-1)
  if (validated.opacity !== undefined) {
    validated.opacity = Math.max(0, Math.min(1, validated.opacity));
  }

  // Validate rotation (0-360)
  if (validated.rotation !== undefined) {
    validated.rotation = validated.rotation % 360;
    if (validated.rotation < 0) {
      validated.rotation += 360;
    }
  }

  // Validate dimensions (minimum 1)
  if (validated.width !== undefined) {
    validated.width = Math.max(1, validated.width);
  }
  if (validated.height !== undefined) {
    validated.height = Math.max(1, validated.height);
  }

  // Validate stroke width (minimum 0)
  if (validated.strokeWidth !== undefined) {
    validated.strokeWidth = Math.max(0, validated.strokeWidth);
  }

  return validated;
}

export default function PropertiesPanel() {
  const { user } = useAuth();
  const isOpen = useUIStore((state) => state.propertiesPanel.isOpen);
  const togglePanel = useUIStore((state) => state.togglePropertiesPanel);
  const selectedIds = useSelectionStore((state) => state.selectedIds);
  const getObjectById = useCanvasStore((state) => state.getObjectById);

  // Get command service
  const lockManager = useActiveLock();
  const commands = useCanvasCommands(lockManager, user?.uid);

  // Get selected shape (only if exactly one is selected)
  const selectedShape =
    selectedIds.length === 1 ? getObjectById(selectedIds[0]) : null;

  // Local state for form inputs (for immediate UI updates)
  const [formData, setFormData] = useState<Partial<CanvasObject>>({});

  // Debounce timer ref
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Track original values before optimistic updates (for history capture)
  const originalValuesRef = useRef<Record<string, any>>({});

  // Update form data when selection changes or selectedShape.id changes
  // Use selectedShape.id in dependency to avoid resetting during property updates
  const selectedShapeId = selectedShape?.id;
  useEffect(() => {
    if (selectedShape) {
      setFormData({
        x: selectedShape.x,
        y: selectedShape.y,
        width: selectedShape.width,
        height: selectedShape.height,
        rotation: selectedShape.rotation || 0,
        color: selectedShape.color,
        strokeColor: selectedShape.strokeColor || "#000000",
        strokeWidth: selectedShape.strokeWidth || 0,
        opacity:
          selectedShape.opacity !== undefined ? selectedShape.opacity : 1,
        text: selectedShape.text || "",
        fontSize: selectedShape.fontSize || 16,
        fontWeight: selectedShape.fontWeight || "normal",
        fontStyle: selectedShape.fontStyle || "normal",
      });

      // Clear original values ref when selection changes
      originalValuesRef.current = {};
    }
  }, [selectedShapeId]); // Only reset when selection changes, not on every property update

  // Debounced update function - updates Firestore via commands
  const updateShapeDebounced = useCallback(
    (
      updates: Partial<CanvasObject>,
      originalValues?: Partial<CanvasObject>
    ) => {
      if (!selectedShape) return;

      // Clear existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set new timer
      debounceTimerRef.current = setTimeout(async () => {
        try {
          // Use command service with original values for proper history capture
          await commands.updateShapeProperties(
            selectedShape.id,
            updates,
            originalValues
          );

          // Clear captured original values after successful update
          originalValuesRef.current = {};
        } catch (error) {
          // Command service already logs and shows toast
          console.error("Error updating shape properties:", error);
        }
      }, 150); // 150ms debounce
    },
    [selectedShape, commands]
  );

  // Immediate update function - for discrete actions like color changes
  const updateShapeImmediate = useCallback(
    async (updates: Partial<CanvasObject>) => {
      if (!selectedShape) return;

      // Cancel any pending debounced updates
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      try {
        // Use command service (includes validation and error handling)
        await commands.updateShapeProperties(selectedShape.id, updates);
      } catch (error) {
        // Command service already logs and shows toast
        console.error("Error updating shape properties:", error);
      }
    },
    [selectedShape, commands]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleInputChange = (
    field: keyof CanvasObject,
    value: string | number
  ) => {
    // Capture original value BEFORE any changes (for history)
    if (!originalValuesRef.current[field] && selectedShape) {
      originalValuesRef.current[field] = selectedShape[field];
    }

    // Update local state immediately for responsive UI
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Also update canvas store immediately for instant visual feedback (optimistic)
    if (selectedShape) {
      useCanvasStore
        .getState()
        .updateObject(selectedShape.id, { [field]: value });
    }

    // Debounce Firestore update with original values
    const originalValues: Partial<CanvasObject> = {};
    Object.keys(originalValuesRef.current).forEach((key) => {
      originalValues[key as keyof CanvasObject] =
        originalValuesRef.current[key];
    });
    updateShapeDebounced({ [field]: value }, originalValues);
  };

  const handleColorChange = (field: "color" | "strokeColor", value: string) => {
    // Update local state immediately
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Update Firestore immediately (colors are discrete actions)
    updateShapeImmediate({ [field]: value });
  };

  const handleToggle = (field: "fontWeight" | "fontStyle") => {
    const currentValue = formData[field] as string;
    const newValue =
      field === "fontWeight"
        ? currentValue === "bold"
          ? "normal"
          : "bold"
        : currentValue === "italic"
        ? "normal"
        : "italic";

    // Update local state and Firestore immediately
    setFormData((prev) => ({ ...prev, [field]: newValue }));
    updateShapeImmediate({ [field]: newValue });
  };

  if (!isOpen) {
    // Collapsed state - show expand button
    return (
      <div className="fixed right-0 top-16 z-30">
        <button
          onClick={togglePanel}
          className="bg-white border border-l-0 border-gray-300 rounded-l-lg px-2 py-3 hover:bg-gray-50 transition-colors shadow-md"
          title="Open Properties Panel (P)"
        >
          <svg
            className="w-5 h-5 text-gray-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
      </div>
    );
  }

  // Prevent wheel events from propagating to canvas (which would zoom)
  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      className="fixed right-0 top-16 bottom-0 w-80 bg-white border-l border-gray-300 shadow-lg z-30 overflow-y-auto"
      onWheel={handleWheel}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 bg-gray-50">
        <h2 className="text-xs font-semibold text-gray-800">Properties</h2>
        <button
          onClick={togglePanel}
          className="p-1 hover:bg-gray-200 rounded transition-colors"
          title="Close Properties Panel (P)"
        >
          <svg
            className="w-5 h-5 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="p-3">
        {selectedIds.length === 0 && (
          <div className="text-xs text-gray-500 text-center py-6">
            No shape selected
          </div>
        )}

        {selectedIds.length > 1 && (
          <div className="text-xs text-gray-500 text-center py-6">
            Multiple shapes selected
            <div className="text-xs mt-1">
              Select a single shape to edit properties
            </div>
          </div>
        )}

        {selectedShape && (
          <div className="space-y-3">
            {/* Shape Type Badge */}
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {selectedShape.type}
            </div>

            {/* Position */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-700">
                Position
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">X</label>
                  <input
                    type="number"
                    value={Math.round(formData.x || 0)}
                    onChange={(e) =>
                      handleInputChange("x", parseFloat(e.target.value) || 0)
                    }
                    className="w-full px-2 py-1.5 text-sm text-black border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Y</label>
                  <input
                    type="number"
                    value={Math.round(formData.y || 0)}
                    onChange={(e) =>
                      handleInputChange("y", parseFloat(e.target.value) || 0)
                    }
                    className="w-full px-2 py-1.5 text-sm text-black border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Size */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-700">
                Size
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Width
                  </label>
                  <input
                    type="number"
                    value={Math.round(formData.width || 0)}
                    onChange={(e) =>
                      handleInputChange(
                        "width",
                        parseFloat(e.target.value) || 1
                      )
                    }
                    min="1"
                    className="w-full px-2 py-1.5 text-sm text-black border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Height
                  </label>
                  <input
                    type="number"
                    value={Math.round(formData.height || 0)}
                    onChange={(e) =>
                      handleInputChange(
                        "height",
                        parseFloat(e.target.value) || 1
                      )
                    }
                    min="1"
                    className="w-full px-2 py-1.5 text-sm text-black border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Rotation */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-700">
                Rotation
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="range"
                  value={formData.rotation || 0}
                  onChange={(e) =>
                    handleInputChange("rotation", parseFloat(e.target.value))
                  }
                  min="0"
                  max="360"
                  className="flex-1"
                />
                <input
                  type="number"
                  value={Math.round(formData.rotation || 0)}
                  onChange={(e) =>
                    handleInputChange(
                      "rotation",
                      parseFloat(e.target.value) || 0
                    )
                  }
                  min="0"
                  max="360"
                  className="w-16 px-2 py-1.5 text-sm text-black border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <span className="text-xs text-gray-500">°</span>
              </div>
            </div>

            {/* Opacity */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-700">
                Opacity
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="range"
                  value={
                    (formData.opacity !== undefined ? formData.opacity : 1) *
                    100
                  }
                  onChange={(e) =>
                    handleInputChange(
                      "opacity",
                      parseFloat(e.target.value) / 100
                    )
                  }
                  min="0"
                  max="100"
                  className="flex-1"
                />
                <input
                  type="number"
                  value={Math.round(
                    (formData.opacity !== undefined ? formData.opacity : 1) *
                      100
                  )}
                  onChange={(e) =>
                    handleInputChange(
                      "opacity",
                      parseFloat(e.target.value) / 100
                    )
                  }
                  min="0"
                  max="100"
                  className="w-16 px-2 py-1.5 text-sm text-black border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <span className="text-xs text-gray-500">%</span>
              </div>
            </div>

            {/* Text-specific properties */}
            {selectedShape.type === "text" && (
              <>
                {/* Text Content */}
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700">
                    Text
                  </label>
                  <textarea
                    value={formData.text || ""}
                    onChange={(e) => handleInputChange("text", e.target.value)}
                    className="w-full px-2 py-1.5 text-sm text-black border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={2}
                  />
                </div>

                {/* Font Size */}
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700">
                    Font Size
                  </label>
                  <input
                    type="number"
                    value={formData.fontSize || 16}
                    onChange={(e) =>
                      handleInputChange(
                        "fontSize",
                        parseFloat(e.target.value) || 16
                      )
                    }
                    min="8"
                    max="200"
                    className="w-full px-2 py-1.5 text-sm text-black border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Text Style Buttons */}
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700">
                    Style
                  </label>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleToggle("fontWeight")}
                      className={`flex-1 px-3 py-2 text-sm font-bold border rounded transition-colors ${
                        formData.fontWeight === "bold"
                          ? "bg-blue-500 text-white border-blue-500"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      B
                    </button>
                    <button
                      onClick={() => handleToggle("fontStyle")}
                      className={`flex-1 px-3 py-2 text-sm italic border rounded transition-colors ${
                        formData.fontStyle === "italic"
                          ? "bg-blue-500 text-white border-blue-500"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      I
                    </button>
                  </div>
                </div>

                {/* Text Color */}
                <ColorPicker
                  label="Text Color"
                  color={formData.color || "#000000"}
                  onChange={(color) => handleColorChange("color", color)}
                />
              </>
            )}

            {/* Rectangle/Circle-specific properties */}
            {(selectedShape.type === "rectangle" ||
              selectedShape.type === "circle") && (
              <>
                {/* Fill Color */}
                <ColorPicker
                  label="Fill Color"
                  color={formData.color || "#000000"}
                  onChange={(color) => handleColorChange("color", color)}
                />

                {/* Stroke Color */}
                <ColorPicker
                  label="Stroke Color"
                  color={formData.strokeColor || "#000000"}
                  onChange={(color) => handleColorChange("strokeColor", color)}
                />

                {/* Stroke Width */}
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700">
                    Stroke Width
                  </label>
                  <input
                    type="number"
                    value={formData.strokeWidth || 0}
                    onChange={(e) =>
                      handleInputChange(
                        "strokeWidth",
                        parseFloat(e.target.value) || 0
                      )
                    }
                    min="0"
                    max="50"
                    className="w-full px-2 py-1.5 text-sm text-black border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
