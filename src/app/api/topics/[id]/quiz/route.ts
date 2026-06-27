import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { aiComplete } from "@/lib/ai";
import { buildTopicQuizPrompt } from "@/lib/prompts/topic-quiz";
import { getUserAiLanguage, getAiJsonLanguageInstruction } from "@/lib/i18n/ai-language";

type Params = { params: Promise<{ id: string }> };

type GeneratedQuestion = {
  question: string;
  options: string[];
  correct_index: number;
  explanation?: string;
};

// POST /api/topics/[id]/quiz — sinh câu hỏi trắc nghiệm kiểm tra hiểu biết về chủ đề (không lưu DB)
export async function POST(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const body = (await req.json().catch(() => ({}))) as { count?: number };
  const count = Math.min(8, Math.max(3, Number(body.count) || 4));

  const [topic, aiLang] = await Promise.all([
    prisma.topic.findUnique({
      where: { id },
      include: {
        lesson: true,
        phase: {
          include: {
            path: { include: { goal: { select: { user_id: true, level: true } } } },
          },
        },
      },
    }),
    getUserAiLanguage(session.user.id),
  ]);

  if (!topic || topic.phase.path.goal.user_id !== session.user.id) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const prompt =
    buildTopicQuizPrompt({
      topicTitle: topic.title,
      topicDescription: topic.description,
      lessonContent: topic.lesson?.content ?? null,
      level: topic.phase.path.goal.level,
      count,
    }) + getAiJsonLanguageInstruction(aiLang);

  let questions: GeneratedQuestion[] = [];
  try {
    const raw =
      (await aiComplete(session.user.id, "generation", {
        messages: [{ role: "user", content: prompt }],
        json: true,
        temperature: 0.6,
        maxTokens: 1500,
      })) || "{}";
    const parsed = JSON.parse(raw) as { questions?: GeneratedQuestion[] };
    questions = (parsed.questions ?? [])
      .filter(
        (q) =>
          q.question &&
          Array.isArray(q.options) &&
          q.options.length === 4 &&
          Number.isInteger(q.correct_index) &&
          q.correct_index >= 0 &&
          q.correct_index <= 3
      )
      .slice(0, count);
  } catch {
    return NextResponse.json({ error: "Không tạo được câu hỏi. Vui lòng thử lại." }, { status: 502 });
  }

  if (questions.length === 0) {
    return NextResponse.json({ error: "AI không trả về câu hỏi hợp lệ." }, { status: 502 });
  }

  return NextResponse.json({ count: questions.length, questions });
}
