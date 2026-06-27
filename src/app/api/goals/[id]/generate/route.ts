import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { aiComplete } from "@/lib/ai";
import { buildLearningPathPrompt } from "@/lib/prompts/learning-path";
import { buildQuizPrompt } from "@/lib/prompts/quiz";
import { getUserAiLanguage, getAiJsonLanguageInstruction } from "@/lib/i18n/ai-language";

type Params = { params: Promise<{ id: string }> };

type ParsedTopic = {
  title: string;
  description: string;
  estimated_hrs: number;
  week_number: number;
  order_index: number;
};

type ParsedPhase = {
  title: string;
  order_index: number;
  topics: ParsedTopic[];
};

type ParsedPath = {
  total_weeks: number;
  overview: string;
  phases: ParsedPhase[];
};

type GeneratedQuestion = {
  type: "mcq" | "essay";
  question: string;
  options?: string[];
  correct_index?: number;
  explanation?: string;
  model_answer?: string;
  grading_criteria?: string[];
};

async function generatePhaseQuiz(
  userId: string,
  phaseId: string,
  phaseTitle: string,
  goalTitle: string,
  level: string,
  topics: ParsedTopic[],
  aiLang = "vi"
): Promise<void> {
  const prompt = buildQuizPrompt({
    phaseTitle,
    goalTitle,
    level,
    topicSummaries: topics.map((t) => `${t.title}: ${t.description}`),
    difficulty: "medium",
    count: 7,
    types: ["mcq", "essay"],
  });

  try {
    const raw =
      (await aiComplete(userId, "generation", {
        messages: [{ role: "user", content: prompt + getAiJsonLanguageInstruction(aiLang) }],
        json: true,
        temperature: 0.6,
      })) || "{}";
    const parsed = JSON.parse(raw) as { questions?: GeneratedQuestion[] };
    const questions = (parsed.questions ?? []).slice(0, 7);

    if (questions.length === 0) return;

    await prisma.phaseQuiz.upsert({
      where: { phase_id: phaseId },
      update: {
        questions: {
          deleteMany: {},
          create: questions.map((q, i) => ({
            type: q.type,
            question: q.question,
            options: q.options != null ? (q.options as Prisma.InputJsonValue) : Prisma.JsonNull,
            correct_index: q.correct_index ?? null,
            explanation: q.explanation ?? null,
            model_answer: q.model_answer ?? null,
            order_index: i,
          })),
        },
      },
      create: {
        phase_id: phaseId,
        difficulty: "medium",
        questions: {
          create: questions.map((q, i) => ({
            type: q.type,
            question: q.question,
            options: q.options != null ? (q.options as Prisma.InputJsonValue) : Prisma.JsonNull,
            correct_index: q.correct_index ?? null,
            explanation: q.explanation ?? null,
            model_answer: q.model_answer ?? null,
            order_index: i,
          })),
        },
      },
    });
  } catch {
    // Non-fatal: quiz generation failure shouldn't block path generation
  }
}

export async function POST(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const [goal, aiLang] = await Promise.all([
    prisma.goal.findUnique({ where: { id } }),
    getUserAiLanguage(session.user.id),
  ]);
  const langInstruction = getAiJsonLanguageInstruction(aiLang);
  if (!goal || goal.user_id !== session.user.id) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const weeksAvailable = Math.max(
    1,
    Math.ceil((goal.deadline.getTime() - Date.now()) / (7 * 24 * 60 * 60 * 1000))
  );

  const prompt = buildLearningPathPrompt({
    title: goal.title,
    description: goal.description,
    level: goal.level,
    hoursPerDay: goal.hours_per_day,
    deadlineDate: goal.deadline.toISOString().split("T")[0],
    weeksAvailable,
  }) + langInstruction;

  let parsed: ParsedPath;
  try {
    const raw =
      (await aiComplete(session.user.id, "generation", {
        messages: [
          {
            role: "system",
            content:
              "You are an expert curriculum designer. Always respond with valid JSON only, no markdown, no extra text.",
          },
          { role: "user", content: prompt },
        ],
        json: true,
        temperature: 0.6,
        maxTokens: 4096,
      })) || "{}";
    parsed = JSON.parse(raw) as ParsedPath;
  } catch {
    return NextResponse.json(
      { error: "AI generation failed. Please try again." },
      { status: 502 }
    );
  }

  if (!parsed.phases || !Array.isArray(parsed.phases) || parsed.phases.length === 0) {
    return NextResponse.json(
      { error: "AI returned an invalid learning path structure. Please try again." },
      { status: 502 }
    );
  }

  // Delete existing path (cascade removes phases + topics + phase quizzes)
  await prisma.learningPath.deleteMany({ where: { goal_id: id } });

  const learningPath = await prisma.learningPath.create({
    data: {
      goal_id: id,
      raw_json: parsed,
      total_weeks: parsed.total_weeks ?? weeksAvailable,
      status: "active",
      phases: {
        create: parsed.phases.map((phase) => ({
          title: phase.title,
          order_index: phase.order_index ?? 0,
          topics: {
            create: (phase.topics ?? []).map((topic) => ({
              title: topic.title,
              description: topic.description,
              estimated_hrs: topic.estimated_hrs ?? 1,
              week_number: topic.week_number ?? 1,
              order_index: topic.order_index ?? 0,
            })),
          },
        })),
      },
    },
    include: {
      phases: {
        orderBy: { order_index: "asc" },
        include: { topics: { orderBy: { order_index: "asc" } } },
      },
    },
  });

  // Generate phase quizzes in parallel (non-blocking — errors are swallowed)
  void Promise.all(
    learningPath.phases.map((phase, i) =>
      generatePhaseQuiz(
        session.user.id,
        phase.id,
        phase.title,
        goal.title,
        goal.level,
        parsed.phases[i]?.topics ?? [],
        aiLang
      )
    )
  );

  return NextResponse.json({ path: learningPath, overview: parsed.overview ?? "" });
}
