import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { aiComplete } from "@/lib/ai";
import { buildEssayGraderPrompt, type EssayGradeInput } from "@/lib/prompts/quiz-grader";
import { getUserAiLanguage, getAiJsonLanguageInstruction } from "@/lib/i18n/ai-language";

type SubmittedAnswer =
  | { type: "mcq"; chosen_index: number }
  | { type: "essay"; essay_text: string };

type FeedbackEntry = {
  question: string;
  type: string;
  score: number;
  max_score: number;
  correct_index?: number;
  chosen_index?: number;
  explanation?: string;
  feedback?: string;
  options?: unknown;
};

// POST /api/phases/[id]/quiz/attempt — submit answers, AI grades essays, store attempt
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: phaseId } = await params;
  const body = await req.json() as { answers: SubmittedAnswer[] };

  if (!Array.isArray(body.answers)) {
    return NextResponse.json({ error: "answers must be an array" }, { status: 400 });
  }

  const aiLang = await getUserAiLanguage(session.user.id);

  const quiz = await prisma.phaseQuiz.findFirst({
    where: {
      phase_id: phaseId,
      phase: { path: { goal: { user_id: session.user.id } } },
    },
    include: { questions: { orderBy: { order_index: "asc" } } },
  });
  if (!quiz) return NextResponse.json({ error: "Quiz not found" }, { status: 404 });

  const feedback: FeedbackEntry[] = [];
  let totalEarned = 0;
  let totalMax = 0;

  // Collect essays for batch AI grading
  const essayInputs: EssayGradeInput[] = [];
  const essayIndices: number[] = [];

  for (let i = 0; i < quiz.questions.length; i++) {
    const q = quiz.questions[i];
    const ans = body.answers[i];
    const MAX_MCQ = 1;
    const MAX_ESSAY = 10;

    if (q.type === "mcq") {
      totalMax += MAX_MCQ;
      const chosen = ans?.type === "mcq" ? ans.chosen_index : -1;
      const correct = chosen === q.correct_index;
      totalEarned += correct ? MAX_MCQ : 0;
      feedback.push({
        question: q.question,
        type: "mcq",
        options: q.options,
        chosen_index: chosen,
        correct_index: q.correct_index ?? -1,
        explanation: q.explanation ?? "",
        score: correct ? MAX_MCQ : 0,
        max_score: MAX_MCQ,
      });
    } else {
      totalMax += MAX_ESSAY;
      const text = ans?.type === "essay" ? ans.essay_text : "";
      essayInputs.push({
        question: q.question,
        model_answer: q.model_answer ?? "",
        grading_criteria: [],
        student_answer: text,
      });
      essayIndices.push(i);
      feedback.push({
        question: q.question,
        type: "essay",
        score: 0,
        max_score: MAX_ESSAY,
      });
    }
  }

  // AI grade essays in one call
  if (essayInputs.length > 0) {
    try {
      const raw =
        (await aiComplete(session.user.id, "generation", {
          messages: [{ role: "user", content: buildEssayGraderPrompt(essayInputs) + getAiJsonLanguageInstruction(aiLang) }],
          json: true,
          temperature: 0.3,
        })) || "{}";
      const graded = JSON.parse(raw) as { grades: { score: number; feedback: string }[] };

      for (let k = 0; k < essayIndices.length; k++) {
        const idx = essayIndices[k];
        const grade = graded.grades?.[k];
        if (grade) {
          const score = Math.min(10, Math.max(0, Math.round(grade.score)));
          feedback[idx].score = score;
          feedback[idx].feedback = grade.feedback;
          totalEarned += score;
        }
      }
    } catch {
      // If AI fails, give partial credit to essay questions
      for (const idx of essayIndices) {
        feedback[idx].score = 5;
        feedback[idx].feedback = "Auto-grading unavailable; partial credit awarded.";
        totalEarned += 5;
      }
    }
  }

  const score = totalMax > 0 ? Math.round((totalEarned / totalMax) * 100) : 0;

  const attempt = await prisma.phaseQuizAttempt.create({
    data: {
      quiz_id: quiz.id,
      user_id: session.user.id,
      answers: body.answers as unknown as import("@prisma/client").Prisma.InputJsonValue,
      score,
      ai_feedback: feedback as unknown as import("@prisma/client").Prisma.InputJsonValue,
    },
  });

  return NextResponse.json({ attempt, score, feedback });
}
