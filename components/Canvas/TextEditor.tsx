"use client";

// PR #11 - Text Shape Support - Text Editing
// Overlay HTML textarea for editing text on double-click

import { Html } from "react-konva-utils";
import { useEffect, useRef, useCallback, useMemo, useState } from "react";
import { TEXT_EDITOR } from "@/utils/constants";
import type Konva from "konva";

interface TextEditorProps {
  textNode: Konva.Text;
  onClose: () => void;
  onChange: (newText: string) => void;
}

// Static styles that don't change
const TEXTAREA_STATIC_STYLES: React.CSSProperties = {
  position: "absolute",
  minHeight: "1em",
  border: "1px solid #0066FF",
  margin: "0px",
  overflow: "hidden",
  background: "none",
  outline: "none",
  resize: "none",
  transformOrigin: "left top",
  cursor: "text",
  caretColor: "#000000",
  boxSizing: "border-box",
};

export default function TextEditor({
  textNode,
  onClose,
  onChange,
}: TextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [initialText] = useState(() => textNode.text()); // Capture once on mount
  const ignoreNextClickRef = useRef(true); // Ignore first click (from double-click)

  // Compute dynamic styles from textNode
  const dynamicStyles = useMemo(() => {
    const fill = textNode.fill();
    const rotation = textNode.rotation();

    // Get stage and its transformations (zoom/pan)
    const stage = textNode.getStage();
    if (!stage) {
      return {};
    }

    // Get text node's absolute position accounting for parent group offsets
    // The text Group is positioned at its center with offsetX/offsetY, so we need
    // the absolute position to get the actual top-left corner position
    const absolutePosition = textNode.getAbsolutePosition();

    const screenX = absolutePosition.x;
    const screenY = absolutePosition.y;

    // Use unscaled dimensions - the stage will apply scaling automatically
    const padding = textNode.padding();
    const fontSize = textNode.fontSize();

    // Add extra width to account for textarea border and padding to prevent wrapping
    const borderWidth = TEXT_EDITOR.BORDER_WIDTH * 2;
    const extraPadding = padding * 2;
    const textareaWidth = textNode.width() + extraPadding + borderWidth;
    const textareaHeight = textNode.height() + extraPadding + borderWidth;

    return {
      styles: {
        top: `${screenY}px`,
        left: `${screenX}px`,
        width: `${textareaWidth}px`,
        height: `${textareaHeight}px`,
        fontSize: `${fontSize}px`,
        padding: `${padding}px`,
        lineHeight: textNode.lineHeight().toString(),
        fontFamily: textNode.fontFamily(),
        textAlign: textNode.align() as React.CSSProperties["textAlign"],
        color: typeof fill === "string" ? fill : "#000000",
        transform: rotation ? `rotateZ(${rotation}deg)` : undefined,
      },
      calculatedWidth: textareaWidth,
    };
  }, [textNode]);

  // Handle save
  const handleSave = useCallback(() => {
    if (!textareaRef.current) return;
    const value = textareaRef.current.value;
    onChange(value);
    onClose();
  }, [onChange, onClose]);

  // Handle keyboard events
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSave();
      }
      if (e.key === "Escape") {
        onClose(); // Don't save on Escape
      }
    },
    [handleSave, onClose]
  );

  // Handle input (auto-resize)
  const handleInput = useCallback(() => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;

    // Use the pre-calculated width to maintain consistency
    textarea.style.width = `${dynamicStyles.calculatedWidth}px`;
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [dynamicStyles.calculatedWidth]);

  // Handle focus - select all text and auto-size
  const handleFocus = useCallback(() => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;

    // Auto-size height
    textarea.style.height = "auto";
    textarea.style.height = `${
      textarea.scrollHeight + TEXT_EDITOR.AUTO_RESIZE_PADDING
    }px`;

    // Select all text
    textarea.select();
  }, []);

  // Handle outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      // Ignore the first click (from double-click that opened the editor)
      if (ignoreNextClickRef.current) {
        ignoreNextClickRef.current = false;
        return;
      }

      if (textareaRef.current && e.target !== textareaRef.current) {
        e.preventDefault();
        e.stopPropagation();
        handleSave();
      }
    };

    window.addEventListener("mousedown", handleOutsideClick);

    return () => {
      window.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [handleSave]);

  return (
    <Html>
      <textarea
        ref={textareaRef}
        defaultValue={initialText}
        autoFocus
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        onInput={handleInput}
        style={{
          ...TEXTAREA_STATIC_STYLES,
          ...dynamicStyles.styles,
        }}
      />
    </Html>
  );
}
