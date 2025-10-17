"use client";

import { useState } from "react";
import { HexColorPicker } from "react-colorful";

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  label?: string;
}

export default function ColorPicker({
  color,
  onChange,
  label,
}: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      {label && (
        <label className="block text-xs font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}

      <div className="flex items-center gap-2">
        {/* Color swatch button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-10 h-10 rounded border-2 border-gray-300 hover:border-gray-400 transition-colors relative overflow-hidden"
          style={{ backgroundColor: color }}
          title={`Color: ${color}`}
        >
          {/* Checkerboard pattern for transparency preview */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)",
              backgroundSize: "8px 8px",
              backgroundPosition: "0 0, 0 4px, 4px -4px, -4px 0px",
            }}
          />
        </button>

        {/* Hex input */}
        <input
          type="text"
          value={color}
          onChange={(e) => {
            const value = e.target.value;
            // Only update if it's a valid hex color format
            if (/^#[0-9A-Fa-f]{0,6}$/.test(value) || value === "#") {
              onChange(value);
            }
          }}
          onBlur={(e) => {
            // Ensure valid hex on blur
            const value = e.target.value;
            if (!/^#[0-9A-Fa-f]{6}$/.test(value)) {
              onChange(color); // Reset to previous valid color
            }
          }}
          className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
          placeholder="#000000"
          maxLength={7}
        />
      </div>

      {/* Color picker popover */}
      {isOpen && (
        <>
          {/* Backdrop to close picker */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Picker popover */}
          <div className="absolute top-full left-0 mt-2 z-50 bg-white rounded-lg shadow-lg border border-gray-200 p-3">
            <HexColorPicker color={color} onChange={onChange} />

            {/* Quick preset colors */}
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="text-xs text-gray-500 mb-2">Quick Colors</div>
              <div className="grid grid-cols-6 gap-1.5">
                {[
                  "#000000",
                  "#FFFFFF",
                  "#FF0000",
                  "#00FF00",
                  "#0000FF",
                  "#FFFF00",
                  "#FF00FF",
                  "#00FFFF",
                  "#808080",
                  "#C0C0C0",
                  "#800000",
                  "#808000",
                ].map((presetColor) => (
                  <button
                    key={presetColor}
                    type="button"
                    onClick={() => {
                      onChange(presetColor);
                      setIsOpen(false);
                    }}
                    className="w-6 h-6 rounded border-2 border-gray-300 hover:border-gray-500 transition-colors"
                    style={{ backgroundColor: presetColor }}
                    title={presetColor}
                  />
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
