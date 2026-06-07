import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    activeGoals,
    pausedGoals,
    completedGoals,
    allCompletedLogs,
    thisWeekLogs,
    recentActivity,
  ] = await Promise.all([
    prisma.goal.count({ where: { user_id: userId, status: "active" } }),
    prisma.goal.count({ where: { user_id: userId, status: "paused" } }),
    prisma.goal.count({ where: { user_id: userId, status: "completed" } }),
    prisma.progressLog.findMany({
      where: { user_id: userId, status: "completed" },
      select: { completed_at: true, topic: { select: { estimated_hrs: true } } },
    }),
    prisma.progressLog.count({
      where: {
        user_id: userId,
        status: "completed",
        completed_at: { gte: sevenDaysAgo },
      },
    }),
    prisma.progressLog.findMany({
      where: { user_id: userId, status: "completed" },
      orderBy: { completed_at: "desc" },
      take: 5,
      select: {
        completed_at: true,
        topic: {
          select: {
            title: true,
            estimated_hrs: true,
            phase: {
              select: {
                path: {
                  select: { goal: { select: { id: true, title: true } } },
                },
              },
            },
          },
        },
      },
    }),
  ]);

  const totalTopicsCompleted = allCompletedLogs.length;
  const totalHoursCompleted = Math.round(
    allCompletedLogs.reduce((sum, l) => sum + (l.topic?.estimated_hrs ?? 0), 0)
  );

  // Streak calculation
  function calcStreak(dates: (Date | null)[]): number {
    const dateSet = new Set(
      dates.filter(Boolean).map((d) => d!.toISOString().split("T")[0])
    );
    let streak = 0;
    const check = new Date();
    check.setHours(0, 0, 0, 0);
    if (!dateSet.has(check.toISOString().split("T")[0])) {
      check.setDate(check.getDate() - 1);
    }
    while (dateSet.has(check.toISOString().split("T")[0])) {
      streak++;
      check.setDate(check.getDate() - 1);
    }
    return streak;
  }

  const streak = calcStreak(allCompletedLogs.map((l) => l.completed_at));

  const activity = recentActivity.map((l) => ({
    topicTitle: l.topic.title,
    estimatedHrs: l.topic.estimated_hrs,
    goalId: l.topic.phase.path.goal.id,
    goalTitle: l.topic.phase.path.goal.title,
    completedAt: l.completed_at?.toISOString() ?? null,
  }));

  return NextResponse.json({
    goals: { active: activeGoals, paused: pausedGoals, completed: completedGoals },
    topics: { total: totalTopicsCompleted, thisWeek: thisWeekLogs },
    hours: totalHoursCompleted,
    streak,
    recentActivity: activity,
  });
}
