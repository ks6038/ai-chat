# AI Chat — Character Roleplay Chatbot

## Project Overview

An entertainment-focused AI chatbot where users engage in character roleplay conversations powered by Claude (Anthropic). Users can chat with pre-defined characters (admin-registered) or create their own custom characters. Access is controlled via a shared access code — no traditional login required.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| AI | Anthropic SDK (`@anthropic-ai/sdk`) + Vercel AI SDK (`ai`) |
| Database | MongoDB Atlas (Mongoose) |
| Styling | Tailwind CSS + shadcn/ui |
| Deployment | Google Cloud Run (Dockerized) |
| Package Manager | npm |

## Core Features

### 1. Access Control
- Code-based access: users enter a shared passcode stored in `ACCESS_CODE` env var
- Passcode is validated server-side via a Route Handler; a short-lived session cookie is set on success
- No OAuth, no user accounts, no email/password

### 2. Character Management
- **Admin characters**: pre-defined characters seeded into MongoDB; managed via seed scripts or an `/admin` route protected by `ADMIN_CODE`
- **User characters**: users can create, edit, and delete their own characters using a browser-local session ID (UUID stored in `localStorage`)
- Character schema: `name`, `description`, `personality`, `systemPrompt`, `avatarUrl`, `isPublic`, `createdBy` (session ID or `"admin"`)

### 3. Chat Interface
- User selects a character → starts or resumes a roleplay conversation
- Responses stream in real-time using the Anthropic streaming API and `ReadableStream`
- Character avatar shown alongside streamed assistant messages
- Bright, minimal UI (white background, soft accents, clean typography)

### 4. Conversation History
- All messages persisted to MongoDB after each exchange
- Conversations are linked to a `sessionId` (UUID from `localStorage`) + `characterId`
- Users can resume past conversations from a sidebar or history page
- No cross-device sync (session is browser-local)

## Project Structure

```
src/
├── app/
│   ├── access/                  # Access code entry page
│   ├── (main)/
│   │   ├── page.tsx             # Character selection grid
│   │   ├── chat/[characterId]/  # Roleplay chat interface
│   │   └── characters/          # User character CRUD UI
│   ├── api/
│   │   ├── access/route.ts      # POST — validate access code, set cookie
│   │   ├── chat/route.ts        # POST — streaming chat (SSE)
│   │   ├── characters/
│   │   │   ├── route.ts         # GET list, POST create
│   │   │   └── [id]/route.ts   # GET, PATCH, DELETE single character
│   │   └── conversations/
│   │       ├── route.ts         # GET list by sessionId
│   │       └── [id]/route.ts   # GET messages for a conversation
│   └── layout.tsx
├── components/
│   ├── chat/                    # MessageBubble, StreamingMessage, ChatInput
│   ├── characters/              # CharacterCard, CharacterForm, CharacterGrid
│   └── ui/                     # shadcn/ui re-exports
├── lib/
│   ├── db/
│   │   ├── connect.ts           # Mongoose connection singleton
│   │   ├── models/character.ts
│   │   └── models/conversation.ts
│   ├── claude.ts                # Anthropic client singleton
│   └── session.ts               # localStorage session ID helpers (client-side)
└── types/
    ├── character.ts
    └── conversation.ts
```

## Environment Variables

```env
# Required — Anthropic
ANTHROPIC_API_KEY=

# Required — MongoDB Atlas connection string
MONGODB_URI=

# Required — Shared passcode for app access
ACCESS_CODE=

# Required — Separate code for admin character management
ADMIN_CODE=

# Optional — Next.js session cookie secret (defaults to ACCESS_CODE if omitted)
SESSION_SECRET=

# Set automatically in Cloud Run; used by Next.js for canonical URLs
NEXT_PUBLIC_APP_URL=
```

## Development

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build check
npm run lint       # ESLint
```

## Deployment — Google Cloud Run

The app runs as a containerized Next.js server (`next start`).

### Dockerfile (place in project root)
```dockerfile
FROM node:24-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

Add `output: 'standalone'` to `next.config.ts` for the standalone build.

### Deploy commands
```bash
# Build and push
docker build -t gcr.io/[PROJECT_ID]/ai-chat .
docker push gcr.io/[PROJECT_ID]/ai-chat

# Deploy (first time or update)
gcloud run deploy ai-chat \
  --image gcr.io/[PROJECT_ID]/ai-chat \
  --platform managed \
  --region asia-northeast3 \
  --allow-unauthenticated \
  --set-env-vars ANTHROPIC_API_KEY=...,MONGODB_URI=...,ACCESS_CODE=...
```

Set secrets via Google Cloud Secret Manager and inject as env vars — do not hardcode in the deploy command for production.

## Key Conventions

- **Streaming**: use `anthropic.messages.stream()` piped into a `ReadableStream` returned from a Route Handler; do not buffer full responses
- **Character system prompt**: injected as the `system` parameter in every Claude API call, not as a user message
- **Session ID**: generated once client-side (`crypto.randomUUID()`), stored in `localStorage`, passed as `X-Session-Id` header on API requests — server never sets it
- **Access guard**: middleware (`src/middleware.ts`) checks for a valid `access_token` cookie and redirects unauthenticated requests to `/access`
- **MongoDB connection**: use a module-level singleton (`lib/db/connect.ts`) with connection reuse across hot reloads in dev and across requests in production
- **shadcn/ui**: install components with `npx shadcn@latest add [component]`; do not eject or copy component source manually

## Claude API Pattern

```typescript
// lib/claude.ts
import Anthropic from '@anthropic-ai/sdk';
export const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
```

```typescript
// app/api/chat/route.ts (simplified)
const stream = anthropic.messages.stream({
  model: 'claude-sonnet-4-6',
  max_tokens: 1024,
  system: character.systemPrompt,
  messages: history,          // { role: 'user'|'assistant', content: string }[]
});

const readable = new ReadableStream({
  async start(controller) {
    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta') {
        controller.enqueue(new TextEncoder().encode(chunk.delta.text));
      }
    }
    controller.close();
  },
});

return new Response(readable, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
```

## Data Models (Mongoose)

```typescript
// Character
{
  name: string;
  description: string;          // short tagline shown on card
  personality: string;          // detailed personality for context
  systemPrompt: string;         // injected as Claude system prompt
  avatarUrl?: string;
  isPublic: boolean;            // admin chars are public; user chars default to false
  createdBy: string;            // 'admin' | sessionId UUID
  createdAt: Date;
}

// Conversation
{
  characterId: ObjectId;
  sessionId: string;            // browser UUID
  messages: { role: 'user' | 'assistant'; content: string; createdAt: Date }[];
  updatedAt: Date;
}
```
