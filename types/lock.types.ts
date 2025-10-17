// PR #8 - Object-Level Locking System
// Locking types for Strategy 3: Interaction Lock

export interface Lock {
  objectId: string;
  lockedBy: string; // user ID
  lockedAt: number; // Unix timestamp in milliseconds
}

export interface LockState {
  locks: Map<string, Lock>;
}

// Lock acquisition result
export interface LockResult {
  success: boolean;
  reason?: "already_locked" | "stale_lock_acquired" | "error";
  lockedBy?: string;
  lockedByName?: string;
}

// Lock timeout configuration (milliseconds)
export const LOCK_TIMEOUT_MS = 10000; // 10 seconds
