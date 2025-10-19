"use client";

// Bottom toolbar with shape selection tools
// Positioned at the bottom of the screen with floating style

import ShapeTools, { ShapeToolType } from "./ShapeTools";

interface BottomToolbarProps {
  selectedTool: ShapeToolType;
  onToolSelect: (tool: ShapeToolType) => void;
}

export default function BottomToolbar({
  selectedTool,
  onToolSelect,
}: BottomToolbarProps) {
  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-white rounded-xl shadow-xl px-3 py-2 border border-gray-200">
        <ShapeTools selectedTool={selectedTool} onToolSelect={onToolSelect} />
      </div>
    </div>
  );
}
