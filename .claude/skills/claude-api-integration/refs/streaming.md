# Claude API — Streaming (Chat Assistant)

## Server-side Streaming (Next.js API Route)

```typescript
// src/app/api/chat/route.ts
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { claude } from "@/lib/claude";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { goalId, message } = await request.json();

  // Lấy context: goal + progress
  const goal = await prisma.goal.findUnique({
    where: { id: goalId, user_id: session.user.id },
    include: { learning_path: { include: { phases: true } } },
  });

  // Lấy lịch sử chat gần nhất
  const history = await prisma.chatMessage.findMany({
    where: { goal_id: goalId, user_id: session.user.id },
    orderBy: { created_at: "desc" },
    take: 10,
  });

  // Lưu message của user
  await prisma.chatMessage.create({
    data: { user_id: session.user.id, goal_id: goalId, role: "user", content: message },
  });

  // Build system prompt với context
  const systemPrompt = `You are a learning assistant helping with: "${goal?.description}".
User level: ${goal?.level}. 
Be concise, practical, and encouraging.`;

  // Stream response từ Claude
  const stream = await claude.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: systemPrompt,
    messages: [
      // Lịch sử chat (reverse để đúng thứ tự)
      ...history.reverse().map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
      { role: "user", content: message },
    ],
  });

  // Collect full response để lưu vào DB
  let fullResponse = "";
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
          const text = chunk.delta.text;
          fullResponse += text;
          controller.enqueue(new TextEncoder().encode(text));
        }
      }
      // Lưu assistant response vào DB
      await prisma.chatMessage.create({
        data: { user_id: session.user.id, goal_id: goalId, role: "assistant", content: fullResponse },
      });
      controller.close();
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "X-Content-Type-Options": "nosniff" },
  });
}
```

## Client-side Streaming Consumer

```typescript
// src/components/chat/ChatWindow.tsx
"use client";

async function sendMessage(message: string) {
  setMessages(prev => [...prev, { role: "user", content: message }]);
  setStreaming(true);
  let assistantMsg = "";

  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ goalId, message }),
  });

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();

  // Add placeholder message
  setMessages(prev => [...prev, { role: "assistant", content: "" }]);

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    assistantMsg += decoder.decode(value, { stream: true });
    // Update last message in real-time
    setMessages(prev => [
      ...prev.slice(0, -1),
      { role: "assistant", content: assistantMsg },
    ]);
  }

  setStreaming(false);
}
```

## Error Handling

```typescript
try {
  const stream = await claude.messages.stream({ ... });
  // ...
} catch (error) {
  if (error instanceof Anthropic.APIError) {
    console.error("Claude API error:", error.status, error.message);
    return new Response("AI service unavailable", { status: 503 });
  }
  throw error;
}
```
