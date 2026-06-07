import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/phases/[id]/quiz — fetch phase quiz with questions (correct answers hidden from response)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: phaseId } = await params;

  const phase = await prisma.phase.findFirst({
    where: {
      id: phaseId,
      path: { goal: { user_id: session.user.id } },
    },
  });
  if (!phase) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const quiz = await prisma.phaseQuiz.findUnique({
    where: { phase_id: phaseId },
    include: {
      questions: { orderBy: { order_index: "asc" } },
      attempts: {
        where: { user_id: session.user.id },
        orderBy: { completed_at: "desc" },
        take: 5,
        select: { id: true, score: true, completed_at: true },
      },
    },
  });

  if (!quiz) return NextResponse.json(null);

  // Strip correct answers before sending to client
  const safeQuestions = quiz.questions.map((q) => ({
    id: q.id,
    type: q.type,
    question: q.question,
    options: q.options,
    order_index: q.order_index,
    // correct_index and model_answer intentionally omitted
  }));

  return NextResponse.json({ ...quiz, questions: safeQuestions });
}
