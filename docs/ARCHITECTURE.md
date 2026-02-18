# Rynk Ideas Web - Architecture

## Executive Summary

Rynk Ideas is a sophisticated Next.js-based AI chat platform designed for deep research and project management. It features complex state management, real-time streaming, and a dual-context architecture to handle large-scale data processing on the edge.

## Core Stack

- **Framework**: Next.js (App Router)
- **Runtime**: Cloudflare Workers (Edge)
- **Database**: Cloudflare D1 (SQLite)
- **Storage**: Cloudflare R2 (Object Storage)
- **Vector DB**: Cloudflare Vectorize
- **Styling**: Tailwind CSS + Shadcn/UI
- **State**: React Query + Context API

## Key Architectural Patterns

### 1. Dual Context Pattern
To optimize performance and minimize re-renders, the application splits chat state into:
- **ChatContext**: Stable data (conversations, folders, user credits).
- **StreamingContext**: high-frequency updates (tokens, status pills, search results).

### 2. Edge-First Design
All compute runs on Cloudflare Workers.
- **`chat-service.ts`**: Orchestrates AI providers and context assembly.
- **`cloud-db.ts`**: Handles D1 database operations.
- **`vector-db.ts`**: Manages semantic search and embeddings.

### 3. Service Layer
The application maintains a strict separation of concerns:
- **Frontend**: Components and Hooks (`useChat`, `useChatController`).
- **Actions**: Server Actions for secure backend communication.
- **Services**: Pure business logic and data access.

## Data Flow

### Message Submission
1. **Optimistic Update**: UI shows message immediately.
2. **Server Action**: Request sent to `chatAction`.
3. **Context Assembly**:
    - Query Vectorize for defined `context` (files, previous chats).
    - Retrieve full content from D1.
4. **AI Inference**: Stream response from OpenRouter/Groq.
5. **Stream Processing**: Client handles SSE stream to update UI incrementally.
6. **Persistence**: Final message stored to D1 and indexed in Vectorize (background).

## Folder Structure

```
app/
  api/          # Edge API routes (webhooks, auth)
  chat/         # Main chat interface
  login/        # Authentication pages
components/     # Shared UI components
lib/
  hooks/        # Custom React hooks
  services/     # Backend business logic
  utils/        # Helper functions
```
