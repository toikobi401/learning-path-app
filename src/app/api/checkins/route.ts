import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MOODS = ["great", "good", "okay", "hard"] as const;
type Mood = (typeof MOODS)[number];

function todayUtcDate(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

// GET /api/checkins?goalId=... — lịch sử check-in của goal (mới nhất trước, tối đa 30)
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const goalId = new URL(req.url).searchParams.get("goalId");
  if (!goalId) {
    return NextResponse.json({ error: "goalId is required." }, { status: 400 });
  }

  const goal = await prisma.goal.findFirst({
    where: { id: goalId, user_id: session.user.id },
    select: { id: true },
  });
  if (!goal) return NextResponse.json({ error: "Goal not found." }, { status: 404 });

  const checkins = await prisma.dailyCheckin.findMany({
    where: { user_id: session.user.id, goal_id: goalId },
    orderBy: { date: "desc" },
    take: 30,
    select: { date: true, hours_studied: true, mood: true },
  });

  const today = todayUtcDate().toISOString().slice(0, 10);
  const todayEntry = checkins.find((c) => c.date.toISOString().slice(0, 10) === today) ?? null;

  return NextResponse.json({
    today: todayEntry
      ? { hours_studied: todayEntry.hours_studied, mood: todayEntry.mood }
      : null,
    history: checkins.map((c) => ({
      date: c.date.toISOString().slice(0, 10),
      hours_studied: c.hours_studied,
      mood: c.mood,
    })),
  });
}

// POST /api/checkins — upsert check-in của hôm nay cho 1 goal
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as {
    goal_id?: string;
    hours_studied?: number;
    mood?: string;
  };

  if (!body.goal_id) {
    return NextResponse.json({ error: "goal_id is required." }, { status: 400 });
  }
  const hours = Number(body.hours_studied);
  if (!Number.isFinite(hours) || hours < 0 || hours > 24) {
    return NextResponse.json({ error: "hours_studied không hợp lệ (0–24)." }, { status: 400 });
  }
  const mood = (body.mood ?? "good") as Mood;
  if (!MOODS.includes(mood)) {
    return NextResponse.json({ error: "mood không hợp lệ." }, { status: 400 });
  }

  const goal = await prisma.goal.findFirst({
    where: { id: body.goal_id, user_id: session.user.id },
    select: { id: true },
  });
  if (!goal) return NextResponse.json({ error: "Goal not found." }, { status: 404 });

  const date = todayUtcDate();

  await prisma.dailyCheckin.upsert({
    where: {
      user_id_goal_id_date: { user_id: session.user.id, goal_id: body.goal_id, date },
    },
    create: {
      user_id: session.user.id,
      goal_id: body.goal_id,
      date,
      hours_studied: hours,
      mood,
    },
    update: { hours_studied: hours, mood },
  });

  return NextResponse.json({ ok: true, today: { hours_studied: hours, mood } });
}
