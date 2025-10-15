"use client";

// PR #11 - Text Shape Support - Text Editing
// Overlay HTML textarea for editing text on double-click

import { Html } from "react-konva-utils";
import { useEffect, useRef, useState } from "react";
import type Konva from "konva";

interface TextEditorProps {
  textNode: Konva.Text;
  onClose: () => void;
  onChange: (newText: string) => void;
}

export default function TextEditor({
  textNode,
  onClose,
  onChange,
}: TextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const initializedRef = useRef(false);
  const [initialText] = useState(textNode.text()); // Capture initial text once

  useEffect(() => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const stage = textNode.getStage();
    if (!stage) return;

    const isFirstRender = !initializedRef.current;

    // Only set initial value once, not on every re-render
    if (isFirstRender) {
      textarea.value = initialText;
      initializedRef.current = true;
    }

    // Get absolute position accounting for all transforms (Group + Stage)
    const textPosition = textNode.absolutePosition();

    // absolutePosition() gives position in stage coordinates
    // We need to convert to screen coordinates by adding stage container offset
    const areaPosition = {
      x: textPosition.x,
      y: textPosition.y,
    };

    // Match styles with the text node
    textarea.style.position = "absolute";
    textarea.style.top = `${areaPosition.y}px`;
    textarea.style.left = `${areaPosition.x}px`;
    textarea.style.width = `${textNode.width()}px`;
    textarea.style.fontSize = `${textNode.fontSize()}px`;
    textarea.style.border = "1px solid #0066FF";
    textarea.style.padding = `${textNode.padding()}px`;
    textarea.style.margin = "0px";
    textarea.style.overflow = "hidden";
    textarea.style.background = "none";
    textarea.style.outline = "none";
    textarea.style.resize = "none";
    textarea.style.lineHeight = textNode.lineHeight().toString();
    textarea.style.fontFamily = textNode.fontFamily();
    textarea.style.transformOrigin = "left top";
    textarea.style.textAlign = textNode.align();
    const fill = textNode.fill();
    textarea.style.color = typeof fill === "string" ? fill : "#000000";

    const rotation = textNode.rotation();
    let transform = "";
    if (rotation) {
      transform += `rotateZ(${rotation}deg)`;
    }
    textarea.style.transform = transform;

    // Auto-size height
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight + 3}px`;

    // Only focus and select on initial render
    if (isFirstRender) {
      textarea.focus();
      textarea.select(); // Select all text for easy editing
    }

    const handleSave = () => {
      const value = textarea.value;
      // Save and close - ensure onChange is called before close
      onChange(value);
      // Small delay to ensure async save operation completes
      setTimeout(() => {
        onClose();
      }, 50);
    };

    const handleOutsideClick = (e: MouseEvent) => {
      if (e.target !== textarea) {
        e.preventDefault();
        e.stopPropagation();
        handleSave();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSave();
      }
      if (e.key === "Escape") {
        onClose(); // Don't save on Escape
      }
    };

    const handleInput = () => {
      const scale = textNode.getAbsoluteScale().x;
      textarea.style.width = `${textNode.width() * scale}px`;
      textarea.style.height = "auto";
      textarea.style.height = `${
        textarea.scrollHeight + textNode.fontSize()
      }px`;
    };

    textarea.addEventListener("keydown", handleKeyDown);
    textarea.addEventListener("input", handleInput);

    // Delay adding click listener to prevent immediate close from double-click
    const timeoutId = setTimeout(() => {
      window.addEventListener("click", handleOutsideClick);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      textarea.removeEventListener("keydown", handleKeyDown);
      textarea.removeEventListener("input", handleInput);
      window.removeEventListener("click", handleOutsideClick);
    };
  }, [textNode, onChange, onClose, initialText]);

  return (
    <Html>
      <textarea
        ref={textareaRef}
        style={{
          minHeight: "1em",
          position: "absolute",
        }}
      />
    </Html>
  );
}
