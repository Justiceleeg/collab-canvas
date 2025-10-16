# 🧩 Collab Canvas — Development Plan & PR Breakdown

## File Structure

```
collab-canvas/
├── app/
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx                  # Login page
│   ├── canvas/
│   │   └── page.tsx                      # Main canvas page
│   ├── layout.tsx                        # Root layout
│   ├── page.tsx                          # Home/redirect page
│   └── globals.css                       # Global styles
├── components/
│   ├── Canvas/
│   │   ├── Canvas.tsx                    # Main canvas component
│   │   ├── Stage.tsx                     # Konva Stage wrapper
│   │   ├── Shape.tsx                     # Generic shape renderer
│   │   ├── Rectangle.tsx                 # Rectangle shape
│   │   ├── Circle.tsx                    # Circle shape
│   │   ├── Text.tsx                      # Text shape
│   │   ├── TextEditor.tsx                # Text editing overlay
│   │   ├── Transformer.tsx               # Transform controls
│   │   ├── SelectionBox.tsx              # Multi-select rectangle
│   │   ├── Cursors.tsx                   # Multiplayer cursors
│   │   ├── ContextMenu.tsx               # Right-click context menu
│   │   └── Toast.tsx                     # Toast notifications
│   ├── Toolbar/
│   │   ├── Toolbar.tsx                   # Main toolbar
│   │   ├── ShapeTools.tsx                # Shape creation buttons
│   │   └── LayerTools.tsx                # Layer order controls
│   ├── Auth/
│   │   ├── AuthProvider.tsx              # Auth context provider
│   │   ├── AuthGuard.tsx                 # Route protection component
│   │   └── LoginForm.tsx                 # Login UI
│   └── Presence/
│       ├── PresenceIndicator.tsx         # Online users list
│       └── UserCursor.tsx                # Single cursor component
├── hooks/
│   ├── useAuth.ts                        # Firebase Auth hook
│   ├── useCanvas.ts                      # Canvas state management
│   ├── useFirestore.ts                   # Firestore sync hook
│   ├── usePresence.ts                    # User presence tracking (Realtime DB)
│   ├── useCursors.ts                     # Cursor position sync (Realtime DB)
│   ├── useLocking.ts                     # Object locking logic
│   ├── useActiveLock.ts                  # Simplified lock management
│   ├── useKeyboardShortcuts.ts           # Centralized keyboard handling
│   ├── useShapeInteractions.ts           # Shape event handlers
│   └── usePerformance.ts                 # FPS & performance monitoring
├── services/
│   ├── firebase.ts                       # Firebase initialization (both DBs)
│   ├── firestore.service.ts              # Firestore CRUD operations
│   ├── auth.service.ts                   # Auth operations
│   ├── presence.service.ts               # Presence management (Realtime DB)
│   └── canvasCommands.ts                 # Command service for canvas operations
├── store/
│   ├── canvasStore.ts                    # Zustand store for canvas state
│   ├── selectionStore.ts                 # Selection state management
│   └── uiStore.ts                        # UI overlay state (menus, toasts, modals)
├── types/
│   ├── canvas.types.ts                   # Shape & canvas types
│   ├── user.types.ts                     # User & presence types
│   └── lock.types.ts                     # Locking types
├── utils/
│   ├── geometry.ts                       # Shape calculations
│   ├── transforms.ts                     # Transform utilities
│   ├── lockManager.ts                    # Lock timeout & cleanup
│   └── performance.ts                    # Performance utilities
├── public/
│   └── (static assets)
├── .env.example                          # Firebase config template
├── .env.local                            # Firebase config (gitignored)
├── .gitignore
├── firestore.rules                       # Firestore security rules
├── database.rules.json                   # Realtime Database security rules
├── firestore.indexes.json                # Composite indexes
├── ARCHITECTURE.md                       # Architecture documentation (4-tier)
├── package.json
├── tsconfig.json
├── next.config.js                        # Next.js configuration
└── README.md
```

---

## Architecture Decision: Hybrid Database Approach

This project uses **both Firestore and Realtime Database** for optimal
performance:

### Firestore (for Canvas Objects)

- **Use case:** Persistent canvas data (shapes, positions, properties)
- **Why:** Rich querying, transactions for locking, structured documents
- **Collections:** `canvasObjects`
- **Update frequency:** Low-medium (1-10 updates/second per object)

### Realtime Database (for Presence System)

- **Use case:** Ephemeral user presence and cursor positions
- **Why:** Native `onDisconnect()`, lower latency, optimized for frequent
  updates
- **Paths:** `presence/{userId}`
- **Update frequency:** High (30-60 updates/second for cursor movements)

**Benefits of this approach:**

- ✅ No "ghost users" (automatic cleanup via `onDisconnect()`)
- ✅ Better cursor latency (<50ms achievable)
- ✅ Separation of concerns (persistent vs ephemeral data)
- ✅ Industry standard pattern recommended by Firebase

**Trade-offs:**

- Slightly more complex setup (+30 minutes)
- Two sets of security rules to maintain
- Different API patterns for each database

**Net result:** Saves ~1 hour in implementation time and provides more reliable
presence system.

---

## PR Breakdown (Chronological)

### **PR #1: Project Setup & Firebase Configuration** 🏗️ ✅

**Priority:** CRITICAL (Foundation)\
**Estimated Time:** 2.5-3.5 hours\
**Status:** COMPLETED

#### Tasks:

1. **Initialize Next.js + TypeScript project**
   - Files: `package.json`, `next.config.js`, `tsconfig.json`
   - Run:
     `npx create-next-app@latest collab-canvas --typescript --app --tailwind --no-src-dir`
   - Configure for TypeScript and App Router

2. **Install core dependencies**
   - Files: `package.json`
   - Install: `firebase`, `konva`, `react-konva`, `zustand`

3. **Setup Firebase project**
   - Files: `services/firebase.ts`, `.env.example`, `.env.local`
   - Create Firebase project in console
   - Enable Firestore and Authentication
   - **Enable Realtime Database** (for presence system)
   - Add Firebase config to environment variables (use `NEXT_PUBLIC_` prefix)
   - Initialize both Firestore and Realtime Database in `firebase.ts`
   - Export `db` (Firestore) and `rtdb` (Realtime Database)

