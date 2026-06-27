import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { aiComplete } from "@/lib/ai";
import { buildLessonPrompt } from "@/lib/prompts/lesson";
import { getUserAiLanguage, getAiLanguageInstruction } from "@/lib/i18n/ai-language";

type Params = { params: Promise<{ id: string }> };

async function loadOwnedTopic(topicId: string, userId: string) {
  const topic = await prisma.topic.findUnique({
    where: { id: topicId },
    include: {
      lesson: true,
      phase: {
        include: {
          path: { include: { goal: { select: { user_id: true, title: true, level: true } } } },
        },
      },
    },
  });
  if (!topic || topic.phase.path.goal.user_id !== userId) return null;
  return topic;
}

// GET /api/topics/[id]/lesson — trả bài giảng đã cache (hoặc content=null nếu chưa có)
export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const topic = await loadOwnedTopic(id, session.user.id);
  if (!topic) return NextResponse.json({ error: "Not found." }, { status: 404 });

  return NextResponse.json({ content: topic.lesson?.content ?? null });
}

// POST /api/topics/[id]/lesson — sinh bài giảng AI và cache (upsert)
export async function POST(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const topic = await loadOwnedTopic(id, session.user.id);
  if (!topic) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const aiLang = await getUserAiLanguage(session.user.id);
  const prompt =
    buildLessonPrompt({
      topicTitle: topic.title,
      topicDescription: topic.description,
      goalTitle: topic.phase.path.goal.title,
      level: topic.phase.path.goal.level,
    }) + getAiLanguageInstruction(aiLang);

  let content: string;
  try {
    content = await aiComplete(session.user.id, "generation", {
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      maxTokens: 2048,
    });
  } catch {
    return NextResponse.json(
      { error: "Không tạo được bài giảng. Vui lòng thử lại." },
      { status: 502 }
    );
  }

  if (!content.trim()) {
    return NextResponse.json({ error: "AI trả về nội dung rỗng." }, { status: 502 });
  }

  await prisma.topicLesson.upsert({
    where: { topic_id: id },
    create: { topic_id: id, content },
    update: { content },
  });

  return NextResponse.json({ content });
}
