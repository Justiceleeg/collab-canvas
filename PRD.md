# 🧩 Collab Canvas — MVP Product Requirements (Developer-Focused)

## Overview

**Goal:**\
Build a real-time collaborative canvas (like a simplified Figma) where multiple
authenticated users can create, move, and view shapes simultaneously with smooth
performance and persistent state.

**MVP Focus:**\
✅ Real-time collaboration\
✅ Basic shape manipulation\
✅ Authentication + user presence\
✅ Deployment (public access)

No AI integration yet — this phase focuses solely on building a bulletproof
multiplayer foundation.

---

## 1. Core Features

### 1.1 Canvas

- Pan and zoom support
- **Three shape types**: rectangles, circles, and text layers
- Create, select, move, resize, rotate, and delete shapes
- **Multi-select support**: shift-click or drag-to-select multiple objects
- Basic operations: duplicate and delete
- Layer management (z-index ordering)
- Smooth rendering with Konva.js
- Canvas state updates broadcast in real time

### 1.2 Real-Time Collaboration

- Real-time synchronization via Firestore (onSnapshot listeners)
- Each user's cursor visible with their name label
- Presence awareness (who's online)
- Conflict resolution through **object-level locking** (see section below)
- State persistence — if all users disconnect and return, shapes remain

### 1.3 Authentication

- Firebase Authentication (email/password or anonymous sign-in)
- Users must have display names (shown beside cursors)
- Auth state synced to Firestore presence list

### 1.4 Deployment

- Deployed publicly using Firebase Hosting
- Must support at least 5 concurrent users
- Accessible via a public URL

---

## 2. User Flow

1. User visits app URL → prompted to sign in or auto-assign guest name.
2. User enters canvas workspace.
3. Canvas displays:
   - All existing shapes (fetched from Firestore)
   - Real-time cursors for other users
   - "Online users" indicator
4. User can:
   - Create new shapes (rectangle, circle, or text)
   - Click to select single shapes
   - Shift-click or drag-to-select multiple shapes
   - Drag to move shapes
   - Resize shapes (drag corner handles)
   - Rotate shapes (rotation handle)
   - Duplicate selected shapes
   - Delete selected shapes
   - Change layer order (bring forward/send backward)
   - Pan/zoom around canvas
5. All changes reflect instantly for every connected user.
6. On refresh or disconnect/reconnect:
   - Canvas state rehydrates from Firestore.

---

## 3. Architecture Overview

### Frontend

- **React (Vite)** for fast iteration
- **Konva.js** for 2D canvas rendering
- **Zustand** (or simple React context) for local state management

### Backend

- **Firestore** (persistent canvas data)
  - `canvasObjects` collection: stores shape objects
    ```ts
    {
      id: string,
      type: 'rectangle' | 'circle' | 'text',
      x: number,
      y: number,
      width: number,
      height: number,
      rotation?: number,        // degrees
      color: string,
      text?: string,            // for text objects
      fontSize?: number,        // for text objects
      zIndex: number,           // layer order
      lockedBy?: string,        // user ID currently editing
      lockedAt?: Timestamp,     // when lock was acquired
      lastUpdatedBy: string,
      updatedAt: Timestamp
    }
    ```
- **Realtime Database** (ephemeral presence data)
  - `presence/{userId}` path: tracks who's online and cursor positions
    ```ts
    {
      userId: string,
      displayName: string,
      color: string,
      online: boolean,
      cursor: { x: number, y: number },
      lastSeen: number,
      joinedAt: number
    }
    ```
  - Native `onDisconnect()` support prevents "ghost users"
- **Firebase Auth** for user identity

**Why both databases?**

- Firestore: Best for structured, persistent canvas objects with locking
- Realtime Database: Optimized for high-frequency cursor updates (<50ms latency)

### Data Flow

**Canvas Objects (Firestore):**

- Local user action (e.g., drag shape) →\
  update Firestore doc →\
  all connected clients receive updates via `onSnapshot` listeners →\
  update local canvas.

**Presence/Cursors (Realtime Database):**

- User moves cursor →\
  update Realtime Database (debounced 30-50ms) →\
  all connected clients receive updates via `onValue` listeners →\
  render cursor positions in real-time.

---

## 4. Functional Requirements

| Category      | Requirement                                 | Done When                                  |
| ------------- | ------------------------------------------- | ------------------------------------------ |
| Canvas        | Pan & zoom smoothly                         | Interaction feels fluid, no lag            |
| Canvas        | Three shape types (rectangle, circle, text) | All shapes render and sync for all users   |
| Canvas        | Transform operations (move, resize, rotate) | Transformations work and sync in real-time |
| Canvas        | Multi-select (shift-click + drag-select)    | Can select and manipulate multiple shapes  |
| Canvas        | Layer management                            | Z-index ordering works correctly           |
| Canvas        | Duplicate & delete operations               | Operations work on single/multi-select     |
| Collaboration | Real-time sync (2+ users)                   | Updates visible <100ms latency             |
| Collaboration | Multiplayer cursors w/ names                | Cursors visible and move live              |
| Collaboration | Presence awareness                          | "Online users" count accurate              |
| Collaboration | Object-level locking                        | Only one user can edit a shape at a time   |
| Auth          | Login/signup/guest flow                     | Users have names displayed                 |
| Persistence   | Canvas state retained on reload             | Data reloads from Firestore                |
| Deployment    | Firebase Hosting public URL                 | Live demo works on multiple browsers       |

---

## 5. Non-Functional Requirements

- Maintain **~60 FPS** on canvas interactions
- Sync latency:
  - Object changes <100 ms
  - Cursor updates <50 ms
- Support **500+ objects** without lag
- Handle **5+ concurrent users** reliably
- Basic error handling for Firestore writes

---

## 6. Real-Time Collaboration — Lock-Based Editing (Detailed)

### Real-Time Synchronization

**Canvas Objects (Firestore):**

- All users subscribe to updates in the Firestore `canvasObjects` collection via
  `onSnapshot`.
- Each shape document includes:
  ```ts
  {
    id: string,
    type: 'rectangle' | 'circle' | 'text',
    x: number,
    y: number,
    width: number,
    height: number,
    rotation?: number,
    color: string,
    text?: string,
    fontSize?: number,
    zIndex: number,
    lockedBy?: string,       // user ID currently editing
    lockedAt?: Timestamp,    // when the lock was acquired
    updatedAt: Timestamp,
    lastUpdatedBy: string
  }
  ```
- Snapshot listeners update all connected clients in real time.
- Local actions (move, resize, etc.) immediately reflect optimistically, then
  confirm via Firestore.

**Presence System (Realtime Database):**

- User presence tracked at `presence/{userId}` path
- Automatic disconnect handling via `onDisconnect().remove()`
- Cursor positions updated frequently (debounced 30-50ms)
- No "ghost users" - users automatically removed when disconnected

### Conflict Resolution — Lock-Based Editing

**1. Lock Acquisition**

- When a user begins interacting with a shape (e.g., clicks and starts dragging
  it):
  - The client attempts to **lock** that shape by writing its `lockedBy` and
    `lockedAt` fields to Firestore.
- If the shape is already locked by another user:
  - The action is **blocked locally** — user B sees the object as "in use"
    (e.g., subtle outline or tooltip).
  - User B cannot modify it until it's unlocked.

**2. Active Manipulation**

- While user A holds the lock:
  - Only A's client can send position/size updates for that object.
  - All other clients receive real-time updates but cannot modify it.

**3. Lock Release**

- When user A releases the mouse (or after a short timeout, e.g., 2-3 seconds of
  inactivity):
  - The client clears `lockedBy` and `lockedAt`, freeing the object for others.
- Firestore snapshot listeners notify all clients that the object is now
  editable again.

**4. Timeout Recovery**

- To avoid permanent locks from disconnects:
  - Locks older than **2-3 seconds** automatically expire.
  - On reconnect, any user can edit expired objects again.

**5. Conflict Handling**

- If two users attempt to acquire the same lock simultaneously:
  - Firestore's last-write-wins applies, but only one user succeeds in locking
    (based on the most recent confirmed write).
  - The losing client reverts its attempted change and respects the current lock
    state.

### Persistence & Reconnection

**Canvas State (Firestore):**

- Canvas objects and locks persist permanently in Firestore.
- On reload or reconnect:
  - The app reloads all shapes and their current lock status.
  - Any stale locks (older than timeout threshold) are cleared automatically on
    load.

**Presence (Realtime Database):**

- Presence data is ephemeral (only exists while users are connected).
- On reload or reconnect:
  - User writes new presence entry with `onDisconnect()` handler.
  - Previous presence entry automatically removed by Firebase.
  - No manual cleanup needed.

### Developer Notes

- Implement a small **"locked" visual indicator** (gray border or tooltip:
  "Justice is editing this").
- Prevent local drag/resize events when `lockedBy` ≠ current user.
- Keep lock writes **debounced** to avoid excessive Firestore updates.
- Optional: use Firestore transactions for atomic lock set/release.

---

## 7. Success Criteria

✅ Two users editing in real time in different browsers\
✅ Changes sync instantly (<100ms)\
✅ Canvas persists after refresh\
✅ Users visible via cursors and presence\
✅ Lock-based conflict resolution works (one editor per shape)\
✅ All three shape types (rectangle, circle, text) working\
✅ Transform operations (move, resize, rotate) functioning\
✅ Multi-select and layer management operational\
✅ App publicly accessible\
✅ Smooth 60 FPS interactions