4. **Configure database rules and indexes**
   - Files: `firestore.rules`, `database.rules.json`, `firestore.indexes.json`
   - Setup Firestore rules for `canvasObjects` collection
   - Setup Realtime Database rules for `presence` path
   - Create indexes for `canvasObjects`

5. **Setup file structure**
   - Files: Create all directories from structure above
   - Create placeholder files with TODO comments
   - Setup `app` directory structure with routes

#### Deliverable:

- ✅ Project runs locally (`npm run dev`)
- ✅ Firebase initialized and connected (both Firestore and Realtime DB)
- ✅ File structure in place
- ✅ Both database security rules deployed

---

### **PR #2: Vercel Deployment & CI/CD** 🚀 ✅

**Priority:** HIGH (Enable continuous deployment)\
**Estimated Time:** 1-2 hours\
**Status:** COMPLETED

#### Tasks:

1. **Setup Vercel project**
   - Connect GitHub repository to Vercel
   - Configure build settings (Next.js auto-detected)
   - Set environment variables in Vercel dashboard (all `NEXT_PUBLIC_*` vars)

2. **Configure deployment settings**
   - Files: `vercel.json` (optional, if custom config needed)
   - Ensure `next.config.js` is properly configured
   - Set up production and preview deployments

3. **Add deployment documentation**
   - Files: `README.md`
   - Document deployment process
   - Add deployed URL placeholder
   - Document environment variable setup in Vercel

4. **Deploy initial version**
   - Push to main and verify auto-deployment
   - Confirm public URL is accessible
   - Test preview deployments on PR branches

#### Deliverable:

- ✅ App deployed and publicly accessible on Vercel
- ✅ Auto-deployment working on push to main
- ✅ Public URL documented in README
- ✅ Environment variables configured in Vercel

---

### **PR #3: Authentication System** 🔐 ✅

**Priority:** HIGH (Required for presence)\
**Estimated Time:** 3-4 hours\
**Status:** COMPLETED

#### Tasks:

1. **Create auth service**
   - Files: `services/auth.service.ts`
   - Implement email/password sign up/sign in
   - Implement anonymous sign in
   - Handle user display name

2. **Build auth context and hook**
   - Files: `components/Auth/AuthProvider.tsx`, `hooks/useAuth.ts`
   - Create auth state context (use 'use client' directive)
   - Handle auth state changes

3. **Create login page**
   - Files: `app/(auth)/login/page.tsx`, `components/Auth/LoginForm.tsx`
   - Email/password form
   - Anonymous login button
   - Display name input

4. **Add auth protection with middleware**
   - Files: `middleware.ts`, `app/layout.tsx`
   - Redirect unauthenticated users to login
   - Handle loading states
   - Wrap app with AuthProvider
   - **Note:** `middleware.ts` for auth protection is unnecessary with Firebase Auth (client-side). Instead, implemented `AuthGuard` component for route protection, which is the recommended pattern for client-side authentication.

5. **Define user types**
   - Files: `types/user.types.ts`
   - User, AuthState types

#### Deliverable:

- ✅ Users can sign up/sign in
- ✅ Anonymous authentication working
- ✅ User display names stored
- ✅ Auth state persisted
- ✅ Protected routes working

---

### **PR #4: Basic Canvas with Pan & Zoom** 🎨 ✅

**Priority:** HIGH (Core functionality)\
**Estimated Time:** 4-5 hours\
**Status:** COMPLETED

#### Tasks:

1. **Create canvas types**
   - Files: `types/canvas.types.ts`
   - Define Shape, CanvasObject, CanvasState types

2. **Setup Zustand store**
   - Files: `store/canvasStore.ts`
   - Canvas state management
   - Shape CRUD operations (local only)

3. **Build Stage component**
   - Files: `components/Canvas/Stage.tsx`
   - Konva Stage setup (mark as 'use client' - Konva requires DOM)
   - Pan and zoom controls (mouse wheel + drag)
   - Viewport state management

4. **Create Canvas wrapper**
   - Files: `components/Canvas/Canvas.tsx`, `hooks/useCanvas.ts`
   - Mark as 'use client' component
   - Render Stage
   - Handle canvas events
   - Canvas dimensions and responsiveness

5. **Create canvas page**
   - Files: `app/canvas/page.tsx`
   - Import Canvas component dynamically (to avoid SSR issues with Konva)
   - Add page-level layout

6. **Add basic styling**
   - Files: `app/globals.css`
   - Canvas container styles
   - Full viewport layout

#### Deliverable:

- ✅ Empty canvas renders
- ✅ Pan with mouse drag working
- ✅ Zoom with mouse wheel working
- ✅ Smooth 60 FPS interactions
- ✅ No SSR errors with Konva

---

### **PR #5: Firestore Sync Infrastructure** 🔄 ✅

**Priority:** CRITICAL (Real-time foundation)\
**Estimated Time:** 5-6 hours\
**Status:** COMPLETED

#### Tasks:

1. **Create Firestore service**
   - Files: `services/firestore.service.ts`
   - CRUD operations for `canvasObjects`
   - Batch operations
   - Transaction support

2. **Build Firestore sync hook**
   - Files: `hooks/useFirestore.ts`
   - onSnapshot listeners for `canvasObjects`
   - Real-time updates to local store
   - Error handling and reconnection

3. **Integrate with canvas store**
   - Files: `store/canvasStore.ts`
   - Subscribe to Firestore changes
   - Push local changes to Firestore
   - Optimistic updates

4. **Add loading states**
   - Files: `components/Canvas/Canvas.tsx`
   - Loading indicator while fetching initial state
   - Error states

5. **Handle persistence**
   - Files: `hooks/useFirestore.ts`
   - Canvas state persists on reload
   - Handle empty canvas initialization

#### Deliverable:

- ✅ Canvas state syncs to Firestore
- ✅ Changes persist on page reload
- ✅ Multiple browser tabs see same state
- ✅ Error handling for network issues
- ✅ Optimistic updates implemented
- ✅ Batch operations for performance
- ✅ Transaction support for locking
- ✅ Test panel and comprehensive testing guide

---

### **PR #6: Rectangle Shape Creation & Rendering** 📐 ✅

**Priority:** HIGH (First shape type)\
**Estimated Time:** 3-4 hours\
**Status:** COMPLETED

#### Tasks:

