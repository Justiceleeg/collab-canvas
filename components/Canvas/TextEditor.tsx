"use client";

// PR #11 - Text Shape Support - Text Editing
// Overlay HTML textarea for editing text on double-click

import { Html } from "react-konva-utils";
import { useEffect, useRef, useCallback, useMemo, useState } from "react";
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
  const [initialText] = useState(() => textNode.text()); // Capture once on mount
  const ignoreNextClickRef = useRef(true); // Ignore first click (from double-click)

  // Compute dynamic styles from textNode
  const dynamicStyles = useMemo(() => {
    const textPosition = textNode.absolutePosition();
    const fill = textNode.fill();
    const rotation = textNode.rotation();

    // Calculate height based on text content
    const textHeight = textNode.height();
    const minHeight = Math.max(textHeight, textNode.fontSize() * 1.5);

    // Account for textarea padding and border to match text node wrapping
    const padding = textNode.padding();
    const borderWidth = 1; // 1px border on each side
    // With box-sizing: border-box, total width includes padding and border
    // Add padding*2 + border*2 to get same content width as text node
    const textareaWidth = textNode.width() + padding * 2 + borderWidth * 2;

    return {
      top: `${textPosition.y}px`,
      left: `${textPosition.x}px`,
      width: `${textareaWidth}px`,
      height: `${minHeight + padding * 2 + borderWidth * 2}px`,
      fontSize: `${textNode.fontSize()}px`,
      paddingLeft: `${padding}px`,
      paddingTop: `${padding}px`,
      paddingRight: `${padding}px`,
      paddingBottom: `${padding}px`,
      lineHeight: textNode.lineHeight().toString(),
      fontFamily: textNode.fontFamily(),
      textAlign: textNode.align() as React.CSSProperties["textAlign"],
      color: typeof fill === "string" ? fill : "#000000",
      transform: rotation ? `rotateZ(${rotation}deg)` : undefined,
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
    const scale = textNode.getAbsoluteScale().x;
    textarea.style.width = `${textNode.width() * scale}px`;
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight + textNode.fontSize()}px`;
  }, [textNode]);

  // Handle focus - select all text and auto-size
  const handleFocus = useCallback(() => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;

    // Auto-size height
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight + 3}px`;

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
          // Static styles
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
          // Dynamic styles from textNode
          ...dynamicStyles,
        }}
      />
    </Html>
  );
}
