# 🧩 Collab Canvas — Development Plan & PR Breakdown

## File Structure

```
collab-canvas/
├── .github/
│   └── workflows/
│       └── firebase-hosting.yml          # Auto-deploy on push to main
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Canvas/
│   │   │   ├── Canvas.tsx                # Main canvas component
│   │   │   ├── Stage.tsx                 # Konva Stage wrapper
│   │   │   ├── Shape.tsx                 # Generic shape renderer
│   │   │   ├── Rectangle.tsx             # Rectangle shape
│   │   │   ├── Circle.tsx                # Circle shape
│   │   │   ├── Text.tsx                  # Text shape
│   │   │   ├── Transformer.tsx           # Transform controls
│   │   │   ├── SelectionBox.tsx          # Multi-select rectangle
│   │   │   └── Cursors.tsx               # Multiplayer cursors
│   │   ├── Toolbar/
│   │   │   ├── Toolbar.tsx               # Main toolbar
│   │   │   ├── ShapeTools.tsx            # Shape creation buttons
│   │   │   └── LayerTools.tsx            # Layer order controls
│   │   ├── Auth/
│   │   │   ├── AuthProvider.tsx          # Auth context provider
│   │   │   ├── LoginForm.tsx             # Login UI
│   │   │   └── ProtectedRoute.tsx        # Route guard
│   │   └── Presence/
│   │       ├── PresenceIndicator.tsx     # Online users list
│   │       └── UserCursor.tsx            # Single cursor component
│   ├── hooks/
│   │   ├── useAuth.ts                    # Firebase Auth hook
│   │   ├── useCanvas.ts                  # Canvas state management
│   │   ├── useFirestore.ts               # Firestore sync hook
│   │   ├── usePresence.ts                # User presence tracking (Realtime DB)
│   │   ├── useCursors.ts                 # Cursor position sync (Realtime DB)
│   │   ├── useLocking.ts                 # Object locking logic
│   │   └── usePerformance.ts             # FPS & performance monitoring
│   ├── services/
│   │   ├── firebase.ts                   # Firebase initialization (both DBs)
│   │   ├── firestore.service.ts          # Firestore CRUD operations
│   │   ├── auth.service.ts               # Auth operations
│   │   └── presence.service.ts           # Presence management (Realtime DB)
│   ├── store/
│   │   ├── canvasStore.ts                # Zustand store for canvas state
│   │   └── selectionStore.ts             # Selection state management
│   ├── types/
│   │   ├── canvas.types.ts               # Shape & canvas types
│   │   ├── user.types.ts                 # User & presence types
│   │   └── lock.types.ts                 # Locking types
│   ├── utils/
│   │   ├── geometry.ts                   # Shape calculations
│   │   ├── transforms.ts                 # Transform utilities
│   │   ├── lockManager.ts                # Lock timeout & cleanup
│   │   └── performance.ts                # Performance utilities
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── .env.example                          # Firebase config template
├── .env                                  # Firebase config (gitignored)
├── .gitignore
├── firebase.json                         # Firebase hosting config
├── .firebaserc                           # Firebase project config
├── firestore.rules                       # Firestore security rules
├── database.rules.json                   # Realtime Database security rules
├── firestore.indexes.json                # Composite indexes
├── package.json
├── tsconfig.json
├── vite.config.ts
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

### **PR #1: Project Setup & Firebase Configuration** 🏗️

**Priority:** CRITICAL (Foundation)\
**Estimated Time:** 2.5-3.5 hours

#### Tasks:

1. **Initialize Vite + React + TypeScript project**
   - Files: `package.json`, `vite.config.ts`, `tsconfig.json`
   - Install: `react`, `react-dom`, `typescript`, `vite`

2. **Install core dependencies**
   - Files: `package.json`
   - Install: `firebase`, `konva`, `react-konva`, `zustand`

3. **Setup Firebase project**
   - Files: `src/services/firebase.ts`, `.env.example`, `.env`
   - Create Firebase project in console
   - Enable Firestore and Authentication
   - **Enable Realtime Database** (for presence system)
   - Add Firebase config to environment variables
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

#### Deliverable:

- ✅ Project runs locally (`npm run dev`)
- ✅ Firebase initialized and connected (both Firestore and Realtime DB)
- ✅ File structure in place
- ✅ Both database security rules deployed

---

### **PR #2: Firebase Hosting & CI/CD** 🚀

**Priority:** HIGH (Enable continuous deployment)\
**Estimated Time:** 1-2 hours

#### Tasks:

1. **Setup Firebase Hosting**
   - Files: `firebase.json`, `.firebaserc`
   - Initialize Firebase hosting
   - Configure build output directory (`dist`)

2. **Create GitHub Actions workflow**
   - Files: `.github/workflows/firebase-hosting.yml`
   - Auto-deploy on push to `main`
   - Build and deploy to Firebase Hosting

3. **Add deployment documentation**
   - Files: `README.md`
   - Document deployment process
   - Add deployed URL placeholder

4. **Deploy initial version**
   - Push to main and verify deployment
   - Confirm public URL is accessible

#### Deliverable:

- ✅ App deployed and publicly accessible
- ✅ Auto-deployment working on push to main
- ✅ Public URL documented in README

---

### **PR #3: Authentication System** 🔐

**Priority:** HIGH (Required for presence)\
**Estimated Time:** 3-4 hours

#### Tasks:

1. **Create auth service**
   - Files: `src/services/auth.service.ts`
   - Implement email/password sign up/sign in
   - Implement anonymous sign in
   - Handle user display name

2. **Build auth context and hook**
   - Files: `src/components/Auth/AuthProvider.tsx`, `src/hooks/useAuth.ts`
   - Create auth state context
   - Handle auth state changes

3. **Create login UI**
   - Files: `src/components/Auth/LoginForm.tsx`
   - Email/password form
   - Anonymous login button
   - Display name input

4. **Add protected route**
   - Files: `src/components/Auth/ProtectedRoute.tsx`, `src/App.tsx`
   - Redirect unauthenticated users to login
   - Handle loading states

5. **Define user types**
   - Files: `src/types/user.types.ts`
   - User, AuthState types

#### Deliverable:

- ✅ Users can sign up/sign in
- ✅ Anonymous authentication working
- ✅ User display names stored
- ✅ Auth state persisted

---

### **PR #4: Basic Canvas with Pan & Zoom** 🎨

**Priority:** HIGH (Core functionality)\
**Estimated Time:** 4-5 hours

#### Tasks:

1. **Create canvas types**
   - Files: `src/types/canvas.types.ts`
   - Define Shape, CanvasObject, CanvasState types

2. **Setup Zustand store**
   - Files: `src/store/canvasStore.ts`
   - Canvas state management
   - Shape CRUD operations (local only)

3. **Build Stage component**
   - Files: `src/components/Canvas/Stage.tsx`
   - Konva Stage setup
   - Pan and zoom controls (mouse wheel + drag)
   - Viewport state management

4. **Create Canvas wrapper**
   - Files: `src/components/Canvas/Canvas.tsx`, `src/hooks/useCanvas.ts`
   - Render Stage
   - Handle canvas events
   - Canvas dimensions and responsiveness

5. **Add basic styling**
   - Files: `src/index.css`
   - Canvas container styles
   - Full viewport layout

6. **Update App component**
   - Files: `src/App.tsx`
   - Mount Canvas after auth

#### Deliverable:

- ✅ Empty canvas renders
- ✅ Pan with mouse drag working
- ✅ Zoom with mouse wheel working
- ✅ Smooth 60 FPS interactions

---

### **PR #5: Firestore Sync Infrastructure** 🔄

**Priority:** CRITICAL (Real-time foundation)\
**Estimated Time:** 5-6 hours

#### Tasks:

1. **Create Firestore service**
   - Files: `src/services/firestore.service.ts`
   - CRUD operations for `canvasObjects`
   - Batch operations
   - Transaction support

2. **Build Firestore sync hook**
   - Files: `src/hooks/useFirestore.ts`
   - onSnapshot listeners for `canvasObjects`
   - Real-time updates to local store
   - Error handling and reconnection

3. **Integrate with canvas store**
   - Files: `src/store/canvasStore.ts`
   - Subscribe to Firestore changes
   - Push local changes to Firestore
   - Optimistic updates

4. **Add loading states**
   - Files: `src/components/Canvas/Canvas.tsx`
   - Loading indicator while fetching initial state
   - Error states

5. **Handle persistence**
   - Files: `src/hooks/useFirestore.ts`
   - Canvas state persists on reload
   - Handle empty canvas initialization

#### Deliverable:

- ✅ Canvas state syncs to Firestore
- ✅ Changes persist on page reload
- ✅ Multiple browser tabs see same state
- ✅ Error handling for network issues

---

### **PR #6: Rectangle Shape Creation & Rendering** 📐

**Priority:** HIGH (First shape type)\
**Estimated Time:** 3-4 hours

#### Tasks:

1. **Create Shape components**
   - Files: `src/components/Canvas/Shape.tsx`,
     `src/components/Canvas/Rectangle.tsx`
   - Generic Shape wrapper
   - Rectangle rendering with Konva.Rect

2. **Add shape creation toolbar**
   - Files: `src/components/Toolbar/Toolbar.tsx`,
     `src/components/Toolbar/ShapeTools.tsx`
   - Rectangle creation button
   - Toolbar styling

3. **Implement shape creation logic**
   - Files: `src/hooks/useCanvas.ts`, `src/store/canvasStore.ts`
   - Click on canvas to create rectangle
   - Default size, color, position
   - Generate unique IDs

4. **Sync new shapes to Firestore**
   - Files: `src/services/firestore.service.ts`
   - Write new shape to `canvasObjects` collection
   - Include all required fields

5. **Add geometry utilities**
   - Files: `src/utils/geometry.ts`
   - Shape bounds calculation
   - Collision detection helpers

#### Deliverable:

- ✅ Click toolbar to enable rectangle creation mode
- ✅ Click canvas to create rectangle
- ✅ Rectangle appears for all connected users
- ✅ Rectangles persist on reload

---

### **PR #7: Shape Selection & Movement** 🖱️

**Priority:** HIGH (Basic interaction)\
**Estimated Time:** 4-5 hours

#### Tasks:

1. **Create selection store**
   - Files: `src/store/selectionStore.ts`
   - Track selected shape IDs
   - Single selection logic

2. **Add click selection**
   - Files: `src/components/Canvas/Shape.tsx`
   - Click shape to select
   - Visual selection indicator (border/highlight)

3. **Implement drag to move**
   - Files: `src/components/Canvas/Shape.tsx`, `src/hooks/useCanvas.ts`
   - Konva drag events
   - Update shape position in store
   - Sync position changes to Firestore

4. **Add transform utilities**
   - Files: `src/utils/transforms.ts`
   - Position calculation helpers
   - Snap to grid (optional)

5. **Handle click outside to deselect**
   - Files: `src/components/Canvas/Stage.tsx`
   - Click canvas background to clear selection

#### Deliverable:

- ✅ Click shape to select (visual feedback)
- ✅ Drag selected shape to move
- ✅ Position updates sync to all users
- ✅ Click outside to deselect

---

### **PR #8: Object-Level Locking System** 🔒

**Priority:** CRITICAL (Conflict resolution)\
**Estimated Time:** 5-6 hours

#### Tasks:

1. **Create locking types**
   - Files: `src/types/lock.types.ts`
   - Lock, LockState types

2. **Build locking service**
   - Files: `src/hooks/useLocking.ts`, `src/utils/lockManager.ts`
   - Acquire lock (write `lockedBy`, `lockedAt` to Firestore)
   - Release lock (clear fields)
   - Check lock status
   - Automatic timeout cleanup (2-3 seconds)

3. **Integrate locks with shape interaction**
   - Files: `src/components/Canvas/Shape.tsx`
   - Attempt lock on mousedown/dragstart
   - Block interaction if locked by another user
   - Release lock on mouseup/dragend

4. **Add locked visual indicator**
   - Files: `src/components/Canvas/Shape.tsx`
   - Gray border or tooltip when locked by another user
   - Show locking user's name

5. **Handle stale lock cleanup**
   - Files: `src/utils/lockManager.ts`
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

### **PR #9: User Presence & Multiplayer Cursors** 👥

**Priority:** HIGH (Collaboration visibility)\
**Estimated Time:** 3-4 hours

#### Tasks:

1. **Create presence service**
   - Files: `src/services/presence.service.ts`, `src/types/user.types.ts`
   - Write user to Realtime Database `presence/{userId}` path on mount
   - Use `onDisconnect().remove()` for automatic cleanup
   - Include user ID, display name, color, online status
   - No need for manual heartbeat polling

2. **Build presence hook**
   - Files: `src/hooks/usePresence.ts`
   - Subscribe to `presence` path using `onValue()` listener
   - Track online users in real-time
   - Filter for users with `online: true`

3. **Create presence indicator UI**
   - Files: `src/components/Presence/PresenceIndicator.tsx`
   - Show count of online users
   - List user names with colored dots

4. **Build cursor tracking**
   - Files: `src/hooks/useCursors.ts`
   - Update cursor position in Realtime Database (debounced 30-50ms)
   - Use `set()` on `presence/{userId}/cursor` path
   - Subscribe to other users' cursor positions with `onValue()`

5. **Create cursor components**
   - Files: `src/components/Presence/UserCursor.tsx`,
     `src/components/Canvas/Cursors.tsx`
   - Render cursor SVG with user name label
   - Render all cursors on Stage
   - Transform cursor positions based on canvas zoom/pan

6. **Integrate cursor data with presence**
   - Files: `src/services/presence.service.ts`
   - Store cursor position within user's presence node
   - Update on mousemove events (debounced)

#### Deliverable:

- ✅ Online users count displayed
- ✅ User list shows who's connected
- ✅ Other users' cursors visible with names
- ✅ Cursor positions update in real-time (<50ms latency)
- ✅ Users automatically removed on disconnect (no ghost users)

---

### **PR #10: Circle Shape Support** ⭕

**Priority:** MEDIUM (Second shape type)\
**Estimated Time:** 2-3 hours

#### Tasks:

1. **Create Circle component**
   - Files: `src/components/Canvas/Circle.tsx`
   - Render with Konva.Circle
   - Support same interactions as Rectangle

2. **Add circle creation button**
   - Files: `src/components/Toolbar/ShapeTools.tsx`
   - Circle button in toolbar

3. **Update shape creation logic**
   - Files: `src/hooks/useCanvas.ts`, `src/store/canvasStore.ts`
   - Handle `type: 'circle'`
   - Default radius/size

4. **Update Shape wrapper**
   - Files: `src/components/Canvas/Shape.tsx`
   - Conditionally render Circle or Rectangle based on type

5. **Update geometry utilities**
   - Files: `src/utils/geometry.ts`
   - Circle bounds calculation
   - Circle-specific helpers

#### Deliverable:

- ✅ Circle creation button in toolbar
- ✅ Circles render and sync across users
- ✅ Circles support selection and movement
- ✅ Circles work with locking system

---

### **PR #11: Text Shape Support** 📝

**Priority:** MEDIUM (Third shape type)\
**Estimated Time:** 3-4 hours

#### Tasks:

1. **Create Text component**
   - Files: `src/components/Canvas/Text.tsx`
   - Render with Konva.Text
   - Double-click to edit text
   - Input overlay for editing

2. **Add text creation button**
   - Files: `src/components/Toolbar/ShapeTools.tsx`
   - Text button in toolbar

3. **Implement text editing**
   - Files: `src/components/Canvas/Text.tsx`
   - Double-click to enter edit mode
   - Render HTML input overlay
   - Save text on blur/Enter

4. **Update shape creation logic**
   - Files: `src/hooks/useCanvas.ts`, `src/store/canvasStore.ts`
   - Handle `type: 'text'`
   - Default text, fontSize

5. **Update Shape wrapper**
   - Files: `src/components/Canvas/Shape.tsx`
   - Render Text component

6. **Sync text changes**
   - Files: `src/services/firestore.service.ts`
   - Update text field in Firestore on edit

#### Deliverable:

- ✅ Text creation button in toolbar
- ✅ Click to create text, double-click to edit
- ✅ Text edits sync across users
- ✅ Text supports selection and movement

---

### **PR #12: Transform Controls (Resize & Rotate)** 🔄

**Priority:** HIGH (Essential interaction)\
**Estimated Time:** 4-5 hours

#### Tasks:

1. **Create Transformer component**
   - Files: `src/components/Canvas/Transformer.tsx`
   - Konva.Transformer for resize and rotate handles
   - Attach to selected shape

2. **Implement resize**
   - Files: `src/components/Canvas/Transformer.tsx`
   - Drag corner handles to resize
   - Update width/height in store
   - Sync to Firestore

3. **Implement rotate**
   - Files: `src/components/Canvas/Transformer.tsx`
   - Drag rotation handle
   - Update rotation in store
   - Sync to Firestore

4. **Apply transformations to shapes**
   - Files: `src/components/Canvas/Shape.tsx`,
     `src/components/Canvas/Rectangle.tsx`, `src/components/Canvas/Circle.tsx`
   - Read rotation from shape data
   - Apply via Konva rotation prop

5. **Lock during transformation**
   - Files: `src/components/Canvas/Transformer.tsx`
   - Acquire lock on transform start
   - Release lock on transform end

6. **Update transform utilities**
   - Files: `src/utils/transforms.ts`
   - Rotation calculations
   - Bounding box with rotation

#### Deliverable:

- ✅ Corner handles appear on selected shapes
- ✅ Drag corners to resize shapes
- ✅ Drag rotation handle to rotate shapes
- ✅ Transform changes sync in real-time
- ✅ Transforms respect locking

---

### **PR #13: Multi-Select (Shift-Click)** 🖱️✨

**Priority:** MEDIUM (Enhanced interaction)\
**Estimated Time:** 3-4 hours

#### Tasks:

1. **Update selection store**
   - Files: `src/store/selectionStore.ts`
   - Support multiple selected IDs
   - Add/remove from selection

2. **Implement shift-click**
   - Files: `src/components/Canvas/Shape.tsx`
   - Detect shift key on click
   - Add shape to selection instead of replacing

3. **Visual feedback for multi-select**
   - Files: `src/components/Canvas/Shape.tsx`
   - Highlight all selected shapes

4. **Move multiple shapes together**
   - Files: `src/hooks/useCanvas.ts`
   - Drag one shape in selection → move all
   - Calculate relative offsets

5. **Apply operations to multi-select**
   - Files: `src/store/canvasStore.ts`
   - Delete multiple shapes
   - (Duplicate will be added in next PR)

#### Deliverable:

- ✅ Shift-click to add shapes to selection
- ✅ All selected shapes highlighted
- ✅ Dragging one selected shape moves all
- ✅ Delete works on multiple shapes

---

### **PR #14: Drag-to-Select (Selection Box)** 📦

**Priority:** MEDIUM (Enhanced interaction)\
**Estimated Time:** 3-4 hours

#### Tasks:

1. **Create SelectionBox component**
   - Files: `src/components/Canvas/SelectionBox.tsx`
   - Render selection rectangle

2. **Implement drag-to-select**
   - Files: `src/components/Canvas/Stage.tsx`, `src/hooks/useCanvas.ts`
   - Click and drag on canvas background
   - Draw selection box
   - Detect shapes within box bounds

3. **Update selection on drag end**
   - Files: `src/store/selectionStore.ts`
   - Select all shapes intersecting box
   - Clear previous selection (unless shift held)

4. **Add intersection detection**
   - Files: `src/utils/geometry.ts`
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
   - Files: `src/types/canvas.types.ts`, `src/store/canvasStore.ts`
   - Include zIndex in shape data
   - Default zIndex on creation

2. **Sort shapes by zIndex**
   - Files: `src/components/Canvas/Canvas.tsx`
   - Render shapes in zIndex order

3. **Create layer tools**
   - Files: `src/components/Toolbar/LayerTools.tsx`
   - "Bring Forward" button
   - "Send Backward" button
   - "Bring to Front" button
   - "Send to Back" button

4. **Implement layer operations**
   - Files: `src/store/canvasStore.ts`
   - Update zIndex for selected shapes
   - Sync to Firestore

5. **Add to toolbar**
   - Files: `src/components/Toolbar/Toolbar.tsx`
   - Mount LayerTools component

#### Deliverable:

- ✅ Shapes render in correct layer order
- ✅ Layer control buttons in toolbar
- ✅ Bring forward/back operations work
- ✅ Layer changes sync across users

---

### **PR #16: Duplicate & Delete Operations** 🗑️📋

**Priority:** MEDIUM (Basic operations)\
**Estimated Time:** 2-3 hours

#### Tasks:

1. **Implement delete**
   - Files: `src/store/canvasStore.ts`
   - Delete selected shapes from local store
   - Delete from Firestore
   - Keyboard shortcut (Delete/Backspace key)

2. **Implement duplicate**
   - Files: `src/store/canvasStore.ts`
   - Clone selected shapes with offset position
   - New unique IDs
   - Write to Firestore

3. **Add toolbar buttons**
   - Files: `src/components/Toolbar/Toolbar.tsx`
   - Delete button
   - Duplicate button

4. **Add keyboard shortcuts**
   - Files: `src/hooks/useCanvas.ts`
   - Delete: Delete/Backspace
   - Duplicate: Ctrl+D / Cmd+D

#### Deliverable:

- ✅ Delete button removes selected shapes
- ✅ Duplicate button clones selected shapes
- ✅ Keyboard shortcuts work
- ✅ Operations sync across users

---

### **PR #17: Performance Monitoring & Optimization** ⚡

**Priority:** HIGH (Non-functional requirement)\
**Estimated Time:** 3-4 hours

#### Tasks:

1. **Create performance utilities**
   - Files: `src/utils/performance.ts`
   - FPS counter
   - Render time tracking

2. **Build performance hook**
   - Files: `src/hooks/usePerformance.ts`
   - Monitor FPS
   - Track object count
   - Measure sync latency

3. **Add performance HUD**
   - Files: `src/components/Canvas/Canvas.tsx`
   - Display FPS (dev mode)
   - Display object count
   - Display sync latency

4. **Optimize Firestore writes**
   - Files: `src/hooks/useFirestore.ts`, `src/hooks/useCursors.ts`
   - Debounce position updates (50-100ms)
   - Batch writes where possible
   - Throttle cursor updates

5. **Optimize rendering**
   - Files: `src/components/Canvas/Shape.tsx`
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
   - Files: `src/components/ErrorBoundary.tsx`, `src/App.tsx`
   - Catch React errors
   - Display error UI

2. **Improve loading states**
   - Files: `src/components/Canvas/Canvas.tsx`,
     `src/components/Auth/LoginForm.tsx`
   - Better loading spinners
   - Skeleton screens

3. **Add toast notifications**
   - Files: Install toast library, create `src/components/Toast.tsx`
   - Success/error messages for operations
   - Network connection status

4. **Handle network errors**
   - Files: `src/hooks/useFirestore.ts`
   - Retry failed writes
   - Show offline indicator
   - Queue operations when offline

5. **Add keyboard shortcuts help**
   - Files: `src/components/HelpModal.tsx`
   - List all keyboard shortcuts
   - Trigger with "?" key

6. **Final styling polish**
   - Files: `src/index.css`, component styles
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

## Summary Timeline

| PR # | Title                           | Priority | Time     | Cumulative            |
| ---- | ------------------------------- | -------- | -------- | --------------------- |
| 1    | Project Setup & Firebase Config | CRITICAL | 2.5-3.5h | 2.5-3.5h              |
| 2    | Firebase Hosting & CI/CD        | HIGH     | 1-2h     | 3.5-5.5h              |
| 3    | Authentication System           | HIGH     | 3-4h     | 6.5-9.5h              |
| 4    | Basic Canvas with Pan & Zoom    | HIGH     | 4-5h     | 10.5-14.5h            |
| 5    | Firestore Sync Infrastructure   | CRITICAL | 5-6h     | 15.5-20.5h            |
| 6    | Rectangle Shape Creation        | HIGH     | 3-4h     | 18.5-24.5h            |
| 7    | Shape Selection & Movement      | HIGH     | 4-5h     | 22.5-29.5h            |
| 8    | Object-Level Locking            | CRITICAL | 5-6h     | 27.5-35.5h            |
| 9    | User Presence & Cursors         | HIGH     | 3-4h     | 30.5-39.5h ✅ **MVP** |
| 10   | Circle Shape Support            | MEDIUM   | 2-3h     | 32.5-42.5h            |
| 11   | Text Shape Support              | MEDIUM   | 3-4h     | 35.5-46.5h            |
| 12   | Transform Controls              | HIGH     | 4-5h     | 39.5-51.5h            |
| 13   | Multi-Select (Shift-Click)      | MEDIUM   | 3-4h     | 42.5-55.5h            |
| 14   | Drag-to-Select                  | MEDIUM   | 3-4h     | 45.5-59.5h            |
| 15   | Layer Management                | MEDIUM   | 3-4h     | 48.5-63.5h            |
| 16   | Duplicate & Delete              | MEDIUM   | 2-3h     | 50.5-66.5h            |
| 17   | Performance Monitoring          | HIGH     | 3-4h     | 53.5-70.5h            |
| 18   | Polish & Error Handling         | MEDIUM   | 3-4h     | 56.5-74.5h            |
| 19   | Testing & Documentation         | HIGH     | 3-4h     | 59.5-78.5h            |

**Total Estimated Time:** 59.5-78.5 hours (7.5-10 working days for 1 developer)

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
✅ **PR #2** - Firebase Hosting & CI/CD\
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
| `src/services/`            | Firebase initialization (both DBs), Firestore ops, Auth, Presence (RTDB) |
| `src/components/Canvas/`   | Canvas rendering, shapes, cursors, transformers                          |
| `src/components/Toolbar/`  | UI controls for shape creation and manipulation                          |
| `src/components/Auth/`     | Authentication UI and logic                                              |
| `src/components/Presence/` | Online users display and cursor rendering (RTDB data)                    |
| `src/hooks/`               | Custom React hooks for state, sync, locking, presence (RTDB)             |
| `src/store/`               | Zustand state management (canvas state, selection state)                 |
| `src/types/`               | TypeScript type definitions                                              |
| `src/utils/`               | Helper functions (geometry, transforms, performance, locking)            |
| `firestore.rules`          | Security rules for Firestore (canvas objects)                            |
| `database.rules.json`      | Security rules for Realtime Database (presence)                          |
| `firestore.indexes.json`   | Composite indexes for queries                                            |
| `.github/workflows/`       | CI/CD deployment automation                                              |

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

Create `.env` file with:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

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

- `firebase.json` points to correct build directory (`dist`)
- GitHub Actions has Firebase token/secret
- Build completes successfully locally
- `.env` variables are set (or use Firebase config)

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