1. **Create Shape components**
   - Files: `components/Canvas/Shape.tsx`, `components/Canvas/Rectangle.tsx`
   - Generic Shape wrapper (mark as 'use client')
   - Rectangle rendering with Konva.Rect

2. **Add shape creation toolbar**
   - Files: `components/Toolbar/Toolbar.tsx`,
     `components/Toolbar/ShapeTools.tsx`
   - Rectangle creation button
   - Toolbar styling

3. **Implement shape creation logic**
   - Files: `hooks/useCanvas.ts`, `store/canvasStore.ts`
   - Click on canvas to create rectangle
   - Default size, color, position
   - Generate unique IDs

4. **Sync new shapes to Firestore**
   - Files: `services/firestore.service.ts`
   - Write new shape to `canvasObjects` collection
   - Include all required fields

5. **Add geometry utilities**
   - Files: `utils/geometry.ts`
   - Shape bounds calculation
   - Collision detection helpers

#### Deliverable:

- ✅ Click toolbar to enable rectangle creation mode
- ✅ Click canvas to create rectangle
- ✅ Rectangle appears for all connected users
- ✅ Rectangles persist on reload

---

### **PR #7: Shape Selection & Movement** 🖱️ ✅

**Priority:** HIGH (Basic interaction)\
**Estimated Time:** 4-5 hours\
**Status:** COMPLETED

#### Tasks:

1. **Create selection store**
   - Files: `store/selectionStore.ts`
   - Track selected shape IDs
   - Single selection logic

2. **Add click selection**
   - Files: `components/Canvas/Shape.tsx`
   - Click shape to select
   - Visual selection indicator (border/highlight)

3. **Implement drag to move**
   - Files: `components/Canvas/Shape.tsx`, `hooks/useCanvas.ts`
   - Konva drag events
   - Update shape position in store
   - Sync position changes to Firestore

4. **Add transform utilities**
   - Files: `utils/transforms.ts`
   - Position calculation helpers
   - Snap to grid (optional)

5. **Handle click outside to deselect**
   - Files: `components/Canvas/Stage.tsx`
   - Click canvas background to clear selection

#### Deliverable:

- ✅ Click shape to select (visual feedback)
- ✅ Drag selected shape to move
- ✅ Position updates sync to all users
- ✅ Click outside to deselect

---

### **PR #8: Object-Level Locking System** 🔒 ✅

**Priority:** CRITICAL (Conflict resolution)\
**Estimated Time:** 5-6 hours\
**Status:** COMPLETED

#### Tasks:

1. **Create locking types**
   - Files: `types/lock.types.ts`
   - Lock, LockState types

2. **Build locking service**
   - Files: `hooks/useLocking.ts`, `utils/lockManager.ts`
   - Acquire lock (write `lockedBy`, `lockedAt` to Firestore)
   - Release lock (clear fields)
   - Check lock status
   - Automatic timeout cleanup (2-3 seconds)

3. **Integrate locks with shape interaction**
   - Files: `components/Canvas/Shape.tsx`
   - Attempt lock on mousedown/dragstart
   - Block interaction if locked by another user
   - Release lock on mouseup/dragend

4. **Add locked visual indicator**
   - Files: `components/Canvas/Shape.tsx`
   - Gray border or tooltip when locked by another user
   - Show locking user's name

5. **Handle stale lock cleanup**
   - Files: `utils/lockManager.ts`
   - Background process to clear expired locks
   - Run on app mount and periodically

6. **Add lock status to Firestore schema**
   - Files: `firestore.rules`
   - Update security rules to allow lock fields

#### Deliverable:

- ✅ Only one user can edit a shape at a time
- ✅ Locked shapes show visual indicator with user name
- ✅ Locks automatically release after 2-3 seconds
- ✅ Stale locks cleaned up on reconnect

---

### **PR #9: User Presence & Multiplayer Cursors** 👥 ✅

**Priority:** HIGH (Collaboration visibility)\
**Estimated Time:** 3-4 hours\
**Status:** COMPLETED

#### Tasks:

1. **Create presence service**
   - Files: `services/presence.service.ts`, `types/user.types.ts`
   - Write user to Realtime Database `presence/{userId}` path on mount
   - Use `onDisconnect().remove()` for automatic cleanup
   - Include user ID, display name, color, online status
   - No need for manual heartbeat polling

2. **Build presence hook**
   - Files: `hooks/usePresence.ts`
   - Subscribe to `presence` path using `onValue()` listener
   - Track online users in real-time
   - Filter for users with `online: true`

3. **Create presence indicator UI**
   - Files: `components/Presence/PresenceIndicator.tsx`
   - Show count of online users
   - List user names with colored dots

4. **Build cursor tracking**
   - Files: `hooks/useCursors.ts`
   - Update cursor position in Realtime Database (debounced 30-50ms)
   - Use `set()` on `presence/{userId}/cursor` path
   - Subscribe to other users' cursor positions with `onValue()`

5. **Create cursor components**
   - Files: `components/Presence/UserCursor.tsx`,
     `components/Canvas/Cursors.tsx`
   - Render cursor SVG with user name label (mark as 'use client')
   - Render all cursors on Stage
   - Transform cursor positions based on canvas zoom/pan

6. **Integrate cursor data with presence**
   - Files: `services/presence.service.ts`
   - Store cursor position within user's presence node
   - Update on mousemove events (debounced)

#### Deliverable:

- ✅ Online users count displayed
- ✅ User list shows who's connected
- ✅ Other users' cursors visible with names
- ✅ Cursor positions update in real-time (<50ms latency)
- ✅ Users automatically removed on disconnect (no ghost users)

---

### **PR #10: Circle Shape Support** ⭕ ✅

**Priority:** MEDIUM (Second shape type)\
**Estimated Time:** 2-3 hours\
**Status:** COMPLETED

#### Tasks:

1. **Create Circle component**
   - Files: `components/Canvas/Circle.tsx`
   - Render with Konva.Circle
   - Support same interactions as Rectangle

2. **Add circle creation button**
   - Files: `components/Toolbar/ShapeTools.tsx`
   - Circle button in toolbar

3. **Update shape creation logic**
   - Files: `hooks/useCanvas.ts`, `store/canvasStore.ts`
   - Handle `type: 'circle'`
   - Default radius/size

