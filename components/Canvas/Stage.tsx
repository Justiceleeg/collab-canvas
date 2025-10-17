"use client";

// PR #4 - Basic Canvas with Pan & Zoom
// PR #14 - Drag-to-Select (Selection Box)
// Konva Stage wrapper component
// - Konva Stage setup
// - Pan and zoom controls (mouse wheel + drag)
// - Viewport state management
// - Drag-to-select functionality

import { useRef, useEffect, useState } from "react";
import { Stage as KonvaStage, Layer } from "react-konva";
import Konva from "konva";
import { useCanvasStore } from "@/store/canvasStore";
import SelectionBox from "./SelectionBox";

interface StageProps {
  width: number;
  height: number;
  children?: React.ReactNode;
  onStageClick?: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  stageRef?: React.RefObject<Konva.Stage | null>;
  onSelectionBoxChange?: (
    box: {
      x: number;
      y: number;
      width: number;
      height: number;
    } | null
  ) => void;
  onCursorMove?: (x: number, y: number) => void; // Canvas coordinates (world space)
}

export default function Stage({
  width,
  height,
  children,
  onStageClick,
  stageRef: externalStageRef,
  onSelectionBoxChange,
  onCursorMove,
}: StageProps) {
  const internalStageRef = useRef<Konva.Stage>(null);
  const stageRef = externalStageRef || internalStageRef;
  const { viewport, updateViewport } = useCanvasStore();

  const isPanning = useRef(false);
  const lastPointerPosition = useRef({ x: 0, y: 0 });
  const isSpacePressed = useRef(false);

  // PR #14 - Selection box state
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // Track space key for panning
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !isSpacePressed.current) {
        isSpacePressed.current = true;
        // Change cursor to indicate pan mode
        const container = stageRef.current?.container();
        if (container) {
          container.style.cursor = "grab";
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        isSpacePressed.current = false;
        isPanning.current = false;
        // Reset cursor
        const container = stageRef.current?.container();
        if (container) {
          container.style.cursor = "default";
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [stageRef]);

  // Handle mouse wheel for zooming
  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();

    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = viewport.scale;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    // Zoom sensitivity
    const scaleBy = 1.05;
    const direction = e.evt.deltaY > 0 ? -1 : 1;

    // Calculate new scale with limits
    let newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;
    newScale = Math.max(0.1, Math.min(5, newScale)); // Limit zoom between 0.1x and 5x

    // Calculate new position to zoom towards pointer
    const mousePointTo = {
      x: (pointer.x - viewport.x) / oldScale,
      y: (pointer.y - viewport.y) / oldScale,
    };

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };

    updateViewport({
      scale: newScale,
      x: newPos.x,
      y: newPos.y,
    });
  };

  // Handle mouse down for panning or selection
  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // Pan with middle mouse button OR space + left click
    const isMiddleButton = e.evt.button === 1;
    const isSpaceAndLeftClick = e.evt.button === 0 && isSpacePressed.current;

    if (isMiddleButton || isSpaceAndLeftClick) {
      e.evt.preventDefault();
      isPanning.current = true;
      const stage = stageRef.current;
      if (!stage) return;

      const pos = stage.getPointerPosition();
      if (pos) {
        lastPointerPosition.current = pos;
      }

      // Change cursor when actively panning
      const container = stage.container();
      if (container) {
        container.style.cursor = "grabbing";
      }
      return;
    }

    // PR #14 - Start selection box on left click on empty canvas
    const isLeftClick = e.evt.button === 0;
    const clickedOnEmpty =
      e.target === e.target.getStage() ||
      e.target.getType() === "Stage" ||
      e.target.getType() === "Layer";

    if (isLeftClick && clickedOnEmpty && !isSpacePressed.current) {
      const stage = stageRef.current;
      if (!stage) return;

      const pos = stage.getPointerPosition();
      if (pos) {
        // getPointerPosition() returns position relative to stage (screen coordinates)
        // We need to get the relative position considering the stage's transformation
        const pointerPos = stage.getRelativePointerPosition();

        setIsSelecting(true);
        setSelectionStart(pointerPos);
        setSelectionEnd(pointerPos);
      }
    }
  };

  // Handle mouse move for panning or selection
  const handleMouseMove = () => {
    const stage = stageRef.current;
    if (!stage) return;

    const pos = stage.getPointerPosition();
    if (!pos) return;

    // Track cursor position in canvas space for multiplayer
    const relativePos = stage.getRelativePointerPosition();
    if (relativePos && onCursorMove) {
      onCursorMove(relativePos.x, relativePos.y);
    }

    // Handle panning
    if (isPanning.current) {
      const dx = pos.x - lastPointerPosition.current.x;
      const dy = pos.y - lastPointerPosition.current.y;

      updateViewport({
        x: viewport.x + dx,
        y: viewport.y + dy,
      });

      lastPointerPosition.current = pos;
      return;
    }

    // PR #14 - Handle selection box dragging
    if (isSelecting && selectionStart) {
      // getRelativePointerPosition() accounts for stage transformation
      const pointerPos = stage.getRelativePointerPosition();
      if (pointerPos) {
        setSelectionEnd(pointerPos);
      }
    }
  };

  // Handle mouse up to stop panning or finalize selection
  const handleMouseUp = () => {
    // Stop panning
    if (isPanning.current) {
      isPanning.current = false;

      // Reset cursor
      const container = stageRef.current?.container();
      if (container) {
        container.style.cursor = isSpacePressed.current ? "grab" : "default";
      }
      return;
    }

    // PR #14 - Finalize selection box
    if (isSelecting && selectionStart && selectionEnd) {
      // Calculate selection box dimensions
      const box = {
        x: Math.min(selectionStart.x, selectionEnd.x),
        y: Math.min(selectionStart.y, selectionEnd.y),
        width: Math.abs(selectionEnd.x - selectionStart.x),
        height: Math.abs(selectionEnd.y - selectionStart.y),
      };

      // Only trigger selection if box has meaningful size (> 5 pixels)
      if (box.width > 5 || box.height > 5) {
        onSelectionBoxChange?.(box);
      }

      // PR #14 - Reset selection state in timeout
      // This allows the click event to check if we just finished selecting
      // and prevent it from clearing the selection
      setTimeout(() => {
        setIsSelecting(false);
        setSelectionStart(null);
        setSelectionEnd(null);
      });
    }
  };

  // Handle stage click (for shape creation, etc.)
  const handleClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // PR #14 - Don't trigger click if we just finished a selection box drag
    // Check if selection box was just used (before timeout resets it)
    const wasSelectingWithBox =
      isSelecting &&
      selectionStart &&
      selectionEnd &&
      (Math.abs(selectionEnd.x - selectionStart.x) > 5 ||
        Math.abs(selectionEnd.y - selectionStart.y) > 5);

    if (wasSelectingWithBox) {
      return;
    }

    // Only trigger if we didn't pan and clicked on empty canvas (not on a shape)
    // Check if the target is the stage or the layer (background)
    const clickedOnEmpty =
      e.target === e.target.getStage() ||
      e.target.getType() === "Stage" ||
      e.target.getType() === "Layer";

    if (!isPanning.current && clickedOnEmpty) {
      onStageClick?.(e);
    }
  };

  // Calculate selection box dimensions for rendering
  const selectionBoxDimensions =
    isSelecting && selectionStart && selectionEnd
      ? {
          x: Math.min(selectionStart.x, selectionEnd.x),
          y: Math.min(selectionStart.y, selectionEnd.y),
          width: Math.abs(selectionEnd.x - selectionStart.x),
          height: Math.abs(selectionEnd.y - selectionStart.y),
        }
      : null;

  return (
    <KonvaStage
      ref={stageRef}
      width={width}
      height={height}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleClick}
      onTap={handleClick}
      scaleX={viewport.scale}
      scaleY={viewport.scale}
      x={viewport.x}
      y={viewport.y}
      draggable={false}
    >
      <Layer>
        {children}
        {/* PR #14 - Render selection box during drag */}
        {selectionBoxDimensions && (
          <SelectionBox
            x={selectionBoxDimensions.x}
            y={selectionBoxDimensions.y}
            width={selectionBoxDimensions.width}
            height={selectionBoxDimensions.height}
            visible={true}
          />
        )}
      </Layer>
    </KonvaStage>
  );
}
