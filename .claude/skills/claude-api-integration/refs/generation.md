# Claude API — Structured JSON Output (Learning Path Generation)

## Client Setup

```typescript
// src/lib/claude.ts
import Anthropic from "@anthropic-ai/sdk";

export const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
```

## Learning Path Generation Pattern

```typescript
// src/app/api/paths/generate/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { claude } from "@/lib/claude";
import { prisma } from "@/lib/prisma";
import { generatePathPrompt } from "@/lib/prompts/generate-path";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { goalId } = await request.json();
  const goal = await prisma.goal.findUnique({ where: { id: goalId, user_id: session.user.id } });
  if (!goal) return NextResponse.json({ error: "Goal not found" }, { status: 404 });

  // Tính số tuần từ deadline
  const weeksAvailable = Math.ceil(
    (goal.deadline.getTime() - Date.now()) / (7 * 24 * 60 * 60 * 1000)
  );

  const message = await claude.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    messages: [{
      role: "user",
      content: generatePathPrompt({ goal, weeksAvailable }),
    }],
  });

  // Parse JSON từ response
  const content = message.content[0];
  if (content.type !== "text") throw new Error("Unexpected response type");

  // Extract JSON từ markdown code block nếu có
  const jsonMatch = content.text.match(/```json\n([\s\S]*?)\n```/) ||
                    content.text.match(/(\{[\s\S]*\})/);
  const parsed = JSON.parse(jsonMatch ? jsonMatch[1] : content.text);

  // Lưu vào DB (nested create)
  const path = await prisma.learningPath.create({
    data: {
      goal_id: goalId,
      raw_json: parsed,
      total_weeks: parsed.total_weeks,
      status: "active",
      phases: {
        create: parsed.phases.map((phase: any, i: number) => ({
          title: phase.title,
          order_index: i,
          topics: {
            create: phase.topics.map((topic: any, j: number) => ({
              title: topic.title,
              description: topic.description,
              estimated_hrs: topic.estimated_hrs,
              week_number: topic.week_number,
              order_index: j,
              resources: { create: topic.resources ?? [] },
            })),
          },
        })),
      },
    },
  });

  return NextResponse.json({ pathId: path.id });
}
```

## Prompt Template (src/lib/prompts/generate-path.ts)

```typescript
export function generatePathPrompt({ goal, weeksAvailable }: {
  goal: { description: string; level: string; hours_per_day: number };
  weeksAvailable: number;
}) {
  return `You are an expert learning coach. Create a personalized learning path.

Goal: ${goal.description}
Level: ${goal.level}
Available time: ${goal.hours_per_day} hours/day
Duration: ${weeksAvailable} weeks

Return ONLY valid JSON matching this exact schema:
{
  "total_weeks": number,
  "phases": [{
    "title": string,
    "topics": [{
      "title": string,
      "description": string,
      "estimated_hrs": number,
      "week_number": number,
      "resources": [{
        "title": string,
        "url": string,
        "type": "article" | "video" | "course" | "doc"
      }]
    }]
  }]
}`;
}
```

## Weekly Review Generation

```typescript
const reviewMessage = await claude.messages.create({
  model: "claude-sonnet-4-6",
  max_tokens: 1024,
  messages: [{
    role: "user",
    content: `Review week ${weekNumber} progress:
- Planned topics: ${plannedTopics}
- Completed: ${completedTopics}
- Hours studied: ${hoursStudied}/${plannedHours}

Return JSON: { "summary": string, "adjustments": object, "focus_next_week": string[] }`,
  }],
});
```