4. **Update Shape wrapper**
   - Files: `components/Canvas/Shape.tsx`
   - Conditionally render Circle or Rectangle based on type

5. **Update geometry utilities**
   - Files: `utils/geometry.ts`
   - Circle bounds calculation
   - Circle-specific helpers

#### Deliverable:

- ✅ Circle creation button in toolbar (enabled and functional)
- ✅ Circles render and sync across users (using Konva.Circle)
- ✅ Circles support selection and movement (with proper coordinate handling)
- ✅ Circles work with locking system (same as rectangles)
- ✅ Circle collision detection uses radius-based calculations (accurate circular bounds)

---

### **PR #11: Text Shape Support** 📝 ✅

**Priority:** MEDIUM (Third shape type)\
**Estimated Time:** 3-4 hours\
**Status:** COMPLETED

#### Tasks:

1. **Create Text component**
   - Files: `components/Canvas/Text.tsx`
   - Render with Konva.Text
   - Double-click to edit text
   - Input overlay for editing

2. **Add text creation button**
   - Files: `components/Toolbar/ShapeTools.tsx`
   - Text button in toolbar

3. **Implement text editing**
   - Files: `components/Canvas/Text.tsx`
   - Double-click to enter edit mode
   - Render HTML input overlay
   - Save text on blur/Enter

4. **Update shape creation logic**
   - Files: `hooks/useCanvas.ts`, `store/canvasStore.ts`
   - Handle `type: 'text'`
   - Default text, fontSize

5. **Update Shape wrapper**
   - Files: `components/Canvas/Shape.tsx`
   - Render Text component

6. **Sync text changes**
   - Files: `services/firestore.service.ts`
   - Update text field in Firestore on edit

#### Deliverable:

- ✅ Text creation button in toolbar
- ✅ Click to create text, double-click to edit
- ✅ Text edits sync across users
- ✅ Text supports selection and movement

---

### **PR #12: Transform Controls (Resize & Rotate)** 🔄 ✅

**Priority:** HIGH (Essential interaction)\
**Estimated Time:** 4-5 hours\
**Status:** COMPLETED

#### Tasks:

1. **Create Transformer component**
   - Files: `components/Canvas/Transformer.tsx`
   - Konva.Transformer for resize and rotate handles
   - Attach to selected shape

2. **Implement resize**
   - Files: `components/Canvas/Transformer.tsx`
   - Drag corner handles to resize
   - Update width/height in store
   - Sync to Firestore

3. **Implement rotate**
   - Files: `components/Canvas/Transformer.tsx`
   - Drag rotation handle
   - Update rotation in store
   - Sync to Firestore

4. **Apply transformations to shapes**
   - Files: `components/Canvas/Shape.tsx`, `components/Canvas/Rectangle.tsx`,
     `components/Canvas/Circle.tsx`
   - Read rotation from shape data
   - Apply via Konva rotation prop

5. **Lock during transformation**
   - Files: `components/Canvas/Transformer.tsx`
   - Acquire lock on transform start
   - Release lock on transform end

6. **Update transform utilities**
   - Files: `utils/transforms.ts`
   - Rotation calculations
   - Bounding box with rotation

#### Deliverable:

- ✅ Corner handles appear on selected shapes
- ✅ Drag corners to resize shapes
- ✅ Drag rotation handle to rotate shapes
- ✅ Transform changes sync in real-time
- ✅ Transforms respect locking

---

### **PR #13: Multi-Select (Shift-Click)** 🖱️✨ ✅

**Priority:** MEDIUM (Enhanced interaction)\
**Estimated Time:** 3-4 hours\
**Status:** COMPLETED

#### Tasks:

1. **Update selection store**
   - Files: `store/selectionStore.ts`
   - Support multiple selected IDs
   - Add/remove from selection

2. **Implement shift-click**
   - Files: `components/Canvas/Shape.tsx`
   - Detect shift key on click
   - Add shape to selection instead of replacing

3. **Visual feedback for multi-select**
   - Files: `components/Canvas/Shape.tsx`
   - Highlight all selected shapes

4. **Move multiple shapes together**
   - Files: `hooks/useCanvas.ts`
   - Drag one shape in selection → move all
   - Calculate relative offsets

5. **Apply operations to multi-select**
   - Files: `store/canvasStore.ts`
   - Delete multiple shapes
   - (Duplicate will be added in next PR)

#### Deliverable:

- ✅ Shift-click to add shapes to selection
- ✅ All selected shapes highlighted
- ✅ Dragging one selected shape moves all
- ✅ Delete works on multiple shapes
- ✅ Lock indicators show on all selected shapes
- ✅ Multi-lock support in useActiveLock hook

---

### **PR #14: Drag-to-Select (Selection Box)** 📦 ✅

**Priority:** MEDIUM (Enhanced interaction)\
**Estimated Time:** 3-4 hours\
**Status:** COMPLETED

#### Tasks:

1. **Create SelectionBox component** ✅
   - Files: `components/Canvas/SelectionBox.tsx`
   - Render selection rectangle

2. **Implement drag-to-select** ✅
   - Files: `components/Canvas/Stage.tsx`, `components/Canvas/Canvas.tsx`
   - Click and drag on canvas background
   - Draw selection box
   - Detect shapes within box bounds

3. **Update selection on drag end** ✅
   - Files: `store/selectionStore.ts` (already had necessary methods)
   - Select all shapes intersecting box
   - Clear previous selection (unless shift held)

4. **Add intersection detection** ✅
   - Files: `utils/geometry.ts` (already had `isShapeInSelectionBox`)
   - Check if shape bounds intersect selection box

#### Deliverable:

- ✅ Click and drag on canvas to draw selection box
- ✅ Shapes within box get selected
- ✅ Works with shift-click for additive selection

---

### **PR #15: Layer Management (Z-Index)** 📚

**Priority:** MEDIUM (Visual organization)\
**Estimated Time:** 3-4 hours

#### Tasks:

1. **Add zIndex to shapes**
   - Files: `types/canvas.types.ts`, `store/canvasStore.ts`
   - Include zIndex in shape data
   - Default zIndex on creation

2. **Sort shapes by zIndex**
   - Files: `components/Canvas/Canvas.tsx`
   - Render shapes in zIndex order

