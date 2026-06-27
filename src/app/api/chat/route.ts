import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { aiStream, type AiMessage } from "@/lib/ai";
import { getUserAiLanguage, getAiLanguageInstruction } from "@/lib/i18n/ai-language";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as {
    message: string;
    conversationId?: string;
    goalId?: string; // kept for backward compat; ignored if conversationId given
  };

  const { message, conversationId } = body;

  if (!message?.trim()) {
    return NextResponse.json({ error: "message is required." }, { status: 400 });
  }

  const userId = session.user.id;
  const aiLang = await getUserAiLanguage(userId);

  // Resolve or create conversation
  let conversation: { id: string; goal_id: string | null; title: string };

  if (conversationId) {
    const found = await prisma.conversation.findFirst({
      where: { id: conversationId, user_id: userId },
      select: { id: true, goal_id: true, title: true },
    });
    if (!found) {
      return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
    }
    conversation = found;
  } else {
    // Auto-create conversation — title from first 50 chars of message
    const autoTitle = message.trim().slice(0, 50) + (message.trim().length > 50 ? "…" : "");
    const goalId = body.goalId ?? null;

    if (goalId) {
      const goal = await prisma.goal.findFirst({
        where: { id: goalId, user_id: userId },
        select: { id: true },
      });
      if (!goal) {
        return NextResponse.json({ error: "Goal not found." }, { status: 404 });
      }
    }

    const created = await prisma.conversation.create({
      data: { user_id: userId, goal_id: goalId, title: autoTitle },
      select: { id: true, goal_id: true, title: true },
    });
    conversation = created;
  }

  const goalId = conversation.goal_id;

  // Build system prompt — with goal context if conversation has a goal
  let systemPrompt = `You are PathAI, an expert learning assistant.`;

  if (goalId) {
    const goal = await prisma.goal.findUnique({
      where: { id: goalId },
      include: {
        learning_path: {
          include: {
            phases: {
              include: { topics: { select: { id: true, title: true } } },
              orderBy: { order_index: "asc" },
            },
          },
        },
      },
    });

    if (goal) {
      const allTopicIds = goal.learning_path?.phases.flatMap((p) => p.topics.map((t) => t.id)) ?? [];
      const completedCount =
        allTopicIds.length > 0
          ? await prisma.progressLog.count({
              where: { user_id: userId, topic_id: { in: allTopicIds }, status: "completed" },
            })
          : 0;
      const totalCount = allTopicIds.length;
      const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
      const phaseList =
        goal.learning_path?.phases.map((p) => `  - ${p.title} (${p.topics.length} topics)`).join("\n") ??
        "No learning path generated yet.";

      systemPrompt = `You are PathAI, an expert learning assistant helping the user achieve their learning goal.

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
- Be specific to this learner's goal and current progress level`;
    }
  } else {
    systemPrompt = `You are PathAI, an expert learning assistant. Help the user with any learning-related questions. Keep responses concise and helpful.`;
  }

  systemPrompt += `\n${getAiLanguageInstruction(aiLang)}`;

  // Get recent message history for this conversation (last 20)
  const history = await prisma.chatMessage.findMany({
    where: { conversation_id: conversation.id },
    orderBy: { created_at: "desc" },
    take: 20,
    select: { role: true, content: true },
  });
  const orderedHistory = history.reverse();

  // Save user message
  await prisma.chatMessage.create({
    data: {
      user_id: userId,
      goal_id: goalId,
      conversation_id: conversation.id,
      role: "user",
      content: message.trim(),
    },
  });

  // Update conversation updated_at
  await prisma.conversation.update({
    where: { id: conversation.id },
    data: { updated_at: new Date() },
  });

  // Build messages cho lớp AI đa-provider
  const aiMessages: AiMessage[] = [
    { role: "system", content: systemPrompt },
    ...orderedHistory.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: message.trim() },
  ];

  // Stream qua lớp AI (provider user chọn + fallback Groq hệ thống)
  const stream = aiStream(userId, "chat", {
    messages: aiMessages,
    maxTokens: 1024,
    temperature: 0.7,
  });

  const encoder = new TextEncoder();
  let fullResponse = "";
  const convId = conversation.id;

  const readable = new ReadableStream({
    async start(controller) {
      // Send conversation_id as first chunk so client can update state
      controller.enqueue(encoder.encode(`[CONV_ID:${convId}]\n`));

      try {
        for await (const text of stream) {
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
              conversation_id: convId,
              role: "assistant",
              content: fullResponse,
            },
          });
          // Update conversation updated_at again after assistant message
          await prisma.conversation.update({
            where: { id: convId },
            data: { updated_at: new Date() },
          });
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Conversation-Id": convId,
    },
  });
}
