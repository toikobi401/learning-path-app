# Skill: Chat Assistant

## Trigger
Khi implement tính năng chat AI trong context lộ trình học tập.

## Context
- API route: `src/app/api/chat/route.ts`
- Prompt: `src/lib/prompts/chat-system.ts`
- Model: `claude-sonnet-4-6` với streaming
- DB: lưu messages vào `ChatMessage` table

## Streaming Pattern (Next.js App Router)
```typescript
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

// Trong route.ts
export async function POST(req: Request) {
  const stream = await client.messages.stream({ ... });
  return new Response(stream.toReadableStream());
}
```

## System Prompt cần bao gồm
- Mục tiêu học tập hiện tại của user (goal.description)
- Level của user (goal.level)
- Topic đang học hiện tại
- % hoàn thành tổng thể
- Lịch sử chat gần nhất (last 10 messages)

## Client-side streaming
- Dùng `fetch` với `ReadableStream`
- Component: `src/components/chat/ChatWindow.tsx`
