// AI Canvas Agent Types
// Types for AI chat messages and commands

export interface AIMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
}

// Additional types for PR #23 and #24 will be added later
