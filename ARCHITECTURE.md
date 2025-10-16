# Canvas Architecture - 4-Tier Refactor

## Overview

The canvas has been refactored from a monolithic 600+ line component into a clean, maintainable 4-tier architecture. This document explains the new structure and how user interactions flow through the system.

## Architecture Layers

```
┌─────────────────────────────────────────────────┐
│  LAYER 1: UI State Management (uiStore)         │
│  - Context menus, tool windows, modals          │
│  - Toast notifications                          │
│  - Keyboard modifier tracking                   │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│  LAYER 2: Interaction Handlers                  │
│  - useShapeInteractions (click, drag, right-click)│
│  - useKeyboardShortcuts (centralized keyboard)  │
│  - useCanvasGestures (pan, zoom, select box)    │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│  LAYER 3: Command/Action Layer                  │
│  - CanvasCommandService (CRUD operations)       │
│  - Handles locking, Firestore, optimistic updates│
│  - Triggers UI feedback (toasts)                │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│  LAYER 4: Domain State (existing)               │
│  - canvasStore (shapes, viewport)               │
│  - selectionStore (selected shape IDs)          │
│  - Firestore sync                               │
└─────────────────────────────────────────────────┘
```

## Key Files

### Layer 1: UI State
- **`store/uiStore.ts`**: Zustand store for all UI overlay state
  - Context menu (position, target shapes)
  - Tool windows (properties, layers, history)
  - Modals (export, share, settings)
  - Toast notifications (success, error, info, warning)
  - Keyboard modifiers (shift, ctrl, meta, alt)

### Layer 2: Interaction Hooks
- **`hooks/useShapeInteractions.ts`**: All shape event handlers
  - Click (single/multi-select)
  - Right-click (context menu)
  - Drag start/end
  - Transform start/end
  - Double-click (text editing)

- **`hooks/useKeyboardShortcuts.ts`**: Centralized keyboard handling
  - Delete/Backspace: Delete shapes
  - Cmd/Ctrl+D: Duplicate
  - Cmd/Ctrl+C/V: Copy/Paste
  - Cmd/Ctrl+[/]: Send to back/front
  - Arrow keys: Move shapes
  - Escape: Deselect

### Layer 3: Command Service
- **`services/canvasCommands.ts`**: CanvasCommandService class
  - `deleteShapes()`: Delete with lock release
  - `duplicateShapes()`: Duplicate with offset
  - `changeColor()`: Batch color update
  - `bringToFront()` / `sendToBack()`: Z-index management
  - `moveShapes()`: Batch movement
  - `transformShapes()`: Resize/rotate
  - `updateText()`: Text content update
  - All commands include error handling and toast feedback

### Layer 4: Components
- **`components/Canvas/Canvas.tsx`**: Main canvas (now ~350 lines, down from 600+)
  - Orchestrates all layers
  - Minimal direct event handling
  - Focus on rendering and composition

- **`components/Canvas/ContextMenu.tsx`**: Right-click menu
  - Duplicate, Copy, Delete
  - Bring to Front, Send to Back
  - Group (coming soon)
  - Properties panel (coming soon)

- **`components/Canvas/Toast.tsx`**: Notification component
  - Auto-dismissing messages
  - Color-coded by type (success, error, warning, info)
  - Slide-in animation

## User Interaction Flow Example: Right-Click on Shape

Here's how a right-click flows through the architecture:

```
1. User right-clicks shape
   ↓
2. Shape.tsx captures onContextMenu event
   ↓
3. Canvas.tsx passes event to useShapeInteractions.handleShapeRightClick()
   ↓
4. handleShapeRightClick():
   - Determines target shapes (selected or just this one)
   - Calls useUIStore.openContextMenu(position, shapeIds)
   ↓
5. ContextMenu.tsx renders at cursor position
   ↓
6. User clicks "Duplicate"
   ↓
7. ContextMenu calls commands.duplicateShapes(shapeIds)
   ↓
8. CanvasCommandService.duplicateShapes():
   - Reads shapes from canvasStore
   - Creates duplicates with offset
   - Saves to Firestore via firestoreService
   - Updates selection via selectionStore
   - Shows toast via useUIStore.showToast()
   ↓
9. Toast.tsx renders success message
   ↓
10. Firestore sync updates canvas rendering
```

## Benefits of New Architecture

