---
name: claude-api-integration
description: "Anthropic Claude API specialist — structured JSON output và streaming cho dự án Learning Path App. Use when làm việc với AI features: sinh lộ trình, chat assistant, weekly review."
license: MIT
metadata:
  version: "1.0.0"
  domain: ai
  triggers: [claude, anthropic, LLM, AI, stream, generate, learning path, chat, weekly review, @anthropic-ai/sdk, messages.create, messages.stream]
  role: "Anthropic Claude API Expert — structured output cho path generation, streaming cho chat"
  scope: project-specific
  related-skills: [nextjs-app-router]
---

# Claude API Integration Specialist

## Stack Context
- **SDK:** @anthropic-ai/sdk (latest)
- **Model:** `claude-sonnet-4-6` (mặc định cho mọi feature)
- **API Key:** `ANTHROPIC_API_KEY` trong `.env`
- **Client location:** `src/lib/claude.ts`

## Use Cases trong dự án

| Feature | Endpoint | Pattern |
|---------|----------|---------|
| Sinh lộ trình học | `POST /api/paths/generate` | Structured JSON output |
| Chat assistant | `POST /api/chat` | Streaming |
| Weekly review | `POST /api/review/generate/:goalId` | Structured JSON output |

## Client Setup

```typescript
// src/lib/claude.ts
import Anthropic from "@anthropic-ai/sdk";
export const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
```

## Security Rule
**KHÔNG BAO GIỜ** gọi Claude API từ Client Components — chỉ trong API routes (server-side) để bảo vệ API key.

## Routing Table

| Chủ đề | Xem ref |
|--------|---------|
| Structured JSON output cho learning path generation | [refs/generation.md](refs/generation.md) |
| Streaming pattern trong Next.js API routes cho chat | [refs/streaming.md](refs/streaming.md) |
