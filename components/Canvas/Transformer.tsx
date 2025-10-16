"use client";

// PR #12 - Transform Controls (Resize & Rotate)
// Konva.Transformer for resize and rotate handles
// Attaches to selected shapes
// Handles locking during transformation and syncs to Firestore

import { useEffect, useRef, useCallback } from "react";
import { Transformer as KonvaTransformer } from "react-konva";
import type Konva from "konva";

interface TransformerProps {
  selectedShapeIds: string[];
  isLocked?: boolean;
  onTransformStart?: (shapeIds: string[]) => void;
  onTransformEnd?: (
    transformedShapes: Array<{
      id: string;
      x: number;
      y: number;
      width: number;
      height: number;
      rotation: number;
      scaleX: number;
      scaleY: number;
    }>
  ) => void;
}

export default function Transformer({
  selectedShapeIds,
  isLocked = false,
  onTransformStart,
  onTransformEnd,
}: TransformerProps) {
  const transformerRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    const transformer = transformerRef.current;
    if (!transformer) return;

    // Find the selected nodes on the stage
    const stage = transformer.getStage();
    if (!stage) return;

    // Get all nodes with the selected IDs
    const selectedNodes = selectedShapeIds
      .map((id) => stage.findOne(`#${id}`) as Konva.Node)
      .filter((node) => node !== null);

    // Attach transformer to the selected nodes
    if (selectedNodes.length > 0) {
      transformer.nodes(selectedNodes);
    } else {
      transformer.nodes([]);
    }

    // Update transformer layer
    transformer.getLayer()?.batchDraw();
  }, [selectedShapeIds]);

  // Handle transform start - acquire locks
  const handleTransformStart = useCallback(() => {
    if (onTransformStart) {
      onTransformStart(selectedShapeIds);
    }
  }, [onTransformStart, selectedShapeIds]);

  // Handle transform end - sync changes to Firestore
  const handleTransformEnd = useCallback(() => {
    const transformer = transformerRef.current;
    if (!transformer || !onTransformEnd) return;

    const nodes = transformer.nodes();
    const transformedShapes = nodes.map((node) => {
      const shape = node as Konva.Shape;

      // Get the transformed attributes
      const scaleX = shape.scaleX() || 1;
      const scaleY = shape.scaleY() || 1;
      const rotation = shape.rotation() || 0;

      // For groups (like Text), get position from the group
      const x = shape.x();
      const y = shape.y();
      const width = shape.width() * scaleX;
      const height = shape.height() * scaleY;

      // Reset scale to 1 after applying to dimensions
      // This prevents scale accumulation on subsequent transforms
      shape.scaleX(1);
      shape.scaleY(1);

      return {
        id: shape.id(),
        x,
        y,
        width,
        height,
        rotation,
        scaleX,
        scaleY,
      };
    });

    onTransformEnd(transformedShapes);
  }, [onTransformEnd]);

  // Don't render transformer if locked by another user
  if (isLocked) {
    return null;
  }

  // Disable rotation and scaling when multiple shapes are selected
  const isMultiSelect = selectedShapeIds.length > 1;

  return (
    <KonvaTransformer
      ref={transformerRef}
      // Transformer styling - solid thin line
      borderStroke="#0066FF"
      borderStrokeWidth={1}
      borderDash={[]}
      anchorFill="#0066FF"
      anchorStroke="#ffffff"
      anchorStrokeWidth={1}
      anchorSize={6}
      anchorCornerRadius={1}
      // Enable resize and rotate only for single selection
      // Multi-select: only dragging is allowed (no anchors, no rotation)
      enabledAnchors={
        isMultiSelect
          ? []
          : [
              "top-left",
              "top-center",
              "top-right",
              "middle-right",
              "middle-left",
              "bottom-left",
              "bottom-center",
              "bottom-right",
            ]
      }
      rotateEnabled={!isMultiSelect}
      // Keep aspect ratio for circles (optional)
      keepRatio={false}
      // Bounding box settings
      boundBoxFunc={(oldBox, newBox) => {
        // Minimum size constraint
        if (newBox.width < 10 || newBox.height < 10) {
          return oldBox;
        }
        return newBox;
      }}
      // Transform event handlers
      onTransformStart={handleTransformStart}
      onTransformEnd={handleTransformEnd}
    />
  );
}
