import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { groq, MODELS } from "@/lib/groq";
import { buildQuizPrompt, type QuizDifficulty, type QuestionType } from "@/lib/prompts/quiz";

type GeneratedQuestion = {
  type: "mcq" | "essay";
  question: string;
  options?: string[];
  correct_index?: number;
  explanation?: string;
  model_answer?: string;
  grading_criteria?: string[];
};

// POST /api/phases/[id]/practice — generate practice questions (NOT stored in DB)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: phaseId } = await params;
  const body = await req.json() as {
    difficulty: QuizDifficulty;
    count: number;
    types: QuestionType[];
  };

  const difficulty: QuizDifficulty = ["easy", "medium", "hard"].includes(body.difficulty)
    ? body.difficulty
    : "medium";
  const count = Math.min(20, Math.max(3, Number(body.count) || 5));
  const types: QuestionType[] = (body.types ?? ["mcq"]).filter((t) =>
    ["mcq", "essay"].includes(t)
  ) as QuestionType[];
  if (types.length === 0) types.push("mcq");

  const phase = await prisma.phase.findFirst({
    where: {
      id: phaseId,
      path: { goal: { user_id: session.user.id } },
    },
    include: {
      topics: { select: { title: true, description: true }, orderBy: { order_index: "asc" } },
      path: { include: { goal: { select: { title: true, level: true } } } },
    },
  });
  if (!phase) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const prompt = buildQuizPrompt({
    phaseTitle: phase.title,
    goalTitle: phase.path.goal.title,
    level: phase.path.goal.level,
    topicSummaries: phase.topics.map((t) => `${t.title}: ${t.description}`),
    difficulty,
    count,
    types,
  });

  let questions: GeneratedQuestion[] = [];
  try {
    const completion = await groq.chat.completions.create({
      model: MODELS.generation,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });
    const raw = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as { questions?: GeneratedQuestion[] };
    questions = (parsed.questions ?? []).slice(0, count);
  } catch {
    return NextResponse.json({ error: "Failed to generate questions. Try again." }, { status: 502 });
  }

  if (questions.length === 0) {
    return NextResponse.json({ error: "AI returned no questions." }, { status: 502 });
  }

  return NextResponse.json({
    phaseId,
    difficulty,
    count: questions.length,
    types,
    questions,
  });
}
