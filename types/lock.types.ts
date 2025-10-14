// TODO: PR #8 - Object-Level Locking System
// Locking types

export interface Lock {
  objectId: string;
  lockedBy: string; // user ID
  lockedAt: number; // timestamp
}

export interface LockState {
  locks: Map<string, Lock>;
}

