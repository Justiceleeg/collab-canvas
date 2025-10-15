"use client";

// PR #4 - Basic Canvas with Pan & Zoom
// Konva Stage wrapper component
// - Konva Stage setup
// - Pan and zoom controls (mouse wheel + drag)
// - Viewport state management

import { useRef, useEffect } from "react";
import { Stage as KonvaStage, Layer } from "react-konva";
import Konva from "konva";
import { useCanvasStore } from "@/store/canvasStore";

interface StageProps {
  width: number;
  height: number;
  children?: React.ReactNode;
  onStageClick?: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  stageRef?: React.RefObject<Konva.Stage | null>;
}

export default function Stage({
  width,
  height,
  children,
  onStageClick,
  stageRef: externalStageRef,
}: StageProps) {
  const internalStageRef = useRef<Konva.Stage>(null);
  const stageRef = externalStageRef || internalStageRef;
  const { viewport, updateViewport } = useCanvasStore();

  const isPanning = useRef(false);
  const lastPointerPosition = useRef({ x: 0, y: 0 });
  const isSpacePressed = useRef(false);

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
  }, []);

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

  // Handle mouse down for panning
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
    }
  };

  // Handle mouse move for panning
  const handleMouseMove = () => {
    if (!isPanning.current) return;

    const stage = stageRef.current;
    if (!stage) return;

    const pos = stage.getPointerPosition();
    if (!pos) return;

    const dx = pos.x - lastPointerPosition.current.x;
    const dy = pos.y - lastPointerPosition.current.y;

    updateViewport({
      x: viewport.x + dx,
      y: viewport.y + dy,
    });

    lastPointerPosition.current = pos;
  };

  // Handle mouse up to stop panning
  const handleMouseUp = () => {
    isPanning.current = false;

    // Reset cursor
    const container = stageRef.current?.container();
    if (container) {
      container.style.cursor = isSpacePressed.current ? "grab" : "default";
    }
  };

  // Handle stage click (for shape creation, etc.)
  const handleClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    console.log("Stage click event:", {
      targetType: e.target.getType(),
      targetName: e.target.name(),
      isPanning: isPanning.current,
    });

    // Only trigger if we didn't pan and clicked on empty canvas (not on a shape)
    // Check if the target is the stage or the layer (background)
    const clickedOnEmpty =
      e.target === e.target.getStage() ||
      e.target.getType() === "Stage" ||
      e.target.getType() === "Layer";

    console.log("Clicked on empty?", clickedOnEmpty);

    if (!isPanning.current && clickedOnEmpty) {
      console.log("Calling onStageClick handler");
      onStageClick?.(e);
    } else {
      console.log("Not calling onStageClick - conditions not met");
    }
  };

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
      <Layer>{children}</Layer>
    </KonvaStage>
  );
}
