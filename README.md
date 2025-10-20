# 🎨 Collab Canvas

A real-time collaborative canvas application with AI assistant capabilities. Think Figma meets multiplayer editing—multiple users can create, edit, and manipulate shapes simultaneously with smooth real-time synchronization.

![Next.js](https://img.shields.io/badge/Next.js-15.5-black?logo=next.js)
![React](https://img.shields.io/badge/React-19.1-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)
![Firebase](https://img.shields.io/badge/Firebase-12.4-orange?logo=firebase)

---

## ✨ Features

### Core Canvas Capabilities
- **Real-time Collaboration**: Multiple users can edit simultaneously with sub-100ms sync latency
- **Shape Creation**: Rectangles, circles, and text layers
- **Transform Tools**: Move, resize, and rotate shapes with visual feedback
- **Multi-select**: Select multiple shapes with Shift+Click or drag-to-select box
- **Layer Management**: Full z-index control (bring to front, send to back, etc.)
- **Copy/Paste/Duplicate**: Standard editing operations with keyboard shortcuts
- **Pan & Zoom**: Navigate large canvases smoothly

### Collaboration Features
- **Live Cursors**: See where other users are pointing in real-time
- **Presence Awareness**: Know who's online with visual indicators
- **Lock-based Editing**: Prevents conflicts—only one user can edit a shape at a time
- **Persistent State**: Canvas data persists across sessions via Firestore

### User Experience
- **Context Menus**: Right-click for quick actions
- **Properties Panel**: Edit shape properties in real-time (⌘P / Ctrl+P)
- **AI Assistant**: Natural language interface for canvas operations (⌘K / Ctrl+K)
- **Toast Notifications**: Clear feedback for all operations
- **Undo/Redo**: Full history support with keyboard shortcuts
- **Keyboard Shortcuts**: Comprehensive shortcuts for power users

---

## 🛠 Technology Stack

### Frontend
- **[Next.js 15](https://nextjs.org/)** - React framework with App Router and Turbopack
- **[React 19](https://react.dev/)** - UI library
- **[TypeScript 5](https://www.typescriptlang.org/)** - Type safety
- **[Konva.js](https://konvajs.org/)** & **[React Konva](https://konvajs.org/docs/react/)** - High-performance 2D canvas rendering
- **[Zustand](https://zustand-demo.pmnd.rs/)** - Lightweight state management
- **[Tailwind CSS 4](https://tailwindcss.com/)** - Utility-first styling

### Backend & Services
- **[Firebase](https://firebase.google.com/)** - Backend infrastructure
  - **Firestore** - Persistent canvas object storage with real-time sync
  - **Realtime Database** - Ephemeral presence and cursor data (<50ms latency)
  - **Authentication** - User identity and access control
- **[OpenAI API](https://openai.com/)** - AI assistant powered by GPT-4
- **[Vercel AI SDK](https://sdk.vercel.ai/)** - Streaming AI responses

### Other Key Libraries
- **[Zod](https://zod.dev/)** - Runtime type validation
- **[react-colorful](https://omgovich.github.io/react-colorful/)** - Color picker component

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js 18+** ([Download](https://nodejs.org/))
- **pnpm** package manager ([Install](https://pnpm.io/installation))
  ```bash
  npm install -g pnpm
  ```
- **Firebase project** with:
  - Firestore Database enabled
  - Realtime Database enabled  
  - Authentication enabled (Email/Password or Anonymous)
- **OpenAI API key** ([Get one here](https://platform.openai.com/api-keys))

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/collab-canvas.git
cd collab-canvas
```

### 2. Install Dependencies

```bash
pnpm install
```

This will install all required packages including Next.js, React, Firebase, Konva, and more.

### 3. Set Up Firebase

1. **Create a Firebase project:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Click "Add project" and follow the setup wizard
   - Enable Google Analytics (optional)

2. **Enable Firestore Database:**
   - In Firebase Console, go to "Build" → "Firestore Database"
   - Click "Create database"
   - Start in **production mode** or **test mode** (for development)
   - Choose a location (e.g., `us-central1`)

3. **Enable Realtime Database:**
   - Go to "Build" → "Realtime Database"
   - Click "Create Database"
   - Start in **test mode** for development
   - Note: Realtime Database is used for high-frequency cursor updates

4. **Enable Authentication:**
   - Go to "Build" → "Authentication"
   - Click "Get started"
   - Enable "Email/Password" and/or "Anonymous" sign-in methods

5. **Get your Firebase config:**
   - Go to Project Settings (gear icon)
   - Scroll down to "Your apps" → Click web icon `</>`
   - Register your app and copy the config object

6. **Set up Firestore Security Rules** (optional but recommended):
   ```bash
   firebase deploy --only firestore:rules
   ```
   Uses the `firestore.rules` file in this project.

### 4. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
# Firebase Client Configuration (Public)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your_project.firebaseio.com

# OpenAI API Key (Server-side only)
OPENAI_API_KEY=sk-your_openai_api_key_here
```

**Important Notes:**
- Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser
- `OPENAI_API_KEY` is server-side only (used in API routes)
- Never commit `.env.local` to version control (it's in `.gitignore`)

### 5. Run the Development Server

```bash
pnpm dev
```

This will start the development server with Turbopack (faster than Webpack).

Open [http://localhost:3000](http://localhost:3000) in your browser to see the app!

### 6. Test Multi-User Collaboration

Open the app in **multiple browser windows** or **different browsers** to test real-time collaboration:

1. Create shapes in one window
2. See them appear instantly in other windows
3. Try moving shapes simultaneously (locking prevents conflicts)
4. Observe live cursor movements

---

## ⌨️ Keyboard Shortcuts

### Canvas Operations
- **Arrow Keys** - Move selected shapes (1px increments)
- **Shift + Arrow Keys** - Move selected shapes (10px increments)
- **Delete / Backspace** - Delete selected shapes
- **Escape** - Deselect all shapes

### Editing
- **⌘/Ctrl + D** - Duplicate selected shapes
- **⌘/Ctrl + C** - Copy selected shapes
- **⌘/Ctrl + V** - Paste shapes
- **⌘/Ctrl + Z** - Undo
- **⌘/Ctrl + ⇧ + Z** / **Ctrl + Y** - Redo

### Layer Management
- **]** - Bring to front
- **[** - Send to back  
- **Shift + ]** - Bring forward
- **Shift + [** - Send backward

### Panels & Tools
- **⌘/Ctrl + K** - Toggle AI Assistant panel
- **P** - Toggle Properties panel

### Selection
- **Shift + Click** - Add/remove shapes from selection
- **Click + Drag** - Create selection box for multi-select

---

## 🧠 AI Assistant

The AI assistant helps you understand and use the canvas. Activate it with **⌘K / Ctrl+K**.

**Example queries:**
- "What shapes can I create?"
- "How do I select multiple shapes?"
- "Explain the layer system"
- "What keyboard shortcuts are available?"

**Note:** Advanced AI canvas operations (e.g., "Create a grid of circles") are in active development.

---

## 🏗 Architecture Overview

Collab Canvas uses a clean **4-tier architecture** for maintainability and scalability:

### Layer 1: UI State Management
**File:** `store/uiStore.ts`

Manages all UI overlay state:
- Context menus (position, target shapes)
- Tool windows (properties, layers, history)  
- Toast notifications (success, error, info, warning)
- Keyboard modifiers (shift, ctrl, meta, alt)

**Why separate?** UI state changes shouldn't trigger canvas re-renders.

### Layer 2: Interaction Handlers
**Files:** `hooks/useShapeInteractions.ts`, `hooks/useKeyboardShortcuts.ts`

Handles all user input:
- **Shape interactions**: Click, drag, right-click, double-click
- **Keyboard shortcuts**: Delete, duplicate, copy/paste, arrow keys
- **Canvas gestures**: Pan, zoom, selection box

**Why separate?** Keeps event handling logic out of components.

### Layer 3: Command Service
**File:** `services/canvasCommands.ts`

Encapsulates all canvas operations:
- `deleteShapes()` - Delete with lock release
- `duplicateShapes()` - Duplicate with offset
- `changeColor()` - Batch color update
- `bringToFront()` / `sendToBack()` - Z-index management
- `moveShapes()` - Batch movement
- `transformShapes()` - Resize/rotate
- `updateText()` - Text content update

**Why separate?** Commands can be called from menus, shortcuts, toolbar, or API. Consistent error handling and feedback.

### Layer 4: Domain State
**Files:** `store/canvasStore.ts`, `store/selectionStore.ts`, `store/historyStore.ts`

Core application state:
- **canvasStore**: Canvas objects, viewport, zoom level
- **selectionStore**: Selected shape IDs
- **historyStore**: Undo/redo history
- Synced with Firestore via `useFirestore` hook

### Data Flow Example: Right-Click → Duplicate

```
1. User right-clicks shape
   ↓
2. Shape.tsx captures onContextMenu event
   ↓
3. useShapeInteractions.handleShapeRightClick()
   - Determines target shapes (selected or just this one)
   - Opens context menu via uiStore
   ↓
4. ContextMenu.tsx renders at cursor position
   ↓
5. User clicks "Duplicate"
   ↓
6. CanvasCommandService.duplicateShapes()
   - Reads shapes from canvasStore
   - Creates duplicates with offset
   - Saves to Firestore
   - Updates selection
   - Shows success toast
   ↓
7. Firestore sync updates all clients' canvases
```

**Benefits:**
- ✅ **Separation of Concerns** - UI state ≠ domain state ≠ event handling
- ✅ **Testability** - Commands can be tested without rendering UI
- ✅ **Reusability** - Same command callable from multiple sources
- ✅ **Maintainability** - Clear ownership, small focused files
- ✅ **Scalability** - Easy to add new commands, shortcuts, or UI overlays

For detailed architecture documentation, see [ARCHITECTURE.md](./ARCHITECTURE.md).

---

## 🔄 Real-Time Collaboration Details

### Lock-Based Editing

Prevents edit conflicts when multiple users work simultaneously:

1. **Lock Acquisition**: When you click/drag a shape, your client acquires a lock
2. **Active Editing**: Only you can modify the shape while you hold the lock
3. **Lock Release**: Lock releases when you stop interacting (or after 2-3s timeout)
4. **Visual Feedback**: Locked shapes show who's editing them

**Database Strategy:**
- **Firestore** - Persistent canvas objects and locks (onSnapshot sync)
- **Realtime Database** - Ephemeral presence and cursor data (onValue sync)

**Why two databases?**
- Firestore: Best for structured, persistent data with complex queries
- Realtime Database: Optimized for high-frequency updates (<50ms latency)

### Automatic Disconnect Handling

- Firebase Realtime Database's `onDisconnect()` prevents "ghost users"
- Stale locks (>2-3s old) automatically expire
- Presence data is ephemeral—removed when user disconnects

---

## 🧪 Development

### Project Structure

```
collab-canvas/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication pages
│   ├── api/               # API routes (chat, etc.)
│   ├── canvas/            # Main canvas page
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── Auth/              # Authentication components
│   ├── Canvas/            # Canvas-related components
│   ├── Presence/          # User cursors and presence
│   └── Toolbar/           # Toolbar components
├── hooks/                 # Custom React hooks
├── services/              # Business logic services
├── store/                 # Zustand state stores
├── types/                 # TypeScript type definitions
├── utils/                 # Utility functions
└── lib/                   # Third-party integrations
```
