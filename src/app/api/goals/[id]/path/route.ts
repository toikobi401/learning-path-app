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
    where: { id },
    include: {
      learning_path: {
        include: {
          phases: {
            orderBy: { order_index: "asc" },
            include: {
              topics: { orderBy: { order_index: "asc" } },
            },
          },
        },
      },
    },
  });

  if (!goal || goal.user_id !== session.user.id) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  return NextResponse.json({ goal, path: goal.learning_path ?? null });
}
