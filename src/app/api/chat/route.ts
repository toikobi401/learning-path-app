import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { groq, MODELS } from "@/lib/groq";
import { getUserAiLanguage, getAiLanguageInstruction } from "@/lib/i18n/ai-language";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { goalId, message } = (await req.json()) as {
    goalId: string;
    message: string;
  };

  if (!goalId || !message?.trim()) {
    return NextResponse.json({ error: "goalId and message are required." }, { status: 400 });
  }

  const userId = session.user.id;

  // Verify ownership and load goal context
  const goal = await prisma.goal.findUnique({
    where: { id: goalId, user_id: userId },
    include: {
      learning_path: {
        include: {
          phases: {
            include: {
              topics: { select: { id: true, title: true } },
            },
            orderBy: { order_index: "asc" },
          },
        },
      },
    },
  });

  if (!goal) {
    return NextResponse.json({ error: "Goal not found." }, { status: 404 });
  }

  const aiLang = await getUserAiLanguage(userId);

  // Build progress context
  const allTopicIds =
    goal.learning_path?.phases.flatMap((p) => p.topics.map((t) => t.id)) ?? [];

  const completedCount =
    allTopicIds.length > 0
      ? await prisma.progressLog.count({
          where: { user_id: userId, topic_id: { in: allTopicIds }, status: "completed" },
        })
      : 0;

  const totalCount = allTopicIds.length;
  const progressPct =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const phaseList =
    goal.learning_path?.phases
      .map((p) => `  - ${p.title} (${p.topics.length} topics)`)
      .join("\n") ?? "No learning path generated yet.";

  // System prompt
  const systemPrompt = `You are PathAI, an expert learning assistant helping the user achieve their learning goal.

**Goal:** ${goal.title}
**Description:** ${goal.description}
**Level:** ${goal.level}
**Schedule:** ${goal.hours_per_day}h/day
**Progress:** ${completedCount}/${totalCount} topics (${progressPct}% complete)

**Learning Path Phases:**
${phaseList}

Your role:
- Answer questions about topics in the learning path
- Suggest study strategies and techniques
- Help understand concepts related to the goal
- Provide encouragement and accountability
- Keep responses concise (under 250 words) unless a detailed explanation is explicitly requested
- Be specific to this learner's goal and current progress level
${getAiLanguageInstruction(aiLang)}`;

  // Get recent message history (last 20 for context)
  const history = await prisma.chatMessage.findMany({
    where: { user_id: userId, goal_id: goalId },
    orderBy: { created_at: "desc" },
    take: 20,
    select: { role: true, content: true },
  });
  const orderedHistory = history.reverse();

  // Save user message
  await prisma.chatMessage.create({
    data: { user_id: userId, goal_id: goalId, role: "user", content: message.trim() },
  });

  // Build Groq messages
  const groqMessages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: systemPrompt },
    ...orderedHistory.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: message.trim() },
  ];

  // Stream from Groq
  const stream = await groq.chat.completions.create({
    model: MODELS.chat,
    messages: groqMessages,
    stream: true,
    max_tokens: 1024,
    temperature: 0.7,
  });

  const encoder = new TextEncoder();
  let fullResponse = "";

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content ?? "";
          if (text) {
            fullResponse += text;
            controller.enqueue(encoder.encode(text));
          }
        }
        // Save assistant response after stream completes
        if (fullResponse) {
          await prisma.chatMessage.create({
            data: {
              user_id: userId,
              goal_id: goalId,
              role: "assistant",
              content: fullResponse,
            },
          });
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
