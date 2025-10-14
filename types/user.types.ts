// TODO: PR #3 - Authentication System
// User & presence types

export interface User {
  uid: string;
  email?: string;
  displayName: string;
  isAnonymous: boolean;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: Error | null;
}

// TODO: PR #9 - User Presence & Multiplayer Cursors
export interface UserPresence {
  userId: string;
  displayName: string;
  color: string; // assigned color for cursor
  online: boolean;
  cursor?: {
    x: number;
    y: number;
    timestamp: number;
  };
  lastSeen: number; // Unix timestamp
  joinedAt: number; // Unix timestamp
}