3. **Create layer tools**
   - Files: `components/Toolbar/LayerTools.tsx`
   - "Bring Forward" button
   - "Send Backward" button
   - "Bring to Front" button
   - "Send to Back" button

4. **Implement layer operations**
   - Files: `store/canvasStore.ts`
   - Update zIndex for selected shapes
   - Sync to Firestore

5. **Add to toolbar**
   - Files: `components/Toolbar/Toolbar.tsx`
   - Mount LayerTools component

#### Deliverable:

- ✅ Shapes render in correct layer order
- ✅ Layer control buttons in toolbar
- ✅ Bring forward/back operations work
- ✅ Layer changes sync across users

---

### **PR #16: Duplicate & Delete Operations** 🗑️📋 ✅

**Priority:** MEDIUM (Basic operations)\
**Estimated Time:** 2-3 hours\
**Status:** COMPLETED

#### Tasks:

1. **Implement delete** ✅
   - Files: `services/canvasCommands.ts`, `hooks/useKeyboardShortcuts.ts`
   - Delete selected shapes from Firestore
   - Keyboard shortcut (Delete/Backspace key)
   - Right-click context menu option

2. **Implement duplicate** ✅
   - Files: `services/canvasCommands.ts`, `hooks/useKeyboardShortcuts.ts`
   - Clone selected shapes at same position (no offset, spawns on top)
   - New unique IDs
   - Write to Firestore
   - Incremented zIndex to place on top

3. **Add right-click context menu** ✅
   - Files: `components/Canvas/ContextMenu.tsx`
   - Delete option in context menu
   - Duplicate option in context menu
   - Context menu appears at cursor position
   - Works with single and multi-select

4. **Add keyboard shortcuts** ✅
   - Files: `hooks/useKeyboardShortcuts.ts`
   - Delete: Delete/Backspace
   - Duplicate: Ctrl+D / Cmd+D (works cross-platform)

#### Deliverable:

- ✅ Right-click context menu with delete and duplicate options
- ✅ Context menu positioned at cursor location
- ✅ Delete removes selected shapes (via context menu or keyboard)
- ✅ Duplicate clones shapes on top at same position (no offset)
- ✅ Keyboard shortcuts work (Delete/Backspace, Cmd+D/Ctrl+D)
- ✅ Operations sync across users in real-time
- ✅ Toast notifications for user feedback
- ✅ Works with both single and multi-select

---

### **PR #17: Performance Monitoring & Optimization** ⚡

**Priority:** HIGH (Non-functional requirement)\
**Estimated Time:** 3-4 hours

#### Tasks:

1. **Create performance utilities**
   - Files: `utils/performance.ts`
   - FPS counter
   - Render time tracking

2. **Build performance hook**
   - Files: `hooks/usePerformance.ts`
   - Monitor FPS
   - Track object count
   - Measure sync latency

3. **Add performance HUD**
   - Files: `components/Canvas/Canvas.tsx`
   - Display FPS (dev mode)
   - Display object count
   - Display sync latency

4. **Optimize Firestore writes**
   - Files: `hooks/useFirestore.ts`, `hooks/useCursors.ts`
   - Debounce position updates (50-100ms)
   - Batch writes where possible
   - Throttle cursor updates

5. **Optimize rendering**
   - Files: `components/Canvas/Shape.tsx`
   - React.memo for shape components
   - Avoid unnecessary re-renders

6. **Test with 500+ objects**
   - Files: Add test script to create bulk objects
   - Verify FPS stays ~60

#### Deliverable:

- ✅ FPS counter shows ~60 FPS during interactions
- ✅ Sync latency <100ms for objects, <50ms for cursors
- ✅ App handles 500+ objects without lag
- ✅ Debouncing and batching implemented

---

### **PR #18: Polish & Error Handling** ✨

**Priority:** MEDIUM (User experience)\
**Estimated Time:** 3-4 hours

#### Tasks:

1. **Add error boundaries**
   - Files: `components/ErrorBoundary.tsx`, `app/layout.tsx`
   - Catch React errors
   - Display error UI

2. **Improve loading states**
   - Files: `components/Canvas/Canvas.tsx`, `components/Auth/LoginForm.tsx`
   - Better loading spinners
   - Skeleton screens

3. **Add toast notifications**
   - Files: Install toast library (e.g., sonner), create `components/Toast.tsx`
   - Success/error messages for operations
   - Network connection status

4. **Handle network errors**
   - Files: `hooks/useFirestore.ts`
   - Retry failed writes
   - Show offline indicator
   - Queue operations when offline

5. **Add keyboard shortcuts help**
   - Files: `components/HelpModal.tsx`
   - List all keyboard shortcuts
   - Trigger with "?" key

6. **Final styling polish**
   - Files: `app/globals.css`, component styles
   - Consistent colors and spacing
   - Responsive design

#### Deliverable:

- ✅ Graceful error handling
- ✅ Clear loading and error states
- ✅ Toast notifications for user actions
- ✅ Offline/online indicators
- ✅ Keyboard shortcuts documented
- ✅ Polished UI

---

### **PR #19: Testing & Documentation** 📚

**Priority:** HIGH (Validation)\
**Estimated Time:** 3-4 hours

#### Tasks:

1. **Manual testing checklist**
   - Files: Create `TESTING.md`
   - Test all functional requirements
   - Test with 2+ users in different browsers
   - Test refresh mid-edit
   - Test rapid shape creation

2. **Performance testing**
   - Files: Document results in `TESTING.md`
   - Verify 60 FPS with interactions
   - Verify sync latency <100ms
   - Verify 500+ objects performance
   - Verify 5+ concurrent users

3. **Update README**
   - Files: `README.md`
   - Add setup instructions
   - Add architecture overview
   - Add deployed URL
   - Add screenshots/GIFs

4. **Environment setup guide**
   - Files: `README.md`, `.env.example`
   - Document Firebase setup steps
   - Document required environment variables

5. **Known issues & limitations**
   - Files: `README.md`
   - Document any known bugs
   - Document browser compatibility
   - Document performance limitations

#### Deliverable:

- ✅ All success criteria tested and passing
- ✅ Performance metrics documented
- ✅ Complete README with setup guide
- ✅ Deployed URL accessible and working

---

### **PR #20: Architecture Refactor (4-Tier System)** 🏗️ ✅

