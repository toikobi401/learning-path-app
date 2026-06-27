import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Verify goal ownership and get all topic IDs
  const path = await prisma.learningPath.findUnique({
    where: { goal_id: id },
    include: {
      goal: { select: { user_id: true } },
      phases: { include: { topics: { select: { id: true } } } },
    },
  });

  if (!path || path.goal.user_id !== session.user.id) {
    return NextResponse.json({});
  }

  const topicIds = path.phases.flatMap((p) => p.topics.map((t) => t.id));

  const logs = await prisma.progressLog.findMany({
    where: { user_id: session.user.id, topic_id: { in: topicIds } },
    select: { topic_id: true, status: true, completed_at: true, note: true },
  });

  // Return as map: topicId → { status, completed_at, note }
  const result: Record<
    string,
    { status: string; completed_at: string | null; note: string | null }
  > = {};
  for (const log of logs) {
    result[log.topic_id] = {
      status: log.status,
      completed_at: log.completed_at?.toISOString() ?? null,
      note: log.note ?? null,
    };
  }

  return NextResponse.json(result);
}