### 1. Separation of Concerns
- **UI state** (menus, modals) separate from **domain state** (shapes, selection)
- **Event handling** separate from **business logic**
- **Commands** encapsulate operations with consistent error handling

### 2. Testability
- Commands can be tested without rendering components
- Hooks can be tested independently
- UI components are thin presentation layers

### 3. Reusability
- Same command can be called from:
  - Context menu
  - Keyboard shortcut
  - Toolbar button
  - Future: API endpoint, voice command, etc.

### 4. Maintainability
- Clear ownership: know exactly where to add features
- Small, focused files instead of monolithic components
- Type-safe interfaces between layers

### 5. Scalability
- Easy to add new commands (just extend CanvasCommandService)
- Easy to add new keyboard shortcuts (just update useKeyboardShortcuts)
- Easy to add new UI overlays (just use useUIStore)

## Adding New Features

### Adding a New Context Menu Action

1. Add command method to `CanvasCommandService`:
```typescript
async alignShapes(shapeIds: string[], alignment: 'left' | 'center' | 'right') {
  // Implementation
  useUIStore.getState().showToast("Shapes aligned", "success");
}
```

2. Add menu item to `ContextMenu.tsx`:
```tsx
<button onClick={() => handleAction(() => commands.alignShapes(targetShapeIds, 'left'))}>
  Align Left
</button>
```

3. (Optional) Add keyboard shortcut to `useKeyboardShortcuts.ts`:
```typescript
if (cmdOrCtrl && e.key === 'l') {
  await commands.alignShapes(selectedIds, 'left');
}
```

### Adding a New Tool Window

1. Add state to `uiStore.ts` (if needed for new type):
```typescript
export type ToolWindowType = "properties" | "layers" | "history" | "styles";
```

2. Create component:
```typescript
// components/Canvas/StylesPanel.tsx
export default function StylesPanel() {
  const { toolWindow, closeToolWindow } = useUIStore();
  if (toolWindow.type !== 'styles') return null;
  // ... implementation
}
```

3. Add to Canvas.tsx:
```tsx
<StylesPanel />
```

## Migration Notes

### What Changed in Canvas.tsx

**Before:**
- 12+ event handler useCallback definitions
- 3+ useEffect blocks for keyboard handling
- 600+ lines of mixed concerns

**After:**
- Uses `useShapeInteractions` for event handlers
- Uses `useKeyboardShortcuts` for keyboard
- Uses `useCanvasCommands` for operations
- ~350 lines focused on rendering and composition

### Backward Compatibility

All existing functionality is preserved:
- ✅ Shape creation still works
- ✅ Selection (single and multi-select) still works
- ✅ Dragging and transforming still works
- ✅ Text editing still works
- ✅ Locking still works
- ✅ Multiplayer cursors still work
- ✅ Firestore sync still works

**New features added:**
- ✅ Right-click context menu
- ✅ Keyboard shortcuts (Cmd+D, Cmd+[/], arrow keys)
- ✅ Toast notifications for feedback
- ✅ Copy/paste (basic implementation)
- ✅ Bring to front / Send to back

## Future Enhancements

The new architecture makes these features easy to add:

1. **Undo/Redo**: Commands can be logged and reversed
2. **Grouping**: Add groupShapes command and UI
3. **Properties Panel**: Already structured in uiStore
4. **Layers Panel**: Show z-index visually
5. **History Panel**: Log all commands
6. **Keyboard Customization**: Remap shortcuts in one place
7. **API/Voice Commands**: Call commands programmatically
8. **Collaboration Features**: Commands broadcast to other users
9. **Batch Operations**: Commands already support multiple shapes
10. **Macros/Automation**: Chain commands together

## Performance Considerations

- Commands use optimistic updates (instant UI feedback)
- Toast auto-dismisses (3 seconds) to avoid clutter
- Context menu closes on outside click or Escape
- Keyboard shortcuts debounced where needed (arrow keys)
- No re-renders of Canvas.tsx when UI overlays change (separate stores)

## Developer Experience

- **Clear mental model**: Always know which layer to modify
- **Type safety**: TypeScript interfaces between all layers
- **Consistent patterns**: All commands follow same structure
- **Easy debugging**: Each layer can be inspected independently
- **Documentation**: This file! Keep it updated as architecture evolves

---

**Last Updated:** October 16, 2025
**Version:** 1.0 (Initial 4-tier refactor)

