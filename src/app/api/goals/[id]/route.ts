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

  const existing = await prisma.goal.findUnique({ where: { id } });
  if (!existing || existing.user_id !== session.user.id) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const body = (await req.json()) as {
    title?: string;
    description?: string;
    level?: string;
    hours_per_day?: number;
    deadline?: string;
    status?: string;
  };

  const data: Record<string, unknown> = {};

  if (body.title !== undefined) {
    if (body.title.trim().length < 3) {
      return NextResponse.json({ error: "Title must be at least 3 characters." }, { status: 400 });
    }
    data.title = body.title.trim();
  }
  if (body.description !== undefined) {
    if (body.description.trim().length < 10) {
      return NextResponse.json({ error: "Description must be at least 10 characters." }, { status: 400 });
    }
    data.description = body.description.trim();
  }
  if (body.level !== undefined) {
    if (!["beginner", "intermediate", "advanced"].includes(body.level)) {
      return NextResponse.json({ error: "Invalid level." }, { status: 400 });
    }
    data.level = body.level;
  }
  if (body.hours_per_day !== undefined) {
    if (body.hours_per_day < 0.5 || body.hours_per_day > 12) {
      return NextResponse.json({ error: "Hours per day must be between 0.5 and 12." }, { status: 400 });
    }
    data.hours_per_day = body.hours_per_day;
  }
  if (body.deadline !== undefined) {
    const d = new Date(body.deadline);
    if (isNaN(d.getTime())) {
      return NextResponse.json({ error: "Invalid deadline." }, { status: 400 });
    }
    data.deadline = d;
  }
  if (body.status !== undefined) {
    if (!["active", "paused", "completed"].includes(body.status)) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }
    data.status = body.status;
  }

  const updated = await prisma.goal.update({ where: { id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.goal.findUnique({ where: { id } });
  if (!existing || existing.user_id !== session.user.id) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  await prisma.goal.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
