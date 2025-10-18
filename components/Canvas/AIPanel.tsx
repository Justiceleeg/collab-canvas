"use client";

import { useChat } from "@ai-sdk/react";
import { useUIStore } from "@/store/uiStore";
import { useEffect, useRef, useState } from "react";

export default function AIPanel() {
  const isOpen = useUIStore((state) => state.aiPanel.isOpen);
  const togglePanel = useUIStore((state) => state.toggleAIPanel);

  const { messages, sendMessage } = useChat();

  const [input, setInput] = useState("");

  // Check if AI is currently generating a response
  const isAIResponding =
    messages.length > 0 && messages[messages.length - 1].role === "user";
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Prevent wheel events from propagating to canvas (which would zoom)
  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
  };

  if (!isOpen) {
    // Collapsed state - show expand button
    return (
      <div className="fixed right-0 top-28 z-30">
        <button
          onClick={togglePanel}
          className="bg-white border border-l-0 border-gray-300 rounded-l-lg px-2 py-3 hover:bg-gray-50 transition-colors shadow-md"
          title="Open AI Assistant (⌘K)"
        >
          <svg
            className="w-5 h-5 text-gray-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div
      className="fixed right-0 top-16 bottom-0 w-96 bg-white border-l border-gray-300 shadow-lg z-30 flex flex-col"
      onWheel={handleWheel}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
          <h2 className="text-xs font-semibold text-gray-800">AI Assistant</h2>
        </div>
        <button
          onClick={togglePanel}
          className="p-1 hover:bg-gray-200 rounded transition-colors"
          title="Close AI Assistant (⌘K)"
        >
          <svg
            className="w-5 h-5 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-sm text-gray-500 py-8">
            <p className="mb-2">👋 Hi! I&apos;m your AI canvas assistant.</p>
            <p className="text-xs">
              Ask me anything about using the canvas or how to create and
              manipulate shapes.
            </p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-3 py-2 ${
                message.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              <div className="text-sm whitespace-pre-wrap">
                {message.parts.map((part, i) => {
                  if (part.type === "text") {
                    return <div key={i}>{part.text}</div>;
                  }
                  return null;
                })}
              </div>
            </div>
          </div>
        ))}

        {isAIResponding && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-800 rounded-lg px-3 py-2">
              <div className="text-sm">
                Thinking
                <span className="inline-flex ml-1">
                  <span className="animate-pulse">.</span>
                  <span className="animate-pulse animation-delay-200">.</span>
                  <span className="animate-pulse animation-delay-400">.</span>
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (input.trim()) {
              sendMessage({ text: input });
              setInput("");
            }
          }}
          className="flex gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything..."
            disabled={isAIResponding}
            className="flex-1 px-3 py-2 text-sm text-black border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={isAIResponding || !input.trim()}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </form>
        <p className="text-xs text-gray-500 mt-2">Press Enter to send</p>
      </div>
    </div>
  );
}
