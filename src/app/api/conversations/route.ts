import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/conversations — list all user conversations, newest first
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const widget = searchParams.get("widget") === "true";

  const conversations = await prisma.conversation.findMany({
    where: {
      user_id: session.user.id,
      ...(widget ? { goal_id: null } : {}),
    },
    include: {
      goal: { select: { id: true, title: true } },
      messages: {
        orderBy: { created_at: "desc" },
        take: 1,
        select: { content: true, role: true, created_at: true },
      },
    },
    orderBy: { updated_at: "desc" },
  });

  const result = conversations.map((c) => ({
    id: c.id,
    title: c.title,
    goal_id: c.goal_id,
    goal_title: c.goal?.title ?? null,
    last_message: c.messages[0] ?? null,
    updated_at: c.updated_at,
    created_at: c.created_at,
  }));

  return NextResponse.json({ conversations: result });
}

// POST /api/conversations — create a new conversation
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as { goal_id?: string; title?: string };

  // Validate goal ownership if goal_id provided
  if (body.goal_id) {
    const goal = await prisma.goal.findFirst({
      where: { id: body.goal_id, user_id: session.user.id },
      select: { id: true, title: true },
    });
    if (!goal) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }
  }

  const conversation = await prisma.conversation.create({
    data: {
      user_id: session.user.id,
      goal_id: body.goal_id ?? null,
      title: body.title ?? "New conversation",
    },
    include: {
      goal: { select: { id: true, title: true } },
    },
  });

  return NextResponse.json({ conversation }, { status: 201 });
}
