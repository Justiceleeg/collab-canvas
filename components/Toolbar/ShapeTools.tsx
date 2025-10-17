"use client";

// Shape creation buttons for toolbar
// Designed for bottom toolbar with dark theme

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
    <div className="shape-tools flex gap-1.5 items-center">
      {/* Rectangle Tool */}
      <button
        className={`tool-button ${
          selectedTool === "rectangle"
            ? "bg-blue-500 text-white"
            : "bg-gray-700 text-gray-300 hover:bg-gray-600"
        } p-2 rounded-lg flex items-center justify-center transition-all hover:scale-105`}
        onClick={() =>
          onToolSelect(selectedTool === "rectangle" ? null : "rectangle")
        }
        title="Rectangle (R)"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            x="4"
            y="6"
            width="16"
            height="12"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            rx="2"
          />
        </svg>
      </button>

      {/* Circle Tool */}
      <button
        className={`tool-button ${
          selectedTool === "circle"
            ? "bg-blue-500 text-white"
            : "bg-gray-700 text-gray-300 hover:bg-gray-600"
        } p-2 rounded-lg flex items-center justify-center transition-all hover:scale-105`}
        onClick={() =>
          onToolSelect(selectedTool === "circle" ? null : "circle")
        }
        title="Circle (C)"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx="12"
            cy="12"
            r="8"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
          />
        </svg>
      </button>

      {/* Text Tool */}
      <button
        className={`tool-button ${
          selectedTool === "text"
            ? "bg-blue-500 text-white"
            : "bg-gray-700 text-gray-300 hover:bg-gray-600"
        } p-2 rounded-lg flex items-center justify-center transition-all hover:scale-105`}
        onClick={() => onToolSelect(selectedTool === "text" ? null : "text")}
        title="Text (T)"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M6 5h12M12 5v14M9 19h6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {/* Clear selection */}
      {selectedTool && (
        <>
          <div className="h-6 w-px bg-gray-600 mx-0.5"></div>
          <button
            className="tool-button bg-gray-700 text-gray-300 hover:bg-gray-600 p-2 rounded-lg flex items-center justify-center transition-all hover:scale-105"
            onClick={() => onToolSelect(null)}
            title="Deselect tool (Esc)"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M18 6L6 18M6 6l12 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </>
      )}
    </div>
  );
}
