import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { groq, MODELS } from "@/lib/groq";
import { buildLearningPathPrompt } from "@/lib/prompts/learning-path";

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

export async function POST(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const goal = await prisma.goal.findUnique({ where: { id } });
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
  });

  let parsed: ParsedPath;
  try {
    const completion = await groq.chat.completions.create({
      model: MODELS.generation,
      messages: [
        {
          role: "system",
          content:
            "You are an expert curriculum designer. Always respond with valid JSON only, no markdown, no extra text.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.6,
      max_tokens: 4096,
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    parsed = JSON.parse(raw) as ParsedPath;
  } catch {
    return NextResponse.json(
      { error: "AI generation failed. Please try again." },
      { status: 502 }
    );
  }

  if (
    !parsed.phases ||
    !Array.isArray(parsed.phases) ||
    parsed.phases.length === 0
  ) {
    return NextResponse.json(
      { error: "AI returned an invalid learning path structure. Please try again." },
      { status: 502 }
    );
  }

  // Delete existing path (cascade removes phases + topics)
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

  return NextResponse.json({ path: learningPath, overview: parsed.overview ?? "" });
}
