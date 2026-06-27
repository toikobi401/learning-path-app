import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Mốc bắt đầu (UTC) cho từng khoảng thời gian.
function rangeStart(range: string): Date | null {
  const now = new Date();
  if (range === "today") {
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  }
  if (range === "week") {
    // 7 ngày gần nhất (bao gồm hôm nay)
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    start.setUTCDate(start.getUTCDate() - 6);
    return start;
  }
  return null; // all-time
}

async function sumMinutes(userId: string, gte: Date | null): Promise<number> {
  const agg = await prisma.studySession.aggregate({
    where: { user_id: userId, ...(gte ? { created_at: { gte } } : {}) },
    _sum: { minutes: true },
  });
  return agg._sum.minutes ?? 0;
}

// GET /api/study-sessions — thống kê cá nhân (hôm nay / tuần / tổng) + buổi gần đây
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const [today, week, all, recent] = await Promise.all([
    sumMinutes(userId, rangeStart("today")),
    sumMinutes(userId, rangeStart("week")),
    sumMinutes(userId, null),
    prisma.studySession.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
      take: 10,
      select: { id: true, minutes: true, source: true, created_at: true, goal_id: true },
    }),
  ]);

  return NextResponse.json({
    totals: { today, week, all },
    recent: recent.map((s) => ({
      id: s.id,
      minutes: s.minutes,
      source: s.source,
      goal_id: s.goal_id,
      created_at: s.created_at.toISOString(),
    })),
  });
}

// POST /api/study-sessions — ghi nhận 1 buổi tập trung đã hoàn thành
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as {
    minutes?: number;
    goalId?: string | null;
    source?: string;
  };

  const minutes = Math.round(Number(body.minutes));
  if (!Number.isFinite(minutes) || minutes <= 0 || minutes > 600) {
    return NextResponse.json({ error: "minutes không hợp lệ (1–600)." }, { status: 400 });
  }
  const source = body.source === "manual" ? "manual" : "pomodoro";

  // Xác thực goal thuộc về user (nếu có)
  let goalId: string | null = null;
  if (body.goalId) {
    const goal = await prisma.goal.findFirst({
      where: { id: body.goalId, user_id: session.user.id },
      select: { id: true },
    });
    if (!goal) return NextResponse.json({ error: "Goal not found." }, { status: 404 });
    goalId = goal.id;
  }

  await prisma.studySession.create({
    data: { user_id: session.user.id, goal_id: goalId, minutes, source },
  });

  const all = await sumMinutes(session.user.id, null);
  return NextResponse.json({ ok: true, totalAll: all });
}
