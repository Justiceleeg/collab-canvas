"use client";

// PR #6 - Rectangle Shape Creation & Rendering
// Shape creation buttons for toolbar

export type ShapeToolType = "rectangle" | "circle" | "text" | null;

interface ShapeToolsProps {
  selectedTool: ShapeToolType;
  onToolSelect: (tool: ShapeToolType) => void;
}

export default function ShapeTools({
  selectedTool,
  onToolSelect,
}: ShapeToolsProps) {
  return (
    <div className="shape-tools flex gap-2 items-center">
      <span className="text-sm text-gray-600 font-medium mr-2">Shapes:</span>

      {/* Rectangle Tool */}
      <button
        className={`tool-button ${
          selectedTool === "rectangle"
            ? "bg-blue-500 text-white"
            : "bg-white text-gray-700 hover:bg-gray-100"
        } px-4 py-2 rounded border border-gray-300 flex items-center gap-2 transition-colors`}
        onClick={() =>
          onToolSelect(selectedTool === "rectangle" ? null : "rectangle")
        }
        title="Rectangle (R)"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            x="3"
            y="5"
            width="14"
            height="10"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
          />
        </svg>
        <span className="text-sm">Rectangle</span>
      </button>

      {/* Circle Tool - Coming in PR #10 */}
      <button
        className="tool-button bg-gray-100 text-gray-400 px-4 py-2 rounded border border-gray-300 flex items-center gap-2 cursor-not-allowed opacity-50"
        disabled
        title="Circle (Coming in PR #10)"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx="10"
            cy="10"
            r="7"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
          />
        </svg>
        <span className="text-sm">Circle</span>
      </button>

      {/* Text Tool - Coming in PR #11 */}
      <button
        className="tool-button bg-gray-100 text-gray-400 px-4 py-2 rounded border border-gray-300 flex items-center gap-2 cursor-not-allowed opacity-50"
        disabled
        title="Text (Coming in PR #11)"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M5 4h10M10 4v12M7 16h6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
        <span className="text-sm">Text</span>
      </button>

      {/* Clear selection */}
      {selectedTool && (
        <button
          className="tool-button bg-white text-gray-700 px-3 py-2 rounded border border-gray-300 hover:bg-gray-100 transition-colors"
          onClick={() => onToolSelect(null)}
          title="Deselect tool (Esc)"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M15 5L5 15M5 5l10 10"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
