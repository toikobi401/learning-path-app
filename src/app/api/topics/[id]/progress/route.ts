import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await req.json()) as { status?: string; note?: string };
  const hasStatus = typeof body.status === "string";
  const hasNote = typeof body.note === "string";

  if (!hasStatus && !hasNote) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }
  if (hasStatus && !["not_started", "in_progress", "completed"].includes(body.status!)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  // Verify ownership: topic → phase → path → goal → user
  const topic = await prisma.topic.findUnique({
    where: { id },
    include: {
      phase: {
        include: {
          path: { include: { goal: { select: { user_id: true } } } },
        },
      },
    },
  });

  if (!topic || topic.phase.path.goal.user_id !== session.user.id) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const status = body.status as "not_started" | "in_progress" | "completed" | undefined;
  const note = hasNote ? body.note! : undefined;

  const log = await prisma.progressLog.upsert({
    where: { user_id_topic_id: { user_id: session.user.id, topic_id: id } },
    create: {
      user_id: session.user.id,
      topic_id: id,
      status: status ?? "not_started",
      completed_at: status === "completed" ? new Date() : null,
      note: note ?? null,
    },
    update: {
      ...(hasStatus
        ? { status, completed_at: status === "completed" ? new Date() : null }
        : {}),
      ...(hasNote ? { note } : {}),
    },
  });

  return NextResponse.json(log);
}
