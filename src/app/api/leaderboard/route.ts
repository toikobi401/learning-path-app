import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function rangeStart(range: string): Date | null {
  const now = new Date();
  if (range === "today") {
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  }
  if (range === "week") {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    start.setUTCDate(start.getUTCDate() - 6);
    return start;
  }
  return null; // all-time
}

// GET /api/leaderboard?range=today|week|all — bảng xếp hạng theo tổng phút tập trung
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const myId = session.user.id;

  const range = new URL(req.url).searchParams.get("range") ?? "week";
  const gte = rangeStart(range);

  // Tổng phút theo user trong khoảng, sắp giảm dần
  const grouped = await prisma.studySession.groupBy({
    by: ["user_id"],
    where: gte ? { created_at: { gte } } : {},
    _sum: { minutes: true },
    orderBy: { _sum: { minutes: "desc" } },
  });

  // Loại những user đã tắt hiển thị leaderboard (trừ chính mình để còn tính hạng)
  const optedOut = await prisma.userSettings.findMany({
    where: { leaderboard_opt_in: false },
    select: { user_id: true },
  });
  const optedOutIds = new Set(optedOut.map((s) => s.user_id));

  const visible = grouped.filter((g) => !optedOutIds.has(g.user_id) || g.user_id === myId);

  const users = await prisma.user.findMany({
    where: { id: { in: visible.map((v) => v.user_id) } },
    select: { id: true, name: true, avatar_url: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u]));

  const ranked = visible.map((g, i) => {
    const u = userMap.get(g.user_id);
    return {
      rank: i + 1,
      user_id: g.user_id,
      name: u?.name ?? "Học viên",
      avatar_url: u?.avatar_url ?? null,
      minutes: g._sum.minutes ?? 0,
      isMe: g.user_id === myId,
    };
  });

  const top = ranked.slice(0, 50);
  const me = ranked.find((r) => r.isMe) ?? { rank: null, minutes: 0, isMe: true };
  const optedIn = !optedOutIds.has(myId);

  return NextResponse.json({
    range,
    top,
    me: { rank: me.rank, minutes: me.minutes, optedIn },
  });
}