**Priority:** HIGH (Code quality & maintainability)\
**Estimated Time:** 4-5 hours\
**Status:** COMPLETED

#### Tasks:

1. **Create UI state store**
   - Files: `store/uiStore.ts`
   - Context menus, tool windows, modals state
   - Toast notification system
   - Keyboard modifier tracking

2. **Build command service layer**
   - Files: `services/canvasCommands.ts`
   - Centralized CanvasCommandService class
   - All canvas operations (delete, duplicate, move, transform, etc.)
   - Consistent error handling and user feedback

3. **Extract keyboard shortcuts hook**
   - Files: `hooks/useKeyboardShortcuts.ts`
   - Consolidate all keyboard handling
   - Centralized shortcut definitions
   - Support for Cmd+D, Cmd+C/V, Delete, Arrow keys, etc.

4. **Extract shape interactions hook**
   - Files: `hooks/useShapeInteractions.ts`
   - All shape event handlers
   - Click, right-click, drag, transform, text editing
   - Separated from Canvas.tsx

5. **Create context menu component**
   - Files: `components/Canvas/ContextMenu.tsx`
   - Right-click menu for shapes
   - Duplicate, Copy, Delete, Layer operations
   - Properties panel trigger

6. **Create toast notification component**
   - Files: `components/Canvas/Toast.tsx`
   - User feedback for all operations
   - Success, error, warning, info types
   - Auto-dismiss with animation

7. **Refactor Canvas.tsx**
   - Files: `components/Canvas/Canvas.tsx`
   - Reduced from 600+ to ~350 lines
   - Uses new hooks and command service
   - Cleaner composition pattern

8. **Update shape components**
   - Files: `components/Canvas/Shape.tsx`, `Rectangle.tsx`, `Circle.tsx`, `Text.tsx`
   - Add `onContextMenu` prop for right-click
   - Pass through to all shape types

9. **Add architecture documentation**
   - Files: `ARCHITECTURE.md`
   - Complete guide to 4-tier system
   - Examples and patterns
   - How to extend with new features

#### Deliverable:

- ✅ Canvas component reduced from 600+ to ~350 lines
- ✅ All keyboard shortcuts consolidated in one place
- ✅ Right-click context menu working on all shapes
- ✅ Toast notifications for user feedback
- ✅ Command service handles all canvas operations
- ✅ Clear separation of concerns (UI/Interaction/Command/Domain)
- ✅ Production build successful with no errors
- ✅ All existing functionality preserved
- ✅ Architecture documented in ARCHITECTURE.md

**Architecture Benefits:**
- Easier to test (commands separate from UI)
- Easier to extend (clear place for new features)
- Better code organization (small, focused files)
- Reusable commands (same code from menu, keyboard, toolbar)

---

## Summary Timeline

| PR # | Title                           | Priority | Time     | Cumulative            |
| ---- | ------------------------------- | -------- | -------- | --------------------- |
| 1    | Project Setup & Firebase Config | CRITICAL | 2.5-3.5h | 2.5-3.5h              |
| 2    | Vercel Deployment & CI/CD       | HIGH     | 1-2h     | 3.5-5.5h              |
| 3    | Authentication System           | HIGH     | 3-4h     | 6.5-9.5h              |
| 4    | Basic Canvas with Pan & Zoom    | HIGH     | 4-5h     | 10.5-14.5h            |
| 5    | Firestore Sync Infrastructure   | CRITICAL | 5-6h     | 15.5-20.5h            |
| 6    | Rectangle Shape Creation        | HIGH     | 3-4h     | 18.5-24.5h            |
| 7    | Shape Selection & Movement      | HIGH     | 4-5h     | 22.5-29.5h            |
| 8    | Object-Level Locking            | CRITICAL | 5-6h     | 27.5-35.5h            |
| 9    | User Presence & Cursors         | HIGH     | 3-4h     | 30.5-39.5h ✅ **MVP** |
| 10   | Circle Shape Support            | MEDIUM   | 2-3h     | 32.5-42.5h            |
| 11   | Text Shape Support              | MEDIUM   | 3-4h     | 35.5-46.5h            |
| 12   | Transform Controls              | HIGH     | 4-5h     | 39.5-51.5h ✅         |
| 13   | Multi-Select (Shift-Click)      | MEDIUM   | 3-4h     | 42.5-55.5h            |
| 14   | Drag-to-Select                  | MEDIUM   | 3-4h     | 45.5-59.5h            |
| 15   | Layer Management                | MEDIUM   | 3-4h     | 48.5-63.5h            |
| 16   | Duplicate & Delete              | MEDIUM   | 2-3h     | 50.5-66.5h            |
| 17   | Performance Monitoring          | HIGH     | 3-4h     | 53.5-70.5h            |
| 18   | Polish & Error Handling         | MEDIUM   | 3-4h     | 56.5-74.5h            |
| 19   | Testing & Documentation         | HIGH     | 3-4h     | 59.5-78.5h            |
| 20   | Architecture Refactor (4-Tier)  | HIGH     | 4-5h     | 63.5-83.5h ✅         |

**Total Estimated Time:** 63.5-83.5 hours (8-10.5 working days for 1 developer)

**MVP Checkpoint:** After PR #9 (~30.5-39.5 hours) you'll have a complete MVP
with all critical features: canvas, shapes, real-time sync, locking, and
presence.

---

## PR Checklist Template

Use this for each PR:

```markdown
## PR #[NUMBER]: [TITLE]

### Pre-Push Checklist

- [ ] All files updated as specified
- [ ] Code runs locally without errors
- [ ] Changes tested in browser
- [ ] Firebase rules updated (if needed)
- [ ] Types updated (if needed)
- [ ] No console errors
- [ ] Performance check (FPS stable)

### Testing Checklist

- [ ] Feature works in single user mode
- [ ] Feature works with 2+ users simultaneously
- [ ] Changes sync across all connected users
- [ ] Feature persists on page reload
- [ ] No breaking changes to existing features

### Deployment Checklist

- [ ] Pushed to main branch
- [ ] GitHub Actions deployment successful
- [ ] Verified changes on deployed URL
- [ ] No production errors in Firebase console

### Post-Deployment

- [ ] Mark PR as complete in tracking doc
- [ ] Update README if needed
- [ ] Document any new environment variables
- [ ] Note any known issues
```

---

