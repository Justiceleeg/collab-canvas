This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Collab Canvas

A real-time collaborative canvas application with AI assistant capabilities.

### Features

- **Real-time Collaboration**: Multiple users can edit simultaneously
- **Shape Creation**: Rectangles, circles, and text
- **Transform Tools**: Move, resize, rotate shapes
- **Multi-select**: Select multiple shapes with Shift+Click or drag-to-select
- **Layer Management**: Arrange shapes with z-index control
- **Properties Panel**: Edit shape properties in real-time
- **AI Assistant**: Natural language interface for canvas operations (⌘K / Ctrl+K)
- **Undo/Redo**: Full history support
- **Lock-based Editing**: Prevents conflicts in multi-user scenarios

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm installed
- Firebase project with Firestore and Realtime Database enabled
- OpenAI API key (for AI assistant features)

### Installation

1. Clone the repository
2. Install dependencies:

```bash
pnpm install
```

3. Create a `.env.local` file in the root directory with your Firebase and OpenAI credentials:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your_project.firebaseio.com

# OpenAI API Key (for AI assistant)
OPENAI_API_KEY=sk-your_openai_api_key
```

4. Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Usage

#### Keyboard Shortcuts

- **⌘K / Ctrl+K**: Toggle AI Assistant panel
- **⌘D / Ctrl+D**: Duplicate selected shapes
- **⌘C / Ctrl+C**: Copy selected shapes
- **⌘V / Ctrl+V**: Paste shapes
- **⌘Z / Ctrl+Z**: Undo
- **⌘⇧Z / Ctrl+Y**: Redo
- **Delete / Backspace**: Delete selected shapes
- **Arrow Keys**: Move selected shapes (Shift for 10px steps)
- **P**: Toggle Properties panel
- **]**: Bring to front
- **[**: Send to back
- **Shift+]**: Bring forward
- **Shift+[**: Send backward
- **Escape**: Deselect all

#### AI Assistant

The AI assistant can help you with canvas operations. Open it with **⌘K / Ctrl+K** and try:

- "What shapes can I create?"
- "How do I select multiple shapes?"
- "Explain the layer system"

(More advanced commands coming in PR #23 and #24)

## Architecture

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
