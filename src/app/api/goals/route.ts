import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const goals = await prisma.goal.findMany({
    where: { user_id: session.user.id },
    orderBy: { created_at: "desc" },
    include: {
      learning_path: { select: { id: true, status: true } },
    },
  });

  return NextResponse.json(goals);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as {
    title?: string;
    description?: string;
    level?: string;
    hours_per_day?: number;
    deadline?: string;
  };

  const { title, description, level, hours_per_day, deadline } = body;

  if (!title || title.trim().length < 3) {
    return NextResponse.json({ error: "Title must be at least 3 characters." }, { status: 400 });
  }
  if (!description || description.trim().length < 10) {
    return NextResponse.json({ error: "Description must be at least 10 characters." }, { status: 400 });
  }
  if (!level || !["beginner", "intermediate", "advanced"].includes(level)) {
    return NextResponse.json({ error: "Invalid level." }, { status: 400 });
  }
  if (hours_per_day === undefined || hours_per_day < 0.5 || hours_per_day > 12) {
    return NextResponse.json({ error: "Hours per day must be between 0.5 and 12." }, { status: 400 });
  }
  if (!deadline) {
    return NextResponse.json({ error: "Deadline is required." }, { status: 400 });
  }

  const deadlineDate = new Date(deadline);
  if (isNaN(deadlineDate.getTime())) {
    return NextResponse.json({ error: "Invalid deadline." }, { status: 400 });
  }

  const goal = await prisma.goal.create({
    data: {
      user_id: session.user.id,
      title: title.trim(),
      description: description.trim(),
      level: level as "beginner" | "intermediate" | "advanced",
      hours_per_day,
      deadline: deadlineDate,
    },
  });

  return NextResponse.json(goal, { status: 201 });
}
