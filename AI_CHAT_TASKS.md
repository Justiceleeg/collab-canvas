# 🤖 AI Canvas Agent — Development Plan & PR Breakdown

## Overview

This document outlines the implementation of an AI-powered chat agent for the collaborative canvas. The implementation is divided into three incremental PRs to allow for early testing and validation.

**Expected Rubric Score:** 23-25 points out of 25

---

## PR #22: Basic AI Chat Panel 🤖 (Minimal)

**Priority:** HIGH (Foundation)  
**Estimated Time:** 2-3 hours  
**Status:** PLANNED

**Goal:** Get a working AI chat panel that can have conversations about the canvas (queries only, no commands yet).

### Tasks:

#### 1. Install dependencies
- Files: `package.json`
- Run: `pnpm add ai @ai-sdk/react @ai-sdk/openai zod`
- Note: Updated packages per [Vercel AI SDK docs](https://ai-sdk.dev/docs/getting-started/nextjs-app-router)

#### 2. Setup environment
- Files: `.env.local`
- Add `OPENAI_API_KEY=your_key_here`
- Document in README (don't commit actual key)

#### 3. Create basic AI types
- Files: `types/ai.types.ts`
- Define `AIMessage` type (id, role, content, timestamp)
- Keep it simple for now - just chat messages

#### 4. Create basic API route
- Files: `app/api/ai/chat/route.ts`
- Use Vercel AI SDK pattern from docs
- Import: `openai` from `@ai-sdk/openai`
- Import: `streamText, convertToModelMessages` from `ai`
- Simple system prompt: "You are a helpful assistant for a collaborative canvas app"
- Accept messages, stream response
- No command execution yet - just conversational

#### 5. Update UI store for AI panel
- Files: `store/uiStore.ts`
- Add `aiPanel: { isOpen: boolean, messages: AIMessage[] }`
- Add `toggleAIPanel()`, `setAIPanelOpen()`
- Add `addAIMessage()`, `clearAIMessages()`
- Mutual exclusion with properties panel

#### 6. Create minimal AI panel component
- Files: `components/Canvas/AIPanel.tsx`
- Use `useChat` hook from `@ai-sdk/react`
- Fixed right side panel (copy properties panel structure)
- Collapsible, defaults to closed
- Message list with auto-scroll
- Simple input field (Enter to send, Shift+Enter for newline)
- Display messages with role (User/AI)
- "Thinking..." during loading state
- Match existing panel styling

#### 7. Add keyboard shortcut
- Files: `hooks/useKeyboardShortcuts.ts`
- Cmd/Ctrl+K toggles AI panel
- Prevent default browser behavior

#### 8. Integrate into Canvas
- Files: `components/Canvas/Canvas.tsx`
- Render `AIPanel` component
- Position next to properties toggle button

### Deliverable:

- ✅ AI chat panel visible and toggleable with Cmd/Ctrl+K
- ✅ Can have conversations with AI about canvas
- ✅ "Thinking..." animation during AI responses
- ✅ Session-based history (clears on reload)
- ✅ Mutually exclusive with properties panel
- ✅ Clean UI matching existing panels

### Test Queries:
- "Hello, what can you help me with?"
- "What shapes can I create on this canvas?"
- "How do I select multiple shapes?"

---

## PR #23: AI Command Execution 🎯

**Priority:** HIGH (Core functionality)  
**Estimated Time:** 3-4 hours  
**Status:** PLANNED

**Goal:** Add ability for AI to execute simple commands (creation and manipulation).

### Tasks:

#### 1. Update AI types
- Files: `types/ai.types.ts`
- Add command types: `CreateShapeCommand`, `MoveShapeCommand`, `ResizeShapeCommand`, `RotateShapeCommand`
- Add `AICommandResult` type

#### 2. Create color parser utility
- Files: `utils/colors.ts` (new)
- `parseColor(colorName: string): string` - Convert color names to hex
- Support common colors: red, blue, green, yellow, orange, purple, pink, black, white, gray
- Support variations: "dark blue", "light red", etc.
- Return hex if already in hex format
- Test: `parseColor("red") => "#FF0000"`, `parseColor("#FF0000") => "#FF0000"`

#### 3. Create shape finder utilities
- Files: `utils/shapeQuery.ts` (new)
- `findShapesByColor(objects, color)` - Find shapes matching color (accepts hex or name)
- `findShapesByType(objects, type)` - Find all shapes of specific type
- `findSelectedShapes(objects, selectedIds)` - Get currently selected shapes
- `findBestMatch(objects, criteria)` - Find shape matching description (type + color)
- Test: Can find shapes by color, type, and combination of criteria

#### 4. Create AI agent service
- Files: `services/aiAgent.service.ts`
- `analyzeCanvas(objects)` - Returns canvas summary (shape count, types, positions)
- `executeCommand(command, commandService)` - Parses and executes commands
- Integration with `CanvasCommandService`
- Uses color parser and shape finder utilities
- Support 6 command types:
  - **Creation (3)**: Create rectangle/circle/text
  - **Manipulation (3)**: Move/resize/rotate shape

#### 5. Update API route with tools
- Files: `app/api/ai/chat/route.ts`
- Add canvas context to system prompt
- Define tools using Vercel AI SDK `tool()` function:
  - `createShape` - Create new shape
  - `moveShape` - Move existing shape
  - `resizeShape` - Resize shape
  - `rotateShape` - Rotate shape
- Include canvas state in each request
- Return tool results to UI

#### 6. Update AI panel for commands
- Files: `components/Canvas/AIPanel.tsx`
- Handle tool invocations in message display
- Show command execution status
- Display success/error feedback

#### 7. Pass canvas context to panel
- Files: `components/Canvas/Canvas.tsx`
- Pass `objects`, `commands`, `lockManager`, `user` to AIPanel
- Allow panel to execute commands

### Deliverable:

- ✅ AI can create shapes: "Create a red circle"
- ✅ AI can manipulate shapes: "Move the selected shape to x:500 y:300"
- ✅ AI can resize: "Make it 200x200"
- ✅ AI can rotate: "Rotate 45 degrees"
- ✅ Commands execute and show in chat
- ✅ Toast notifications on success/failure
- ✅ Integrates with undo/redo

### Test Commands:
- "Create a blue rectangle"
- "Make a red circle at position 200, 300"
- "Move the selected shape to x:500 y:400"
- "Resize it to 150x150"
- "Rotate the shape 90 degrees"

---

## PR #24: Advanced Commands & Layouts 🏗️

**Priority:** MEDIUM (Enhanced functionality)  
**Estimated Time:** 2-3 hours  
**Status:** PLANNED

**Goal:** Add layout commands, complex multi-element commands, and query capabilities.

### Tasks:

#### 1. Add layout command types
- Files: `types/ai.types.ts`
- Add `ArrangeGridCommand`, `DistributeCommand`, `AlignCommand`

#### 2. Create layout utilities
- Files: `utils/layout.ts` (new)
- `calculateGridPositions(shapes, rows, cols, spacing)` - Calculate positions for grid layout
- `calculateDistribution(shapes, direction, spacing)` - Calculate even spacing
- `calculateAlignment(shapes, alignType)` - Calculate alignment positions
- `getBoundingBox(shapes)` - Get overall bounds of multiple shapes
- `ensureNoOverlap(positions, shapeSize)` - Adjust positions to prevent overlap

#### 3. Extend AI agent service
- Files: `services/aiAgent.service.ts`
- Add layout functions:
  - `arrangeInGrid()` - Arrange shapes in grid pattern
  - `distributeShapes()` - Space shapes evenly
  - `alignShapes()` - Align shapes (horizontal/vertical)
- Add complex command parsing:
  - Parse multi-step commands
  - Execute in sequence
  - Return composite results
- Add query capabilities:
  - `countShapes()` - Count shapes by type/color/criteria
  - `findShapes()` - Find shapes matching criteria
  - `analyzeLayout()` - Provide canvas analysis

#### 4. Add layout & query tools to API
- Files: `app/api/ai/chat/route.ts`
- Add `arrangeGrid` tool
- Add `distributeShapes` tool
- Add `countShapes` tool
- Add `findShapes` tool
- Add `getCanvasStats` tool
- Add ability to chain commands for complex operations
- Enhanced system prompt with layout examples

### Deliverable:

- ✅ 10+ total command types working
- ✅ Layout commands: "Arrange in 3x3 grid"
- ✅ Complex commands: "Create a login form with username, password, and button"
- ✅ Query commands: "How many red shapes are there?"
- ✅ Multi-step execution for complex layouts
- ✅ Smart positioning (elements don't overlap)
- ✅ All rubric requirements met

### Test Commands:

**Layout:**
- "Arrange all shapes in a 3x3 grid"
- "Distribute selected shapes horizontally with 50px spacing"
- "Align all rectangles vertically"

**Complex:**
- "Create a login form with username field, password field, and login button"
- "Build a navigation bar with Home, About, Services, Contact"
- "Make a card with title, description, and action button"

**Query:**
- "How many red shapes are there?"
- "What's the largest shape?"
- "List all text layers"
- "Show me all circles"

---

## Files to Create/Modify

### New Files (PR #22)
- `types/ai.types.ts` - AI message and command types
- `app/api/ai/chat/route.ts` - Streaming AI chat endpoint
- `components/Canvas/AIPanel.tsx` - Chat panel UI

### Modified Files (PR #22)
- `package.json` - Add AI SDK dependencies
- `.env.local` - Add OpenAI API key
- `store/uiStore.ts` - Add AI panel state
- `hooks/useKeyboardShortcuts.ts` - Add Cmd/Ctrl+K shortcut
- `components/Canvas/Canvas.tsx` - Render AI panel
- `README.md` - Document AI features

### New Files (PR #23)
- `utils/colors.ts` - Color name to hex parser
- `utils/shapeQuery.ts` - Shape finder utilities
- `services/aiAgent.service.ts` - AI command executor

### Modified Files (PR #23)
- `types/ai.types.ts` - Add command types
- `app/api/ai/chat/route.ts` - Add tools
- `components/Canvas/AIPanel.tsx` - Command display

### New Files (PR #24)
- `utils/layout.ts` - Layout calculation utilities

### Modified Files (PR #24)
- `types/ai.types.ts` - Add layout command types
- `services/aiAgent.service.ts` - Add layout functions
- `app/api/ai/chat/route.ts` - Add layout/query tools

---

## Rubric Alignment

This implementation targets excellent scores across all rubric categories:

### Command Breadth & Capability (9-10 points)

**Target: 10/10 points**

- ✅ 10+ distinct command types
  - 3 creation commands (rectangle, circle, text)
  - 3 manipulation commands (move, resize, rotate)
  - 3 layout commands (grid, distribute, align)
  - 3+ query commands (count, find, analyze)
  - 2+ complex commands (forms, navbars)
- ✅ Covers all categories: creation, manipulation, layout, complex, query
- ✅ Commands are diverse and meaningful

### Complex Command Execution (7-8 points)

**Target: 7-8/8 points**

- ✅ "Create login form" produces 3+ properly arranged elements
- ✅ Complex layouts execute multi-step plans correctly
- ✅ Smart positioning (no overlap)
- ✅ Handles ambiguity well
- ⚠️ Quality depends on layout algorithm implementation

### AI Performance & Reliability (6-7 points)

**Target: 6-7/7 points**

- ✅ Sub-2 second responses (GPT-4o-mini)
- ✅ Natural UX with "Thinking..." feedback
- ✅ Streaming for immediate feedback
- ✅ Shared state works flawlessly (uses existing CanvasCommandService)
- ✅ Multiple users can use AI simultaneously
- ⚠️ 90%+ accuracy depends on prompt quality and testing

**Expected Total: 23-25 points**

---

## Benefits of This Approach

1. **Early validation** - See chat working in 2-3 hours
2. **Incremental testing** - Test each layer before adding complexity
3. **Risk reduction** - If time runs short, PR #22 + #23 cover core requirements
4. **Easier debugging** - Isolate issues by PR
5. **Better git history** - Clear progression of features

---

## Architecture Integration

The AI agent follows the existing 4-tier architecture:

- **Layer 1 (UI)**: `AIPanel.tsx` component + `uiStore.ts` state
- **Layer 2 (Interactions)**: Keyboard shortcuts (Cmd/Ctrl+K)
- **Layer 3 (Commands)**: `aiAgent.service.ts` + integration with existing `CanvasCommandService`
- **Layer 4 (Domain)**: Uses existing canvas store via command service

### Why This Works Well:

- ✅ **Multi-user safe**: AI uses `CanvasCommandService`, which handles locking
- ✅ **Undo/Redo**: Commands integrate with history system automatically
- ✅ **Consistent UX**: AI executes same commands as keyboard/menu actions
- ✅ **Testable**: Command logic separated from AI parsing

---

## PR Checklist Template

Use this for each PR:

```markdown
## PR #[NUMBER]: [TITLE]

### Pre-Push Checklist

- [ ] All files updated as specified
- [ ] Code runs locally without errors
- [ ] Changes tested in browser
- [ ] AI responses working as expected
- [ ] No console errors
- [ ] Performance check (responses < 2s)

### Testing Checklist

- [ ] Feature works in single user mode
- [ ] Feature works with 2+ users simultaneously
- [ ] AI commands sync across all connected users
- [ ] Feature persists on page reload (for chat history within session)
- [ ] No breaking changes to existing features
- [ ] All test commands from PR description work

### Deployment Checklist

- [ ] Pushed to main branch
- [ ] Vercel deployment successful
- [ ] Verified changes on deployed URL
- [ ] OpenAI API key configured in Vercel
- [ ] No production errors in logs

### Post-Deployment

- [ ] Mark PR as complete in tracking doc
- [ ] Update README if needed
- [ ] Document any known issues
- [ ] Test with 2+ concurrent users in production
```

---

## Environment Variables Required

Add to `.env.local`:

```env
# Existing Firebase variables
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_DATABASE_URL=...

# New: OpenAI API Key (PR #22)
OPENAI_API_KEY=sk-...
```

**Note:** `OPENAI_API_KEY` does NOT need `NEXT_PUBLIC_` prefix because it's used server-side only (in API routes).

---

## Summary Timeline

| PR # | Title | Priority | Time | Cumulative |
| ---- | ----- | -------- | ---- | ---------- |
| 22 | Basic AI Chat Panel | HIGH | 2-3h | 2-3h |
| 23 | AI Command Execution | HIGH | 3-4h | 5-7h |
| 24 | Advanced Commands & Layouts | MEDIUM | 2-3h | 7-10h |

**Total Estimated Time:** 7-10 hours (1-1.5 working days)

---

## Success Criteria

After completing all 3 PRs, the following should work:

### Basic Functionality (PR #22)
- ✅ Chat panel opens with Cmd/Ctrl+K
- ✅ Can have conversations about canvas features
- ✅ "Thinking..." animation during responses
- ✅ Session-based history maintained

### Command Execution (PR #23)
- ✅ Create shapes by natural language
- ✅ Move/resize/rotate shapes
- ✅ Commands execute instantly with feedback
- ✅ Integrates with undo/redo

### Advanced Features (PR #24)
- ✅ Layout commands (grid, distribute)
- ✅ Complex multi-element commands
- ✅ Query commands return accurate data
- ✅ 10+ distinct command types
- ✅ Sub-2s response times
- ✅ 90%+ accuracy on test commands

---

## Next Steps

1. **Complete PR #22** - Get basic chat working (2-3 hours)
2. **Test thoroughly** - Ensure chat works reliably before moving on
3. **Complete PR #23** - Add command execution (3-4 hours)
4. **Test commands** - Verify all 6 command types work
5. **Complete PR #24** - Add advanced features (2-3 hours)
6. **Final testing** - Run all test commands, verify rubric criteria

**Good luck! 🚀**