## Development Workflow

### For Each PR:

1. **Create feature branch**
   ```bash
   git checkout -b pr-[NUMBER]-[short-description]
   ```

2. **Work through subtasks**
   - Update files as specified
   - Test locally after each subtask
   - Commit frequently with clear messages

3. **Pre-merge testing**
   - Test in multiple browsers
   - Test with 2+ users (use incognito/different browser)
   - Verify real-time sync
   - Check performance (FPS counter if available)

4. **Merge to main**
   ```bash
   git checkout main
   git merge pr-[NUMBER]-[short-description]
   git push origin main
   ```

5. **Verify deployment**
   - Wait for GitHub Actions to complete
   - Visit deployed URL
   - Test feature in production
   - Check Firebase console for errors

6. **Mark complete**
   - Update tracking spreadsheet/document
   - Move to next PR

---

## Critical Path PRs (Must Complete for MVP)

These PRs are absolutely required to pass the MVP checkpoint:

✅ **PR #1** - Project Setup & Firebase Configuration (Firestore + Realtime DB)\
✅ **PR #2** - Vercel Deployment & CI/CD\
✅ **PR #3** - Authentication System\
✅ **PR #4** - Basic Canvas with Pan & Zoom\
✅ **PR #5** - Firestore Sync Infrastructure\
✅ **PR #6** - Rectangle Shape Creation & Rendering\
✅ **PR #7** - Shape Selection & Movement\
✅ **PR #8** - Object-Level Locking (conflict resolution)\
✅ **PR #9** - User Presence & Multiplayer Cursors (Realtime DB)

**Minimum MVP requires PRs #1-9** (all CRITICAL + HIGH priority for
collaboration)

The remaining PRs complete the full feature set but can be prioritized based on
time constraints.

---

## Quick Reference: File Responsibilities

| File/Directory             | Primary Responsibility                                                   |
| -------------------------- | ------------------------------------------------------------------------ |
| `app/`                     | Next.js App Router pages and layouts                                     |
| `services/`                | Firebase initialization (both DBs), Firestore ops, Auth, Presence (RTDB), Commands |
| `services/canvasCommands.ts` | Command service layer - all canvas operations (CRUD, transformations)  |
| `components/Canvas/`       | Canvas rendering, shapes, cursors, transformers, context menus, toasts  |
| `components/Toolbar/`      | UI controls for shape creation and manipulation                          |
| `components/Auth/`         | Authentication UI and logic                                              |
| `components/Presence/`     | Online users display and cursor rendering (RTDB data)                    |
| `hooks/`                   | Custom React hooks for state, sync, locking, presence, interactions      |
| `hooks/useKeyboardShortcuts.ts` | Centralized keyboard shortcut handling                              |
| `hooks/useShapeInteractions.ts` | Shape event handlers (click, drag, transform, right-click)          |
| `store/`                   | Zustand state management (canvas, selection, UI overlay states)          |
| `store/uiStore.ts`         | UI overlay state (context menus, toasts, modals, tool windows)           |
| `types/`                   | TypeScript type definitions                                              |
| `utils/`                   | Helper functions (geometry, transforms, performance, locking)            |
| `firestore.rules`          | Security rules for Firestore (canvas objects)                            |
| `database.rules.json`      | Security rules for Realtime Database (presence)                          |
| `firestore.indexes.json`   | Composite indexes for queries                                            |
| `ARCHITECTURE.md`          | 4-tier architecture documentation and patterns                           |
| `middleware.ts`            | Next.js middleware for auth protection                                   |
| `next.config.js`           | Next.js configuration                                                    |

---

## Key Integration Points

### Shape Lifecycle

1. **Creation**: Toolbar → useCanvas hook → canvasStore → firestore.service →
   Firestore
2. **Rendering**: Firestore → useFirestore hook → canvasStore → Canvas component
   → Shape components
3. **Interaction**: Shape component → useLocking → canvasStore →
   firestore.service → Firestore
4. **Updates**: Firestore onSnapshot → useFirestore → canvasStore → Shape
   re-renders

### Lock Flow

1. **Acquire**: User mousedown → useLocking.acquireLock() → Write `lockedBy` to
   Firestore
2. **Active**: User drags → Only locked user can update → Others see locked
   indicator
3. **Release**: User mouseup → useLocking.releaseLock() → Clear `lockedBy` in
   Firestore
4. **Timeout**: lockManager monitors timestamps → Auto-release after 2-3 seconds

### Presence Flow

1. **Join**: User signs in → presence.service.joinCanvas() → Write to Realtime
   Database `presence/{userId}` → Set `onDisconnect().remove()` handler
2. **Active**: Cursor moves → useCursors.updatePosition() → Update cursor
   position in Realtime Database (debounced 30-50ms)
3. **Display**: Realtime Database `onValue()` listener → usePresence → Cursors
   component → Render all cursors in real-time
4. **Leave**: User closes tab → `onDisconnect()` automatically removes user from
   `presence` (no ghost users)

### Sync Flow

1. **Local Action**: User interaction → Update local store (optimistic)
2. **Write**: Store change → firestore.service.updateShape() → Write to
   Firestore
3. **Broadcast**: Firestore triggers onSnapshot → All clients receive update
4. **Reconcile**: useFirestore merges remote changes → Update local store →
   Re-render

---

## Environment Variables Required

