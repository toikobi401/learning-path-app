import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { aiComplete } from "@/lib/ai";
import { buildWeeklyReviewPrompt } from "@/lib/prompts/weekly-review";
import { getUserAiLanguage, getAiJsonLanguageInstruction } from "@/lib/i18n/ai-language";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { goalId } = (await req.json()) as { goalId: string };
  if (!goalId) {
    return NextResponse.json({ error: "goalId is required." }, { status: 400 });
  }

  const userId = session.user.id;

  // Load goal with full path
  const goal = await prisma.goal.findUnique({
    where: { id: goalId, user_id: userId },
    include: {
      learning_path: {
        include: {
          phases: {
            include: {
              topics: {
                select: { id: true, title: true, estimated_hrs: true },
              },
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

  if (!goal.learning_path) {
    return NextResponse.json(
      { error: "Generate a learning path first before requesting a review." },
      { status: 400 }
    );
  }

  const allTopics = goal.learning_path.phases.flatMap((p) => p.topics);
  const allTopicIds = allTopics.map((t) => t.id);

  // Get all progress logs
  const progressLogs = await prisma.progressLog.findMany({
    where: { user_id: userId, topic_id: { in: allTopicIds } },
    select: { topic_id: true, status: true, completed_at: true },
  });

  const completedTopicIds = new Set(
    progressLogs.filter((l) => l.status === "completed").map((l) => l.topic_id)
  );

  // Topics completed in the last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const completedThisWeek = progressLogs
    .filter(
      (l) =>
        l.status === "completed" &&
        l.completed_at &&
        l.completed_at >= sevenDaysAgo
    )
    .map((l) => {
      const topic = allTopics.find((t) => t.id === l.topic_id)!;
      return { title: topic.title, estimatedHrs: topic.estimated_hrs };
    });

  // Phase summaries
  const phaseSummaries = goal.learning_path.phases.map((p) => ({
    title: p.title,
    completed: p.topics.filter((t) => completedTopicIds.has(t.id)).length,
    total: p.topics.length,
  }));

  // Week number since goal creation
  const weeksSinceCreated = Math.floor(
    (Date.now() - goal.created_at.getTime()) / (7 * 24 * 60 * 60 * 1000)
  );
  const weekNumber = weeksSinceCreated + 1;

  const aiLang = await getUserAiLanguage(userId);
  const prompt = buildWeeklyReviewPrompt({
    goalTitle: goal.title,
    goalDescription: goal.description,
    level: goal.level,
    weekNumber,
    totalWeeks: goal.learning_path.total_weeks,
    completedThisWeek,
    totalCompleted: completedTopicIds.size,
    totalTopics: allTopics.length,
    phaseSummaries,
  });

  const raw =
    (await aiComplete(userId, "generation", {
      messages: [
        {
          role: "system",
          content: "You are an expert learning coach. Return only valid JSON.",
        },
        { role: "user", content: prompt + getAiJsonLanguageInstruction(aiLang) },
      ],
      json: true,
      temperature: 0.7,
      maxTokens: 1024,
    })) || "{}";
  let parsed: {
    summary?: string;
    strengths?: string[];
    challenges?: string[];
    adjustments?: string[];
    motivation?: string;
  };

  try {
    parsed = JSON.parse(raw);
  } catch {
    return NextResponse.json(
      { error: "AI returned invalid JSON. Please try again." },
      { status: 502 }
    );
  }

  const summary = parsed.summary ?? "Weekly review generated.";
  const adjustments = {
    strengths: parsed.strengths ?? [],
    challenges: parsed.challenges ?? [],
    adjustments: parsed.adjustments ?? [],
    motivation: parsed.motivation ?? "",
  };

  // Upsert: one review per week per goal
  const review = await prisma.weeklyReview.upsert({
    where: { user_id_goal_id_week_number: { user_id: userId, goal_id: goalId, week_number: weekNumber } },
    create: { user_id: userId, goal_id: goalId, week_number: weekNumber, summary, adjustments },
    update: { summary, adjustments },
  });

  return NextResponse.json({ review });
}
