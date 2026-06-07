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

  const goal = await prisma.goal.findUnique({
    where: { id, user_id: session.user.id },
    select: { id: true },
  });

  if (!goal) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const reviews = await prisma.weeklyReview.findMany({
    where: { user_id: session.user.id, goal_id: id },
    orderBy: { week_number: "desc" },
    select: {
      id: true,
      week_number: true,
      summary: true,
      adjustments: true,
      created_at: true,
    },
  });

  return NextResponse.json(reviews);
}