Create `.env.local` file with:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your_project.firebaseio.com
```

**Note:** All Firebase environment variables must use the `NEXT_PUBLIC_` prefix
to be accessible in client components.

---

## Database Structure

### Firestore: `canvasObjects` Collection

```typescript
{
  id: string,                    // Document ID (auto-generated)
  type: 'rectangle' | 'circle' | 'text',
  x: number,
  y: number,
  width: number,
  height: number,
  rotation: number,              // degrees, default 0
  color: string,                 // hex color
  text?: string,                 // only for text objects
  fontSize?: number,             // only for text objects
  zIndex: number,                // layer order
  lockedBy: string | null,       // user ID or null
  lockedAt: Timestamp | null,    // Firebase Timestamp or null
  lastUpdatedBy: string,         // user ID
  updatedAt: Timestamp,          // Firebase Timestamp
  createdAt: Timestamp           // Firebase Timestamp
}
```

**Indexes needed:**

- `updatedAt` (ascending)
- `zIndex` (ascending)
- `lockedAt` (ascending) - for cleanup queries

### Realtime Database: `presence` Path

```typescript
// Structure: presence/{userId}
{
  userId: string,                // user's auth UID (also the key)
  displayName: string,
  color: string,                 // assigned color for cursor
  online: boolean,               // true when connected
  cursor: {
    x: number,
    y: number,
    timestamp: number            // Unix timestamp
  },
  lastSeen: number,              // Unix timestamp (ServerValue.TIMESTAMP)
  joinedAt: number               // Unix timestamp
}
```

**Key features:**

- Automatically removed via `onDisconnect().remove()`
- No indexes needed (simple path-based queries)
- Optimized for high-frequency updates (cursors)

---

## Security Rules Templates

### `firestore.rules` (Firestore)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function - user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper function - user is the owner/locker of the object
    function isOwnerOrUnlocked() {
      return !resource.data.keys().hasAny(['lockedBy']) ||
             resource.data.lockedBy == null ||
             resource.data.lockedBy == request.auth.uid;
    }
    
    // Canvas objects - authenticated users can read/write
    match /canvasObjects/{objectId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if isAuthenticated() && isOwnerOrUnlocked();
      allow delete: if isAuthenticated();
    }
  }
}
```

### `database.rules.json` (Realtime Database)

```json
{
  "rules": {
    ".read": false,
    ".write": false,
    "presence": {
      "$userId": {
        ".read": "auth != null",
        ".write": "auth != null && auth.uid === $userId",
        ".validate": "newData.hasChildren(['displayName', 'color', 'online'])"
      }
    }
  }
}
```

---

## Performance Optimization Checklist

### Firestore Optimization

- [ ] Debounce position updates (50-100ms)
- [ ] Debounce cursor updates (30-50ms)
- [ ] Use batch writes for multi-shape operations
- [ ] Implement optimistic updates (update local first)
- [ ] Limit onSnapshot listeners to active collections only
- [ ] Unsubscribe from listeners on component unmount

### React Optimization

- [ ] Use React.memo for Shape components
- [ ] Use useMemo for expensive calculations
- [ ] Use useCallback for event handlers passed to children
- [ ] Avoid inline object/array creation in render
- [ ] Implement virtualization if 1000+ objects (future enhancement)

### Konva Optimization

- [ ] Set `listening: false` for non-interactive shapes
- [ ] Use `perfectDrawEnabled: false` for better performance
- [ ] Implement layer caching for static elements
- [ ] Batch updates with `batchDraw()`
- [ ] Limit transformer to selected shapes only

### Network Optimization

- [ ] Enable Firestore offline persistence
- [ ] Implement exponential backoff for retries
- [ ] Queue operations during offline periods
- [ ] Compress large payloads (if needed)

---

## Troubleshooting Common Issues

### Issue: Shapes not syncing

**Check:**

- Firestore rules allow writes
- `useFirestore` hook is subscribed
- Network connection is active
- Console for Firestore errors

### Issue: Locks not releasing

**Check:**

- Lock timeout is running (lockManager)
- `lockedAt` timestamp is being written
- Lock release is called on mouseup/dragend
- Check for JavaScript errors preventing release

### Issue: Cursors lagging

**Check:**

- Cursor updates are debounced (30-50ms max)
- Realtime Database connection is active
- Check browser console for RTDB permission errors
- Too many simultaneous updates (throttle more)
- Verify `onValue()` listener is attached correctly

### Issue: Performance drops with many objects

**Check:**

- FPS counter shows actual frame rate
- React.memo is used on Shape components
- Konva layers are not unnecessarily re-rendering
- Consider reducing update frequency

### Issue: Deployment fails

**Check:**

- Vercel project is connected to GitHub repo
- Build completes successfully locally (`npm run build`)
- Environment variables are set in Vercel dashboard
- All `NEXT_PUBLIC_*` variables are configured correctly

---

## Success Metrics Dashboard

Track these metrics throughout development:

| Metric                    | Target  | Current | Status |
| ------------------------- | ------- | ------- | ------ |
| FPS (pan/zoom)            | ~60 FPS | TBD     | ⏳     |
| FPS (with 500 objects)    | ~60 FPS | TBD     | ⏳     |
| Object sync latency       | <100ms  | TBD     | ⏳     |
| Cursor sync latency       | <50ms   | TBD     | ⏳     |
| Concurrent users tested   | 5+      | TBD     | ⏳     |
| Page load time            | <3s     | TBD     | ⏳     |
| Time to first interaction | <1s     | TBD     | ⏳     |
| PRs completed             | 19      | 0       | ⏳     |

Update this table as you complete each PR and run performance tests.

---

## Final Deployment Checklist

Before submitting for evaluation:

### Functionality

- [ ] All three shape types work (rectangle, circle, text)
- [ ] Pan and zoom are smooth
- [ ] Selection works (single and multi)
- [ ] Transform works (move, resize, rotate)
- [ ] Duplicate and delete work
- [ ] Layer management works
- [ ] Real-time sync works with 2+ users
- [ ] Multiplayer cursors visible with names
- [ ] Presence awareness accurate
- [ ] Object-level locking prevents conflicts
- [ ] State persists on reload
- [ ] Authentication works

### Performance

- [ ] 60 FPS during all interactions
- [ ] Object sync <100ms
- [ ] Cursor sync <50ms
- [ ] Works with 500+ objects
- [ ] Works with 5+ concurrent users
- [ ] No memory leaks (check DevTools)

### Deployment

- [ ] Public URL accessible
- [ ] Auto-deployment working
- [ ] No console errors in production
- [ ] Works in Chrome, Firefox, Safari
- [ ] Works on mobile (bonus)

### Documentation

- [ ] README has setup instructions
- [ ] README has deployed URL
- [ ] Architecture documented
- [ ] Known issues documented
- [ ] `.env.example` provided

---

## Next Steps After MVP

Once MVP is complete, you'll move to Phase 2 (AI Agent Integration). That will
require:

1. Additional PRs for AI function calling schema
2. LangChain or OpenAI integration
3. AI command parsing and execution
4. Shared AI state synchronization
5. AI Development Log documentation

But focus on nailing the MVP first. The collaborative infrastructure is the
hardest part and the foundation for everything else.

**Good luck! 🚀**
