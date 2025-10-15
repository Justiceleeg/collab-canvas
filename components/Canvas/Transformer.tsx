"use client";

// PR #12 - Transform Controls (Resize & Rotate)
// (Implemented early for PR #11 to show bounding boxes)
// Konva.Transformer for resize and rotate handles
// Attaches to selected shapes

import { useEffect, useRef } from "react";
import { Transformer as KonvaTransformer } from "react-konva";
import type Konva from "konva";

interface TransformerProps {
  selectedShapeIds: string[];
  isLocked?: boolean;
}

export default function Transformer({
  selectedShapeIds,
  isLocked = false,
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

  // Don't render transformer if locked by another user
  if (isLocked) {
    return null;
  }

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
      // Enable resize and rotate
      enabledAnchors={[
        "top-left",
        "top-center",
        "top-right",
        "middle-right",
        "middle-left",
        "bottom-left",
        "bottom-center",
        "bottom-right",
      ]}
      rotateEnabled={true}
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
    />
  );
}
