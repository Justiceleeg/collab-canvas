"use client";

// Layer Panel Component
// Displays a list of all shapes ordered by zIndex (render order)
// Supports click-to-select, drag-to-reorder, and auto-scroll to selected shape

import { useEffect, useRef, useState } from "react";
import { useCanvasStore } from "@/store/canvasStore";
import { useSelectionStore } from "@/store/selectionStore";
import { useUIStore } from "@/store/uiStore";
import { firestoreService } from "@/services/firestore.service";
import type { CanvasObject } from "@/types/canvas.types";

interface LayerPanelProps {
  userId?: string;
}

export default function LayerPanel({ userId }: LayerPanelProps) {
  const { layerPanel, toggleLayerPanel } = useUIStore();
  const { objects } = useCanvasStore();
  const { selectedIds, setSelectedIds } = useSelectionStore();

  const panelRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Sort shapes by zIndex (highest first = top of list)
  const sortedShapes = [...objects].sort((a, b) => b.zIndex - a.zIndex);

  // Auto-scroll to center selected shape when selection changes
  useEffect(() => {
    if (!layerPanel.isOpen || selectedIds.length !== 1 || !panelRef.current) {
      return;
    }

    const selectedId = selectedIds[0];
    const itemElement = itemRefs.current.get(selectedId);

    if (itemElement && panelRef.current) {
      const panelRect = panelRef.current.getBoundingClientRect();
      const itemRect = itemElement.getBoundingClientRect();

      // Calculate scroll position to center the item vertically
      const scrollTop =
        itemElement.offsetTop - panelRect.height / 2 + itemRect.height / 2;

      panelRef.current.scrollTo({
        top: scrollTop,
        behavior: "smooth",
      });
    }
  }, [selectedIds, layerPanel.isOpen]);

  const handleItemClick = (shapeId: string) => {
    setSelectedIds([shapeId]);
  };

  const handleDragStart = (e: React.DragEvent, shapeId: string) => {
    setDraggedItemId(shapeId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedItemId(null);
    setDragOverIndex(null);
  };

  const handleDrop = async (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();

    if (!draggedItemId || !userId) {
      setDraggedItemId(null);
      setDragOverIndex(null);
      return;
    }

    const draggedShape = sortedShapes.find((s) => s.id === draggedItemId);
    if (!draggedShape) return;

    const currentIndex = sortedShapes.findIndex((s) => s.id === draggedItemId);

    if (currentIndex === targetIndex) {
      setDraggedItemId(null);
      setDragOverIndex(null);
      return;
    }

    // Reorder: assign new zIndex values based on new position
    const newOrder = [...sortedShapes];
    newOrder.splice(currentIndex, 1);
    newOrder.splice(targetIndex, 0, draggedShape);

    // Update zIndex for all affected shapes
    // Top of list = highest zIndex, bottom = lowest
    const updates = newOrder.map((shape, index) => ({
      id: shape.id,
      zIndex: newOrder.length - index,
    }));

    try {
      // Update all shapes in parallel
      await Promise.all(
        updates.map((update) =>
          firestoreService.updateObject(
            update.id,
            { zIndex: update.zIndex },
            userId
          )
        )
      );
    } catch (error) {
      console.error("Error reordering layers:", error);
    }

    setDraggedItemId(null);
    setDragOverIndex(null);
  };

  if (!layerPanel.isOpen) {
    // Collapsed state - just show expand button
    return (
      <div className="fixed left-4 top-20 z-30">
        <button
          onClick={toggleLayerPanel}
          className="bg-white rounded-lg shadow-lg border border-gray-200 p-2 hover:bg-gray-50 transition-colors"
          title="Open Layers Panel"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            className="text-gray-700"
          >
            <rect
              x="2"
              y="3"
              width="16"
              height="3"
              rx="1"
              fill="currentColor"
            />
            <rect
              x="2"
              y="8"
              width="16"
              height="3"
              rx="1"
              fill="currentColor"
            />
            <rect
              x="2"
              y="13"
              width="16"
              height="3"
              rx="1"
              fill="currentColor"
            />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed left-4 top-20 z-30 bg-white rounded-lg shadow-xl border border-gray-200 w-[200px] max-h-[calc(100vh-120px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700">Layers</h3>
        <button
          onClick={toggleLayerPanel}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          title="Close Layers Panel"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className="text-gray-500"
          >
            <path
              d="M12 4L4 12M4 4l8 8"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      {/* Layer list */}
      <div
        ref={panelRef}
        className="flex-1 overflow-y-auto overflow-x-hidden"
        style={{ scrollBehavior: "smooth" }}
      >
        {sortedShapes.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-400">
            No shapes yet
          </div>
        ) : (
          <div className="py-2">
            {sortedShapes.map((shape, index) => {
              const isSelected = selectedIds.includes(shape.id);
              const isDragging = draggedItemId === shape.id;
              const showDropIndicator =
                dragOverIndex === index && draggedItemId !== shape.id;

              return (
                <div key={shape.id}>
                  {/* Drop indicator line */}
                  {showDropIndicator && (
                    <div className="h-0.5 bg-blue-500 mx-2 my-0.5" />
                  )}

                  <div
                    ref={(el) => {
                      if (el) {
                        itemRefs.current.set(shape.id, el);
                      } else {
                        itemRefs.current.delete(shape.id);
                      }
                    }}
                    draggable
                    onDragStart={(e) => handleDragStart(e, shape.id)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    onDrop={(e) => handleDrop(e, index)}
                    onClick={() => handleItemClick(shape.id)}
                    className={`
                      mx-2 my-1 px-2 py-2 rounded cursor-pointer
                      flex items-center gap-2
                      transition-all
                      ${
                        isSelected
                          ? "bg-blue-50 border-2 border-blue-500"
                          : "bg-gray-50 border-2 border-transparent hover:border-gray-300"
                      }
                      ${isDragging ? "opacity-50" : "opacity-100"}
                    `}
                  >
                    {/* Drag handle */}
                    <div className="flex-shrink-0 text-gray-400 cursor-grab active:cursor-grabbing">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="currentColor"
                      >
                        <rect x="1" y="2" width="10" height="1.5" rx="0.75" />
                        <rect
                          x="1"
                          y="5.25"
                          width="10"
                          height="1.5"
                          rx="0.75"
                        />
                        <rect x="1" y="8.5" width="10" height="1.5" rx="0.75" />
                      </svg>
                    </div>

                    {/* Shape preview */}
                    <div className="flex-shrink-0">
                      <ShapePreview shape={shape} />
                    </div>

                    {/* Shape info */}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-gray-700 truncate capitalize">
                        {shape.type}
                      </div>
                      {shape.type === "text" && shape.text && (
                        <div className="text-xs text-gray-500 truncate">
                          {shape.text}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Drop indicator at the end */}
            {dragOverIndex === sortedShapes.length && (
              <div className="h-0.5 bg-blue-500 mx-2 my-0.5" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Mini canvas preview component
function ShapePreview({ shape }: { shape: CanvasObject }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, 40, 40);

    // Calculate scale to fit shape in 40x40 preview while maintaining aspect ratio
    const padding = 4;
    const availableSize = 40 - padding * 2;
    const scale = Math.min(
      availableSize / shape.width,
      availableSize / shape.height
    );

    const scaledWidth = shape.width * scale;
    const scaledHeight = shape.height * scale;

    // Center the shape in the preview
    const offsetX = (40 - scaledWidth) / 2;
    const offsetY = (40 - scaledHeight) / 2;

    ctx.save();
    ctx.translate(offsetX + scaledWidth / 2, offsetY + scaledHeight / 2);
    ctx.rotate((shape.rotation || 0) * (Math.PI / 180));
    ctx.translate(-scaledWidth / 2, -scaledHeight / 2);

    ctx.fillStyle = shape.color;

    if (shape.type === "rectangle") {
      ctx.fillRect(0, 0, scaledWidth, scaledHeight);
    } else if (shape.type === "circle") {
      // Draw ellipse (circle can have different width/height for ovals)
      ctx.beginPath();
      ctx.ellipse(
        scaledWidth / 2,
        scaledHeight / 2,
        scaledWidth / 2,
        scaledHeight / 2,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();
    } else if (shape.type === "text") {
      // For text, just show a colored rectangle with "T" icon
      ctx.fillRect(0, 0, scaledWidth, scaledHeight);
      ctx.fillStyle = "white";
      ctx.font = `${Math.max(12, scaledHeight * 0.6)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("T", scaledWidth / 2, scaledHeight / 2);
    }

    ctx.restore();
  }, [shape]);

  return (
    <canvas
      ref={canvasRef}
      width={40}
      height={40}
      className="border border-gray-200 rounded bg-white"
    />
  );
}
