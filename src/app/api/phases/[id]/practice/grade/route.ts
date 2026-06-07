import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { groq, MODELS } from "@/lib/groq";
import { buildEssayGraderPrompt, type EssayGradeInput } from "@/lib/prompts/quiz-grader";
import type { QuizDifficulty } from "@/lib/prompts/quiz";

type PracticeQuestion = {
  type: "mcq" | "essay";
  question: string;
  options?: string[];
  correct_index?: number;
  explanation?: string;
  model_answer?: string;
  grading_criteria?: string[];
};

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
  options?: string[];
};

// POST /api/phases/[id]/practice/grade — grade practice quiz, store score only
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: phaseId } = await params;
  const body = await req.json() as {
    questions: PracticeQuestion[];
    answers: SubmittedAnswer[];
    difficulty: QuizDifficulty;
    types: string[];
  };

  if (!Array.isArray(body.questions) || body.questions.length === 0) {
    return NextResponse.json({ error: "questions required" }, { status: 400 });
  }

  const phase = await prisma.phase.findFirst({
    where: { id: phaseId, path: { goal: { user_id: session.user.id } } },
  });
  if (!phase) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const feedback: FeedbackEntry[] = [];
  let totalEarned = 0;
  let totalMax = 0;
  const essayInputs: EssayGradeInput[] = [];
  const essayIndices: number[] = [];

  for (let i = 0; i < body.questions.length; i++) {
    const q = body.questions[i];
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
        correct_index: q.correct_index,
        explanation: q.explanation ?? "",
        score: correct ? MAX_MCQ : 0,
        max_score: MAX_MCQ,
      });
    } else {
      totalMax += MAX_ESSAY;
      const text = ans?.type === "essay" ? ans.essay_text : "";
      essayInputs.push({
        question: q.question,
        model_answer: q.model_answer ?? q.question,
        grading_criteria: q.grading_criteria ?? [],
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

  if (essayInputs.length > 0) {
    try {
      const completion = await groq.chat.completions.create({
        model: MODELS.generation,
        messages: [{ role: "user", content: buildEssayGraderPrompt(essayInputs) }],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });
      const raw = completion.choices[0]?.message?.content ?? "{}";
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
      for (const idx of essayIndices) {
        feedback[idx].score = 5;
        feedback[idx].feedback = "Auto-grading unavailable; partial credit awarded.";
        totalEarned += 5;
      }
    }
  }

  const score = totalMax > 0 ? Math.round((totalEarned / totalMax) * 100) : 0;

  await prisma.practiceAttempt.create({
    data: {
      phase_id: phaseId,
      user_id: session.user.id,
      difficulty: body.difficulty ?? "medium",
      question_count: body.questions.length,
      question_types: (body.types ?? ["mcq"]) as unknown as import("@prisma/client").Prisma.InputJsonValue,
      score,
      ai_feedback: feedback as unknown as import("@prisma/client").Prisma.InputJsonValue,
    },
  });

  return NextResponse.json({ score, feedback });
}
